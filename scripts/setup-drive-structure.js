import fs from 'fs';
import path from 'path';
import { spawnSync, execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const CATALOG_PATH = path.join(ROOT_DIR, 'public/content/catalog.json');
const PARENT_FOLDER_ID = '1UTsC7YPjz72BiwqJDyJx6VydyHGgW160';

async function main() {
  if (!fs.existsSync(CATALOG_PATH)) {
    console.error(`Catalog not found at: ${CATALOG_PATH}`);
    process.exit(1);
  }

  let catalog;
  try {
    catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  } catch (error) {
    console.error(`Failed to parse catalog JSON: ${error.message}`);
    process.exit(1);
  }

  const tracks = catalog.tracks || [];
  if (tracks.length === 0) {
    console.log('No tracks found in the catalog.');
    process.exit(0);
  }

  // Get credentials
  let token = process.env.GOOGLE_WORKSPACE_CLI_TOKEN;
  if (!token) {
    try {
      token = execSync('gcloud auth application-default print-access-token', { encoding: 'utf8' }).trim();
    } catch (err) {
      console.error('Failed to get access token from gcloud. Please authenticate or set GOOGLE_WORKSPACE_CLI_TOKEN.');
      process.exit(2);
    }
  }

  const env = { ...process.env, GOOGLE_WORKSPACE_CLI_TOKEN: token };

  for (const track of tracks) {
    console.log(`\nChecking track: "${track.title}" (${track.id})...`);
    
    // Construct query for finding existing folder
    const query = `'${PARENT_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${track.title.replace(/'/g, "\\'")}' and trashed = false`;
    
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
      console.error(`Error querying folder for track "${track.title}":`, listResult.stderr || listResult.error);
      continue;
    }

    let filesList;
    try {
      filesList = JSON.parse(listResult.stdout);
    } catch (e) {
      console.error(`Failed to parse response for track "${track.title}":`, listResult.stdout);
      continue;
    }

    const existingFolders = filesList.files || [];
    if (existingFolders.length > 0) {
      console.log(`Folder for track "${track.title}" already exists (ID: ${existingFolders[0].id}).`);
    } else {
      console.log(`Folder for track "${track.title}" is missing. Creating...`);
      
      const createResult = spawnSync('gws', [
        'drive',
        'files',
        'create',
        '--params',
        JSON.stringify({
          supportsAllDrives: true
        }),
        '--json',
        JSON.stringify({
          name: track.title,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [PARENT_FOLDER_ID]
        })
      ], { env, encoding: 'utf8' });

      if (createResult.status !== 0) {
        console.error(`Failed to create folder for track "${track.title}":`, createResult.stderr || createResult.error);
      } else {
        try {
          const newFolder = JSON.parse(createResult.stdout);
          console.log(`Successfully created track folder "${track.title}" with ID: ${newFolder.id}`);
        } catch (e) {
          console.log(`Folder created successfully, but response couldn't be parsed:`, createResult.stdout);
        }
      }
    }
  }
}

main().catch(error => {
  console.error('An unexpected error occurred:', error);
  process.exit(5);
});
