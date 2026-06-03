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
  console.log('Tabs:');
  tabs.forEach(t => {
    console.log(`- Tab ID: ${t.tabProperties.tabId}, Title: "${t.tabProperties.title}"`);
    if (t.childTabs) {
      t.childTabs.forEach(ct => {
        console.log(`  - Child Tab ID: ${ct.tabProperties.tabId}, Title: "${ct.tabProperties.title}"`);
      });
    }
  });
}

main().catch(console.error);
