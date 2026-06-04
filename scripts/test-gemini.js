import { google } from 'googleapis';

async function testGemini() {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/var/home/wtg/.gcloud_config/application_default_credentials.json';
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;
  
  console.log("Acquired token successfully.");
  
  const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/tridorian-taylor-sandbox/locations/us-central1/publishers/google/models`;
  
  console.log("Calling Vertex AI List Models...");
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error calling Gemini API:", errorText);
    return;
  }
  
  const data = await response.json();
  console.log("Response:", JSON.stringify(data, null, 2));
}

testGemini().catch(console.error);
