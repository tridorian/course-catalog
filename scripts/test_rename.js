import { google } from 'googleapis';

async function main() {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/var/home/wtg/.gcloud_config/application_default_credentials.json';
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive']
  });
  
  const authClient = await auth.getClient();
  const docs = google.docs({ version: 'v1', auth: authClient });
  const docId = '1YJqHXoxxd-ogRZsKnOl-4gvkVqfyUSg3y10KJcTjC9w';
  
  console.log('Fetching document info...');
  const doc = await docs.documents.get({ documentId: docId, includeTabsContent: true });
  const tabs = doc.data.tabs || [];
  
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    const targetTitle = i === 0 ? '[Config Temp]' : `[To Delete Temp ${i}]`;
    console.log(`Attempting to rename Tab ID: ${tab.tabProperties.tabId} ("${tab.tabProperties.title}") -> "${targetTitle}"`);
    try {
      await docs.documents.batchUpdate({
        documentId: docId,
        requestBody: {
          requests: [{
            updateDocumentTabProperties: {
              tabProperties: {
                tabId: tab.tabProperties.tabId,
                title: targetTitle
              },
              fields: 'title'
            }
          }]
        }
      });
      console.log('  Success!');
    } catch (e) {
      console.error('  Failed:', e.message);
    }
  }
}

main().catch(console.error);
