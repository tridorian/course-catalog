import functions from '@google-cloud/functions-framework';
import { GoogleAuth } from 'google-auth-library';

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/generative-language', 'https://www.googleapis.com/auth/cloud-platform']
});

functions.http('themeProxy', async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Check path
  const path = req.path || req.url || '';
  const match = path.match(/\/(generate-theme|generate-music|generate-image)$/);
  if (!match) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }

  const endpoint = match[1];

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Missing prompt in request body' });
      return;
    }

    // Get access token via ADC
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token;

    if (endpoint === 'generate-theme') {
      await handleGenerateTheme(prompt, token, res);
    } else if (endpoint === 'generate-music') {
      await handleGenerateMusic(prompt, token, res);
    } else if (endpoint === 'generate-image') {
      await handleGenerateImage(prompt, token, res);
    }
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function handleGenerateTheme(prompt, token, res) {
  const systemInstruction = `You are an expert web designer and design tokens generator.
Generate a custom CSS theme palette in JSON format matching the user's stylistic description.
Return raw JSON only, no markdown blocks, no code blocks, no text wrapper.
Ensure high readability and contrast (minimum 4.5:1 text-to-background contrast ratio).
Specify these exact keys with hex values or standard rgba strings, plus a music configuration:
{
  "theme-name": "A short, cool, and creative name for this theme based on the prompt (e.g. 'Cyberpunk Oasis', 'Ethereal Forest', 'Midnight Neon')",
  "bg-base": "hex color for general page background",
  "bg-gradient": "linear-gradient CSS string (e.g. 'linear-gradient(135deg, #050805 0%, #020402 100%)' using bg-base and a slightly darker or lighter shade)",
  "bg-pattern": "one of: grid, dots, stripes, waves, circuit, none",
  "bg-panel": "hex color for card panels",
  "bg-muted": "hex color for code block background",
  "bg-elevated": "hex color for hover states",
  "text-main": "high-contrast hex color for primary text",
  "text-muted": "high-contrast hex color for secondary text",
  "border-main": "hex color for primary borders",
  "border-subtle": "hex color for dividers",
  "accent-bg": "hex color for primary brand background",
  "accent-fg": "hex color for text ON accent background (black or white)",
  "accent-text": "hex color for accent text (must be readable on bg-panel)",
  "accent-muted": "rgba string with 0.08 opacity matching accent-bg",
  "accent-border": "rgba string with 0.25 opacity matching accent-bg",
  "shadow-accent": "box shadow string, e.g. '0 0 15px rgba(..., 0.2)'",
  "swatches": ["bg-base", "accent-bg", "text-main"],
  "music": {
    "scale": "one of: major pentatonic, minor pentatonic, dorian, phrygian, mixolydian",
    "tempo": 240,
    "waveform": "one of: sine, triangle, sawtooth, square",
    "pattern": [0, 2, 4, 7, 9, 7],
    "instrument": "one of: bell, synth, pad, chiptune",
    "droneType": "one of: sawtooth, triangle, sine",
    "density": 0.5
  }
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      contents: {
        role: 'user',
        parts: [{ text: `Generate a theme for: ${prompt}` }]
      },
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    res.status(response.status).json({ error: `Gemini API error: ${errText}` });
    return;
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  let cleanedText = text.trim();
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\n?/i, '').replace(/```$/i, '').trim();
  }
  
  const variables = JSON.parse(cleanedText);
  res.status(200).json(variables);
}

async function handleGenerateMusic(prompt, token, res) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/lyria-3-clip-preview:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      contents: {
        parts: [{ text: `Generate exactly a 30-second seamless, perfectly looping instrumental background music track. No spoken vocals. It must have clean, smooth matching transitions at both start and end so it repeats flawlessly without any clicks or gaps. The genre, style, instrumentation, and mood of the track must match this description: ${prompt}` }]
      },
      generationConfig: {
        responseModalities: ['AUDIO', 'TEXT']
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    res.status(response.status).json({ error: `Lyria API error: ${errText}` });
    return;
  }

  const data = await response.json();
  const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part || !part.inlineData || !part.inlineData.data) {
    res.status(500).json({ error: 'No audio data returned from Lyria model.' });
    return;
  }

  res.status(200).json({ audioDataUrl: `data:audio/mpeg;base64,${part.inlineData.data}` });
}

async function handleGenerateImage(prompt, token, res) {
  const models = ['imagen-4.0-generate-001', 'imagen-4.0-fast-generate-001', 'imagen-4.0-ultra-generate-001'];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: `A subtle, premium, seamless and tileable abstract repeating background pattern/texture overlay for a web app dashboard. Theme/Style: ${prompt}. Purely visual pattern of abstract shapes, geometry, lines or textures. ABSOLUTELY NO text, NO words, NO letters, NO numbers, NO typography, NO labels. Extremely clean, low contrast, elegant, decorative only.`
            }
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1",
            outputMimeType: "image/jpeg"
          }
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Model ${model} returned status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const prediction = data.predictions?.[0];
      if (!prediction || !prediction.bytesBase64Encoded) {
        throw new Error(`Model ${model} returned empty predictions`);
      }

      res.status(200).json({ imageDataUrl: `data:image/jpeg;base64,${prediction.bytesBase64Encoded}` });
      return;
    } catch (err) {
      console.warn(`Model ${model} failed:`, err.message);
      lastError = err;
    }
  }

  res.status(500).json({ error: `All Imagen models failed. Last error: ${lastError ? lastError.message : 'Unknown'}` });
}
