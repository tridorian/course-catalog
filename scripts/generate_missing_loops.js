// scripts/generate_missing_loops.js
// Generates high-fidelity music loops using the Lyria API
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const model = 'lyria-3-pro-preview';

const THEMES = [
  {
    name: 'clean_light',
    prompt: 'A clean, modern, peaceful, and optimistic ambient track. Soft acoustic guitar plucks, light ambient pad chords, and a gentle airy atmosphere. Upbeat but subtle, perfect for a focused light theme. Strictly a seamless, perfectly looping instrumental background music. Length: exactly 3 minutes. Clean transitions at start and end for flawless repeat play.'
  },
  {
    name: 'caribbean_mood',
    prompt: 'A sunny, relaxing, and warm Caribbean calypso ambient track. Soft steel drums playing a gentle calypso progression, stereo ocean waves washing on the shore, and a light acoustic guitar/bass accompaniment. Strictly a seamless, perfectly looping instrumental background music. Length: exactly 3 minutes. Clean transitions at start and end for flawless repeat play.'
  },
  {
    name: 'jungle_safari',
    prompt: 'An adventurous, mysterious, and organic jungle track inspired by a Jurassic Park jeep adventure. Deep tribal drums, rolling percussion, mysterious low brass and string pads, distant tropical forest bird calls, and rustling foliage. Strictly a seamless, perfectly looping instrumental background music. Length: exactly 3 minutes. Clean transitions at start and end for flawless repeat play.'
  }
];

async function generateThemeAudio(theme, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const payload = {
    contents: {
      parts: [{ text: theme.prompt }]
    },
    generationConfig: {
      responseModalities: ['AUDIO', 'TEXT']
    }
  };

  console.log(`[Lyria] Requesting loop for theme: ${theme.name}...`);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Lyria API error for ${theme.name}: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Lyria returned error for ${theme.name}: ${JSON.stringify(data.error)}`);
  }

  const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part || !part.inlineData || !part.inlineData.data) {
    throw new Error(`No audio data returned from Lyria model for ${theme.name}.`);
  }

  const outputDir = path.join(__dirname, '../public/audio');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, `${theme.name}_loop.mp3`);
  
  console.log(`[Lyria] Received audio data for ${theme.name}. Writing to ${outputPath}...`);
  const buffer = Buffer.from(part.inlineData.data, 'base64');
  fs.writeFileSync(outputPath, buffer);
  console.log(`[Lyria] Successfully generated and wrote ${theme.name}_loop.mp3 (${buffer.length} bytes).`);
}

async function run() {
  const apiKey = process.env.GEMINI_API_KEY || process.argv[2];
  if (!apiKey || apiKey.startsWith('AIzaSyCrQVmC1PFEFb')) {
    console.error("Error: Please provide a valid Gemini/Lyria API Key.");
    console.error("Usage: node scripts/generate_missing_loops.js <YOUR_API_KEY>");
    console.error("Or set the GEMINI_API_KEY environment variable.");
    process.exit(1);
  }

  console.log("Starting missing audio loop generation...");
  for (const theme of THEMES) {
    try {
      await generateThemeAudio(theme, apiKey);
    } catch (err) {
      console.error(`Failed to generate audio for ${theme.name}:`, err.message);
    }
  }
  console.log("All audio loop generation requests processed.");
}

run();
