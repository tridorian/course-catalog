import { google } from 'googleapis';

async function main() {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(process.env.HOME || '', '.gcloud_config', 'application_default_credentials.json');
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive']
  });
  
  const authClient = await auth.getClient();
  const drive = google.drive({ version: 'v3', auth: authClient });
  const fileId = '1YJqHXoxxd-ogRZsKnOl-4gvkVqfyUSg3y10KJcTjC9w';
  
  console.log('Fetching file permissions...');
  const file = await drive.files.get({
    fileId: fileId,
    supportsAllDrives: true,
    fields: 'id, name, owners, capabilities, permissions'
  });
  console.log('File Metadata:', JSON.stringify(file.data, null, 2));
}

main().catch(console.error);
