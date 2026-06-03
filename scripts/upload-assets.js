import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const TRACK_FOLDER_ID = '1Qz3O9gMN96IdSKE2lKmYjj75CmCQ_Mq2';
const BRAIN_DIR = '/var/home/wtg/.gemini/antigravity-cli/brain/9b98efbd-6ce7-4922-b107-9f3154ab80eb';

async function getGoogleAuth() {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/var/home/wtg/.gcloud_config/application_default_credentials.json';
  const auth = new google.auth.GoogleAuth({
    scopes: [
      'https://www.googleapis.com/auth/drive'
    ]
  });
  return auth;
}

async function uploadOrUpdateFile(drive, localPath, targetName) {
  console.log(`Checking existing file in Drive: "${targetName}"...`);
  
  // List files with the target name in the track folder
  const response = await drive.files.list({
    q: `'${TRACK_FOLDER_ID}' in parents and name = '${targetName}' and trashed = false`,
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
  });
  
  const files = response.data.files || [];
  const media = {
    mimeType: 'image/png',
    body: fs.createReadStream(localPath)
  };
  
  if (files.length > 0) {
    const fileId = files[0].id;
    console.log(`Found existing file (ID: ${fileId}). Updating content...`);
    const updateResponse = await drive.files.update({
      fileId: fileId,
      media: media,
      supportsAllDrives: true
    });
    console.log(`Successfully updated: ${targetName} (ID: ${updateResponse.data.id})`);
    return updateResponse.data.id;
  } else {
    console.log(`No existing file found. Creating new file...`);
    const createResponse = await drive.files.create({
      requestBody: {
        name: targetName,
        parents: [TRACK_FOLDER_ID]
      },
      media: media,
      supportsAllDrives: true
    });
    console.log(`Successfully uploaded: ${targetName} (ID: ${createResponse.data.id})`);
    return createResponse.data.id;
  }
}

async function main() {
  const auth = await getGoogleAuth();
  const drive = google.drive({ version: 'v3', auth });

  console.log(`Scanning brain directory for generated assets: ${BRAIN_DIR}...`);
  if (!fs.existsSync(BRAIN_DIR)) {
    console.error(`Brain directory does not exist: ${BRAIN_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(BRAIN_DIR);
  
  // Define our mapping patterns
  const patterns = [
    { regex: /^agy_track_banner_.*\.png$/, name: 'agy_track_banner.png' },
    { regex: /^agy_l100_badge_.*\.png$/, name: 'agy_l100_badge.png' },
    { regex: /^agy_l200_badge_.*\.png$/, name: 'agy_l200_badge.png' },
    { regex: /^agy_l300_badge_.*\.png$/, name: 'agy_l300_badge.png' },
    { regex: /^agy_l400_badge_.*\.png$/, name: 'agy_l400_badge.png' },
    { regex: /^agy_track_infographic_.*\.png$/, name: 'agy_track_infographic.png' }
  ];

  const matchedFiles = [];
  
  for (const file of files) {
    for (const pattern of patterns) {
      if (pattern.regex.test(file)) {
        matchedFiles.push({
          localPath: path.join(BRAIN_DIR, file),
          targetName: pattern.name
        });
        break;
      }
    }
  }

  if (matchedFiles.length === 0) {
    console.log('No matched generated assets found in the brain directory.');
    process.exit(0);
  }

  console.log(`Found ${matchedFiles.length} asset(s) to upload. Starting uploads...`);
  
  for (const asset of matchedFiles) {
    try {
      await uploadOrUpdateFile(drive, asset.localPath, asset.targetName);
    } catch (err) {
      console.error(`Error uploading ${asset.targetName}:`, err.message);
    }
  }
  
  console.log('\nAll asset uploads completed!');
}

main().catch(error => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});
