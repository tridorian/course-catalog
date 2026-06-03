import React, { useState, useEffect } from 'react';

export default function BadgeCelebration({ badgeTitle, trackName, onDismiss }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  // Play audio chime on mount
  useEffect(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const playTone = (freq, type, start, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      
      // Cyberpunk major scale arpeggio chime
      const now = audioCtx.currentTime;
      playTone(261.63, 'triangle', now, 0.4);       // C4
      playTone(329.63, 'triangle', now + 0.1, 0.4); // E4
      playTone(392.00, 'triangle', now + 0.2, 0.4); // G4
      playTone(523.25, 'sine', now + 0.3, 0.8);     // C5 (Sparkle note)
    } catch (e) {
      console.warn("Audio Context blocked by browser auto-play restrictions.", e);
    }

    // Auto-trigger 3D flip after 500ms
    const timer = setTimeout(() => setIsFlipped(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6">
      
      {/* Sparkle Confetti Rain (Pure CSS) */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2.5 h-2.5 rounded-full animate-fall"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['var(--accent-bg)', '#ff007f', '#06b6d4', '#eab308'][i % 4],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 3}s`,
                opacity: 0.8
              }}
            />
          ))}
        </div>
      )}

      {/* Main card */}
      <div 
        className="max-w-md w-full bg-panel border border-accent-border rounded-2xl p-8 text-center relative overflow-hidden"
        style={{
          boxShadow: 'var(--shadow-accent), 0 25px 50px -12px rgba(0,0,0,0.8)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/0 to-accent/5 pointer-events-none"></div>
        
        <div className="text-[10px] font-mono text-accent-text tracking-[0.3em] uppercase mb-1">
          Mission Accomplished
        </div>
        <h2 className="text-3xl font-extrabold text-main mb-6 uppercase tracking-tight">
          Badge Unlocked!
        </h2>

        {/* 3D Badge container */}
        <div className="w-48 h-48 mx-auto mb-8 perspective-1000">
          <div 
            className={`w-full h-full relative transition-transform duration-1000 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front of Card (Locked State) */}
            <div className="absolute inset-0 w-full h-full bg-muted border border-gray-700 border-dashed rounded-full flex flex-col items-center justify-center backface-hidden">
              <span className="text-4xl">🔒</span>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-2">Decrypting...</span>
            </div>

            {/* Back of Card (Unlocked Badge State) */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-accent/20 to-accent-muted border-2 border-accent rounded-full flex flex-col items-center justify-center backface-hidden rotate-y-180 overflow-hidden group">
              {/* Holographic light sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
              
              <span className="text-6xl animate-pulse">🏆</span>
              <span className="text-xs font-mono font-bold text-accent-text uppercase tracking-widest mt-3">Verified</span>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-bold text-main mb-2">{badgeTitle}</h3>
        <p className="text-sm text-text-muted mb-8 leading-relaxed">
          You have successfully completed all lessons and verified capstone requirements for the <span className="text-main font-bold">{trackName}</span> track.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onDismiss}
            className="w-full py-3 bg-accent text-accent-fg font-extrabold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-accent"
          >
            Return to Mission Map
          </button>
        </div>
      </div>
    </div>
  );
}
