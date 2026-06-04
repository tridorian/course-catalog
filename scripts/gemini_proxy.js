// scripts/gemini_proxy.js
// A zero-dependency secure backend proxy server using Node's native HTTP module.
// This reads the Gemini API key from backend environment variables (preventing client-side exposure)
// and handles requests from the frontend course catalog app.
import http from 'http';

const PORT = process.env.PORT || 5001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('WARNING: GEMINI_API_KEY is not defined in the backend environment!');
  console.warn('Please run with: GEMINI_API_KEY=your-api-key node scripts/gemini_proxy.js');
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle only POST requests
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  // Parse Body
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const payload = JSON.parse(body || '{}');
      const prompt = payload.prompt;

      if (!prompt) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing prompt in request body' }));
        return;
      }

      if (!GEMINI_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy misconfigured: GEMINI_API_KEY is missing on server' }));
        return;
      }

      if (req.url === '/generate-theme') {
        await handleGenerateTheme(prompt, res);
      } else if (req.url === '/generate-music') {
        await handleGenerateMusic(prompt, res);
      } else if (req.url === '/generate-image') {
        await handleGenerateImage(prompt, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

async function handleGenerateTheme(prompt, res) {
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

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    res.writeHead(response.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Gemini API error: ${errText}` }));
    return;
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  let cleanedText = text.trim();
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\n?/i, '').replace(/```$/i, '').trim();
  }
  
  const variables = JSON.parse(cleanedText);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(variables));
}

async function handleGenerateMusic(prompt, res) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/lyria-3-clip-preview:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: {
        parts: [{ text: `Generate exactly a 30-second seamless, perfectly looping ambient background instrumental music track. No spoken vocals. It must have clean, smooth matching transitions at both start and end so it repeats flawlessly without any clicks or gaps. Mood: ${prompt}` }]
      },
      generationConfig: {
        responseModalities: ['AUDIO', 'TEXT']
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    res.writeHead(response.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Lyria API error: ${errText}` }));
    return;
  }

  const data = await response.json();
  const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part || !part.inlineData || !part.inlineData.data) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No audio data returned from Lyria model.' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ audioDataUrl: `data:audio/mpeg;base64,${part.inlineData.data}` }));
}

async function handleGenerateImage(prompt, res) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [
        {
          prompt: `A subtle, premium, seamless and tileable abstract background pattern/texture overlay for a web app dashboard theme. Style: ${prompt}. Very clean, low contrast, dark or light matching the theme, decorative only.`
        }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1",
        outputMimeType: "image/png"
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    res.writeHead(response.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Imagen API error: ${errText}` }));
    return;
  }

  const data = await response.json();
  const prediction = data.predictions?.[0];
  if (!prediction || !prediction.bytesBase64Encoded) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No image prediction returned from Imagen model.' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ imageDataUrl: `data:image/png;base64,${prediction.bytesBase64Encoded}` }));
}

server.listen(PORT, () => {
  console.log(`[Proxy] Secure Gemini/Lyria API proxy listening on port ${PORT}`);
  console.log(`[Proxy] Point VITE_PROXY_URL to http://localhost:${PORT}/ in your .env.local file`);
});
