# Implementation Plan: Interactive React Quiz Widgets & Progression Locking

This document outlines the design and integration plan to parse the course module quizzes, replace their static markdown representations with interactive React widgets, and lock module progression until learners pass each quiz.

---

## 1. Core Findings: Quiz Structural Patterns
Across the `adk-development` and `agentic-engineering` tracks, quizzes are positioned under headers matching `/Check Your Understanding/i` (such as `h2` or `h3` blocks). The actual questions, choices, correct indexes, and feedbacks are structured in six different JSON layout patterns:

1. **Variant 1 (Multi-block Paragraphs):** Question text starts in a paragraph block. Each multiple-choice option (e.g., starting with `- A)`) is in its own paragraph block. The feedback block starts with `Feedback:` in a paragraph block.
2. **Variant 2 (Single-block Question/Options/Feedback):** A single paragraph block holds the entire question, choices, and feedback separated by newlines (`\n`).
3. **Variant 3 (List Options, Separate Question/Feedback):** Question is a paragraph block, options are in a `list` block (e.g. `A. ...`, `B. ...`), and feedback is in a separate paragraph block.
4. **Variant 4 (Embedded List Items):** An introductory paragraph block is followed by a `list` block where each list item is a self-contained string containing a question, choices, and feedback separated by newlines.
5. **Variant 5 (Multi-block with `info` Correct Answer):** Question is a paragraph, options are separate paragraphs, and the correct answer/feedback is in an `info` block starting with `Correct Answer:`.
6. **Variant 6 (Separate Correct Answer & Feedback Blocks):** Question and options are separate paragraphs, followed by a paragraph block stating `Correct Answer: B` and an `info` block containing the feedback explanation.

---

## 2. Dynamic Parser (`scratch/quizParser.js`)
We designed a robust compiler/parser module `scratch/quizParser.js` that scans the blocks array of any module JSON, parses all six patterns into a uniform data model, and replaces them on-the-fly:

### Uniform Quiz Question Schema
```typescript
interface QuizQuestion {
  question: string;       // Text of the question (markdown-stripped)
  options: string[];      // Clean options (e.g., ["Option A", "Option B"])
  correctIndex: number;   // Zero-based index (0 = A, 1 = B, etc.)
  feedback: string;       // Explanation text
}
```

### Integration Workflow
Instead of changing the static module JSON files, the course loading logic in `App.jsx` will intercept the data and transform it on-the-fly:
```javascript
import { replaceQuizWithWidget } from '../scratch/quizParser';

// Inside App.jsx loadCourse():
const steps = await Promise.all(manifest.modules.map(async (mod) => {
  const moduleData = await fetchModuleContent(currentTrackId, currentCourseId, mod.file);
  moduleData._sourceFile = `public/content/tracks/${currentTrackId}/${currentCourseId}/${mod.file}`;
  
  if (moduleData.blocks) {
    // Parser converts raw quiz paragraph blocks into a single block of type 'interactive_quiz'
    moduleData.blocks = replaceQuizWithWidget(moduleData.blocks);
  }
  return moduleData;
}));
```

---

## 3. Interactive Component (`scratch/InteractiveQuiz.jsx`)
The `InteractiveQuiz.jsx` component is placed in the `scratch/` directory. It uses the global design system variables (e.g., `--bg-panel`, `--accent-bg`, etc.) and incorporates the following core mechanisms:

- **State Management:**
  - `currentIdx`: The active question index.
  - `selectedOpt`: The index of the option selected by the user.
  - `isAnswered`: Boolean showing whether the active question has been submitted.
  - `answeredStates`: Array storing `null` (unanswered), `false` (incorrect), or `true` (correct) for each question.
  - `quizFinished`: Boolean indicating whether all questions were passed.
- **Audio Synthesizer:** Incorporates procedural chimes using the Web Audio API:
  - `playSuccessChime()`: Ascending G-Major/C-Major chime arpeggio (`C5 -> E5 -> G5 -> C6`) on correct answer.
  - `playFailureBuzz()`: Detuned sawtooth pitch slide (`110Hz -> 70Hz`) on incorrect answer.
- **Retro-Modern Styling:**
  - Border glows and background tints dynamically colorize on status changes (green borders/backgrounds for correct selections, red for incorrect retries).
  - Clean progression dots show current question and completion status.
- **Callback Trigger:**
  - Triggers the `onPassed()` callback when all questions are answered correctly.

---

## 4. Hooking Progression Locking into `App.jsx`
To block navigation until the user passes the active module's quiz, we implement three adjustments in `App.jsx`:

### Step 4.1: Progression State Management
We introduce an `activeStepQuizPassed` state in `App.jsx` that determines whether the "Next" action is unlocked:
```javascript
const [activeStepQuizPassed, setActiveStepQuizPassed] = useState(true);

// Re-evaluate whenever the module changes or completed index changes
useEffect(() => {
  if (!activeStep) return;
  
  // Check if active step has an interactive quiz
  const hasQuiz = activeStep.blocks && activeStep.blocks.some(b => b.type === 'interactive_quiz');
  
  if (hasQuiz) {
    // If the step is already marked as completed in progress, it's unlocked
    if (completedSteps.includes(activeStepIndex)) {
      setActiveStepQuizPassed(true);
    } else {
      setActiveStepQuizPassed(false);
    }
  } else {
    // If no quiz, progress is always unlocked
    setActiveStepQuizPassed(true);
  }
}, [moduleId, activeStepIndex, activeStep, completedSteps]);
```

### Step 4.2: Drilling Down the Callback
We pass `setActiveStepQuizPassed` to the module renderer:
```jsx
// App.jsx:
<ModuleRenderer 
  module={activeStep} 
  sourceFile={activeStep?._sourceFile} 
  onQuizPassed={() => setActiveStepQuizPassed(true)} 
/>

// ModuleRenderer.jsx:
const ModuleRenderer = ({ module, sourceFile, onQuizPassed }) => {
  ...
  case 'lab':
  default:
    return <ContentRenderer blocks={module.blocks} sourceFile={sourceFile} onQuizPassed={onQuizPassed} />;
}

// ContentRenderer.jsx:
const ContentRenderer = ({ blocks, sourceFile, onQuizPassed }) => {
  ...
  case 'interactive_quiz':
    return <InteractiveQuiz key={index} questions={block.questions} onPassed={onQuizPassed} />;
}
```

### Step 4.3: Locking Bottom Navigation Buttons
Update the footer layout in `App.jsx` to inspect `activeStepQuizPassed`. If `false`, disable the click handler, add a lock icon, and style it as deactivated:
```jsx
{activeStepIndex === totalSteps - 1 ? (
  <button
    disabled={!activeStepQuizPassed}
    onClick={completeCourse}
    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
      activeStepQuizPassed
        ? 'bg-accent text-accent-fg hover:brightness-110 shadow-accent animate-pulse'
        : 'bg-muted text-gray-500 border border-border-main cursor-not-allowed opacity-50'
    }`}
  >
    {activeStepQuizPassed ? <Trophy size={20} /> : <Lock size={20} />}
    Complete Course
  </button>
) : (
  <button
    disabled={!activeStepQuizPassed}
    onClick={goToNext}
    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
      activeStepQuizPassed
        ? 'bg-accent text-accent-fg hover:brightness-110 shadow-accent'
        : 'bg-muted text-gray-500 border border-border-main cursor-not-allowed opacity-50'
    }`}
  >
    {!activeStepQuizPassed && <Lock size={16} />}
    Next
    <ChevronRight size={20} />
  </button>
)}
```

---

## 5. Summary of Benefits
1. **Zero Database Modifications:** Quizzes are parsed directly in the client runtime without modifying any static JSON files or requiring API schema extensions.
2. **True Progression Safeguard:** The learner cannot advance to the next module in the footer OR click next modules in the sidebar until they pass the quiz, since `completedSteps` is only updated when they click the unlocked "Next" button.
3. **Immersive Audio Loop:** The user experiences tactile auditory verification upon solving questions (procedural beep/chime synthesizers).
