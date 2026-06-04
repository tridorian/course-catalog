import fs from 'fs';
import path from 'path';
import { spawnSync, execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const TRACK_JSON_PATH = path.join(ROOT_DIR, 'public/content/tracks/adk-development/track.json');
const CONFIG_JSON_PATH = path.join(ROOT_DIR, 'scripts/sync-config.json');

// The ADK Development Track folder ID inside Google Drive parent folder
const TRACK_FOLDER_ID = '1YA7-uzdcoPT6w0ImvFZeHXrBOOJUNe0q';

async function main() {
  if (!fs.existsSync(TRACK_JSON_PATH)) {
    console.error(`Track file not found at: ${TRACK_JSON_PATH}`);
    process.exit(1);
  }

  const trackData = JSON.parse(fs.readFileSync(TRACK_JSON_PATH, 'utf8'));
  const courses = trackData.courses || [];

  // Get credentials
  let token = process.env.GOOGLE_WORKSPACE_CLI_TOKEN;
  if (!token) {
    try {
      token = execSync('gcloud auth application-default print-access-token', { encoding: 'utf8' }).trim();
    } catch (err) {
      console.error('Failed to get access token. Run gcloud auth application-default login.');
      process.exit(2);
    }
  }

  const env = { ...process.env, GOOGLE_WORKSPACE_CLI_TOKEN: token };

  // Load existing sync config
  let syncConfig = [];
  if (fs.existsSync(CONFIG_JSON_PATH)) {
    syncConfig = JSON.parse(fs.readFileSync(CONFIG_JSON_PATH, 'utf8'));
  }

  for (const course of courses) {
    const docName = `${course.id.toUpperCase()} Draft`;
    console.log(`\nChecking Google Doc for course: "${docName}"...`);

    // Check if doc exists in track folder
    const query = `'${TRACK_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.document' and name = '${docName.replace(/'/g, "\\'")}' and trashed = false`;
    const listResult = spawnSync('gws', [
      'drive',
      'files',
      'list',
      '--params',
      JSON.stringify({
        q: query,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      })
    ], { env, encoding: 'utf8' });

    if (listResult.status !== 0) {
      console.error(`Error checking Google Doc for ${course.id}:`, listResult.stderr || listResult.error);
      continue;
    }

    let filesList = { files: [] };
    try {
      filesList = JSON.parse(listResult.stdout);
    } catch (e) {
      console.error('Failed to parse file list output:', listResult.stdout);
    }

    let docId;
    const existingDocs = filesList.files || [];
    if (existingDocs.length > 0) {
      docId = existingDocs[0].id;
      console.log(`Google Doc already exists: "${docName}" (ID: ${docId})`);
    } else {
      console.log(`Google Doc is missing. Creating...`);
      const createResult = spawnSync('gws', [
        'drive',
        'files',
        'create',
        '--params',
        JSON.stringify({ supportsAllDrives: true }),
        '--json',
        JSON.stringify({
          name: docName,
          mimeType: 'application/vnd.google-apps.document',
          parents: [TRACK_FOLDER_ID]
        })
      ], { env, encoding: 'utf8' });

      if (createResult.status !== 0) {
        console.error(`Failed to create Google Doc for ${course.id}:`, createResult.stderr || createResult.error);
        continue;
      }

      try {
        const newDoc = JSON.parse(createResult.stdout);
        docId = newDoc.id;
        console.log(`Successfully created Google Doc "${docName}" with ID: ${docId}`);

        // Try to read course manifest to build module section headers
        let moduleHeaders = '';
        const manifestPath = path.join(ROOT_DIR, `public/content/tracks/adk-development/${course.id}/manifest.json`);
        if (fs.existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            const modules = manifest.modules || [];
            modules.forEach(mod => {
              moduleHeaders += `\n[${mod.title}]\nWelcome to the draft curriculum for ${mod.title}.\nThis content was auto-generated for review.\n`;
            });
          } catch (e) {
            console.warn(`Failed to read manifest for ${course.id}:`, e.message);
          }
        }

        if (!moduleHeaders) {
          moduleHeaders = `\n[01-Course Introduction]\nWelcome to the draft curriculum for ${course.title}.\nThis content was auto-generated for review.\n`;
        }

        // Populate the Google Doc with standard Single-Doc format
        console.log('Populating document content...');
        const docBody = `[Config]
course_id: ${course.id}
title: ${course.title}
version: 0.1.0
author: Google Cloud
status: Draft

[Intro]
${course.description}
${moduleHeaders}`;

        const updateResult = spawnSync('gws', [
          'docs',
          'documents',
          'batchUpdate',
          '--params',
          JSON.stringify({ documentId: docId }),
          '--json',
          JSON.stringify({
            requests: [
              {
                insertText: {
                  text: docBody,
                  location: { index: 1 }
                }
              }
            ]
          })
        ], { env, encoding: 'utf8' });

        if (updateResult.status !== 0) {
          console.error(`Failed to populate Google Doc content for ${course.id}:`, updateResult.stderr || updateResult.error);
        } else {
          console.log(`Successfully populated content for "${docName}"`);
        }

      } catch (e) {
        console.error('Failed to parse created document response:', e.message);
        continue;
      }
    }

    // Add to sync-config.json if not already present
    const existsInConfig = syncConfig.some(item => item.courseId === course.id);
    if (!existsInConfig && docId) {
      syncConfig.push({
        docId: docId,
        trackId: 'adk-development',
        courseId: course.id
      });
    }
  }

  // Save updated sync config
  fs.writeFileSync(CONFIG_JSON_PATH, JSON.stringify(syncConfig, null, 2));
  console.log(`\nSuccessfully updated sync-config.json at: ${CONFIG_JSON_PATH}`);
}

main().catch(err => {
  console.error('Unexpected error:', err);
});
