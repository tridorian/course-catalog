import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const TRACK_DIR = path.join(ROOT_DIR, 'public/content/tracks/adk-development');

const PLACEHOLDER_REGEX = /todo|fixme|\[insert|placeholder|<placeholder>|\[todo\]|__replace__/i;

const auditResults = {
  totalCourses: 0,
  totalModules: 0,
  totalBlocks: 0,
  failures: [],
  warnings: []
};

function checkText(text, filePath, blockIndex, field = 'content') {
  if (!text || typeof text !== 'string') return;

  // 1. Check for placeholders
  if (PLACEHOLDER_REGEX.test(text)) {
    auditResults.failures.push({
      file: path.relative(ROOT_DIR, filePath),
      block: blockIndex,
      type: 'placeholder_found',
      message: `Placeholder pattern matches: "${text.substring(0, 100)}..."`
    });
  }

  // 2. Check for overly long paragraph blocks (> 800 characters)
  if (text.length > 800) {
    auditResults.warnings.push({
      file: path.relative(ROOT_DIR, filePath),
      block: blockIndex,
      type: 'long_paragraph',
      message: `Paragraph is ${text.length} characters long, consider breaking it down for better readability.`
    });
  }
}

function auditBlock(block, filePath, index) {
  auditResults.totalBlocks++;

  if (!block.type) {
    auditResults.failures.push({
      file: path.relative(ROOT_DIR, filePath),
      block: index,
      type: 'missing_block_type',
      message: 'Block is missing its type specification.'
    });
    return;
  }

  // Check main content
  if (block.content) {
    checkText(block.content, filePath, index);
  }

  // Check custom block type schemas
  if (block.type === 'grid' && block.items) {
    block.items.forEach((item, itemIdx) => {
      checkText(item.title, filePath, index, `grid[${itemIdx}].title`);
      checkText(item.content, filePath, index, `grid[${itemIdx}].content`);
    });
  }

  if (block.type === 'list' && block.items) {
    block.items.forEach((item, itemIdx) => {
      checkText(item, filePath, index, `list[${itemIdx}]`);
    });
  }

  if (block.type === 'numbered_list' && block.items) {
    block.items.forEach((item, itemIdx) => {
      if (typeof item === 'string') {
        checkText(item, filePath, index, `numbered_list[${itemIdx}]`);
      } else {
        checkText(item.title, filePath, index, `numbered_list[${itemIdx}].title`);
        checkText(item.content, filePath, index, `numbered_list[${itemIdx}].content`);
        if (item.code) checkText(item.code, filePath, index, `numbered_list[${itemIdx}].code`);
        if (item.prompt) checkText(item.prompt, filePath, index, `numbered_list[${itemIdx}].prompt`);
        if (item.sub_blocks) {
          item.sub_blocks.forEach((sb, sbi) => auditBlock(sb, filePath, `${index}.sub[${sbi}]`));
        }
      }
    });
  }

  if (block.type === 'tier_card') {
    checkText(block.title, filePath, index, 'tier_card.title');
    checkText(block.description, filePath, index, 'tier_card.description');
    if (block.code) checkText(block.code, filePath, index, 'tier_card.code');
    if (block.items) {
      block.items.forEach((item, itemIdx) => checkText(item, filePath, index, `tier_card.items[${itemIdx}]`));
    }
  }

  if (block.type === 'info' || block.type === 'warning') {
    checkText(block.title, filePath, index, `${block.type}.title`);
    checkText(block.content, filePath, index, `${block.type}.content`);
    if (block.code) checkText(block.code, filePath, index, `${block.type}.code`);
  }

  if (block.type === 'code') {
    const code = block.code || block.content;
    if (!code) {
      auditResults.failures.push({
        file: path.relative(ROOT_DIR, filePath),
        block: index,
        type: 'empty_code_block',
        message: 'Code block is empty or missing content.'
      });
    } else {
      checkText(code, filePath, index, 'code');
    }
  }

  if (block.type === 'timeline' && block.items) {
    block.items.forEach((item, itemIdx) => {
      checkText(item.title, filePath, index, `timeline[${itemIdx}].title`);
      checkText(item.content, filePath, index, `timeline[${itemIdx}].content`);
      if (item.code) checkText(item.code, filePath, index, `timeline[${itemIdx}].code`);
      if (item.prompt) checkText(item.prompt, filePath, index, `timeline[${itemIdx}].prompt`);
    });
  }

  if (block.type === 'recovery_options' && block.items) {
    block.items.forEach((item, itemIdx) => {
      checkText(item.title, filePath, index, `recovery_options[${itemIdx}].title`);
      checkText(item.content, filePath, index, `recovery_options[${itemIdx}].content`);
    });
  }

  if (block.type === 'next_steps' && block.items) {
    checkText(block.title, filePath, index, 'next_steps.title');
    block.items.forEach((item, itemIdx) => {
      checkText(item.title, filePath, index, `next_steps[${itemIdx}].title`);
      checkText(item.content, filePath, index, `next_steps[${itemIdx}].content`);
    });
  }
}

function runAudit() {
  if (!fs.existsSync(TRACK_DIR)) {
    console.error(`Track directory does not exist: ${TRACK_DIR}`);
    process.exit(1);
  }

  const items = fs.readdirSync(TRACK_DIR);
  const courses = items.filter(item => {
    return fs.statSync(path.join(TRACK_DIR, item)).isDirectory() && item.startsWith('adk-');
  });

  auditResults.totalCourses = courses.length;

  for (const courseId of courses) {
    const coursePath = path.join(TRACK_DIR, courseId);
    const modulesDir = path.join(coursePath, 'modules');
    if (!fs.existsSync(modulesDir)) continue;

    const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.endsWith('.json'));
    auditResults.totalModules += moduleFiles.length;

    for (const modFile of moduleFiles) {
      const modFilePath = path.join(modulesDir, modFile);
      let data;
      try {
        data = JSON.parse(fs.readFileSync(modFilePath, 'utf8'));
      } catch (e) {
        auditResults.failures.push({
          file: path.relative(ROOT_DIR, modFilePath),
          block: -1,
          type: 'json_parse_error',
          message: e.message
        });
        continue;
      }

      if (!data.blocks || !Array.isArray(data.blocks)) {
        auditResults.failures.push({
          file: path.relative(ROOT_DIR, modFilePath),
          block: -1,
          type: 'missing_blocks_array',
          message: 'Module does not contain a valid blocks array.'
        });
        continue;
      }

      data.blocks.forEach((block, idx) => auditBlock(block, modFilePath, idx));
    }
  }

  // Print results
  console.log('=== ADK TRACK QUALITY AUDIT RESULTS ===');
  console.log(`Total Courses Audited: ${auditResults.totalCourses}`);
  console.log(`Total Modules Audited: ${auditResults.totalModules}`);
  console.log(`Total Content Blocks: ${auditResults.totalBlocks}`);
  console.log(`Total Failures/Placeholders Found: ${auditResults.failures.length}`);
  console.log(`Total Readability Warnings: ${auditResults.warnings.length}`);

  // Write detailed report to artifact directory
  const reportPath = path.join(ROOT_DIR, '.gemini/antigravity-cli/brain/9b98efbd-6ce7-4922-b107-9f3154ab80eb/adk_audit_report.md');
  const dirReport = path.dirname(reportPath);
  fs.mkdirSync(dirReport, { recursive: true });

  let md = `# 📊 ADK Track Quality Audit Report\n\n`;
  md += `**Date:** ${new Date().toISOString()}\n`;
  md += `*   **Total Courses Audited:** ${auditResults.totalCourses}\n`;
  md += `*   **Total Modules Audited:** ${auditResults.totalModules}\n`;
  md += `*   **Total Blocks Scanned:** ${auditResults.totalBlocks}\n`;
  md += `*   **Critical Failures (Placeholders, Broken schemas):** ${auditResults.failures.length}\n`;
  md += `*   **Warnings (Readability, Text length):** ${auditResults.warnings.length}\n\n`;

  if (auditResults.failures.length > 0) {
    md += `## ❌ Critical Failures & Placeholders (${auditResults.failures.length})\n`;
    md += `| File | Block # | Issue Type | Description |\n`;
    md += `|------|---------|------------|-------------|\n`;
    auditResults.failures.forEach(f => {
      md += `| [${path.basename(f.file)}](file://${path.join(ROOT_DIR, f.file)}) | ${f.block} | \`${f.type}\` | ${f.message.replace(/\|/g, '\\|')} |\n`;
    });
    md += `\n`;
  } else {
    md += `## ✅ Critical Failures & Placeholders\nNo placeholder tags or broken schemas found. The content is fully written!\n\n`;
  }

  if (auditResults.warnings.length > 0) {
    md += `## ⚠️ Readability & Text Length Warnings (${auditResults.warnings.length})\n`;
    md += `| File | Block # | Issue Type | Description |\n`;
    md += `|------|---------|------------|-------------|\n`;
    auditResults.warnings.forEach(w => {
      md += `| [${path.basename(w.file)}](file://${path.join(ROOT_DIR, w.file)}) | ${w.block} | \`${w.type}\` | ${w.message.replace(/\|/g, '\\|')} |\n`;
    });
    md += `\n`;
  }

  fs.writeFileSync(reportPath, md, 'utf8');
  console.log(`Detailed audit report written to: ${reportPath}`);
}

runAudit();
