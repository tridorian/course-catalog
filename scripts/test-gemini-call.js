import { google } from 'googleapis';

async function main() {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(process.env.HOME || '', '.gcloud_config', 'application_default_credentials.json');
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;
  
  const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/tridorian-taylor-sandbox/locations/us-central1/publishers/google/models/gemini-1.5-pro:generateContent`;
  
  const payload = {
    contents: {
      role: 'user',
      parts: [{ text: 'Write a short one-line greeting.' }]
    },
    generationConfig: {
      temperature: 0.2
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error calling Gemini API:", errorText);
    return;
  }

  const data = await response.json();
  console.log("Response text:", data.candidates?.[0]?.content?.parts?.[0]?.text);
}

main().catch(console.error);
