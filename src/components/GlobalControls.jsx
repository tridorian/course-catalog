import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Volume2, VolumeX, Sparkles, Cpu, Trash2, Sliders, Grid } from 'lucide-react';
import * as themeAudio from '../services/themeAudio';
import { saveCustomTheme, getCustomTheme, getCustomThemes, deleteCustomTheme, setActiveCustomTheme, safeLocalStorageSet } from '../services/customTheme';
import { generateThemeWithGemini, generateMusicWithLyria, generateImageWithImagen } from '../services/themeGenerator';

const THEME_OPTIONS = [
  { id: 'dark', label: '🌿 tridorian Dark', swatches: ['#050805', '#4ade80', '#f0fdf4'] },
  { id: 'light', label: '☀️ Clean Light', swatches: ['#f8faf9', '#16a34a', '#0f1f15'] },
  { id: 'kitten', label: '🐱 Rainbow Kitten', swatches: ['#fef4f8', '#e91e8c', '#2d0b1a'] },
  { id: 'caribbean', label: '🏝️ Caribbean Mood', swatches: ['#e6f9f5', '#0d9e8a', '#0a2922'] },
  { id: 'lunar', label: '🌙 Lunar Vibe', swatches: ['#000000', '#e8e8e8', '#b0b0b0'] },
  { id: 'jungle', label: '🦖 Jurassic Jeep', swatches: ['#060e0a', '#f5c518', '#b91c1c'] },
  { id: 'genesis', label: '😈 EVA-01', swatches: ['#0a0512', '#39ff14', '#f3e8ff'] },
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


  // AI Theme Generator state
  const [showGenerator, setShowGenerator] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState(() => {
    const LEAKED_KEY = 'AIzaSyCrQVmC1PFEFb-oLAuOQdT7Jr-gb9W-JzY';
    const isValid = (k) => {
      if (!k) return false;
      const trimmed = k.trim();
      return trimmed !== LEAKED_KEY && 
             trimmed !== 'your-gemini-api-key-here' && 
             !trimmed.startsWith('your-');
    };

    // 1. Check local storage
    const localKey = typeof localStorage !== 'undefined' ? localStorage.getItem('tridorian_gemini_api_key') : '';
    if (localKey) {
      if (isValid(localKey)) {
        return localKey.trim();
      } else {
        try {
          localStorage.removeItem('tridorian_gemini_api_key');
        } catch (e) {}
      }
    }

    // 2. Check environment variable
    const envKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : '';
    if (envKey && isValid(envKey)) {
      return envKey.trim();
    }

    return '';
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [genStatus, setGenStatus] = useState('');
  const [genLogs, setGenLogs] = useState([]);

  const [customThemes, setCustomThemes] = useState(() => getCustomThemes());
  const activeCustomTheme = getCustomTheme();

  // Sandbox Background Tester state
  // Sandbox Background Tester state
  const [sandboxOpacity, setSandboxOpacity] = useState(0.25);
  const [sandboxScale, setSandboxScale] = useState(2.0);
  const [showTester, setShowTester] = useState(false);

  // Sync sandbox state to CSS properties on mount or change
  useEffect(() => {
    const root = document.documentElement;
    if (showTester) {
      root.style.setProperty('--test-pattern-opacity', sandboxOpacity.toString());
      root.style.setProperty('--test-pattern-size', `${512 * sandboxScale}px ${512 * sandboxScale}px`);
    } else {
      root.style.removeProperty('--test-pattern-opacity');
      root.style.removeProperty('--test-pattern-size');
    }
  }, [showTester, sandboxOpacity, sandboxScale, theme]);

  // Refresh themes list when dropdown is opened to ensure sync
  useEffect(() => {
    if (isOpen) {
      setCustomThemes(getCustomThemes());
    }
  }, [isOpen]);

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
    themeAudio.playThemeMusic(theme);
    const muted = themeAudio.toggleMute();
    setAudioState(prev => ({ ...prev, isMuted: muted }));
  };

  const handleVolumeChange = (e) => {
    e.stopPropagation();
    themeAudio.playThemeMusic(theme);
    const vol = parseFloat(e.target.value);
    themeAudio.setVolume(vol);
    setAudioState(prev => ({ ...prev, volume: vol }));
  };


  const addLog = (msg) => {
    console.log(`[ThemeGen] ${msg}`);
    setGenLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleGenerateTheme = async () => {
    if (!prompt.trim()) {
      setGenError("Prompt cannot be empty.");
      return;
    }

    // Check maximum limit: max 3 custom themes
    const currentThemes = getCustomThemes();
    if (currentThemes.length >= 3) {
      setGenError("Maximum limit of 3 custom themes reached. You must delete an existing custom theme to generate a new one.");
      return;
    }

    // Check rate limit: 1 custom theme per hour
    const lastGenTimeStr = localStorage.getItem('tridorian_last_theme_gen_time');
    let lastGenTime = lastGenTimeStr ? Number(lastGenTimeStr) : 0;
    
    // Check existing themes' generation timestamps just in case
    currentThemes.forEach(t => {
      if (t.generatedAt) {
        const tTime = new Date(t.generatedAt).getTime();
        if (tTime > lastGenTime) {
          lastGenTime = tTime;
        }
      }
    });

    if (lastGenTime > 0) {
      const elapsed = Date.now() - lastGenTime;
      if (elapsed < 3600000) {
        const remainingMinutes = Math.ceil((3600000 - elapsed) / 60000);
        setGenError(`You can only generate one custom theme per hour. Please wait another ${remainingMinutes} minute(s).`);
        return;
      }
    }

    setIsGenerating(true);
    setGenError(null);
    setGenStatus("Generating theme colors...");
    setGenLogs([]);

    addLog("🚀 Initiating Custom Theme Pipeline...");
    addLog(`[Config] User Prompt: "${prompt}"`);
    addLog(`[Config] Proxy Mode Enabled: Routing calls to secure backend proxy at ${import.meta.env.VITE_PROXY_URL || 'http://localhost:5001'}`);

    try {
      addLog("Step 1/3: Calling Gemini API (gemini-2.5-flash) to generate custom color palette & styling tokens...");
      const themeVars = await generateThemeWithGemini(prompt, apiKey);
      addLog(`[Gemini] ✅ Colors generated successfully! Created theme: "${themeVars['theme-name']}"`);
      addLog(`[Gemini] Theme Variables:`);
      addLog(`  • Name: ${themeVars['theme-name']}`);
      addLog(`  • Base Background: ${themeVars['bg-base']}`);
      addLog(`  • Panel Background: ${themeVars['bg-panel']}`);
      addLog(`  • Accent color: ${themeVars['accent-bg']}`);
      addLog(`  • Pattern style: ${themeVars['bg-pattern'] || 'none'}`);
      addLog(`  • Music Scale: ${themeVars.music?.scale || 'dorian'}, Waveform: ${themeVars.music?.waveform || 'sine'}`);
      
      // Save Gemini API key if entered/changed
      if (apiKey) {
        localStorage.setItem('tridorian_gemini_api_key', apiKey);
        addLog(`[Storage] Saved user-provided Gemini API key to local settings.`);
      }

      themeVars.prompt = prompt;
      addLog("[Storage] Caching initial theme variables...");
      saveCustomTheme(themeVars, true);
      localStorage.setItem('tridorian_last_theme_gen_time', Date.now().toString());

      addLog("Step 2/3: Dispatching background image request to Imagen AI (imagen-4.0-generate-001)...");
      addLog(`[Imagen] Requesting 1:1 aspect ratio JPEG texture. Timeout threshold: 30 seconds.`);
      setGenStatus("Synthesizing theme background image (Imagen AI)...");
      try {
        const bgImageUrl = await generateImageWithImagen(prompt, apiKey);
        addLog(`[Imagen] ✅ Background image generated successfully! Received compressed base64 payload size: ${bgImageUrl.length} characters.`);
        themeVars['bg-pattern-image-url'] = bgImageUrl;
        saveCustomTheme(themeVars, true);
        addLog(`[Storage] Updated theme variables with background image URL.`);
      } catch (err) {
        addLog(`[Imagen] ⚠️ Image generation failed: ${err.message}`);
        addLog("  ↳ Common reasons: API timeouts or content policy filters. Falling back to CSS SVG pattern overlay.");
        console.warn("Failed to generate background image with Imagen, falling back to pre-built textures:", err);
      }

      addLog("Step 3/3: Dispatching audio loop request to Lyria AI (lyria-3-clip-preview)...");
      addLog(`[Lyria] Prompting for a 30-second seamless looping instrumental track. Timeout threshold: 30 seconds.`);
      setGenStatus("Synthesizing ambient music track (Lyria AI)...");
      try {
        const audioDataUrl = await generateMusicWithLyria(prompt, apiKey);
        addLog(`[Lyria] ✅ Audio loop generated successfully! Received base64 payload size: ${audioDataUrl.length} characters.`);
        
        addLog("[Storage] Saving audio loop to localStorage cache...");
        const saveAudio = safeLocalStorageSet(`tridorian_custom_theme_audio_${themeVars.id}`, audioDataUrl);
        try {
          localStorage.removeItem('tridorian_custom_theme_audio');
        } catch (e) {}
        
        if (saveAudio) {
          addLog("[Storage] ✅ Audio loop saved successfully to local cache.");
        } else {
          addLog("⚠️ Failed to cache audio loop in localStorage (Quota exceeded).");
        }
      } catch (err) {
        addLog(`[Lyria] ⚠️ Audio generation failed: ${err.message}`);
        if (prompt.toLowerCase().includes("'s") || prompt.toLowerCase().includes("rip") || prompt.toLowerCase().includes("dutton") || prompt.toLowerCase().includes("yellowstone")) {
          addLog("  ↳ Warning: Prompts containing fictional characters (e.g. 'Rip', 'Dutton') or trademarked entities can trigger model safety blocks (Finish Reason: OTHER). Try using descriptive terms instead.");
        }
        console.warn("Failed to generate music with Lyria:", err);
        localStorage.removeItem(`tridorian_custom_theme_audio_${themeVars.id}`);
        try {
          localStorage.removeItem('tridorian_custom_theme_audio');
        } catch (e) {}
      }

      addLog("Finalizing theme activation...");
      setCustomThemes(getCustomThemes());
      setTheme('custom');
      
      // Final sync of the custom theme variables (with completed properties) to Drive
      saveCustomTheme(themeVars, false);
      
      addLog("[Audio] Initializing playback for the new theme...");
      themeAudio.playThemeMusic('custom');
      addLog("🎉 Custom theme pipeline completed successfully! Enjoy your theme.");
      
      // Keep modal open slightly longer so user can read complete logs
      setTimeout(() => {
        setPrompt('');
        setShowGenerator(false);
        setGenLogs([]);
      }, 7000);
    } catch (e) {
      addLog(`❌ Pipeline aborted with error: ${e.message}`);
      if (e.message === 'API_KEY_REQUIRED') {
        setGenError("A Gemini API Key is required to run the theme generator.");
      } else {
        setGenError(e.message);
      }
    } finally {
      setIsGenerating(false);
      setGenStatus('');
    }
  };

  const handleDeleteTheme = (e, themeId) => {
    e.stopPropagation();
    const activeCustom = getCustomTheme();
    deleteCustomTheme(themeId);
    
    // Refresh local list
    const updated = getCustomThemes();
    setCustomThemes(updated);
    
    // Fallback if deleted active theme
    if (activeCustom && activeCustom.id === themeId) {
      if (theme === 'custom') {
        const nextCustom = updated[updated.length - 1];
        if (nextCustom) {
          setActiveCustomTheme(nextCustom);
          themeAudio.playThemeMusic('custom');
        } else {
          setTheme('dark');
          themeAudio.playThemeMusic('dark');
        }
      } else {
        const nextCustom = updated[updated.length - 1];
        if (nextCustom) {
          setActiveCustomTheme(nextCustom);
        }
      }
    }
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
      {/* 1. Theme Picker Button & Dropdown */}
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
            className="absolute left-0 top-full mt-2 w-72 rounded-xl border overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200"
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

              {/* Injected AI Custom Theme Options */}
              {customThemes
                .filter((opt) => {
                  const name = (opt['theme-name'] || opt.themeName || '').toLowerCase();
                  return !name.includes('jungle safari') && !name.includes('jungle park') && !name.includes('jeep jamboree');
                })
                .map((opt) => {
                  const isActive = theme === 'custom' && activeCustomTheme && activeCustomTheme.id === opt.id;
                const swatches = opt.swatches || [
                  opt['bg-base'] || '#080c08',
                  opt['accent-bg'] || '#22c55e',
                  opt['text-main'] || '#f0fdf4'
                ];
                return (
                  <div key={opt.id} className="w-full flex items-center gap-1 group px-1">
                    <button
                      onClick={() => {
                        setActiveCustomTheme(opt);
                        setTheme('custom');
                        themeAudio.playThemeMusic('custom');
                        setIsOpen(false);
                      }}
                      className="flex-1 flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-150 hover:bg-muted/30"
                      style={{
                        backgroundColor: isActive ? 'var(--accent-muted)' : 'transparent',
                        color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: isActive ? 'var(--accent-border)' : 'transparent',
                        minWidth: 0
                      }}
                      data-testid={`theme-option-custom-${opt.id}`}
                    >
                      <div className="flex gap-0.5 shrink-0">
                        {swatches.map((color, i) => (
                          <div
                            key={i}
                            className="w-3.5 h-3.5 rounded-full border border-black/20"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <span className="flex-1 text-left truncate text-xs font-mono">
                        {opt['theme-name'] || opt.themeName || 'AI Custom Theme'}
                      </span>
                      {isActive && (
                        <Check size={12} className="shrink-0 text-accent-text" />
                      )}
                    </button>
                    <button
                      onClick={(e) => handleDeleteTheme(e, opt.id)}
                      className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 shrink-0 opacity-40 group-hover:opacity-100 focus:opacity-100"
                      title="Delete Custom Theme"
                      data-testid={`delete-theme-${opt.id}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Background Texture Tester / Pattern Sandbox */}
            <div className="p-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTester(!showTester);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono font-bold hover:bg-muted/20 text-text-muted transition-all duration-150"
                data-testid="pattern-sandbox-trigger"
              >
                <div className="flex items-center gap-2">
                  <Grid size={12} />
                  <span>Background Sandbox</span>
                </div>
                <Sliders size={12} className={`transition-transform duration-200 ${showTester ? 'rotate-90' : ''}`} />
              </button>

              {showTester && (
                <div className="mt-2 p-2 rounded-lg space-y-3 bg-black/20 border border-border-subtle font-mono text-[10px]">
                  <div className="space-y-1">
                    <div className="flex justify-between text-text-muted uppercase tracking-wider">
                      <span>Opacity</span>
                      <span>{Math.round(sandboxOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={sandboxOpacity}
                      onChange={(e) => setSandboxOpacity(parseFloat(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-1 bg-muted rounded appearance-none cursor-pointer"
                      style={{ accentColor: 'var(--accent-bg)' }}
                      data-testid="sandbox-opacity-slider"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-text-muted uppercase tracking-wider">
                      <span>Scale / Density</span>
                      <span>{sandboxScale.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={sandboxScale}
                      onChange={(e) => setSandboxScale(parseFloat(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full h-1 bg-muted rounded appearance-none cursor-pointer"
                      style={{ accentColor: 'var(--accent-bg)' }}
                      data-testid="sandbox-scale-slider"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* AI Theme Generator Button */}
            <div className="p-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowGenerator(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-bold bg-accent/10 hover:bg-accent/20 text-accent-text border border-accent-border transition-all duration-150"
                data-testid="ai-theme-gen-trigger"
              >
                <Cpu size={12} />
                <span>AI Theme Generator</span>
              </button>
            </div>

            <div
              className="px-4 py-2 border-t text-center text-[9px] font-mono uppercase tracking-widest"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)',
                opacity: 0.5,
              }}
            >
              tridorian Theme Engine
            </div>
          </div>
        )}
      </div>

      {/* 2. Custom Cursor Toggle Button */}
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

      {/* 3. Static Audio Controls */}
      <div 
        data-testid="volume-scroll-widget"
        className="flex items-center rounded-full border px-2 py-1.5"
        style={{
          borderColor: 'var(--border-main)',
          backgroundColor: 'var(--bg-panel)',
          color: 'var(--text-muted)',
        }}
        onWheel={(e) => {
          e.stopPropagation();
          e.preventDefault();
          themeAudio.playThemeMusic(theme);
          const change = e.deltaY < 0 ? 0.05 : -0.05;
          const newVol = Math.max(0, Math.min(1, parseFloat(audioState.volume) + change));
          const roundedVol = Math.round(newVol * 100) / 100;
          themeAudio.setVolume(roundedVol);
          setAudioState(prev => ({ ...prev, volume: roundedVol }));
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
          className="flex items-center"
          style={{
            width: '60px',
            opacity: 1,
            marginLeft: '4px',
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

      {/* 4. AI Theme Generator Prompt Modal */}
      {showGenerator && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-panel border border-border-main rounded-xl p-6 max-w-3xl w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] font-sans max-h-[95vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-main mb-2">AI Theme Generator</h3>
            <p className="text-text-muted text-xs mb-4">
              Enter a design style to generate custom colors & synthesizer loops using Gemini.
            </p>
            
            <div className="space-y-4">
              {/* API Key */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-mono uppercase text-text-muted">Gemini API Key</label>
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-accent-text hover:underline"
                  >
                    Get a Key
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="Enter API Key (pre-fills if saved)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border-main rounded-lg text-sm text-main placeholder-text-muted/50 focus:outline-none focus:border-accent"
                />
              </div>
              
              {/* Theme Prompt */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-text-muted mb-1">Theme Prompt</label>
                <textarea
                  placeholder="e.g. Cyberpunk neon orange and deep purple, Autumn forest warm browns and greens, Soft minimalist slate blue..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 bg-muted border border-border-main rounded-lg text-sm text-main placeholder-text-muted/50 focus:outline-none focus:border-accent resize-none"
                />
              </div>

              {/* Generate Button */}
              <button
                disabled={isGenerating}
                onClick={handleGenerateTheme}
                className="w-full py-2.5 bg-accent text-accent-fg font-bold rounded-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
              >
                {isGenerating ? (genStatus || "Generating...") : "Generate Theme Colors & Music"}
              </button>
              
              {/* Real-time Terminal Log Console */}
              {(isGenerating || genLogs.length > 0) && (
                <div className="mt-4 p-3 bg-black border border-border-main rounded-lg font-mono text-[10px] leading-relaxed text-[#4ade80] max-h-96 overflow-y-auto space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider pb-1 border-b border-border-subtle mb-1 flex justify-between items-center">
                    <span>Theme Generation Logs</span>
                    {isGenerating && <span className="animate-pulse text-amber-500">● RUNNING</span>}
                  </div>
                  {genLogs.map((log, i) => (
                    <div key={i} className="break-words select-all">{log}</div>
                  ))}
                </div>
              )}

              {genError && (
                <div className="text-red-400 text-xs font-mono max-w-xl break-words">
                  {genError}
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-3 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  disabled={isGenerating}
                  onClick={() => {
                    setShowGenerator(false);
                    setGenError(null);
                    setGenLogs([]);
                  }}
                  className="w-full py-2 bg-muted text-text-muted rounded-lg hover:bg-elevated transition-all text-sm font-bold disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalControls;
