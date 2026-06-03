import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const TRACK_DIR = path.join(ROOT_DIR, 'public/content/tracks/agentic-engineering');
const TRACK_JSON_PATH = path.join(TRACK_DIR, 'track.json');

async function getGeminiToken() {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(process.env.HOME || '', '.gcloud_config', 'application_default_credentials.json');
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token;
}

async function generateContent(token, systemInstruction, prompt) {
  const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/tridorian-taylor-sandbox/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent`;
  
  const payload = {
    contents: {
      role: 'user',
      parts: [{ text: prompt }]
    },
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192
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
    throw new Error(`Gemini API call failed: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function main() {
  console.log('Acquiring Gemini token...');
  const token = await getGeminiToken();
  console.log('Token acquired.');

  if (!fs.existsSync(TRACK_JSON_PATH)) {
    console.error(`track.json not found at ${TRACK_JSON_PATH}`);
    process.exit(1);
  }

  const trackData = JSON.parse(fs.readFileSync(TRACK_JSON_PATH, 'utf8'));
  const courses = trackData.courses || [];

  // 1. Generate Overall Track Critique & Retort
  console.log('\n--- Generating Overall Track Critique & Retort ---');
  const trackSystemPromptCritique = `You are a highly skeptical, opinionated Enterprise Software Architect and DevOps Lead.
Your task is to write a detailed, highly critical review of the "Agentic Engineering" curriculum track (track.json details attached).
Critique the entire track design and the badge/progression system (L100 Foundations, L200 UI Electives, L300 Integrators/Architects/Platform, L400 Enterprise scale).
Critique the differentiators "agy-easy-install" (a unified shell manager script) and "agy-box" (distrobox sandbox container for immutables).
Be brutal, analytical, and professional. Focus on:
- High security risks of mounting home folders inside containers (agy-box).
- Security risks of forwarding DBus and X11/Wayland sockets for GUI and keyring replication.
- Brittle installation nature of a 125KB interactive shell script (agy-easy-install) versus standardized config management (like Ansible or Nix).
- Autonomy vs Safety: Are Allow/Ask/Deny lists and Jules VM remote execution steps enough to satisfy corporate audits?
- Course structure: Is splitting UI electives (standalone app, CLI, IDE) into separate 90-minute courses redundant?
- Badge progression: Does completing simple labs actually prove competency for "Certified Platform Engineer" or "Certified Workspace Specialist"?

Write your critique in Markdown format. Avoid placeholders. Keep it structured and high quality.`;

  const trackSystemPromptRetort = `You are a Senior Principal Curriculum Developer and the Author of the "Agentic Engineering" track.
Your task is to write a firm, detailed defense and retort to the critiques leveled against the overall track, badges, and core tools (agy-easy-install and agy-box).
Defend the pedagogical choices, usability considerations, and engineering design:
- Why "agy-easy-install" is an essential onboarding tool (providing an interactive/graceful setup for developers on macOS/Windows/Linux, with a Demo UI mode to show mock setup without modifying the system).
- Why "agy-box" using Distrobox with mounts for home directories and GUI forwarding is a deliberate, high-productivity pattern (retaining host credentials/keys, allowing developers to see Chrome previews and IDE views natively, without slow VNC setups).
- Explain how security is layered (with Allow/Ask/Deny commands, secure mode, and offloading high-risk testing to isolated remote Jules VM pools, which protects the developer machine).
- Defend the progression: L100 introduces safety and installation; L200 lets engineers specialize in their UI preference; L300/400 splits integrators (SDK/API), architects (VMs/compliance rules), and platform engineers (CI/CD sandboxes) to match organizational roles.

Write your retort in Markdown format, addressing the critique points directly. Avoid placeholders.`;

  const trackDetailsStr = JSON.stringify(trackData, null, 2);
  
  console.log('Generating Track Critique...');
  const trackCritique = await generateContent(token, trackSystemPromptCritique, `Track Details:\n${trackDetailsStr}`);
  fs.writeFileSync(path.join(TRACK_DIR, 'critique.md'), trackCritique, 'utf8');
  console.log('Track Critique saved.');

  console.log('Generating Track Retort...');
  const trackRetort = await generateContent(token, trackSystemPromptRetort, `Track Critique to reply to:\n${trackCritique}\n\nTrack Details:\n${trackDetailsStr}`);
  fs.writeFileSync(path.join(TRACK_DIR, 'retort.md'), trackRetort, 'utf8');
  console.log('Track Retort saved.');

  // 2. Generate Course-Specific Critique & Retort
  for (const course of courses) {
    console.log(`\n--- Generating Critique & Retort for ${course.id.toUpperCase()} ---`);
    const courseDir = path.join(TRACK_DIR, course.id);
    const manifestPath = path.join(courseDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      console.warn(`Manifest not found for course ${course.id}, skipping.`);
      continue;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const modulesContent = [];
    for (const modRef of manifest.modules) {
      const modPath = path.join(courseDir, modRef.file);
      if (fs.existsSync(modPath)) {
        const mod = JSON.parse(fs.readFileSync(modPath, 'utf8'));
        modulesContent.push({
          title: mod.title,
          blocks: mod.blocks ? mod.blocks.slice(0, 10).map(b => ({ type: b.type, content: b.content || b.items })) : []
        });
      }
    }

    const courseDataStr = JSON.stringify({
      id: course.id,
      title: course.title,
      description: course.description,
      modules: modulesContent
    }, null, 2);

    const courseSystemPromptCritique = `You are a skeptical Enterprise Tech Lead and Course Auditor.
Your task is to write a highly critical review of the syllabus for the course "${course.title}" (${course.id}).
Analyze the modules, lab guides, command usage, and quiz questions.
Identify weak points, unrealistic labs, security gaps, toolchain assumptions, or logical flaws.
Critique how it handles installer helper "agy-easy-install" or "agy-box" integration if mentioned.
Be analytical, precise, and professional. Write in Markdown. Do not use placeholders.`;

    const courseSystemPromptRetort = `You are the lead syllabus author for "${course.title}" (${course.id}).
Read the critique of your course and write a firm, professional retort and defense of the course's design, topics, labs, and quiz questions.
Defend the pedagogical choices: why specific labs were chosen, why tools like agy-easy-install or agy-box were integrated, how this aligns with developer enablement, and why the curriculum prepares developers for real-world agent orchestration.
Write in Markdown. Do not use placeholders.`;

    console.log(`Generating Critique for ${course.id}...`);
    const courseCritique = await generateContent(token, courseSystemPromptCritique, `Course Details:\n${courseDataStr}`);
    fs.writeFileSync(path.join(courseDir, 'critique.md'), courseCritique, 'utf8');
    console.log(`Critique saved for ${course.id}.`);

    console.log(`Generating Retort for ${course.id}...`);
    const courseRetort = await generateContent(token, courseSystemPromptRetort, `Course Critique to reply to:\n${courseCritique}\n\nCourse Details:\n${courseDataStr}`);
    fs.writeFileSync(path.join(courseDir, 'retort.md'), courseRetort, 'utf8');
    console.log(`Retort saved for ${course.id}.`);
  }

  console.log('\nAll critiques and retorts generated successfully!');
}

main().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});
