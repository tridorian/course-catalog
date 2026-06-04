/**
 * Utility functions to dynamically parse inline quizzes from course module JSONs.
 */

/**
 * Finds the correct option index (A=0, B=1, C=2, D=3) from feedback text or correct answer markers.
 * @param {string} text - The raw feedback text.
 * @returns {number} The correct option index, or -1 if not found.
 */
export function findCorrectLetter(text) {
  if (!text) return '';
  
  // First, check if there's an explicit "Correct Answer: B" or similar prefix
  const p1 = text.match(/(?:Correct\s+Answer|Correct\s+Option|Answer|Feedback)\s*[:\-]?\s*([A-D])\b/i);
  if (p1) return p1[1].toUpperCase();

  // Check for "Option B is correct" or "B is correct"
  const p2 = text.match(/\b([A-D])\b\s*(?:is\s*correct|is\s*the\s*correct)/i);
  if (p2) return p2[1].toUpperCase();

  // Check for "correct answer is B"
  const p3 = text.match(/correct\s+(?:answer|option)\s+(?:is\s+)?([A-D])\b/i);
  if (p3) return p3[1].toUpperCase();

  // Fallback: search for first single [A-D] letter after a colon or punctuation
  const p4 = text.match(/[:\-\*]\s*([A-D])\b/i);
  if (p4) return p4[1].toUpperCase();

  return '';
}

/**
 * Parses a single text block containing question, options, and feedback separated by newlines.
 * @param {string} text - The raw text block content.
 * @returns {Object} Structured question object.
 */
export function parseSingleTextBlock(text) {
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

    // Check if line is an option (e.g., "A) ...", "- A) ...", "A. ...", "- A. ...")
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

  // Clean prefixes
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

/**
 * Extracts inline quiz questions from a module's raw block array.
 * @param {Array} blocks - The blocks array from a module JSON file.
 * @returns {Array|null} Array of structured question objects, or null if no quiz is found.
 */
export function extractQuizQuestions(blocks) {
  if (!Array.isArray(blocks)) return null;

  // Find Check Your Understanding header block
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
    
    // Ignore introductory text paragraphs in the quiz section
    if (block.type === 'p' && content.toLowerCase().startsWith('answer the following questions')) {
      continue;
    }

    // Variant 4: List block where each item is a self-contained question
    if (block.type === 'list' && block.items && block.items.length > 0 && block.items[0].toLowerCase().includes('question 1')) {
      for (const item of block.items) {
        questions.push(parseSingleTextBlock(item));
      }
      continue;
    }

    // Variant 2: Self-contained question inside a single paragraph block
    const isQuestionStart = block.type === 'p' && content.match(/^\*?\*?Question\s*\d+/i);
    const hasOptions = content.match(/[-*]?\s*[A-D]\s*[\).\-]/i);
    const hasFeedback = content.match(/(Feedback|\*Feedback\*|Answer Feedback|Correct Answer):/i);

    if (isQuestionStart && hasOptions && hasFeedback) {
      questions.push(parseSingleTextBlock(content));
      continue;
    }

    // Multi-block structure starts
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

    // Handle options, correct answer, and feedback for multi-block structures
    if (block.type === 'list' && block.items) {
      // Variant 3: Options in a list block
      for (const item of block.items) {
        const optionMatch = item.match(/^[-*]?\s*([A-D])\s*[\).\-]\s*(.*)$/i);
        if (optionMatch) {
          currentQuestion.options.push(optionMatch[2].trim());
        } else {
          currentQuestion.options.push(item.trim());
        }
      }
    } else if (block.type === 'p' || block.type === 'info') {
      const optionMatch = content.match(/^[-*]?\s*([A-D])\s*[\).\-]\s*(.*)$/i);
      
      if (optionMatch) {
        // Variant 1: Option in a separate paragraph block
        currentQuestion.options.push(optionMatch[2].trim());
      } else if (content.match(/^(Feedback|\*Feedback\*|Answer Feedback|Correct Answer):/i) || block.type === 'info') {
        // Correct Answer or Feedback block
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
        // Plain text block under a question - check if it's options on newlines
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
          // Otherwise, append to feedback
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

  // Final cleanup and default handling
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
    q.feedback = q.feedback.replace(/^(Option|Answer|Correct Answer is|Correct Answer)\s*[A-D]\s*(is correct)?\.?\s*/i, '').trim();

    return {
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      feedback: q.feedback
    };
  });
}

/**
 * Replaces raw quiz text blocks inside a blocks array with an 'interactive_quiz' block.
 * @param {Array} blocks - The blocks array.
 * @returns {Array} A new blocks array with the quiz replaced.
 */
export function replaceQuizWithWidget(blocks) {
  if (!Array.isArray(blocks)) return blocks;

  const headerIndex = blocks.findIndex(b => 
    (b.type === 'h1' || b.type === 'h2' || b.type === 'h3') &&
    b.content && b.content.toLowerCase().includes('check your understanding')
  );
  if (headerIndex === -1) return blocks;

  const questions = extractQuizQuestions(blocks);
  if (!questions || questions.length === 0) return blocks;

  // We keep the header block, and replace all subsequent blocks with the interactive_quiz block.
  // Wait, if there are non-quiz blocks at the end (rare but possible), we keep them? 
  // Normally the quiz goes until the end. We'll replace everything after the header.
  const newBlocks = blocks.slice(0, headerIndex + 1);
  newBlocks.push({
    type: 'interactive_quiz',
    questions: questions
  });

  return newBlocks;
}
