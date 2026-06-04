import { google } from 'googleapis';
import fetch from 'node-fetch'; // wait, node-fetch is not needed, we can use global fetch

async function enableVertex() {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(process.env.HOME || '', '.gcloud_config', 'application_default_credentials.json');
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;
  
  const projectId = 'tridorian-taylor-sandbox';
  const service = 'aiplatform.googleapis.com';
  const url = `https://serviceusage.googleapis.com/v1/projects/${projectId}/services/${service}:enable`;
  
  console.log(`Enabling ${service} for project ${projectId}...`);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

enableVertex().catch(console.error);
