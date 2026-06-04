const fs = require('fs');
const path = require('path');

const tracksDir = '/var/home/wtg/Repos/course-catalog/public/content/tracks';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith('.json') && !file.includes('manifest.json') && !file.includes('metadata.json') && !file.includes('track.json') && !file.includes('catalog.json')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getFiles(tracksDir);
console.log(`Found ${files.length} module files.`);

files.forEach(file => {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!data.blocks) return;
    
    const quizIdx = data.blocks.findIndex(b => 
      (b.type === 'h1' || b.type === 'h2' || b.type === 'h3') && 
      b.content && b.content.toLowerCase().includes('check your understanding')
    );
    
    if (quizIdx !== -1) {
      const remainingBlocks = data.blocks.slice(quizIdx + 1);
      console.log(`\nFile: ${path.relative(tracksDir, file)} (Header: "${data.blocks[quizIdx].content}")`);
      console.log(`Remaining blocks count: ${remainingBlocks.length}`);
      
      // Let's print the types of the remaining blocks
      const types = remainingBlocks.map(b => b.type);
      console.log(`Block types: ${types.join(', ')}`);
      
      // Print first line of each remaining block
      remainingBlocks.forEach((b, idx) => {
        const preview = typeof b.content === 'string' ? b.content.split('\n')[0] : (b.items ? `List of ${b.items.length} items` : JSON.stringify(b));
        console.log(`  [${b.type}] ${preview.substring(0, 80)}`);
      });
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
});
