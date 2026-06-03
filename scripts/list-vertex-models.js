import { google } from 'googleapis';

async function main() {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(process.env.HOME || '', '.gcloud_config', 'application_default_credentials.json');
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;
  
  const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/tridorian-taylor-sandbox/locations/us-central1/models`;
  
  console.log("Calling Vertex AI List Models on project models...");
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
