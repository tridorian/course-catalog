import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

// Procedural audio synthesizer for quiz sounds
function playSuccessChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const playTone = (freq, time, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.08, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + dur + 0.1);
    };
    
    playTone(523.25, now, 0.3);       // C5
    playTone(659.25, now + 0.08, 0.3); // E5
    playTone(783.99, now + 0.16, 0.3); // G5
    playTone(1046.50, now + 0.24, 0.5); // C6
  } catch (e) {
    console.warn("Success chime blocked or failed:", e);
  }
}

function playFailureBuzz() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(70, now + 0.3);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {
    console.warn("Failure buzz blocked or failed:", e);
  }
}

// Render simple inline bolding and code ticks
function renderInlineText(text) {
  if (typeof text !== 'string') return text;
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-main font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-muted px-1.5 py-0.5 rounded text-accent-text font-mono text-sm">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const InteractiveQuiz = ({ questions, onPassed }) => {
  if (!questions || questions.length === 0) return null;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answeredStates, setAnsweredStates] = useState(
    Array(questions.length).fill(null) // null = uncompleted, false = failed current attempt, true = correct
  );
  const [retrying, setRetrying] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQuestion = questions[currentIdx];
  const isQuestionCorrect = answeredStates[currentIdx] === true;

  // Initialize shuffled options for the first question
  const [shuffledOptions, setShuffledOptions] = useState(() => {
    if (currentQuestion) {
      const opts = currentQuestion.options.map((opt, i) => ({
        text: opt,
        isCorrect: i === currentQuestion.correctIndex
      }));
      return shuffleArray(opts);
    }
    return [];
  });

  // Reshuffle options when moving to next question or questions prop changes
  useEffect(() => {
    if (currentQuestion) {
      const opts = currentQuestion.options.map((opt, i) => ({
        text: opt,
        isCorrect: i === currentQuestion.correctIndex
      }));
      setShuffledOptions(shuffleArray(opts));
    }
  }, [currentIdx, questions]);

  // Handle option click
  const handleSelectOption = (idx) => {
    if (isAnswered && !retrying) return;
    setSelectedOpt(idx);
    setRetrying(false);
  };

  // Submit selected answer
  const handleSubmit = () => {
    if (selectedOpt === null || shuffledOptions.length === 0) return;

    const isCorrect = shuffledOptions[selectedOpt].isCorrect;
    const newStates = [...answeredStates];
    newStates[currentIdx] = isCorrect;
    setAnsweredStates(newStates);
    setIsAnswered(true);

    if (isCorrect) {
      playSuccessChime();
    } else {
      playFailureBuzz();
    }
  };

  // Handle retry after incorrect answer
  const handleRetry = () => {
    setSelectedOpt(null);
    setIsAnswered(false);
    setRetrying(true);
    const newStates = [...answeredStates];
    newStates[currentIdx] = null;
    setAnsweredStates(newStates);

    // Shuffle options again on incorrect retry
    if (currentQuestion) {
      const opts = currentQuestion.options.map((opt, i) => ({
        text: opt,
        isCorrect: i === currentQuestion.correctIndex
      }));
      setShuffledOptions(shuffleArray(opts));
    }
  };

  // Advance to next question or complete quiz
  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
      setRetrying(false);
    } else {
      // Check if all questions are completed successfully
      const allPassed = answeredStates.every(s => s === true);
      if (allPassed) {
        setQuizFinished(true);
        if (onPassed) onPassed();
      }
    }
  };

  // Automatically finish and trigger passed if all steps are correct (redundancy check)
  useEffect(() => {
    const allPassed = answeredStates.every(s => s === true);
    if (allPassed && !quizFinished) {
      setQuizFinished(true);
      if (onPassed) onPassed();
    }
  }, [answeredStates, quizFinished, onPassed]);

  // Restart quiz
  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOpt(null);
    setIsAnswered(false);
    setAnsweredStates(Array(questions.length).fill(null));
    setRetrying(false);
    setQuizFinished(false);
  };

  if (quizFinished) {
    return (
      <div className="bg-panel border-2 border-[var(--quiz-correct-border)] p-8 rounded-2xl text-center shadow-[0_0_30px_rgba(16,185,129,0.08)] my-8 animate-in fade-in slide-in-from-bottom duration-500">
        <div className="w-16 h-16 bg-[var(--quiz-correct-bg)] border border-[var(--quiz-correct-border)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <Icons.Check className="text-[var(--quiz-correct-text)] w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-[var(--quiz-correct-text)] mb-2 uppercase tracking-wide">Comprehension Verified</h3>
        <p className="text-text-muted text-base max-w-md mx-auto mb-6 leading-relaxed">
          Excellent! You have successfully passed the module quiz. Course progression is now unlocked.
        </p>
        <button
          onClick={handleRestart}
          className="px-4 py-2 border border-border-main hover:border-accent-border hover:bg-muted text-xs font-mono text-gray-400 hover:text-accent-text rounded-lg transition-all"
        >
          REVIEW QUESTIONS
        </button>
      </div>
    );
  }

  return (
    <div className="bg-panel border border-border-main p-6 md:p-8 rounded-2xl shadow-sm-themed my-8 animate-in fade-in duration-300 relative overflow-hidden">
      
      {/* Quiz Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {questions.map((_, idx) => {
            const state = answeredStates[idx];
            return (
              <div
                key={idx}
                className={`w-8 h-2 rounded-full transition-all duration-300 ${
                  idx === currentIdx
                    ? 'bg-accent shadow-accent'
                    : state === true
                      ? 'bg-emerald-500'
                      : state === false
                        ? 'bg-rose-500'
                        : 'bg-muted border border-border-main'
                }`}
              />
            );
          })}
        </div>
        <div className="text-xs font-mono text-gray-500 uppercase">
          Question {currentIdx + 1} of {questions.length}
        </div>
      </div>

      {/* Question Text */}
      <h4 className="text-lg font-bold text-main mb-6 leading-relaxed">
        {renderInlineText(currentQuestion.question)}
      </h4>

      {/* Option List */}
      <div className="space-y-3 mb-6">
        {shuffledOptions.map((optObj, idx) => {
          const isSelected = selectedOpt === idx;
          const isCorrectAnswer = optObj.isCorrect;
          const showAnswerStatus = isAnswered;

          let optionStyle = 'border-border-main bg-panel text-text-muted hover:bg-muted/50 hover:text-main';
          if (isSelected) {
            optionStyle = 'border-accent bg-muted text-accent-text shadow-accent';
          }

          if (showAnswerStatus) {
            if (isCorrectAnswer) {
              optionStyle = 'bg-[var(--quiz-correct-bg)] border-[var(--quiz-correct-border)] text-[var(--quiz-correct-text)]';
            } else if (isSelected) {
              optionStyle = 'bg-[var(--quiz-incorrect-bg)] border-[var(--quiz-incorrect-border)] text-[var(--quiz-incorrect-text)]';
            } else {
              optionStyle = 'opacity-40 border-border-main text-text-muted bg-panel';
            }
          }

          const optionLetter = String.fromCharCode(65 + idx);

          return (
            <button
              key={idx}
              disabled={isAnswered}
              onClick={() => handleSelectOption(idx)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-4 ${optionStyle}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border flex-shrink-0 ${
                showAnswerStatus
                  ? isCorrectAnswer
                    ? 'bg-emerald-500 border-emerald-400 text-black'
                    : isSelected
                      ? 'bg-rose-500 border-rose-400 text-white'
                      : 'border-gray-600 text-gray-600'
                  : isSelected
                    ? 'bg-accent border-accent text-accent-fg'
                    : 'border-border-main text-text-muted'
              }`}>
                {showAnswerStatus && isCorrectAnswer ? (
                  <Icons.Check size={14} />
                ) : showAnswerStatus && isSelected ? (
                  <Icons.X size={14} />
                ) : (
                  optionLetter
                )}
              </div>
              <span className="leading-relaxed text-sm md:text-base pt-0.5">{renderInlineText(optObj.text)}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback Section */}
      {isAnswered && (
        <div className={`p-5 rounded-xl border mb-6 animate-in fade-in slide-in-from-top-2 duration-300 ${
          answeredStates[currentIdx] === true
            ? 'bg-[var(--quiz-correct-bg)] border-[var(--quiz-correct-border)] text-[var(--quiz-correct-text)]'
            : 'bg-[var(--quiz-incorrect-bg)] border-[var(--quiz-incorrect-border)] text-[var(--quiz-incorrect-text)]'
        }`}>
          <div className="flex gap-2.5 items-start">
            {answeredStates[currentIdx] === true ? (
              <Icons.CheckCircle2 className="text-[var(--quiz-correct-text)] mt-0.5 flex-shrink-0" size={18} />
            ) : (
              <Icons.XCircle className="text-[var(--quiz-incorrect-text)] mt-0.5 flex-shrink-0" size={18} />
            )}
            <div>
              <div className="font-bold text-xs uppercase tracking-wider mb-1 font-mono">
                {answeredStates[currentIdx] === true ? 'Correct Explanatory Log' : 'Validation Error'}
              </div>
              <p className="text-sm leading-relaxed text-main/90">{renderInlineText(currentQuestion.feedback)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex justify-end gap-3">
        {!isAnswered ? (
          <button
            onClick={handleSubmit}
            disabled={selectedOpt === null}
            className={`px-6 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 ${
              selectedOpt === null
                ? 'bg-muted text-gray-500 border border-border-main cursor-not-allowed'
                : 'bg-accent text-accent-fg hover:brightness-110 shadow-accent'
            }`}
          >
            Submit Answer
          </button>
        ) : answeredStates[currentIdx] === true ? (
          <button
            onClick={handleNext}
            className="px-6 py-2.5 bg-accent text-accent-fg hover:brightness-110 font-bold rounded-lg transition-all shadow-accent flex items-center gap-2"
          >
            {currentIdx < questions.length - 1 ? 'Next Question' : 'Verify Completion'}
            <Icons.ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={handleRetry}
            className="px-6 py-2.5 border border-[var(--quiz-incorrect-border)] text-[var(--quiz-incorrect-text)] hover:bg-[var(--quiz-incorrect-bg)] font-bold rounded-lg transition-all flex items-center gap-2"
          >
            <Icons.RotateCcw size={16} />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default InteractiveQuiz;
