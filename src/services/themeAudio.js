// src/services/themeAudio.js
// Procedural Audio Synthesizer for Tridorian Course Catalog
// Generates infinite themed ambient music loops using the browser's Web Audio API.

let audioCtx = null;
let masterGain = null;
let currentLoopId = null;
let activeNodes = [];
let schedulerTimer = null;

// Persistent preference keys
const VOL_KEY = 'tridorian_audio_volume';
const MUTE_KEY = 'tridorian_audio_muted';

const state = {
  volume: parseFloat(localStorage.getItem(VOL_KEY) || '0.3'),
  isMuted: localStorage.getItem(MUTE_KEY) === 'true'
};

function initAudio() {
  if (audioCtx) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    console.warn("[Theme Audio] Web Audio API is not supported in this environment.");
    return;
  }
  audioCtx = new AudioContextClass();
  masterGain = audioCtx.createGain();
  
  // Set initial volume & mute
  masterGain.gain.setValueAtTime(state.isMuted ? 0 : state.volume, audioCtx.currentTime);
  masterGain.connect(audioCtx.destination);
}

// Fade out and destroy nodes
function cleanupActiveNodes() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }

  const now = audioCtx ? audioCtx.currentTime : 0;
  activeNodes.forEach(node => {
    try {
      if (node.gain) {
        node.gain.gain.setValueAtTime(node.gain.gain.value, now);
        node.gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      }
      setTimeout(() => {
        try { node.stop(); } catch (e) {}
      }, 1500);
    } catch (e) {}
  });
  activeNodes = [];
}

// Create a delay/feedback effect for spacey sounds
function createDelayNode(feedbackVal = 0.5, delayTimeVal = 0.4) {
  const delay = audioCtx.createDelay();
  const feedback = audioCtx.createGain();
  
  delay.delayTime.value = delayTimeVal;
  feedback.gain.value = feedbackVal;
  
  delay.connect(feedback);
  feedback.connect(delay);
  
  return { delay, feedback };
}

// --- Synthesizers for each Theme ---

// 1. Tridorian Dark: Cyberpunk Pulsating Drone & Dark Cyber Plucks
function playTridorianDark() {
  const now = audioCtx.currentTime;

  // Pulsating low drone
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();

  osc1.type = 'sawtooth';
  osc1.frequency.value = 55; // A1
  osc2.type = 'triangle';
  osc2.frequency.value = 55.5; // Slightly detuned

  filter.type = 'lowpass';
  filter.frequency.value = 140;

  // LFO to modulate filter cutoff
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.15; // Slow sweep
  lfoGain.gain.value = 40;

  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.4, now + 2); // Slow fade-in

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  osc1.start(now);
  osc2.start(now);
  lfo.start(now);

  activeNodes.push(osc1, osc2, lfo);

  // Plucks sequencer (A minor pentatonic)
  const notes = [110, 130.81, 146.83, 164.81, 196.00, 220, 261.63];
  let step = 0;

  schedulerTimer = setInterval(() => {
    if (audioCtx.state === 'suspended') return;
    const schedNow = audioCtx.currentTime;
    
    // Play a note every 1.5 seconds
    if (step % 2 === 0) {
      const freq = notes[Math.floor(Math.random() * notes.length)];
      const pluckOsc = audioCtx.createOscillator();
      const pluckGain = audioCtx.createGain();
      const delayObj = createDelayNode(0.4, 0.45);

      pluckOsc.type = 'sine';
      pluckOsc.frequency.setValueAtTime(freq, schedNow);

      pluckGain.gain.setValueAtTime(0, schedNow);
      pluckGain.gain.linearRampToValueAtTime(0.18, schedNow + 0.05);
      pluckGain.gain.exponentialRampToValueAtTime(0.0001, schedNow + 1.5);

      pluckOsc.connect(pluckGain);
      pluckGain.connect(masterGain);
      
      // route to delay
      pluckGain.connect(delayObj.delay);
      delayObj.delay.connect(masterGain);

      pluckOsc.start(schedNow);
      pluckOsc.stop(schedNow + 2);
    }
    step++;
  }, 750);
}

// 2. Clean Light: Bright, airy ambient bells and soft chord pads
function playCleanLight() {
  const now = audioCtx.currentTime;

  // Soft major chord pad
  const freqs = [220, 277.18, 329.63, 440]; // A major
  const padNodes = freqs.map(f => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.value = f;
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 3);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    return osc;
  });

  activeNodes.push(...padNodes);

  // Sparkly Bell sequencer (Pentatonic scale C# major)
  const bellNotes = [554.37, 622.25, 698.46, 830.61, 932.33, 1108.73];
  
  schedulerTimer = setInterval(() => {
    if (audioCtx.state === 'suspended') return;
    const schedNow = audioCtx.currentTime;
    
    // Play sparse random bells
    if (Math.random() > 0.4) {
      const freq = bellNotes[Math.floor(Math.random() * bellNotes.length)];
      const bell = audioCtx.createOscillator();
      const bellGain = audioCtx.createGain();

      bell.type = 'sine';
      bell.frequency.setValueAtTime(freq, schedNow);

      bellGain.gain.setValueAtTime(0, schedNow);
      bellGain.gain.linearRampToValueAtTime(0.08, schedNow + 0.01);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, schedNow + 3);

      bell.connect(bellGain);
      bellGain.connect(masterGain);

      bell.start(schedNow);
      bell.stop(schedNow + 3.2);
    }
  }, 1000);
}

// 3. Rainbow Kitten: Retro chiptune arpeggiator loop (playful/bubbly)
function playRainbowKitten() {
  const now = audioCtx.currentTime;

  // Soft root bass drone
  const bass = audioCtx.createOscillator();
  const bassGain = audioCtx.createGain();
  bass.type = 'triangle';
  bass.frequency.value = 130.81; // C3
  bassGain.gain.setValueAtTime(0, now);
  bassGain.gain.linearRampToValueAtTime(0.12, now + 1);
  bass.connect(bassGain);
  bassGain.connect(masterGain);
  bass.start(now);
  activeNodes.push(bass);

  // Bubbly arpeggiator (C Major chord pattern)
  const pattern = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];
  let idx = 0;

  schedulerTimer = setInterval(() => {
    if (audioCtx.state === 'suspended') return;
    const schedNow = audioCtx.currentTime;

    const pluck = audioCtx.createOscillator();
    const pluckGain = audioCtx.createGain();

    pluck.type = 'square';
    pluck.frequency.setValueAtTime(pattern[idx], schedNow);

    pluckGain.gain.setValueAtTime(0, schedNow);
    pluckGain.gain.linearRampToValueAtTime(0.03, schedNow + 0.01);
    pluckGain.gain.exponentialRampToValueAtTime(0.0001, schedNow + 0.25);

    pluck.connect(pluckGain);
    pluckGain.connect(masterGain);

    pluck.start(schedNow);
    pluck.stop(schedNow + 0.3);

    idx = (idx + 1) % pattern.length;
  }, 180); // Quick upbeat 8th notes
}

// 4. Caribbean Mood: Tropical steel-pan chords & ocean-wave noise generator
function playCaribbeanMood() {
  const now = audioCtx.currentTime;

  // Ambient sea breeze generator using White Noise
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = audioCtx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = 350;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0, now);
  noiseGain.gain.linearRampToValueAtTime(0.05, now + 2);

  // Modulate sea waves
  const waveLfo = audioCtx.createOscillator();
  const waveLfoGain = audioCtx.createGain();
  waveLfo.frequency.value = 0.12; // 8-second wave swells
  waveLfoGain.gain.value = 250;

  waveLfo.connect(waveLfoGain);
  waveLfoGain.connect(noiseFilter.frequency);

  whiteNoise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);

  whiteNoise.start(now);
  waveLfo.start(now);

  activeNodes.push(whiteNoise, waveLfo);

  // Relaxing plucks (Pentatonic F Major)
  const steelNotes = [174.61, 196.00, 220.00, 261.63, 293.66, 349.23];
  
  schedulerTimer = setInterval(() => {
    if (audioCtx.state === 'suspended') return;
    const schedNow = audioCtx.currentTime;

    if (Math.random() > 0.4) {
      const pluck = audioCtx.createOscillator();
      const pluckGain = audioCtx.createGain();
      // steel pan has slight detuned higher harmonics
      const harmonic = audioCtx.createOscillator();

      pluck.type = 'triangle';
      pluck.frequency.setValueAtTime(steelNotes[Math.floor(Math.random() * steelNotes.length)], schedNow);

      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(pluck.frequency.value * 2.01, schedNow); // detuned octave harmonic

      pluckGain.gain.setValueAtTime(0, schedNow);
      pluckGain.gain.linearRampToValueAtTime(0.09, schedNow + 0.02);
      pluckGain.gain.exponentialRampToValueAtTime(0.0001, schedNow + 1.2);

      pluck.connect(pluckGain);
      harmonic.connect(pluckGain);
      pluckGain.connect(masterGain);

      pluck.start(schedNow);
      harmonic.start(schedNow);
      pluck.stop(schedNow + 1.5);
      harmonic.stop(schedNow + 1.5);
    }
  }, 1200);
}

// 5. Lunar Vibe: Sparse deep space echoes & cold ambient bells
function playLunarVibe() {
  const now = audioCtx.currentTime;

  // Cold cosmic drone
  const osc = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.value = 65.41; // C2

  filter.type = 'lowpass';
  filter.frequency.value = 100;

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 4);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  osc.start(now);
  activeNodes.push(osc);

  // Sparse spaced-out echo piano notes
  const notes = [130.81, 164.81, 196.00, 246.94, 261.63, 329.63, 392.00];

  schedulerTimer = setInterval(() => {
    if (audioCtx.state === 'suspended') return;
    const schedNow = audioCtx.currentTime;

    if (Math.random() > 0.6) {
      const noteFreq = notes[Math.floor(Math.random() * notes.length)];
      const oscNode = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const delayObj = createDelayNode(0.65, 0.7); // High echo delay

      oscNode.type = 'sine';
      oscNode.frequency.setValueAtTime(noteFreq, schedNow);

      gainNode.gain.setValueAtTime(0, schedNow);
      gainNode.gain.linearRampToValueAtTime(0.08, schedNow + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, schedNow + 4);

      oscNode.connect(gainNode);
      gainNode.connect(masterGain);
      
      // route through delay
      gainNode.connect(delayObj.delay);
      delayObj.delay.connect(masterGain);

      oscNode.start(schedNow);
      oscNode.stop(schedNow + 5);
    }
  }, 2500);
}

// --- Controller Actions ---

export function playThemeMusic(themeId) {
  try {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      // Audio context needs user gesture to start
      audioCtx.resume();
    }

    if (currentLoopId === themeId) return;
    
    currentLoopId = themeId;
    cleanupActiveNodes();

    console.log(`[Theme Audio] Loading music loop: ${themeId}...`);
    if (themeId === 'dark') {
      playTridorianDark();
    } else if (themeId === 'light') {
      playCleanLight();
    } else if (themeId === 'kitten') {
      playRainbowKitten();
    } else if (themeId === 'caribbean') {
      playCaribbeanMood();
    } else if (themeId === 'lunar') {
      playLunarVibe();
    }
  } catch (e) {
    console.warn("[Theme Audio] Audio start failed (likely blocked by policy).", e);
  }
}

export function stopThemeMusic() {
  currentLoopId = null;
  cleanupActiveNodes();
}

export function setVolume(vol) {
  state.volume = Math.max(0, Math.min(1, vol));
  try {
    localStorage.setItem(VOL_KEY, state.volume.toString());
    if (masterGain && !state.isMuted) {
      masterGain.gain.setValueAtTime(state.volume, audioCtx.currentTime);
    }
  } catch (e) {}
}

export function toggleMute() {
  state.isMuted = !state.isMuted;
  try {
    localStorage.setItem(MUTE_KEY, state.isMuted.toString());
    if (masterGain) {
      masterGain.gain.setValueAtTime(state.isMuted ? 0 : state.volume, audioCtx.currentTime);
    }
  } catch (e) {}
  return state.isMuted;
}

export function getAudioState() {
  return { ...state, currentLoopId };
}
