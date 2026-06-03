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

  const requests = [];

  // Step 1: Rename the first tab to [Config] and delete all other tabs
  if (existingTabs.length > 0) {
    const firstTabId = existingTabs[0].tabProperties.tabId;
    requests.push({
      updateDocumentTabProperties: {
        tabProperties: {
          tabId: firstTabId,
          title: '[Config]'
        },
        fields: 'title'
      }
    });

    for (let i = 1; i < existingTabs.length; i++) {
      requests.push({
        deleteTab: {
          tabId: existingTabs[i].tabProperties.tabId
        }
      });
    }
  }

  // Step 2: Create new tabs for Intro and each module
  const targetTabs = ['[Intro]'];
  courseData.modules.forEach(mod => {
    targetTabs.push(`[${mod.title}]`);
  });

  targetTabs.forEach(title => {
    requests.push({
      addDocumentTab: {
        tabProperties: {
          title: title
        }
      }
    });
  });

  console.log('Resetting and creating tabs...');
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: { requests }
  });

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
    const modTab = newTabs.find(t => t.tabProperties.title === `[${mod.title}]`);
    if (modTab) {
      const modTabId = modTab.tabProperties.tabId;
      let fullText = `# [${mod.title}]\n\n`;
      
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
