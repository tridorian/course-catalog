import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

async function getDocsClient() {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/var/home/wtg/.gcloud_config/application_default_credentials.json';
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive']
  });
  
  const authClient = await auth.getClient();
  return google.docs({ version: 'v1', auth: authClient });
}

async function main() {
  const args = process.argv.slice(2);
  const dataPathIndex = args.indexOf('--data');
  const docIdIndex = args.indexOf('--docId');

  if (dataPathIndex === -1 || docIdIndex === -1) {
    console.error('Usage: node populate-course-doc.js --docId <doc_id> --data <path_to_json>');
    process.exit(1);
  }

  const docId = args[docIdIndex + 1];
  const dataPath = args[dataPathIndex + 1];

  if (!fs.existsSync(dataPath)) {
    console.error(`Data file not found at: ${dataPath}`);
    process.exit(1);
  }

  const courseData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const docs = await getDocsClient();

  console.log(`Fetching document ${docId}...`);
  const doc = await docs.documents.get({ documentId: docId, includeTabsContent: true });
  
  const existingTabs = doc.data.tabs || [];
  console.log(`Document currently has ${existingTabs.length} tabs.`);

  const getTabTitle = (title) => {
    if (title.length > 47) {
      return title.substring(0, 45) + '...';
    }
    return title;
  };

  // Smart Tab Management: Reuse existing tabs with correct titles, add missing ones, delete extra ones
  const cleanupRequests = [];
  const addRequests = [];
  const targetTabs = ['[Intro]'];
  courseData.modules.forEach(mod => {
    targetTabs.push(`[${getTabTitle(mod.title)}]`);
  });

  // 1. Rename the first tab to [Config] if it's not already
  if (existingTabs.length > 0) {
    const firstTab = existingTabs[0];
    if (firstTab.tabProperties.title !== '[Config]') {
      cleanupRequests.push({
        updateDocumentTabProperties: {
          tabProperties: {
            tabId: firstTab.tabProperties.tabId,
            title: '[Config]'
          },
          fields: 'title'
        }
      });
    }
  }

  // 2. Map existing tabs to target titles
  const tabMap = {}; // title -> tabId
  if (existingTabs.length > 0) {
    tabMap['[Config]'] = existingTabs[0].tabProperties.tabId;
    
    for (let i = 1; i < existingTabs.length; i++) {
      const tab = existingTabs[i];
      const title = tab.tabProperties.title;
      if (targetTabs.includes(title)) {
        tabMap[title] = tab.tabProperties.tabId;
      } else {
        // Extra tab, mark for deletion
        cleanupRequests.push({
          deleteTab: {
            tabId: tab.tabProperties.tabId
          }
        });
      }
    }
  }

  // 3. Add missing tabs
  targetTabs.forEach(title => {
    if (!tabMap[title]) {
      addRequests.push({
        addDocumentTab: {
          tabProperties: {
            title: title
          }
        }
      });
    }
  });

  if (cleanupRequests.length > 0) {
    console.log('Cleaning up old and conflicting tabs...');
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests: cleanupRequests }
    });
  }

  if (addRequests.length > 0) {
    console.log('Creating missing tabs...');
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests: addRequests }
    });
  }

  console.log('Tabs updated. Fetching updated document structure...');
  const updatedDoc = await docs.documents.get({ documentId: docId, includeTabsContent: true });
  const newTabs = updatedDoc.data.tabs || [];

  console.log('New tab structure:');
  newTabs.forEach(t => console.log(`- ${t.tabProperties.title} (${t.tabProperties.tabId})`));

  const insertRequests = [];
  const styleRequests = [];

  // Step 3: Populate each tab with content and style it
  // A. Populate [Config]
  const configTab = newTabs.find(t => t.tabProperties.title === '[Config]');
  if (configTab) {
    const configTabId = configTab.tabProperties.tabId;
    let configText = `course_id: ${courseData.course_id}\ntitle: ${courseData.title}\nversion: 0.1.0\nauthor: Tridorian Labs & Google Cloud\nstatus: Draft\n`;
    
    const bodyContent = configTab.documentTab?.body?.content || [];
    let endOfFirstTab = 1;
    if (bodyContent.length > 0) {
      const lastElement = bodyContent[bodyContent.length - 1];
      endOfFirstTab = lastElement.endIndex || 1;
    }
    
    if (endOfFirstTab > 2) {
      insertRequests.push({
        deleteContentRange: {
          range: {
            segmentId: '',
            startIndex: 1,
            endIndex: endOfFirstTab - 1,
            tabId: configTabId
          }
        }
      });
    }

    insertRequests.push({
      insertText: {
        text: configText,
        location: {
          index: 1,
          tabId: configTabId
        }
      }
    });
  }

  // B. Populate [Intro]
  const introTab = newTabs.find(t => t.tabProperties.title === '[Intro]');
  if (introTab) {
    const introTabId = introTab.tabProperties.tabId;
    
    let fullText = `# [Intro]\n\n${courseData.description}\n\nKey Highlights:\n\n`;
    courseData.highlights.forEach(h => {
      fullText += `${h.icon}\t${h.title}\n${h.description}\n\n`;
    });

    const bodyContent = introTab.documentTab?.body?.content || [];
    let endOfTab = 1;
    if (bodyContent.length > 0) {
      const lastElement = bodyContent[bodyContent.length - 1];
      endOfTab = lastElement.endIndex || 1;
    }
    if (endOfTab > 2) {
      insertRequests.push({
        deleteContentRange: {
          range: { segmentId: '', startIndex: 1, endIndex: endOfTab - 1, tabId: introTabId }
        }
      });
    }

    insertRequests.push({
      insertText: {
        text: fullText,
        location: {
          index: 1,
          tabId: introTabId
        }
      }
    });
  }

  // C. Populate Modules
  courseData.modules.forEach(mod => {
    const cleanTitle = getTabTitle(mod.title);
    const modTab = newTabs.find(t => t.tabProperties.title === `[${cleanTitle}]`);
    if (modTab) {
      const modTabId = modTab.tabProperties.tabId;
      let fullText = `# [${cleanTitle}]\n\n`;
      
      mod.blocks.forEach(block => {
        if (block.type === 'h2') {
          const start = fullText.length + 1;
          fullText += `${block.content}\n\n`;
          const end = fullText.length + 1 - 2;
          styleRequests.push({
            updateParagraphStyle: {
              range: { startIndex: start, endIndex: end, tabId: modTabId },
              paragraphStyle: { namedStyleType: 'HEADING_2' },
              fields: 'namedStyleType'
            }
          });
        } else if (block.type === 'h3') {
          const start = fullText.length + 1;
          fullText += `${block.content}\n\n`;
          const end = fullText.length + 1 - 2;
          styleRequests.push({
            updateParagraphStyle: {
              range: { startIndex: start, endIndex: end, tabId: modTabId },
              paragraphStyle: { namedStyleType: 'HEADING_3' },
              fields: 'namedStyleType'
            }
          });
        } else if (block.type === 'p') {
          fullText += `${block.content}\n\n`;
        } else if (block.type === 'code') {
          const start = fullText.length + 1;
          fullText += `${block.content}\n\n`;
          const end = fullText.length + 1 - 2;
          styleRequests.push({
            updateTextStyle: {
              range: { startIndex: start, endIndex: end, tabId: modTabId },
              textStyle: { weightedFontFamily: { fontFamily: 'Courier New' } },
              fields: 'weightedFontFamily'
            }
          });
        } else if (block.type === 'info') {
          fullText += `> [!NOTE]\n> ${block.content.replace(/\n/g, '\n> ')}\n\n`;
        } else if (block.type === 'warning') {
          fullText += `> [!WARNING]\n> ${block.content.replace(/\n/g, '\n> ')}\n\n`;
        } else if (block.type === 'slides' || block.type === 'video') {
          fullText += `[${block.title}](${block.url})\n\n`;
        } else if (block.type === 'list') {
          block.items.forEach(item => {
            fullText += `- ${item}\n`;
          });
          fullText += '\n';
        }
      });

      const bodyContent = modTab.documentTab?.body?.content || [];
      let endOfTab = 1;
      if (bodyContent.length > 0) {
        const lastElement = bodyContent[bodyContent.length - 1];
        endOfTab = lastElement.endIndex || 1;
      }
      if (endOfTab > 2) {
        insertRequests.push({
          deleteContentRange: {
            range: { segmentId: '', startIndex: 1, endIndex: endOfTab - 1, tabId: modTabId }
          }
        });
      }

      insertRequests.push({
        insertText: {
          text: fullText,
          location: {
            index: 1,
            tabId: modTabId
          }
        }
      });
    }
  });

  console.log('Inserting content into all tabs...');
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: { requests: insertRequests }
  });

  if (styleRequests.length > 0) {
    console.log('Applying formatting styles to all tabs...');
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests: styleRequests }
    });
  }

  console.log(`Successfully populated all tabs for document ${docId}!`);
}

main().catch(err => {
  console.error('Error populating document:', err);
  process.exit(1);
});
