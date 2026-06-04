import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const TRACK_JSON_PATH = path.join(ROOT_DIR, 'public/content/tracks/agentic-engineering/track.json');
const SYNC_CONFIG_PATH = path.join(ROOT_DIR, 'scripts/sync-config.json');
const TRACK_FOLDER_ID = '1Qz3O9gMN96IdSKE2lKmYjj75CmCQ_Mq2';

async function getGoogleAuth() {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(process.env.HOME || '', '.gcloud_config', 'application_default_credentials.json');
  const auth = new google.auth.GoogleAuth({
    scopes: [
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/drive'
    ]
  });
  return auth;
}

async function getOrCreateFolder(drive, name, parentId) {
  console.log(`Checking folder: "${name}" under parent ID: ${parentId}...`);
  const response = await drive.files.list({
    q: `'${parentId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
  });
  const files = response.data.files || [];
  if (files.length > 0) {
    console.log(`Folder "${name}" already exists: ${files[0].id}`);
    return files[0].id;
  }

  console.log(`Creating folder "${name}"...`);
  const createResponse = await drive.files.create({
    requestBody: {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    },
    supportsAllDrives: true
  });
  console.log(`Successfully created folder "${name}": ${createResponse.data.id}`);
  return createResponse.data.id;
}

async function getOrCreateDoc(drive, name, parentId) {
  console.log(`Checking document: "${name}" under parent ID: ${parentId}...`);
  const response = await drive.files.list({
    q: `'${parentId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.document' and trashed = false`,
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
  });
  const files = response.data.files || [];
  if (files.length > 0) {
    console.log(`Document "${name}" already exists: ${files[0].id}`);
    return files[0].id;
  }

  console.log(`Creating document "${name}"...`);
  const createResponse = await drive.files.create({
    requestBody: {
      name: name,
      mimeType: 'application/vnd.google-apps.document',
      parents: [parentId]
    },
    supportsAllDrives: true
  });
  console.log(`Successfully created document "${name}": ${createResponse.data.id}`);
  return createResponse.data.id;
}

async function moveFileIfNeeded(drive, fileId, targetFolderId) {
  const fileResponse = await drive.files.get({
    fileId: fileId,
    fields: 'parents',
    supportsAllDrives: true
  });
  const parents = fileResponse.data.parents || [];
  if (parents.includes(targetFolderId)) {
    console.log(`File ${fileId} is already in folder ${targetFolderId}.`);
    return;
  }
  
  console.log(`Moving file ${fileId} to target ${targetFolderId}...`);
  const addParents = targetFolderId;
  const removeParents = parents.filter(p => p !== targetFolderId).join(',');
  
  await drive.files.update({
    fileId: fileId,
    addParents: addParents,
    removeParents: removeParents,
    supportsAllDrives: true
  });
  console.log(`Moved file ${fileId} successfully.`);
}

async function populateOverviewDoc(docs, docId, trackInfo) {
  console.log(`Populating Track Overview document ${docId}...`);
  
  const doc = await docs.documents.get({ documentId: docId });
  const bodyContent = doc.data.body?.content || [];
  let endOfDoc = 1;
  if (bodyContent.length > 0) {
    endOfDoc = bodyContent[bodyContent.length - 1].endIndex || 1;
  }

  const requests = [];
  if (endOfDoc > 2) {
    requests.push({
      deleteContentRange: {
        range: { segmentId: '', startIndex: 1, endIndex: endOfDoc - 1 }
      }
    });
  }

  let fullText = `${trackInfo.title}\n\n`;
  fullText += `${trackInfo.description}\n\n`;
  fullText += `Track Curriculum Structure\n\n`;

  const levels = {
    'L100': [],
    'L200': [],
    'L300': [],
    'L400': []
  };

  trackInfo.courses.forEach(course => {
    const id = course.id;
    const match = id.match(/-(\d)/);
    if (match) {
      const levelNum = match[1];
      const levelKey = `L${levelNum}00`;
      if (levels[levelKey]) {
        levels[levelKey].push(course);
      }
    }
  });

  const styleRequests = [];

  // Track Title styling
  styleRequests.push({
    updateParagraphStyle: {
      range: { startIndex: 1, endIndex: trackInfo.title.length + 1 },
      paragraphStyle: { namedStyleType: 'HEADING_1' },
      fields: 'namedStyleType'
    }
  });

  // Track structure header styling
  const structHeaderIndex = trackInfo.title.length + 2 + trackInfo.description.length + 2;
  const structHeaderTitle = 'Track Curriculum Structure';
  styleRequests.push({
    updateParagraphStyle: {
      range: { startIndex: structHeaderIndex, endIndex: structHeaderIndex + structHeaderTitle.length },
      paragraphStyle: { namedStyleType: 'HEADING_2' },
      fields: 'namedStyleType'
    }
  });

  let currentLength = structHeaderIndex + structHeaderTitle.length + 2;

  Object.keys(levels).forEach(level => {
    const levelCourses = levels[level];
    if (levelCourses.length === 0) return;

    const levelHeader = `${level} Level Courses\n\n`;
    fullText += levelHeader;
    
    styleRequests.push({
      updateParagraphStyle: {
        range: { startIndex: currentLength, endIndex: currentLength + level.length + 14 },
        paragraphStyle: { namedStyleType: 'HEADING_2' },
        fields: 'namedStyleType'
      }
    });

    currentLength += levelHeader.length;

    levelCourses.forEach(course => {
      const courseHeader = `${course.title}\n`;
      fullText += courseHeader;

      styleRequests.push({
        updateParagraphStyle: {
          range: { startIndex: currentLength, endIndex: currentLength + courseHeader.length - 1 },
          paragraphStyle: { namedStyleType: 'HEADING_3' },
          fields: 'namedStyleType'
        }
      });

      currentLength += courseHeader.length;

      const courseDetails = `Course ID: ${course.id}\nModules: ${course.modules}\n${course.description}\n\n`;
      fullText += courseDetails;
      currentLength += courseDetails.length;
    });
  });

  requests.push({
    insertText: {
      text: fullText,
      location: { index: 1 }
    }
  });

  console.log('Inserting track overview text...');
  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: { requests }
  });

  if (styleRequests.length > 0) {
    console.log('Applying styles to track overview doc...');
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests: styleRequests }
    });
  }

  console.log('Track Overview document populated successfully!');
}

async function main() {
  if (!fs.existsSync(TRACK_JSON_PATH)) {
    console.error(`Track JSON not found at: ${TRACK_JSON_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(SYNC_CONFIG_PATH)) {
    console.error(`Sync Config not found at: ${SYNC_CONFIG_PATH}`);
    process.exit(1);
  }

  const trackInfo = JSON.parse(fs.readFileSync(TRACK_JSON_PATH, 'utf8'));
  const syncConfigs = JSON.parse(fs.readFileSync(SYNC_CONFIG_PATH, 'utf8'));

  const auth = await getGoogleAuth();
  const drive = google.drive({ version: 'v3', auth });
  const docs = google.docs({ version: 'v1', auth });

  console.log(`Reorganizing Drive folder structure for "${trackInfo.title}"...`);

  // 1. Create Level Subfolders
  const levelFolders = {};
  for (const level of ['L100', 'L200', 'L300', 'L400']) {
    levelFolders[level] = await getOrCreateFolder(drive, level, TRACK_FOLDER_ID);
  }

  // 2. Create and Populate Track Overview Document
  const overviewDocId = await getOrCreateDoc(drive, `${trackInfo.title} Track Overview`, TRACK_FOLDER_ID);
  await populateOverviewDoc(docs, overviewDocId, trackInfo);

  // 3. Move Course Google Docs to Level Subfolders
  for (const config of syncConfigs) {
    const courseId = config.courseId;
    const docId = config.docId;

    if (courseId === 'agy-101' && docId === '1YJqHXoxxd-ogRZsKnOl-4gvkVqfyUSg3y10KJcTjC9w') {
      // Move agy-101 to L100
      await moveFileIfNeeded(drive, docId, levelFolders['L100']);
      continue;
    }

    const match = courseId.match(/-(\d)/);
    if (match) {
      const levelNum = match[1];
      const levelKey = `L${levelNum}00`;
      const targetFolderId = levelFolders[levelKey];
      if (targetFolderId) {
        console.log(`Course ${courseId} belongs in ${levelKey}.`);
        await moveFileIfNeeded(drive, docId, targetFolderId);
      }
    }
  }

  console.log('\nGoogle Drive reorganization completed successfully!');
}

main().catch(error => {
  console.error('An error occurred during Drive reorganization:', error);
  process.exit(1);
});
