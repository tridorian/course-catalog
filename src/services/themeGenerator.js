// src/services/themeGenerator.js
// Integrates with Gemini API to generate custom color theme JSON variables.
import { getAccessToken } from './googleAuth';

export async function generateThemeWithGemini(promptText, userApiKey = '') {
  const apiKey = userApiKey || 
                 localStorage.getItem('tridorian_gemini_api_key') || 
                 (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : '') || 
                 '';

  const gAuthToken = getAccessToken();

  if (!apiKey && !gAuthToken) {
    throw new Error('API_KEY_REQUIRED');
  }

  // Save key if supplied
  if (userApiKey) {
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

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  let cleanedText = text.trim();
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\n?/i, '').replace(/```$/i, '').trim();
  }
  
  const variables = JSON.parse(cleanedText);
  return variables;
}

export async function generateMusicWithLyria(promptText, userApiKey = '') {
  const apiKey = userApiKey || 
                 localStorage.getItem('tridorian_gemini_api_key') || 
                 (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : '') || 
                 '';

  const gAuthToken = getAccessToken();

  if (!apiKey && !gAuthToken) {
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
      parts: [{ text: `Generate exactly a 30-second seamless, perfectly looping ambient background instrumental music track. No spoken vocals. It must have clean, smooth matching transitions at both start and end so it repeats flawlessly without any clicks or gaps. Mood: ${promptText}` }]
    },
    generationConfig: {
      responseModalities: ['AUDIO', 'TEXT']
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Lyria API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part || !part.inlineData || !part.inlineData.data) {
    throw new Error('No audio data returned from Lyria model.');
  }

  return `data:audio/mpeg;base64,${part.inlineData.data}`;
}
