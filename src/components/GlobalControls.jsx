import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Volume2, VolumeX, Sparkles } from 'lucide-react';
import * as themeAudio from '../services/themeAudio';

const THEME_OPTIONS = [
  { id: 'dark', label: '🌿 Tridorian Dark', swatches: ['#050805', '#4ade80', '#f0fdf4'] },
  { id: 'light', label: '☀️ Clean Light', swatches: ['#f8faf9', '#16a34a', '#0f1f15'] },
  { id: 'kitten', label: '🐱 Rainbow Kitten', swatches: ['#fef4f8', '#e91e8c', '#2d0b1a'] },
  { id: 'caribbean', label: '🏝️ Caribbean Mood', swatches: ['#e6f9f5', '#0d9e8a', '#0a2922'] },
  { id: 'lunar', label: '🌙 Lunar Vibe', swatches: ['#000000', '#e8e8e8', '#b0b0b0'] },
];

const GlobalControls = ({ theme, setTheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCursorEnabled, setIsCursorEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem('tridorian_disable_cursor');
      return stored !== 'true';
    } catch {
      return true;
    }
  });
  const dropdownRef = useRef(null);
  const [audioState, setAudioState] = useState(() => themeAudio.getAudioState());
  const [isSliderVisible, setIsSliderVisible] = useState(false);

  useEffect(() => {
    if (isCursorEnabled) {
      document.body.classList.remove('disable-custom-cursor');
    } else {
      document.body.classList.add('disable-custom-cursor');
    }
    try {
      localStorage.setItem('tridorian_disable_cursor', (!isCursorEnabled).toString());
    } catch {}
  }, [isCursorEnabled]);

  const toggleCursor = (e) => {
    e.stopPropagation();
    setIsCursorEnabled(!isCursorEnabled);
  };

  const handleToggleMute = (e) => {
    e.stopPropagation();
    const muted = themeAudio.toggleMute();
    setAudioState(prev => ({ ...prev, isMuted: muted }));
  };

  const handleVolumeChange = (e) => {
    e.stopPropagation();
    const vol = parseFloat(e.target.value);
    themeAudio.setVolume(vol);
    setAudioState(prev => ({ ...prev, volume: vol }));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="flex items-center gap-2 select-none" ref={dropdownRef}>
      {/* 1. Custom Cursor Toggle Button */}
      <button
        onClick={toggleCursor}
        className="flex items-center justify-center p-2 rounded-full border transition-all duration-200 hover:brightness-110 active:scale-95"
        style={{
          borderColor: isCursorEnabled ? 'var(--accent-border)' : 'var(--border-main)',
          backgroundColor: isCursorEnabled ? 'var(--accent-muted)' : 'var(--bg-panel)',
          color: isCursorEnabled ? 'var(--accent-text)' : 'var(--text-muted)',
          boxShadow: isCursorEnabled ? '0 0 12px var(--accent-border)' : 'none',
        }}
        title={isCursorEnabled ? "Disable Custom Cursor" : "Enable Custom Cursor"}
        data-testid="global-cursor-toggle"
      >
        <Sparkles size={12} className={isCursorEnabled ? "animate-pulse" : ""} />
      </button>

      {/* 2. Interactive Audio Controls */}
      <div 
        className="flex items-center rounded-full border px-2 py-1.5 transition-all duration-300"
        onMouseEnter={() => setIsSliderVisible(true)}
        onMouseLeave={() => setIsSliderVisible(false)}
        style={{
          borderColor: 'var(--border-main)',
          backgroundColor: 'var(--bg-panel)',
          color: 'var(--text-muted)',
        }}
      >
        <button
          onClick={handleToggleMute}
          className="flex items-center justify-center hover:text-main transition-colors focus:outline-none pr-1"
          title={audioState.isMuted ? "Unmute Ambient Music" : "Mute Ambient Music"}
        >
          {audioState.isMuted ? <VolumeX size={12} className="text-red-400" /> : <Volume2 size={12} />}
        </button>

        <div 
          className="overflow-hidden transition-all duration-300 flex items-center"
          style={{
            width: isSliderVisible ? '80px' : '0px',
            opacity: isSliderVisible ? 1 : 0,
            marginLeft: isSliderVisible ? '4px' : '0px',
          }}
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={audioState.volume}
            onChange={handleVolumeChange}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer"
            style={{
              accentColor: 'var(--accent-bg)',
            }}
          />
        </div>
      </div>

      {/* 3. Theme Picker Button & Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 text-[10px] font-mono uppercase tracking-widest hover:brightness-110 active:scale-95"
          style={{
            borderColor: 'var(--accent-border)',
            backgroundColor: 'var(--accent-muted)',
            color: 'var(--accent-text)',
          }}
          title="Change Theme"
          data-testid="global-theme-picker"
        >
          <Palette size={12} />
          Theme
        </button>

        {isOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-56 rounded-xl border overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border-main)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div
              className="px-4 py-3 border-b text-[10px] font-mono uppercase tracking-[0.2em] font-bold"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              Select Theme
            </div>
            <div className="p-2 space-y-1">
              {THEME_OPTIONS.map((opt) => {
                const isActive = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setTheme(opt.id);
                      themeAudio.playThemeMusic(opt.id);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                    style={{
                      backgroundColor: isActive ? 'var(--accent-muted)' : 'transparent',
                      color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderColor: isActive ? 'var(--accent-border)' : 'transparent',
                    }}
                    data-testid={`theme-option-${opt.id}`}
                  >
                    {/* Color swatches */}
                    <div className="flex gap-0.5">
                      {opt.swatches.map((color, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-full border border-black/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="flex-1 text-left">{opt.label}</span>
                    {isActive && (
                      <Check size={14} style={{ color: 'var(--accent-text)' }} />
                    )}
                  </button>
                );
              })}
            </div>
            <div
              className="px-4 py-2 border-t text-center text-[9px] font-mono uppercase tracking-widest"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
                opacity: 0.5,
              }}
            >
              Tridorian Theme Engine
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalControls;
