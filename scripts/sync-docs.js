import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

const SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];

async function getDocsClient() {
  const authKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!authKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  let credentials;
  try {
    credentials = JSON.parse(authKey);
  } catch (e) {
    throw new Error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY as JSON');
  }

  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    SCOPES
  );

  return google.docs({ version: 'v1', auth });
}

function parseTextRun(run) {
  let text = run.textRun.content;
  const style = run.textRun.textStyle || {};

  if (style.bold) text = `**${text}**`;
  if (style.link && style.link.url) {
    text = `[${text}](${style.link.url})`;
  }
  return text;
}

function parseParagraph(paragraph) {
  if (!paragraph.elements) return '';
  return paragraph.elements
    .filter(el => el.textRun)
    .map(parseTextRun)
    .join('');
}

function getBackgroundColor(cell) {
  const style = cell.tableCellStyle || {};
  const bgColor = style.backgroundColor || {};
  const color = bgColor.color || {};
  const rgb = color.rgbColor || {};

  if (!rgb.red && !rgb.green && !rgb.blue) return null;

  // Convert to hex
  const r = Math.round((rgb.red || 0) * 255).toString(16).padStart(2, '0');
  const g = Math.round((rgb.green || 0) * 255).toString(16).padStart(2, '0');
  const b = Math.round((rgb.blue || 0) * 255).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`.toLowerCase();
}

function parseTabContent(content) {
  const blocks = [];
  let currentList = null;

  content.forEach(element => {
    if (element.paragraph) {
      const p = element.paragraph;
      const text = parseParagraph(p).trim();

      if (!text && !p.bullet) {
        currentList = null;
        return;
      }

      const styleType = p.paragraphStyle?.namedStyleType;

      if (styleType === 'HEADING_1') {
        blocks.push({ type: 'h1', content: text });
        currentList = null;
      } else if (styleType === 'HEADING_2') {
        blocks.push({ type: 'h2', content: text });
        currentList = null;
      } else if (styleType === 'HEADING_3') {
        blocks.push({ type: 'h3', content: text });
        currentList = null;
      } else if (p.bullet) {
        // Simple list handling
        if (!currentList) {
          currentList = { type: 'list', items: [] };
          blocks.push(currentList);
        }
        currentList.items.push(text);
      } else {
        // Check for code block (usually monospaced font)
        const isCode = p.elements?.every(el => el.textRun?.textStyle?.weightedFontFamily?.fontFamily === 'Courier New' || el.textRun?.textStyle?.weightedFontFamily?.fontFamily === 'Consolas');

        if (isCode && text) {
           blocks.push({ type: 'code', content: text, language: 'bash' });
        } else if (text) {
          blocks.push({ type: 'p', content: text });
        }
        currentList = null;
      }
    } else if (element.table) {
      currentList = null;
      const table = element.table;
      if (table.rows === 1 && table.columns === 1) {
        const cell = table.tableRows[0].tableCells[0];
        const bgColor = getBackgroundColor(cell);
        const cellText = cell.content.map(c => c.paragraph ? parseParagraph(c.paragraph) : '').join('\n').trim();

        if (bgColor === '#dcfce7') {
          blocks.push({ type: 'info', content: cellText });
        } else if (bgColor === '#fee2e2') {
          blocks.push({ type: 'warning', content: cellText });
        }
      } else if (table.columns === 2) {
        // Could be features table in Intro
        const rows = table.tableRows.map(row => {
          return row.tableCells.map(cell =>
            cell.content.map(c => c.paragraph ? parseParagraph(c.paragraph) : '').join('\n').trim()
          );
        });
        blocks.push({ type: 'table', rows });
      }
    }
  });

  return blocks;
}

function parseConfigTab(content) {
  const config = {};
  content.forEach(element => {
    if (element.table) {
      element.table.tableRows.forEach(row => {
        if (row.tableCells.length >= 2) {
          const key = row.tableCells[0].content.map(c => c.paragraph ? parseParagraph(c.paragraph).trim() : '').join('').replace(/:$/, '');
          const value = row.tableCells[1].content.map(c => c.paragraph ? parseParagraph(c.paragraph).trim() : '').join('');
          if (key) config[key] = value;
        }
      });
    }
  });
  return config;
}

function parseIntroTab(content) {
  let title = '';
  let description = '';
  const features = [];

  content.forEach(element => {
    if (element.paragraph) {
      const p = element.paragraph;
      const text = parseParagraph(p).trim();
      const styleType = p.paragraphStyle?.namedStyleType;

      if (styleType === 'HEADING_1' && !title) {
        title = text;
      } else if (!styleType || styleType === 'NORMAL_TEXT') {
        if (text && !description) description = text;
      }
    } else if (element.table && element.table.columns === 2) {
      element.table.tableRows.forEach(row => {
        const icon = row.tableCells[0].content.map(c => c.paragraph ? parseParagraph(c.paragraph).trim() : '').join('');
        const text = row.tableCells[1].content.map(c => c.paragraph ? parseParagraph(c.paragraph).trim() : '').join('\n').trim();
        if (icon && text) {
          const [fTitle, ...fDescLines] = text.split('\n');
          features.push({ icon, title: fTitle, description: fDescLines.join('\n') });
        }
      });
    }
  });

  return { title, description, features };
}

function classifyModule(blocks) {
  const hasSlides = blocks.some(b => b.type === 'slides' || (b.type === 'p' && b.content.includes('docs.google.com/presentation')));
  const hasVideo = blocks.some(b => b.type === 'video' || (b.type === 'p' && b.content.includes('drive.google.com/file') && b.content.includes('view')));

  if (hasSlides || hasVideo) return 'presentation';

  const hasCode = blocks.some(b => b.type === 'code');
  const hasLinks = blocks.some(b => b.type === 'p' && b.content.includes(']('));

  if (!hasCode && hasLinks) return 'resource';

  return 'lab';
}

async function syncCourse(docs, docId, targetTrackId, targetCourseId) {
  console.log(`Syncing doc ${docId} to ${targetTrackId}/${targetCourseId}...`);

  const doc = await docs.documents.get({
    documentId: docId,
    includeTabsContent: true
  });

  const tabs = doc.data.tabs || [];

  let config = {};
  let intro = {};
  const modules = [];

  for (const tab of tabs) {
    const title = tab.tabProperties.title;
    const content = tab.documentTab.body.content;

    if (title === '[Config]') {
      config = parseConfigTab(content);
    } else if (title === '[Intro]') {
      intro = parseIntroTab(content);
    } else if (title.startsWith('[') && title.endsWith(']')) {
      const moduleName = title.slice(1, -1);
      const blocks = parseTabContent(content);

      // Clean up slides/video from paragraphs if they should be their own blocks
      blocks.forEach((block, index) => {
        if (block.type === 'p') {
          if (block.content.includes('docs.google.com/presentation')) {
            const match = block.content.match(/\[(.*?)\]\((https:\/\/docs\.google\.com\/presentation\/d\/[^\/)]+).*?\)/);
            if (match) {
              blocks[index] = { type: 'slides', url: match[2], title: match[1] };
            }
          } else if (block.content.includes('drive.google.com/file')) {
             const match = block.content.match(/\[(.*?)\]\((https:\/\/drive\.google\.com\/file\/d\/[^\/)]+).*?\)/);
             if (match) {
               blocks[index] = { type: 'video', url: match[2], title: match[1] };
             }
          }
        }
      });

      modules.push({
        title: moduleName,
        blocks
      });
    }
  }

  const courseDir = path.join(ROOT_DIR, 'public/content/tracks', targetTrackId, targetCourseId);
  const modulesDir = path.join(courseDir, 'modules');

  if (!fs.existsSync(modulesDir)) {
    fs.mkdirSync(modulesDir, { recursive: true });
  }

  // Write metadata.json
  const metadata = {
    course_id: config.course_id || targetCourseId,
    title: config.title || intro.title,
    version: config.version || '1.0.0',
    author: config.author || 'Unknown',
    description: intro.description,
    features: intro.features
  };

  const metadataPath = path.join(courseDir, 'metadata.json');
  updateFileIfChanged(metadataPath, JSON.stringify(metadata, null, 2));

  // Write modules
  const manifestModules = [];
  modules.forEach((mod, index) => {
    const id = (index + 1).toString();
    const fileName = `${id.padStart(2, '0')}-${mod.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    const modulePath = path.join(modulesDir, fileName);

    const moduleData = {
      id,
      title: mod.title,
      type: classifyModule(mod.blocks),
      blocks: mod.blocks
    };

    updateFileIfChanged(modulePath, JSON.stringify(moduleData, null, 2));

    manifestModules.push({
      id,
      title: mod.title,
      file: `modules/${fileName}`
    });
  });

  // Write manifest.json
  const manifest = {
    metadata: 'metadata.json',
    modules: manifestModules
  };
  const manifestPath = path.join(courseDir, 'manifest.json');
  updateFileIfChanged(manifestPath, JSON.stringify(manifest, null, 2));

  // Update track.json
  updateTrackJson(targetTrackId, targetCourseId, metadata, manifestModules.length);

  // Update catalog.json
  updateCatalogJson(targetTrackId);
}

function updateFileIfChanged(filePath, content) {
  if (fs.existsSync(filePath)) {
    const existingContent = fs.readFileSync(filePath, 'utf8');
    if (existingContent === content) {
      return;
    }
  }
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${filePath}`);
}

function updateTrackJson(trackId, courseId, metadata, moduleCount) {
  const trackDir = path.join(ROOT_DIR, 'public/content/tracks', trackId);
  if (!fs.existsSync(trackDir)) {
    fs.mkdirSync(trackDir, { recursive: true });
  }

  const trackPath = path.join(trackDir, 'track.json');
  let track;

  if (fs.existsSync(trackPath)) {
    track = JSON.parse(fs.readFileSync(trackPath, 'utf8'));
  } else {
    track = {
      track_id: trackId,
      title: trackId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: '',
      courses: []
    };
  }

  const courseIndex = track.courses.findIndex(c => c.id === courseId);

  const courseInfo = {
    id: courseId,
    title: metadata.title,
    description: metadata.description,
    modules: moduleCount,
    icon: 'BookOpen' // Default icon
  };

  if (courseIndex >= 0) {
    track.courses[courseIndex] = { ...track.courses[courseIndex], ...courseInfo };
  } else {
    track.courses.push(courseInfo);
  }

  updateFileIfChanged(trackPath, JSON.stringify(track, null, 2));
}

function updateCatalogJson(trackId) {
  const catalogPath = path.join(ROOT_DIR, 'public/content/catalog.json');
  if (!fs.existsSync(catalogPath)) return;

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const trackIndex = catalog.tracks.findIndex(t => t.id === trackId);

  if (trackIndex === -1) {
    catalog.tracks.push({
      id: trackId,
      title: trackId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: '',
      icon: 'Cpu' // Default icon
    });
    updateFileIfChanged(catalogPath, JSON.stringify(catalog, null, 2));
  }
}

async function main() {
  const configPath = path.join(__dirname, 'sync-config.json');
  if (!fs.existsSync(configPath)) {
    console.error('sync-config.json not found');
    process.exit(1);
  }

  const syncConfigs = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const docs = await getDocsClient();

  for (const config of syncConfigs) {
    try {
      await syncCourse(docs, config.docId, config.trackId, config.courseId);
    } catch (error) {
      console.error(`Failed to sync course ${config.courseId}:`, error);
    }
  }
}

main();
