import fs from 'fs';
import path from 'url';
import nodePath from 'path';
import { fileURLToPath } from 'url';

const __dirname = nodePath.dirname(fileURLToPath(import.meta.url));
const COURSE_DIR = nodePath.join(__dirname, '../public/content/tracks/agentic-engineering/agy-331');
const SCRATCH_DIR = path.join(__dirname, '../scratch');

async function main() {
  const metadataPath = nodePath.join(COURSE_DIR, 'metadata.json');
  const manifestPath = nodePath.join(COURSE_DIR, 'manifest.json');
  
  if (!fs.existsSync(metadataPath) || !fs.existsSync(manifestPath)) {
    console.error('Metadata or Manifest file not found.');
    process.exit(1);
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const highlights = metadata.features.map(f => ({
    icon: f.icon,
    title: f.title.replace(/\*\*/g, ''), // Strip markdown bold from highlights title for GDoc
    description: f.description
  }));

  const modules = [];

  for (const modRef of manifest.modules) {
    const modFilePath = nodePath.join(COURSE_DIR, modRef.file);
    if (!fs.existsSync(modFilePath)) {
      console.error(`Module file not found: ${modFilePath}`);
      process.exit(1);
    }
    const modData = JSON.parse(fs.readFileSync(modFilePath, 'utf8'));
    modules.push({
      title: modData.title,
      blocks: modData.blocks
    });
  }

  const consolidated = {
    course_id: metadata.course_id,
    title: metadata.title,
    description: metadata.description,
    highlights: highlights,
    modules: modules
  };

  // Ensure scratch dir exists
  fs.mkdirSync(SCRATCH_DIR, { recursive: true });

  const outputPath = nodePath.join(SCRATCH_DIR, 'curriculum_agy-331.json');
  fs.writeFileSync(outputPath, JSON.stringify(consolidated, null, 2), 'utf8');
  console.log(`Successfully compiled consolidated curriculum JSON to ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
