import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '../public');
const CATALOG_PATH = path.join(PUBLIC_DIR, 'content/catalog.json');

function validateCatalog() {
  console.log('--- START CATALOG CONTENT VALIDATION ---');
  
  if (!fs.existsSync(CATALOG_PATH)) {
    console.error(`ERROR: catalog.json not found at ${CATALOG_PATH}`);
    process.exit(1);
  }

  let catalog;
  try {
    catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  } catch (err) {
    console.error(`ERROR: Failed to parse catalog.json: ${err.message}`);
    process.exit(1);
  }

  if (!catalog.tracks || !Array.isArray(catalog.tracks)) {
    console.error(`ERROR: catalog.json is missing a "tracks" array.`);
    process.exit(1);
  }

  let totalErrors = 0;

  function validateQuestionBlock(qText, options, feedback, file) {
    const context = `${file} -> "${qText.substring(0, 45).replace(/\n/g, ' ')}..."`;
    
    if (options.length === 0) {
      return;
    }
    
    if (!feedback) {
      console.error(`    ERROR: Question is missing feedback: ${context}`);
      totalErrors++;
      return;
    }

    const fbLower = feedback.toLowerCase();
    let correctLetter = null;
    
    const optionMatch = fbLower.match(/option\s+([a-d])/i) || 
                        fbLower.match(/correct answer:\s*\**\s*([a-d])/i) || 
                        fbLower.match(/([a-d])\s+is\s+correct/i) ||
                        fbLower.match(/answer\s+([a-d])/i) ||
                        fbLower.match(/\b([a-d])\b/i);
    
    if (optionMatch) {
      correctLetter = optionMatch[1].toUpperCase();
    }

    if (!correctLetter) {
      console.error(`    ERROR: Could not determine correct answer letter in feedback for: ${context}`);
      totalErrors++;
    } else {
      const hasCorrectOpt = options.some(opt => {
        const cleaned = opt.trim().replace(/^[-*]\s+/, '').replace(/^\*+/, '').replace(/\*+$/, '').trim();
        return cleaned.toUpperCase().startsWith(correctLetter) || 
               cleaned.toUpperCase().startsWith(`${correctLetter})`) ||
               cleaned.toUpperCase().startsWith(`${correctLetter}.`);
      });

      if (!hasCorrectOpt) {
        console.error(`    ERROR: Correct answer letter '${correctLetter}' not found in options: [${options.map(o => o.trim()).join(', ')}] for ${context}`);
        totalErrors++;
      }
    }
  }

  catalog.tracks.forEach(track => {
    console.log(`\nValidating Track: ${track.id} ("${track.title}")`);
    const trackDir = path.join(PUBLIC_DIR, `content/tracks/${track.id}`);
    const trackManifestPath = path.join(trackDir, 'track.json');

    if (!fs.existsSync(trackDir)) {
      console.error(`  ERROR: Track directory does not exist: ${trackDir}`);
      totalErrors++;
      return;
    }

    if (!fs.existsSync(trackManifestPath)) {
      console.error(`  ERROR: track.json missing at ${trackManifestPath}`);
      totalErrors++;
      return;
    }

    let trackManifest;
    try {
      trackManifest = JSON.parse(fs.readFileSync(trackManifestPath, 'utf8'));
    } catch (err) {
      console.error(`  ERROR: Failed to parse track.json for ${track.id}: ${err.message}`);
      totalErrors++;
      return;
    }

    if (trackManifest.track_id !== track.id) {
      console.error(`  ERROR: track.json track_id mismatch. Expected "${track.id}", got "${trackManifest.track_id}"`);
      totalErrors++;
    }

    if (!trackManifest.courses || !Array.isArray(trackManifest.courses)) {
      console.error(`  ERROR: track.json for ${track.id} is missing "courses" array.`);
      totalErrors++;
      return;
    }

    trackManifest.courses.forEach(course => {
      console.log(`  Validating Course: ${course.id} ("${course.title}")`);
      const courseDir = path.join(trackDir, course.id);
      const courseManifestPath = path.join(courseDir, 'manifest.json');
      const courseMetadataPath = path.join(courseDir, 'metadata.json');

      if (!fs.existsSync(courseDir)) {
        console.error(`    ERROR: Course directory does not exist: ${courseDir}`);
        totalErrors++;
        return;
      }

      if (!fs.existsSync(courseManifestPath)) {
        console.error(`    ERROR: manifest.json missing at ${courseManifestPath}`);
        totalErrors++;
        return;
      }

      if (!fs.existsSync(courseMetadataPath)) {
        console.error(`    ERROR: metadata.json missing at ${courseMetadataPath}`);
        totalErrors++;
        return;
      }

      let metadata;
      try {
        metadata = JSON.parse(fs.readFileSync(courseMetadataPath, 'utf8'));
      } catch (err) {
        console.error(`    ERROR: Failed to parse metadata.json: ${err.message}`);
        totalErrors++;
        return;
      }

      if (metadata.course_id !== course.id) {
        console.error(`    ERROR: metadata.json course_id mismatch. Expected "${course.id}", got "${metadata.course_id}"`);
        totalErrors++;
      }

      let manifest;
      try {
        manifest = JSON.parse(fs.readFileSync(courseManifestPath, 'utf8'));
      } catch (err) {
        console.error(`    ERROR: Failed to parse manifest.json: ${err.message}`);
        totalErrors++;
        return;
      }

      if (!manifest.metadata) {
        console.error(`    ERROR: manifest.json is missing the "metadata" pointer field.`);
        totalErrors++;
      }

      if (!manifest.modules || !Array.isArray(manifest.modules)) {
        console.error(`    ERROR: manifest.json is missing the "modules" array.`);
        totalErrors++;
        return;
      }

      manifest.modules.forEach(modRef => {
        if (typeof modRef.id !== 'string') {
          console.error(`    ERROR: Module ID "${modRef.id}" in manifest.json is of type ${typeof modRef.id}. IT MUST BE A STRING.`);
          totalErrors++;
        }

        const modFilePath = path.join(courseDir, modRef.file);
        if (!fs.existsSync(modFilePath)) {
          console.error(`    ERROR: Module content file not found: ${modFilePath}`);
          totalErrors++;
          return;
        }

        let moduleData;
        try {
          moduleData = JSON.parse(fs.readFileSync(modFilePath, 'utf8'));
        } catch (err) {
          console.error(`    ERROR: Failed to parse module JSON file ${modRef.file}: ${err.message}`);
          totalErrors++;
          return;
        }

        if (typeof moduleData.id !== 'string') {
          console.error(`    ERROR: Module ID "${moduleData.id}" in ${modRef.file} is of type ${typeof moduleData.id}. IT MUST BE A STRING.`);
          totalErrors++;
        }

        if (!moduleData.title) {
          console.error(`    ERROR: Module missing "title" in ${modRef.file}`);
          totalErrors++;
        }

        const type = moduleData.type || 'lab';
        if (type === 'lab') {
          if (!moduleData.blocks || !Array.isArray(moduleData.blocks)) {
            console.error(`    ERROR: Lab module missing "blocks" array in ${modRef.file}`);
            totalErrors++;
          } else {
            let currentQuestion = null;
            let currentOptions = [];
            let currentFeedback = null;

            moduleData.blocks.forEach((block, idx) => {
              if (!block.type) {
                console.error(`      ERROR: Block at index ${idx} in ${modRef.file} is missing "type"`);
                totalErrors++;
                return;
              }

              const content = block.content || '';
              const lowerContent = content.toLowerCase();

              // Check if this block contains a single-block question (contains question, options, and feedback all in one)
              const isSingleBlockQ = lowerContent.includes('question') &&
                                     (lowerContent.includes('feedback') || lowerContent.includes('correct answer') || lowerContent.includes('correct:')) &&
                                     content.includes('\n');

              if (isSingleBlockQ) {
                if (currentQuestion) {
                  validateQuestionBlock(currentQuestion, currentOptions, currentFeedback, modRef.file);
                  currentQuestion = null;
                  currentOptions = [];
                  currentFeedback = null;
                }

                // Parse single block
                const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
                let qText = '';
                let opts = [];
                let fb = '';

                lines.forEach(line => {
                  const cleanLine = line.replace(/^\*+/, '').replace(/\*+$/, '').trim();
                  const cleanLowerLine = cleanLine.toLowerCase();

                  if (cleanLowerLine.startsWith('question') || (!qText && !cleanLine.startsWith('-') && !cleanLine.match(/^[a-d][\.\)]/i))) {
                    qText += (qText ? '\n' : '') + line;
                  } else if (cleanLine.startsWith('-') || cleanLine.match(/^[A-D][\.\)]/i)) {
                    opts.push(line);
                  } else if (cleanLowerLine.includes('feedback') || cleanLowerLine.includes('correct:') || cleanLowerLine.includes('correct answer')) {
                    fb += (fb ? '\n' : '') + line;
                  } else {
                    if (fb) {
                      fb += '\n' + line;
                    } else if (opts.length > 0) {
                      opts[opts.length - 1] += '\n' + line;
                    } else {
                      qText += '\n' + line;
                    }
                  }
                });

                validateQuestionBlock(qText, opts, fb, modRef.file);
                return;
              }

              const isQuestion = content.trim().toLowerCase().startsWith('question') ||
                                 (block.type === 'p' && content.includes('Question') && (content.includes('?') || content.includes(':'))) ||
                                 (block.type === 'p' && lowerContent.startsWith('**question'));

              if (isQuestion) {
                if (currentQuestion) {
                  validateQuestionBlock(currentQuestion, currentOptions, currentFeedback, modRef.file);
                }
                currentQuestion = content;
                currentOptions = [];
                currentFeedback = null;
              } else if (currentQuestion) {
                const isOption = block.type === 'list' ||
                                 content.trim().startsWith('- ') ||
                                 content.trim().match(/^[A-D]\)/i) ||
                                 content.trim().match(/^[A-D]\.\s/i);
                const isFeedback = block.type === 'info' ||
                                   lowerContent.includes('feedback') ||
                                   lowerContent.includes('correct answer') ||
                                   lowerContent.includes('correct:');

                if (block.type === 'list' && block.items) {
                  currentOptions.push(...block.items);
                } else if (isOption) {
                  if (content.includes('\n')) {
                    currentOptions.push(...content.split('\n').map(l => l.trim()).filter(Boolean));
                  } else {
                    currentOptions.push(content);
                  }
                } else if (isFeedback) {
                  currentFeedback = content;
                  validateQuestionBlock(currentQuestion, currentOptions, currentFeedback, modRef.file);
                  currentQuestion = null;
                  currentOptions = [];
                  currentFeedback = null;
                }
              }
            });

            if (currentQuestion) {
              validateQuestionBlock(currentQuestion, currentOptions, currentFeedback, modRef.file);
            }
          }
        }
      });
    });
  });

  console.log(`\nValidation complete. Total validation errors: ${totalErrors}`);
  if (totalErrors > 0) {
    console.error('--- VALIDATION FAILED ---');
    process.exit(1);
  } else {
    console.log('--- VALIDATION SUCCESSFUL: ALL CONTENT INTEGRITY RULES MET ---');
    process.exit(0);
  }
}

validateCatalog();
