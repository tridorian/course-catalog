import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const CONFIG_JSON_PATH = path.join(ROOT_DIR, 'scripts/sync-config.json');
const SCRATCH_DIR = path.join(__dirname, '../scratch');

async function main() {
  if (!fs.existsSync(CONFIG_JSON_PATH)) {
    console.error(`Sync config not found at: ${CONFIG_JSON_PATH}`);
    process.exit(1);
  }

  const syncConfig = JSON.parse(fs.readFileSync(CONFIG_JSON_PATH, 'utf8'));
  const agyItems = syncConfig.filter(item => item.trackId === 'agentic-engineering');

  if (agyItems.length === 0) {
    console.error('No AGY courses found in sync-config.json.');
    process.exit(1);
  }

  // Ensure scratch directory exists
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });

  console.log(`=== COMPILES AND POPULATES ${agyItems.length} AGY COURSES TO GOOGLE DOCS ===`);

  for (const item of agyItems) {
    const courseId = item.courseId;
    const docId = item.docId;
    const COURSE_DIR = path.join(ROOT_DIR, `public/content/tracks/agentic-engineering/${courseId}`);

    console.log(`\n--------------------------------------------`);
    console.log(`Processing course: ${courseId} (Doc ID: ${docId})...`);

    const metadataPath = path.join(COURSE_DIR, 'metadata.json');
    const manifestPath = path.join(COURSE_DIR, 'manifest.json');

    if (!fs.existsSync(metadataPath) || !fs.existsSync(manifestPath)) {
      console.warn(`[SKIP] Missing metadata or manifest files for ${courseId}`);
      continue;
    }

    // 1. Compile curriculum JSON
    console.log(`Compiling local curriculum for ${courseId}...`);
    let metadata, manifest;
    try {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      console.error(`[ERROR] Failed to parse JSON files for ${courseId}:`, e.message);
      continue;
    }

    const highlights = (metadata.features || []).map(f => ({
      icon: f.icon || '🧭',
      title: (f.title || '').replace(/\*\*/g, ''),
      description: f.description || ''
    }));

    const modules = [];
    let hasMissingModules = false;

    for (const modRef of manifest.modules) {
      const modFilePath = path.join(COURSE_DIR, modRef.file);
      if (!fs.existsSync(modFilePath)) {
        console.error(`[ERROR] Module file not found: ${modRef.file} for ${courseId}`);
        hasMissingModules = true;
        break;
      }
      try {
        const modData = JSON.parse(fs.readFileSync(modFilePath, 'utf8'));
        modules.push({
          title: modData.title,
          blocks: modData.blocks
        });
      } catch (e) {
        console.error(`[ERROR] Failed to parse module file ${modRef.file}:`, e.message);
        hasMissingModules = true;
        break;
      }
    }

    if (hasMissingModules) {
      console.warn(`[SKIP] Skipping ${courseId} due to missing or broken module files.`);
      continue;
    }

    const consolidated = {
      course_id: metadata.course_id,
      title: metadata.title,
      description: metadata.description,
      highlights: highlights,
      modules: modules
    };

    const outputPath = path.join(SCRATCH_DIR, `curriculum_${courseId}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(consolidated, null, 2), 'utf8');
    console.log(`Saved consolidated JSON to ${outputPath}`);

    // 2. Populate Google Doc
    console.log(`Populating Google Doc ${docId} using populate-course-doc.js...`);
    const runResult = spawnSync('node', [
      path.join(ROOT_DIR, 'scripts/populate-course-doc.js'),
      '--docId', docId,
      '--data', outputPath
    ], { stdio: 'inherit' });

    if (runResult.status !== 0) {
      console.error(`[ERROR] Failed to populate Google Doc for ${courseId}`);
    } else {
      console.log(`[SUCCESS] Successfully compiled and populated ${courseId}!`);
    }
  }

  console.log('\n=== AGY TRACK COMPILATION AND POPULATION COMPLETED ===');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
