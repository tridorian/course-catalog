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

function findCorrectLetter(text) {
  // First, check if there's an explicit "Correct Answer: B" or similar prefix
  const p1 = text.match(/(?:Correct\s+Answer|Correct\s+Option|Answer|Feedback)\s*[:\-]?\s*([A-D])\b/i);
  if (p1) return p1[1].toUpperCase();

  // Check for "Option B is correct" or "B is correct"
  const p2 = text.match(/\b([A-D])\b\s*(?:is\s*correct|is\s*the\s*correct)/i);
  if (p2) return p2[1].toUpperCase();

  // Check for "correct answer is B"
  const p3 = text.match(/correct\s+(?:answer|option)\s+(?:is\s+)?([A-D])\b/i);
  if (p3) return p3[1].toUpperCase();

  // Fallback: search for first single [A-D] letter after a colon or start
  const p4 = text.match(/[:\-\*]\s*([A-D])\b/i);
  if (p4) return p4[1].toUpperCase();

  return '';
}

function parseSingleTextBlock(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let questionText = '';
  const options = [];
  let feedbackText = '';
  let correctLetter = '';

  let inQuestion = true;
  let inFeedback = false;

  for (let line of lines) {
    if (line.match(/^(Feedback|\*Feedback\*|Answer Feedback|Correct Answer):/i)) {
      inFeedback = true;
      inQuestion = false;
      feedbackText = line;
      continue;
    }
    
    if (inFeedback) {
      feedbackText += ' ' + line;
      continue;
    }

    // Check if line is an option, e.g., "A) ...", "- A) ...", "A. ...", "- A. ..."
    const optionMatch = line.match(/^[-*]?\s*([A-D])\s*[\).\-]\s*(.*)$/i);
    if (optionMatch) {
      inQuestion = false;
      options.push({
        letter: optionMatch[1].toUpperCase(),
        text: optionMatch[2].trim()
      });
      continue;
    }

    if (inQuestion) {
      if (questionText) questionText += ' ';
      questionText += line;
    } else {
      if (options.length > 0) {
        options[options.length - 1].text += ' ' + line;
      }
    }
  }

  correctLetter = findCorrectLetter(feedbackText);

  questionText = questionText.replace(/^\*?\*?Question\s*\d+[:\.]?\*?\*?\s*/i, '').trim();
  feedbackText = feedbackText.replace(/^(Feedback|\*Feedback\*|Answer Feedback|Correct Answer):\s*/i, '').trim();

  const correctIndex = options.findIndex(o => o.letter === correctLetter);

  return {
    question: questionText,
    options: options.map(o => o.text),
    correctIndex: correctIndex !== -1 ? correctIndex : 0,
    feedback: feedbackText
  };
}

function parseModuleQuizzes(blocks) {
  const headerIndex = blocks.findIndex(b => 
    (b.type === 'h1' || b.type === 'h2' || b.type === 'h3') &&
    b.content && b.content.toLowerCase().includes('check your understanding')
  );
  if (headerIndex === -1) return null;

  const quizBlocks = blocks.slice(headerIndex + 1);
  const questions = [];

  let currentQuestion = null;

  for (let i = 0; i < quizBlocks.length; i++) {
    const block = quizBlocks[i];
    const content = block.content || '';
    
    // Check if it's a prompt to answer questions (can be ignored)
    if (block.type === 'p' && content.toLowerCase().startsWith('answer the following questions')) {
      continue;
    }

    // Check if it's a list containing the questions (Variant 4)
    if (block.type === 'list' && block.items && block.items.length > 0 && block.items[0].toLowerCase().includes('question 1')) {
      for (const item of block.items) {
        questions.push(parseSingleTextBlock(item));
      }
      continue;
    }

    // Check if it is a self-contained question block (Variant 2 / Variant 2-like)
    const isQuestionStart = block.type === 'p' && content.match(/^\*?\*?Question\s*\d+/i);
    const hasOptions = content.match(/[-*]?\s*[A-D]\s*[\).\-]/i);
    const hasFeedback = content.match(/(Feedback|\*Feedback\*|Answer Feedback|Correct Answer):/i);

    if (isQuestionStart && hasOptions && hasFeedback) {
      questions.push(parseSingleTextBlock(content));
      continue;
    }

    // If it's a question start but not self-contained
    if (isQuestionStart) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        question: content.replace(/^\*?\*?Question\s*\d+[:\.]?\*?\*?\s*/i, '').trim(),
        options: [],
        feedback: '',
        correctIndex: -1
      };
      continue;
    }

    if (!currentQuestion) continue;

    // If we have an active question, let's parse options and feedback
    if (block.type === 'list' && block.items) {
      // Options list (Variant 3)
      for (const item of block.items) {
        const optionMatch = item.match(/^[-*]?\s*([A-D])\s*[\).\-]\s*(.*)$/i);
        if (optionMatch) {
          currentQuestion.options.push(optionMatch[2].trim());
        } else {
          // If no prefix, just treat the whole text as option
          currentQuestion.options.push(item.trim());
        }
      }
    } else if (block.type === 'p' || block.type === 'info') {
      // Could be option, correct answer, or feedback
      const optionMatch = content.match(/^[-*]?\s*([A-D])\s*[\).\-]\s*(.*)$/i);
      
      if (optionMatch) {
        // Multi-block option
        currentQuestion.options.push(optionMatch[2].trim());
      } else if (content.match(/^(Feedback|\*Feedback\*|Answer Feedback|Correct Answer):/i) || block.type === 'info') {
        // It's a feedback or correct answer block
        const feedbackMatch = content.match(/^(Feedback|\*Feedback\*|Answer Feedback|Correct Answer):\s*(.*)$/i);
        const fbText = feedbackMatch ? feedbackMatch[2].trim() : content;
        
        const correctLetter = findCorrectLetter(content);

        if (correctLetter) {
          currentQuestion.correctIndex = correctLetter.charCodeAt(0) - 65;
        }

        if (content.toLowerCase().startsWith('correct answer:')) {
          if (!currentQuestion.feedback) {
            currentQuestion.feedback = fbText;
          }
        } else {
          currentQuestion.feedback = fbText;
        }
      } else {
        // If it's just regular text, it could be options in a single block separated by newlines
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const hasLineOptions = lines.some(l => l.match(/^[-*]?\s*[A-D]\s*[\).\-]/i));
        
        if (hasLineOptions) {
          for (const line of lines) {
            const optM = line.match(/^[-*]?\s*([A-D])\s*[\).\-]\s*(.*)$/i);
            if (optM) {
              currentQuestion.options.push(optM[2].trim());
            }
          }
        } else {
          // If it's a regular text block under the feedback, append it to feedback
          if (currentQuestion.feedback) {
            currentQuestion.feedback += ' ' + content;
          } else {
            currentQuestion.feedback = content;
          }
        }
      }
    }
  }

  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  // Validation / Cleanup of questions
  return questions.map(q => {
    if (q.correctIndex === -1 && q.feedback) {
      const correctLetter = findCorrectLetter(q.feedback);
      if (correctLetter) {
        q.correctIndex = correctLetter.charCodeAt(0) - 65;
      }
    }
    if (q.correctIndex === -1) {
      q.correctIndex = 0;
    }
    
    // Clean up feedback from correct answer prefixes
    q.feedback = q.feedback.replace(/^(Option|Answer|Correct Answer is|Correct Answer)\s*[A-D]\s*(is correct)?\.?\s*/i, '').trim();

    return {
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      feedback: q.feedback
    };
  });
}

const files = getFiles(tracksDir);
let successCount = 0;
let failCount = 0;

files.forEach(file => {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!data.blocks) return;
    
    const quizIdx = data.blocks.findIndex(b => 
      (b.type === 'h1' || b.type === 'h2' || b.type === 'h3') && 
      b.content && b.content.toLowerCase().includes('check your understanding')
    );
    
    if (quizIdx !== -1) {
      const parsed = parseModuleQuizzes(data.blocks);
      const relative = path.relative(tracksDir, file);
      
      if (parsed && parsed.length > 0) {
        successCount++;
        // Verify correctness
        const badQ = parsed.find(q => q.options.length === 0 || q.correctIndex >= q.options.length);
        if (badQ) {
          console.log(`⚠️  [${relative}] has invalid parsed questions:`);
          console.log(JSON.stringify(parsed, null, 2));
        }
      } else {
        console.log(`❌ [${relative}] FAILED to parse questions.`);
        failCount++;
      }
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
    failCount++;
  }
});

console.log(`\nParser run finished. Success: ${successCount}, Fail: ${failCount}`);
