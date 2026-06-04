// src/services/themeGenerator.js
// Integrates with Gemini API to generate custom color theme JSON variables.
import { getAccessToken } from './googleAuth';

function getValidApiKey(userApiKey = '') {
  const LEAKED_KEY = 'AIzaSyCrQVmC1PFEFb-oLAuOQdT7Jr-gb9W-JzY';

  const isValid = (k) => {
    if (!k) return false;
    const trimmed = k.trim();
    return trimmed !== LEAKED_KEY && 
           trimmed !== 'your-gemini-api-key-here' && 
           !trimmed.startsWith('your-');
  };

  // 1. User supplied
  if (userApiKey && isValid(userApiKey)) {
    return userApiKey.trim();
  }

  // 2. LocalStorage (with cleanup)
  const localKey = typeof localStorage !== 'undefined' ? localStorage.getItem('tridorian_gemini_api_key') : '';
  if (localKey && isValid(localKey)) {
    return localKey.trim();
  } else if (localKey && !isValid(localKey)) {
    try {
      localStorage.removeItem('tridorian_gemini_api_key');
    } catch (e) {}
  }

  // 3. Env variable
  const envKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : '';
  if (envKey && isValid(envKey)) {
    return envKey.trim();
  }

  return '';
}

export async function generateThemeWithGemini(promptText, userApiKey = '') {
  const proxyUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PROXY_URL) || '/api';

  if (proxyUrl) {
    const url = `${proxyUrl.replace(/\/$/, '')}/generate-theme`;
    console.log(`[Client] [Theme] Routing theme generation request to proxy: ${url}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Client] [Theme] Proxy request failed: ${response.status} - ${errText}`);
      throw new Error(`Proxy error: ${response.status} - ${errText}`);
    }
    const themeVars = await response.json();
    console.log(`[Client] [Theme] Proxy returned custom theme successfully!`, themeVars);
    return themeVars;
  }

  const apiKey = getValidApiKey(userApiKey);
  const gAuthToken = getAccessToken();

  if (!apiKey && !gAuthToken) {
    const rawKey = (userApiKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('tridorian_gemini_api_key') : '') || '').trim();
    if (rawKey === 'AIzaSyCrQVmC1PFEFb-oLAuOQdT7Jr-gb9W-JzY') {
      throw new Error('API key was reported as leaked. Please use a different Gemini API key or sign in with Google.');
    }
    if (rawKey === 'your-gemini-api-key-here' || rawKey.startsWith('your-')) {
      throw new Error('Please replace the placeholder API key with a valid Gemini API key or sign in with Google.');
    }
    throw new Error('API_KEY_REQUIRED');
  }

  // Save key if supplied and valid
  if (userApiKey && getValidApiKey(userApiKey)) {
    localStorage.setItem('tridorian_gemini_api_key', userApiKey);
  }

  const systemInstruction = `You are an expert web designer and design tokens generator.
Generate a custom CSS theme palette in JSON format matching the user's stylistic description.
Return raw JSON only, no markdown blocks, no code blocks, no text wrapper.
Ensure high readability and contrast (minimum 4.5:1 text-to-background contrast ratio).
Specify these exact keys with hex values or standard rgba strings, plus a music configuration:
{
  "theme-name": "A short, cool, and creative name for this theme based on the prompt (e.g. 'Cyberpunk Oasis', 'Ethereal Forest', 'Midnight Neon')",
  "bg-base": "hex color for general page background",
  "bg-gradient": "linear-gradient CSS string (e.g. 'linear-gradient(135deg, #050805 0%, #020402 100%)' using bg-base and a slightly darker or lighter shade)",
  "bg-pattern": "one of: grid, dots, stripes, waves, circuit, none (choose the design texture overlay that best fits the theme prompt)",
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

  let url;
  const headers = { 'Content-Type': 'application/json' };

  if (apiKey) {
    url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  } else {
    url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
    headers['Authorization'] = `Bearer ${gAuthToken}`;
  }

  const payload = {
    contents: {
      role: 'user',
      parts: [{ text: `Generate a theme for: ${promptText}` }]
    },
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json'
    }
  };

  console.log(`[Client] [Theme] Dispatching Gemini API request to: ${url}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  });
 
  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Client] [Theme] Gemini API error: ${response.status} - ${errText}`);
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }
 
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  let cleanedText = text.trim();
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\n?/i, '').replace(/```$/i, '').trim();
  }
  
  console.log(`[Client] [Theme] Gemini responded successfully with raw output:`, cleanedText);
  const variables = JSON.parse(cleanedText);
  return variables;
}

export async function generateMusicWithLyria(promptText, userApiKey = '') {
  const proxyUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PROXY_URL) || '/api';

  if (proxyUrl) {
    const url = `${proxyUrl.replace(/\/$/, '')}/generate-music`;
    console.log(`[Client] [Music] Routing music generation request to proxy: ${url}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Client] [Music] Proxy request failed: ${response.status} - ${errText}`);
      throw new Error(`Proxy error: ${response.status} - ${errText}`);
    }
    const data = await response.json();
    console.log(`[Client] [Music] Proxy returned audio successfully! base64 length: ${data.audioDataUrl?.length || 0}`);
    return data.audioDataUrl;
  }

  const apiKey = getValidApiKey(userApiKey);
  const gAuthToken = getAccessToken();

  if (!apiKey && !gAuthToken) {
    const rawKey = (userApiKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('tridorian_gemini_api_key') : '') || '').trim();
    if (rawKey === 'AIzaSyCrQVmC1PFEFb-oLAuOQdT7Jr-gb9W-JzY') {
      throw new Error('API key was reported as leaked. Please use a different Gemini API key or sign in with Google.');
    }
    if (rawKey === 'your-gemini-api-key-here' || rawKey.startsWith('your-')) {
      throw new Error('Please replace the placeholder API key with a valid Gemini API key or sign in with Google.');
    }
    throw new Error('API_KEY_REQUIRED');
  }

  let url;
  const headers = { 'Content-Type': 'application/json' };

  if (apiKey) {
    url = `https://generativelanguage.googleapis.com/v1beta/models/lyria-3-clip-preview:generateContent?key=${apiKey}`;
  } else {
    url = `https://generativelanguage.googleapis.com/v1beta/models/lyria-3-clip-preview:generateContent`;
    headers['Authorization'] = `Bearer ${gAuthToken}`;
  }

  const payload = {
    contents: {
      parts: [{ text: `Generate exactly a 30-second seamless, perfectly looping instrumental background music track. No spoken vocals. It must have clean, smooth matching transitions at both start and end so it repeats flawlessly without any clicks or gaps. The genre, style, instrumentation, and mood of the track must match this description: ${promptText}` }]
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
  };

  console.log(`[Client] [Music] Dispatching Lyria API request to: ${url}`);
  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  });
 
  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Client] [Music] Lyria API error: ${response.status} - ${errText}`);
    throw new Error(`Lyria API error: ${response.status} - ${errText}`);
  }
 
  const data = await response.json();
  const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part || !part.inlineData || !part.inlineData.data) {
    console.error(`[Client] [Music] Empty inline audio data returned from Lyria candidate:`, data);
    throw new Error('No audio data returned from Lyria model.');
  }
 
  const audioUri = `data:audio/mpeg;base64,${part.inlineData.data}`;
  console.log(`[Client] [Music] Lyria generated music successfully! Base64 length: ${audioUri.length}`);
  return audioUri;
}

export async function generateImageWithImagen(promptText, userApiKey = '') {
  const proxyUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PROXY_URL) || '/api';

  if (proxyUrl) {
    const url = `${proxyUrl.replace(/\/$/, '')}/generate-image`;
    console.log(`[Client] [Image] Routing image generation request to proxy: ${url}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Client] [Image] Proxy request failed: ${response.status} - ${errText}`);
      throw new Error(`Proxy error: ${response.status} - ${errText}`);
    }
    const data = await response.json();
    console.log(`[Client] [Image] Proxy returned image successfully! base64 length: ${data.imageDataUrl?.length || 0}`);
    return data.imageDataUrl;
  }

  const apiKey = getValidApiKey(userApiKey);
  const gAuthToken = getAccessToken();

  if (!apiKey && !gAuthToken) {
    const rawKey = (userApiKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('tridorian_gemini_api_key') : '') || '').trim();
    if (rawKey === 'AIzaSyCrQVmC1PFEFb-oLAuOQdT7Jr-gb9W-JzY') {
      throw new Error('API key was reported as leaked. Please use a different Gemini API key or sign in with Google.');
    }
    if (rawKey === 'your-gemini-api-key-here' || rawKey.startsWith('your-')) {
      throw new Error('Please replace the placeholder API key with a valid Gemini API key or sign in with Google.');
    }
    throw new Error('API_KEY_REQUIRED');
  }

  const models = ['imagen-4.0-generate-001', 'imagen-4.0-fast-generate-001', 'imagen-4.0-ultra-generate-001'];
  let lastError = null;

  for (const model of models) {
    try {
      let url;
      const headers = { 'Content-Type': 'application/json' };

      if (apiKey) {
        url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;
      } else {
        url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`;
        headers['Authorization'] = `Bearer ${gAuthToken}`;
      }

      const payload = {
        instances: [
          {
            prompt: `A subtle, premium, seamless and tileable abstract repeating background pattern/texture overlay for a web app dashboard. Theme/Style: ${promptText}. Purely visual pattern of abstract shapes, geometry, lines or textures. ABSOLUTELY NO text, NO words, NO letters, NO numbers, NO typography, NO labels. Extremely clean, low contrast, elegant, decorative only.`
          }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
          outputMimeType: "image/jpeg"
        }
      };

      console.log(`[Client] [Image] Dispatching Imagen request to model ${model} at: ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000)
      });
 
      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Client] [Image] Model ${model} returned error status ${response.status}: ${errText}`);
        throw new Error(`Model ${model} failed with status ${response.status}: ${errText}`);
      }
 
      const data = await response.json();
      const prediction = data.predictions?.[0];
      if (!prediction || !prediction.bytesBase64Encoded) {
        console.error(`[Client] [Image] Empty prediction or bytes returned from model ${model}:`, data);
        throw new Error(`Model ${model} returned empty predictions`);
      }
 
      const imageUri = `data:image/jpeg;base64,${prediction.bytesBase64Encoded}`;
      console.log(`[Client] [Image] Model ${model} generated image successfully! Base64 length: ${imageUri.length}`);
      return imageUri;
    } catch (err) {
      console.warn(`[Client] [Image] Model ${model} failed:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`All Imagen models failed to generate background image. Last error: ${lastError ? lastError.message : 'Unknown'}`);
}
