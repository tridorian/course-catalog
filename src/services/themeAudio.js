// src/services/themeAudio.js
// Advanced Procedural Audio Synthesizer for Tridorian Course Catalog
// Generates immersive, rich themed ambient music loops using the browser's Web Audio API.
import { getCustomTheme } from './customTheme';

let audioCtx = null;
let masterGain = null;
let currentLoopId = null;
let activeNodes = [];
let schedulerTimer = null;
let evolveTimer = null;
let customAudioElement = null;
let customAudioSource = null;

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
  if (evolveTimer) {
    clearInterval(evolveTimer);
    evolveTimer = null;
  }

  const now = audioCtx ? audioCtx.currentTime : 0;
  activeNodes.forEach(node => {
    try {
      if (node.gainNode) {
        node.gainNode.gain.setValueAtTime(node.gainNode.gain.value, now);
        node.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
      }
      setTimeout(() => {
        try { node.stop(); } catch (e) {}
      }, 1800);
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

// Helper to play FM synthesized bell plucks
function playFMBell(freq, duration, modulationIndex, modulationRatio, gainVal, time) {
  const carrier = audioCtx.createOscillator();
  const modulator = audioCtx.createOscillator();
  const modGain = audioCtx.createGain();
  const bellGain = audioCtx.createGain();

  carrier.type = 'sine';
  carrier.frequency.value = freq;

  modulator.type = 'sine';
  modulator.frequency.value = freq * modulationRatio;

  modGain.gain.setValueAtTime(freq * modulationIndex, time);
  modGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  bellGain.gain.setValueAtTime(0, time);
  bellGain.gain.linearRampToValueAtTime(gainVal, time + 0.01);
  bellGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  modulator.connect(modGain);
  modGain.connect(carrier.frequency);
  carrier.connect(bellGain);
  bellGain.connect(masterGain);

  modulator.start(time);
  carrier.start(time);

  modulator.stop(time + duration + 0.2);
  carrier.stop(time + duration + 0.2);
}

// --- Synthesizers for each Theme ---

// 1. Tridorian Dark: Cyberpunk Pulsating Drone & Analog Sequencer
function playTridorianDark() {
  const now = audioCtx.currentTime;

  // Pulsating analog low bass drone (saw + detuned square)
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();

  osc1.type = 'sawtooth';
  osc1.frequency.value = 55; // A1
  
  osc2.type = 'square';
  osc2.frequency.value = 55.4; // Detuned

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(150, now);
  filter.Q.setValueAtTime(6, now);

  // Slow LFO sweeping the filter cutoff frequency for analog movement
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.08; // Super slow sweep
  lfoGain.gain.value = 80;

  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.35, now + 3);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  osc1.start(now);
  osc2.start(now);
  lfo.start(now);

  osc1.gainNode = gain;
  osc2.gainNode = gain;
  lfo.gainNode = gain;
  activeNodes.push(osc1, osc2, lfo);

  // Industrial high-pass atmospheric noise sweep
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  const noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = noiseBuffer;
  noiseNode.loop = true;

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(800, now);
  noiseFilter.Q.setValueAtTime(3, now);

  const noiseLfo = audioCtx.createOscillator();
  const noiseLfoGain = audioCtx.createGain();
  noiseLfo.frequency.value = 0.05;
  noiseLfoGain.gain.value = 400;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0, now);
  noiseGain.gain.linearRampToValueAtTime(0.015, now + 4);

  noiseLfo.connect(noiseLfoGain);
  noiseLfoGain.connect(noiseFilter.frequency);
  noiseNode.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);

  noiseNode.start(now);
  noiseLfo.start(now);
  noiseNode.gainNode = noiseGain;
  activeNodes.push(noiseNode, noiseLfo);

  // Syncopated 8-step cyberpunk sequencer (A minor pentatonic)
  const sequence = [110, 110, 130.81, 146.83, 110, 164.81, 110, 196.00]; // A2 -> C3 -> D3 -> E3 -> G3
  let step = 0;

  schedulerTimer = setInterval(() => {
    if (audioCtx.state === 'suspended') return;
    const schedNow = audioCtx.currentTime;
    
    // Play notes on steps
    if (step % 8 !== 1 && step % 8 !== 5) { // Skip some steps for a nice rhythm
      const baseFreq = sequence[step % sequence.length];
      const noteFreq = baseFreq * (Math.random() > 0.85 ? 2 : 1); // Occasional octave jump

      const pluckOsc = audioCtx.createOscillator();
      const pluckGain = audioCtx.createGain();
      const pluckFilter = audioCtx.createBiquadFilter();
      const delayObj = createDelayNode(0.35, 0.38);

      pluckOsc.type = 'sawtooth';
      pluckOsc.frequency.setValueAtTime(noteFreq, schedNow);

      // Analog filter sweep envelope for plucks
      pluckFilter.type = 'lowpass';
      pluckFilter.frequency.setValueAtTime(noteFreq * 4, schedNow);
      pluckFilter.frequency.exponentialRampToValueAtTime(noteFreq * 1.2, schedNow + 0.25);

      pluckGain.gain.setValueAtTime(0, schedNow);
      pluckGain.gain.linearRampToValueAtTime(0.12, schedNow + 0.01);
      pluckGain.gain.exponentialRampToValueAtTime(0.0001, schedNow + 0.4);

      pluckOsc.connect(pluckFilter);
      pluckFilter.connect(pluckGain);
      pluckGain.connect(masterGain);
      
      pluckGain.connect(delayObj.delay);
      delayObj.delay.connect(masterGain);

      pluckOsc.start(schedNow);
      pluckOsc.stop(schedNow + 0.5);
    }
    step++;
  }, 220); // Cyberpunk tempo
}

// 2. Clean Light: Airy Zen Evolving Chords & Crystal FM Chimes
function playCleanLight() {
  const now = audioCtx.currentTime;

  // Evolving chord progression in G Major
  const progressions = [
    [196.00, 246.94, 293.66, 392.00], // G Major
    [261.63, 329.63, 392.00, 523.25], // C Major
    [293.66, 369.99, 440.00, 587.33], // D Major
    [164.81, 246.94, 329.63, 392.00]  // E Minor
  ];

  let currentProgIdx = 0;
  let activePadOscs = [];
  const padGain = audioCtx.createGain();
  padGain.gain.setValueAtTime(0, now);
  padGain.gain.linearRampToValueAtTime(0.1, now + 3);
  padGain.connect(masterGain);

  const startChord = (chordFreqs, time) => {
    // Fade out previous oscillators
    const oldOscs = activePadOscs;
    activePadOscs = [];
    
    oldOscs.forEach(o => {
      o.gainNode.gain.setValueAtTime(o.gainNode.gain.value, time);
      o.gainNode.gain.linearRampToValueAtTime(0, time + 2.5);
      setTimeout(() => { o.stop(); }, 3000);
    });

    // Start new chord oscillators
    chordFreqs.forEach(f => {
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, time);
      
      oscGain.gain.setValueAtTime(0, time);
      oscGain.gain.linearRampToValueAtTime(0.045, time + 2.5);

      osc.connect(oscGain);
      oscGain.connect(padGain);
      osc.start(time);
      osc.gainNode = oscGain;
      activePadOscs.push(osc);
    });
  };

  // Start the first chord immediately
  startChord(progressions[currentProgIdx], now);

  // Evolve chords every 7 seconds
  evolveTimer = setInterval(() => {
    if (audioCtx.state === 'suspended') return;
    const schedNow = audioCtx.currentTime;
    currentProgIdx = (currentProgIdx + 1) % progressions.length;
    startChord(progressions[currentProgIdx], schedNow);
  }, 7000);

  // FM Crystal Chimes (C# major pentatonic chimes)
  const bellNotes = [554.37, 622.25, 698.46, 830.61, 932.33, 1108.73];
  
  schedulerTimer = setInterval(() => {
    if (audioCtx.state === 'suspended') return;
    const schedNow = audioCtx.currentTime;
    
    // Play sparse random bells
    if (Math.random() > 0.45) {
      const freq = bellNotes[Math.floor(Math.random() * bellNotes.length)];
      // Bell physical model using FM synthesis (modRatio 3.5, modIndex 1.8)
      playFMBell(freq, 3.5, 1.8, 3.5, 0.05, schedNow);
    }
  }, 1200);
}

// 3. Rainbow Kitten: Retro Chiptune Walking Bass & Chord-Aware Arp
function playRainbowKitten() {
  const now = audioCtx.currentTime;

  const chords = [
    { root: 261.63, pattern: [261.63, 329.63, 392.00, 523.25] }, // C Major
    { root: 349.23, pattern: [349.23, 440.00, 523.25, 698.46] }, // F Major
    { root: 392.00, pattern: [392.00, 493.88, 587.33, 783.99] }, // G Major
    { root: 220.00, pattern: [220.00, 261.63, 329.63, 440.00] }  // A Minor
  ];

  let currentChordIdx = 0;

  // Change chord progression every 4 seconds
  evolveTimer = setInterval(() => {
    if (audioCtx.state === 'suspended') return;
    currentChordIdx = (currentChordIdx + 1) % chords.length;
  }, 4000);

  // 8-bit walking bassline (Triangle Wave)
  let bassStep = 0;
  schedulerTimer = setInterval(() => {
    if (audioCtx.state === 'suspended') return;
    const schedNow = audioCtx.currentTime;

    const activeChord = chords[currentChordIdx];
    // Simple 8-bit walking bass rhythm: Root -> Octave -> 5th -> Octave
    let noteFreq = activeChord.root / 2; // Bass octave
    if (bassStep % 4 === 1) noteFreq = activeChord.pattern[2] / 2; // 5th
    if (bassStep % 4 === 2) noteFreq = activeChord.root; // Root original
    if (bassStep % 4 === 3) noteFreq = activeChord.pattern[1] / 2; // 3rd

    const bassOsc = audioCtx.createOscillator();
    const bassGain = audioCtx.createGain();

    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(noteFreq, schedNow);

    bassGain.gain.setValueAtTime(0, schedNow);
    bassGain.gain.linearRampToValueAtTime(0.12, schedNow + 0.02);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, schedNow + 0.35);

    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);

    bassOsc.start(schedNow);
    bassOsc.stop(schedNow + 0.4);

    bassStep++;
  }, 400);

  // Rapid square-wave arpeggiator
  let arpIdx = 0;
  const arpInterval = setInterval(() => {
    if (audioCtx.state === 'suspended') return;
    const schedNow = audioCtx.currentTime;

    const activeChord = chords[currentChordIdx];
    const noteFreq = activeChord.pattern[arpIdx % activeChord.pattern.length];

    const arpOsc = audioCtx.createOscillator();
    const arpGain = audioCtx.createGain();

    // Pulse/Square wave for 8-bit tone
    arpOsc.type = 'square';
    arpOsc.frequency.setValueAtTime(noteFreq, schedNow);

    arpGain.gain.setValueAtTime(0, schedNow);
    arpGain.gain.linearRampToValueAtTime(0.015, schedNow + 0.005);
    arpGain.gain.exponentialRampToValueAtTime(0.0001, schedNow + 0.12);

    arpOsc.connect(arpGain);
    arpGain.connect(masterGain);

    arpOsc.start(schedNow);
    arpOsc.stop(schedNow + 0.15);

    // Procedural bubble pop sounds (sweeping pitch) triggered occasionally
    if (Math.random() > 0.96) {
      const popOsc = audioCtx.createOscillator();
      const popGain = audioCtx.createGain();
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(400, schedNow);
      popOsc.frequency.exponentialRampToValueAtTime(1200, schedNow + 0.08); // Quick sweep up

      popGain.gain.setValueAtTime(0, schedNow);
      popGain.gain.linearRampToValueAtTime(0.02, schedNow + 0.005);
      popGain.gain.exponentialRampToValueAtTime(0.0001, schedNow + 0.08);

      popOsc.connect(popGain);
      popGain.connect(masterGain);
      popOsc.start(schedNow);
      popOsc.stop(schedNow + 0.1);
    }

    arpIdx++;
  }, 130);

  // Track the interval so it can be cleared inside cleanupActiveNodes
  const oldCleanup = cleanupActiveNodes;
  cleanupActiveNodes = () => {
    clearInterval(arpInterval);
    oldCleanup();
    cleanupActiveNodes = oldCleanup; // Restore original reference
  };
}

// 4. Caribbean Mood: Calypso Steel Drums & Stereo Ocean Waves
function playCaribbeanMood() {
  const now = audioCtx.currentTime;

  // Sea wave generator using lowpass filtered white noise panning left-to-right
  const bufferSize = 4 * audioCtx.sampleRate;
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
  noiseFilter.frequency.setValueAtTime(250, now);

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0, now);
  noiseGain.gain.linearRampToValueAtTime(0.04, now + 3);

  // Slow LFO for 7-second wave swells
  const waveLfo = audioCtx.createOscillator();
  const waveLfoGain = audioCtx.createGain();
  waveLfo.frequency.value = 0.14; // wave rate
  waveLfoGain.gain.value = 180;

  // Stereo Panner to wash the waves left and right
  const panner = audioCtx.createStereoPanner();
  const panLfo = audioCtx.createOscillator();
  const panLfoGain = audioCtx.createGain();
  panLfo.frequency.value = 0.08; // Slower pan
  panLfoGain.gain.value = 0.9;

  waveLfo.connect(waveLfoGain);
  waveLfoGain.connect(noiseFilter.frequency);

  panLfo.connect(panLfoGain);
  panLfoGain.connect(panner.pan);

  whiteNoise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(panner);
  panner.connect(masterGain);

  whiteNoise.start(now);
  waveLfo.start(now);
  panLfo.start(now);

  whiteNoise.gainNode = noiseGain;
  activeNodes.push(whiteNoise, waveLfo, panLfo);

  // Caribbean calypso chords progression (F -> Bb -> C -> Bb)
  const calypsoChords = [
    [174.61, 220.00, 261.63, 349.23], // F Major
    [233.08, 293.66, 349.23, 466.16], // Bb Major
    [261.63, 329.63, 392.00, 523.25], // C Major
    [233.08, 293.66, 349.23, 466.16]  // Bb Major
  ];

  let chordIdx = 0;
  schedulerTimer = setInterval(() => {
    if (audioCtx.state === 'suspended') return;
    const schedNow = audioCtx.currentTime;

    const currentChord = calypsoChords[chordIdx % calypsoChords.length];

    // Trigger calypso steel pan plucks with physical modeling physics:
    // quick high-frequency noise strike + ringing root sine + harmonics
    if (Math.random() > 0.3) {
      const rootFreq = currentChord[Math.floor(Math.random() * currentChord.length)];
      
      // Ringing body (Sine + slightly detuned 2nd and 3rd harmonics)
      const bodyNode = audioCtx.createOscillator();
      const bodyGain = audioCtx.createGain();
      bodyNode.type = 'sine';
      bodyNode.frequency.setValueAtTime(rootFreq, schedNow);

      const harmonic = audioCtx.createOscillator();
      const harmonicGain = audioCtx.createGain();
      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(rootFreq * 2.005, schedNow); // Slightly detuned octave

      // High-frequency impact noise strike
      const strikeNoise = audioCtx.createBufferSource();
      strikeNoise.buffer = noiseBuffer;
      const strikeFilter = audioCtx.createBiquadFilter();
      strikeFilter.type = 'bandpass';
      strikeFilter.frequency.setValueAtTime(3000, schedNow);
      
      const strikeGain = audioCtx.createGain();
      strikeGain.gain.setValueAtTime(0.02, schedNow);
      strikeGain.gain.exponentialRampToValueAtTime(0.0001, schedNow + 0.03); // Quick strike decay

      bodyGain.gain.setValueAtTime(0, schedNow);
      bodyGain.gain.linearRampToValueAtTime(0.07, schedNow + 0.01);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, schedNow + 1.2);

      harmonicGain.gain.setValueAtTime(0, schedNow);
      harmonicGain.gain.linearRampToValueAtTime(0.035, schedNow + 0.01);
      harmonicGain.gain.exponentialRampToValueAtTime(0.0001, schedNow + 0.8);

      bodyNode.connect(bodyGain);
      bodyGain.connect(masterGain);

      harmonic.connect(harmonicGain);
      harmonicGain.connect(masterGain);

      strikeNoise.connect(strikeFilter);
      strikeFilter.connect(strikeGain);
      strikeGain.connect(masterGain);

      bodyNode.start(schedNow);
      harmonic.start(schedNow);
      strikeNoise.start(schedNow);

      bodyNode.stop(schedNow + 1.5);
      harmonic.stop(schedNow + 1.0);
      strikeNoise.stop(schedNow + 0.1);
    }

    chordIdx++;
  }, 1000);
}

// 5. Lunar Vibe: Sparse Solar Wind, Deep Sub Drone & Spaced Echo Plucks
function playLunarVibe() {
  const now = audioCtx.currentTime;

  // Deep multi-oscillator detuned sub space drone (C1 + detuned C1)
  const sub1 = audioCtx.createOscillator();
  const sub2 = audioCtx.createOscillator();
  const droneGain = audioCtx.createGain();
  const droneFilter = audioCtx.createBiquadFilter();

  sub1.type = 'sine';
  sub1.frequency.setValueAtTime(32.70, now); // C1
  
  sub2.type = 'sine';
  sub2.frequency.setValueAtTime(32.90, now); // Detuned C1 (beating)

  droneFilter.type = 'lowpass';
  droneFilter.frequency.setValueAtTime(90, now);

  droneGain.gain.setValueAtTime(0, now);
  droneGain.gain.linearRampToValueAtTime(0.3, now + 4);

  sub1.connect(droneFilter);
  sub2.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(masterGain);

  sub1.start(now);
  sub2.start(now);
  
  sub1.gainNode = droneGain;
  activeNodes.push(sub1, sub2);

  // Solar wind: sweeps of resonant lowpass band on white noise
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  const windFilter = audioCtx.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.setValueAtTime(400, now);
  windFilter.Q.setValueAtTime(4, now);

  const windGain = audioCtx.createGain();
  windGain.gain.setValueAtTime(0, now);
  windGain.gain.linearRampToValueAtTime(0.02, now + 3);

  const windLfo = audioCtx.createOscillator();
  const windLfoGain = audioCtx.createGain();
  windLfo.frequency.value = 0.04; // Very slow sweep
  windLfoGain.gain.value = 350;

  windLfo.connect(windLfoGain);
  windLfoGain.connect(windFilter.frequency);
  noiseSource.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(masterGain);

  noiseSource.start(now);
  windLfo.start(now);
  noiseSource.gainNode = windGain;
  activeNodes.push(noiseSource, windLfo);

  // Space echo-plucks with LFO vibrato in C major pentatonic
  const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];

  schedulerTimer = setInterval(() => {
    if (audioCtx.state === 'suspended') return;
    const schedNow = audioCtx.currentTime;

    // Sparse, ethereal space notes
    if (Math.random() > 0.55) {
      const noteFreq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const delayObj = createDelayNode(0.68, 0.75); // Ethereal feedback echoes

      osc.type = 'sine';
      osc.frequency.setValueAtTime(noteFreq, schedNow);

      // Eerie vibrato (LFO at 5.5Hz modulating frequency)
      const vibratoLfo = audioCtx.createOscillator();
      const vibratoGain = audioCtx.createGain();
      vibratoLfo.frequency.value = 5.5;
      vibratoGain.gain.value = 5.0; // Detuning range

      vibratoLfo.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);

      gainNode.gain.setValueAtTime(0, schedNow);
      gainNode.gain.linearRampToValueAtTime(0.065, schedNow + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, schedNow + 3.5);

      osc.connect(gainNode);
      gainNode.connect(masterGain);
      
      gainNode.connect(delayObj.delay);
      delayObj.delay.connect(masterGain);

      osc.start(schedNow);
      vibratoLfo.start(schedNow);

      osc.stop(schedNow + 4);
      vibratoLfo.stop(schedNow + 4);
    }

    // Occasional space beacon ping every 6 seconds
    if (Math.random() > 0.88) {
      const beaconFreq = 1567.98; // G6
      const beaconOsc = audioCtx.createOscillator();
      const beaconGain = audioCtx.createGain();
      const beaconDelay = createDelayNode(0.5, 0.4);

      beaconOsc.type = 'sine';
      beaconOsc.frequency.setValueAtTime(beaconFreq, schedNow);

      beaconGain.gain.setValueAtTime(0, schedNow);
      beaconGain.gain.linearRampToValueAtTime(0.015, schedNow + 0.005);
      beaconGain.gain.exponentialRampToValueAtTime(0.0001, schedNow + 0.2);

      beaconOsc.connect(beaconGain);
      beaconGain.connect(masterGain);
      beaconGain.connect(beaconDelay.delay);
      beaconDelay.delay.connect(masterGain);

      beaconOsc.start(schedNow);
      beaconOsc.stop(schedNow + 0.3);
    }

  }, 1800);
}

// Helper to play a generated custom background music clip (stored in localStorage)
function playCustomAudioURL(url) {
  if (!audioCtx) return;
  cleanupActiveNodes();

  if (!customAudioElement) {
    customAudioElement = new Audio();
    customAudioElement.crossOrigin = "anonymous";
    customAudioElement.loop = true;
  } else {
    customAudioElement.pause();
  }

  customAudioElement.src = url;

  const audioGain = audioCtx.createGain();
  // Keep it soft and comfortable relative to the user volume setting
  audioGain.gain.setValueAtTime(0.35, audioCtx.currentTime);
  audioGain.connect(masterGain);

  if (!customAudioSource) {
    try {
      customAudioSource = audioCtx.createMediaElementSource(customAudioElement);
    } catch (e) {
      console.warn("Failed to create media source node for custom music:", e);
    }
  }

  if (customAudioSource) {
    try {
      customAudioSource.disconnect();
    } catch (e) {}
    customAudioSource.connect(audioGain);
  }

  customAudioElement.play().catch(err => {
    console.warn("Failed to play custom audio URL:", err);
  });

  const stopFunc = () => {
    if (customAudioElement) {
      customAudioElement.pause();
    }
  };

  // Track in activeNodes for clean fades/cleanup
  activeNodes.push({
    stop: stopFunc,
    gainNode: audioGain
  });
}

// 6. Custom Theme: Beautiful, Toned-Down Ambient AI Synthesizer
function playCustomTheme() {
  const customVars = getCustomTheme();
  
  // Play custom high-fidelity audio generated by Lyria if present
  const customAudioData = customVars?.id 
    ? (localStorage.getItem(`tridorian_custom_theme_audio_${customVars.id}`) || localStorage.getItem('tridorian_custom_theme_audio'))
    : localStorage.getItem('tridorian_custom_theme_audio');
  if (customAudioData) {
    playCustomAudioURL(customAudioData);
    return;
  }

  const now = audioCtx.currentTime;
  
  const bgBase = customVars?.['bg-base'] || '#050805';
  const accentBg = customVars?.['accent-bg'] || '#4ade80';
  
  const colorHash = (hex) => {
    let hash = 0;
    const cleaned = String(hex).replace('#', '');
    for (let i = 0; i < cleaned.length; i++) {
      hash += cleaned.charCodeAt(i);
    }
    return hash;
  };
  
  const bgSeed = colorHash(bgBase);
  const accentSeed = colorHash(accentBg);
  
  // Clean, soft ambient scales map
  const scaleMap = {
    'major pentatonic': [130.81, 146.83, 164.81, 196.00, 220.00], // C3 Pentatonic (Peaceful)
    'minor pentatonic': [110.00, 130.81, 146.83, 164.81, 196.00], // A2 Pentatonic (Mellow)
    'dorian': [110.00, 123.47, 130.81, 146.83, 164.81, 174.61, 196.00], // A2 Dorian (Dreamy)
    'phrygian': [82.41, 87.31, 98.00, 110.00, 123.47, 130.81, 146.83], // E2 Phrygian (Dark Ambient)
    'mixolydian': [98.00, 110.00, 123.47, 130.81, 146.83, 164.81, 174.61] // G2 Mixolydian (Spacey)
  };

  const scales = [
    scaleMap['minor pentatonic'],
    scaleMap['major pentatonic'],
    scaleMap['dorian'],
    scaleMap['phrygian'],
    scaleMap['mixolydian']
  ];
  
  const aiMusic = customVars?.music || {};
  
  let selectedScale = scales[bgSeed % scales.length];
  if (aiMusic.scale && scaleMap[aiMusic.scale.toLowerCase().trim()]) {
    selectedScale = scaleMap[aiMusic.scale.toLowerCase().trim()];
    console.log(`[Theme Audio] Using AI scale: ${aiMusic.scale}`);
  }
  
  // 1. Soft Warm Bass Drone (Low Sine + Detuned Triangles through Lowpass)
  const baseOsc = audioCtx.createOscillator();
  const subOsc = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const droneGain = audioCtx.createGain();
  
  baseOsc.type = 'triangle';
  subOsc.type = 'sine';
  
  const rootFreq = selectedScale[0];
  baseOsc.frequency.setValueAtTime(rootFreq, now);
  subOsc.frequency.setValueAtTime(rootFreq / 2, now); // Sub-bass
  
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(90, now); // Keep it extremely low-passed and non-harsh
  
  // Very slow LFO for filter movement
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.03; // Super slow sweep (33s cycle)
  lfoGain.gain.value = 25;
  
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  
  // Extremely gentle volume for background drone
  droneGain.gain.setValueAtTime(0, now);
  droneGain.gain.linearRampToValueAtTime(0.06, now + 4.0); // Toned down from 0.18
  
  baseOsc.connect(filter);
  subOsc.connect(filter);
  filter.connect(droneGain);
  droneGain.connect(masterGain);
  
  baseOsc.start(now);
  subOsc.start(now);
  lfo.start(now);
  
  baseOsc.gainNode = droneGain;
  subOsc.gainNode = droneGain;
  activeNodes.push(baseOsc, subOsc, lfo);
  
  // 2. Slow Evolving Ambient Chord Chords (Triangle/Sine pads)
  let chordIdx = 0;
  let activePadOscs = [];
  const padGain = audioCtx.createGain();
  padGain.gain.setValueAtTime(0, now);
  padGain.gain.linearRampToValueAtTime(0.03, now + 4); // Toned down from 0.08
  padGain.connect(masterGain);
  
  const chordProgression = [
    [selectedScale[0] * 2, selectedScale[2] * 2, selectedScale[4] * 2], // Root chord
    [selectedScale[1] * 2, selectedScale[3] * 2, selectedScale[0] * 4], // Suspended/Subdominant chord
    [selectedScale[2] * 2, selectedScale[4] * 2, selectedScale[1] * 4]  // Dominant chord
  ];
  
  const startChord = (chordFreqs, time) => {
    const oldOscs = activePadOscs;
    activePadOscs = [];
    oldOscs.forEach(o => {
      try {
        o.gainNode.gain.setValueAtTime(o.gainNode.gain.value, time);
        o.gainNode.gain.linearRampToValueAtTime(0, time + 4.0); // Slow fade out
        setTimeout(() => { try { o.stop(); } catch (err) {} }, 4500);
      } catch (err) {}
    });
    
    chordFreqs.forEach(f => {
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      
      osc.type = 'sine'; // Sine is softer and cleaner than triangle
      osc.frequency.setValueAtTime(f, time);
      
      oscGain.gain.setValueAtTime(0, time);
      oscGain.gain.linearRampToValueAtTime(0.015, time + 3.5); // Very soft entry
      
      osc.connect(oscGain);
      oscGain.connect(padGain);
      osc.start(time);
      osc.gainNode = oscGain;
      activePadOscs.push(osc);
    });
  };
  
  startChord(chordProgression[chordIdx], now);
  
  evolveTimer = setInterval(() => {
    if (audioCtx.state === 'suspended') return;
    const schedNow = audioCtx.currentTime;
    chordIdx = (chordIdx + 1) % chordProgression.length;
    startChord(chordProgression[chordIdx], schedNow);
  }, 9000); // Evolve every 9 seconds for slow, relaxing changes
  
  // 3. Sparse Ethereal Chimes (Pluck / Bell)
  const pattern = aiMusic.pattern || [0, 2, 4, 7, 9, 7];
  const steps = pattern.length;
  let step = 0;
  
  // Slow down the tempo and lower the density to make it very relaxing
  const tempo = Math.max(800, aiMusic.tempo || (800 + (bgSeed % 5) * 200)); // 800ms - 1800ms tempo
  const instrument = aiMusic.instrument || (accentSeed % 2 === 0 ? 'bell' : 'synth');
  const density = 0.25; // Sparse density (25% chance per step)
  
  schedulerTimer = setInterval(() => {
    if (audioCtx.state === 'suspended') return;
    const schedNow = audioCtx.currentTime;
    
    // Play notes very sparsely
    if (Math.random() < density) {
      const degree = pattern[step % pattern.length];
      const scaleFreq = selectedScale[degree % selectedScale.length];
      const noteFreq = scaleFreq * 2; // Mid-high octave (toned down from *4 which was too high and piercing)
      
      if (instrument === 'bell') {
        // Softer FM bell with long release
        playFMBell(noteFreq, 4.0, 0.6, 2.0, 0.012, schedNow); // Lower gain, lower modulation index
      } else {
        // Softer sine/triangle plucks with delay
        const pluck = audioCtx.createOscillator();
        const pluckGain = audioCtx.createGain();
        const delayObj = createDelayNode(0.4, 0.6); // Soft feedback, longer delay
        
        pluck.type = 'sine'; // Softest waveform
        pluck.frequency.setValueAtTime(noteFreq, schedNow);
        
        pluckGain.gain.setValueAtTime(0, schedNow);
        pluckGain.gain.linearRampToValueAtTime(0.018, schedNow + 0.05); // Gentler attack, no clicks
        pluckGain.gain.exponentialRampToValueAtTime(0.0001, schedNow + 2.0); // Longer fadeout
        
        pluck.connect(pluckGain);
        pluckGain.connect(masterGain);
        pluckGain.connect(delayObj.delay);
        delayObj.delay.connect(masterGain);
        
        pluck.start(schedNow);
        pluck.stop(schedNow + 2.5);
      }
    }
    
    step = (step + 1) % steps;
  }, tempo);
}

// Jungle Safari: Organic nature drone, rustling leaves noise, and sparse forest flutes
function playJungleSafari() {
  const now = audioCtx.currentTime;

  // 1. Organic deep drone (low triangle chords)
  const freqs = [82.41, 123.47, 164.81, 196.00]; // E minor
  const padGain = audioCtx.createGain();
  padGain.gain.setValueAtTime(0, now);
  padGain.gain.linearRampToValueAtTime(0.08, now + 3);
  padGain.connect(masterGain);

  freqs.forEach(f => {
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.value = f;

    filter.type = 'lowpass';
    filter.frequency.value = 350;

    osc.connect(filter);
    filter.connect(padGain);
    osc.start(now);
    osc.gainNode = padGain;
    activeNodes.push(osc);
  });

  // 2. Rustling forest leaves wind (White Noise)
  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  const noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = noiseBuffer;
  noiseNode.loop = true;

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(1200, now);
  noiseFilter.Q.setValueAtTime(1.5, now);

  const noiseLfo = audioCtx.createOscillator();
  const noiseLfoGain = audioCtx.createGain();
  noiseLfo.frequency.value = 0.04; // Very slow leaf rustling wave
  noiseLfoGain.gain.value = 500;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0, now);
  noiseGain.gain.linearRampToValueAtTime(0.012, now + 5);

  noiseLfo.connect(noiseLfoGain);
  noiseLfoGain.connect(noiseFilter.frequency);
  noiseNode.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);

  noiseNode.start(now);
  noiseLfo.start(now);
  noiseNode.gainNode = noiseGain;
  activeNodes.push(noiseNode, noiseLfo);

  // 3. Ambient Forest Flute (E minor pentatonic)
  const fluteNotes = [329.63, 392.00, 440.00, 493.88, 587.33, 659.25];
  schedulerTimer = setInterval(() => {
    if (audioCtx.state === 'suspended') return;
    const schedNow = audioCtx.currentTime;

    if (Math.random() > 0.6) {
      const noteFreq = fluteNotes[Math.floor(Math.random() * fluteNotes.length)];
      
      const fluteOsc = audioCtx.createOscillator();
      const fluteGain = audioCtx.createGain();
      const vibrato = audioCtx.createOscillator();
      const vibratoGain = audioCtx.createGain();
      const delayObj = createDelayNode(0.45, 0.5);

      fluteOsc.type = 'sine';
      fluteOsc.frequency.setValueAtTime(noteFreq, schedNow);

      // Add gentle vibrato for organic flute feel
      vibrato.frequency.value = 5.5; // 5.5Hz vibrato
      vibratoGain.gain.value = 4.0; // Vibrato depth (frequency offset)

      vibrato.connect(vibratoGain);
      vibratoGain.connect(fluteOsc.frequency);

      // Flute envelope (slow attack and release)
      fluteGain.gain.setValueAtTime(0, schedNow);
      fluteGain.gain.linearRampToValueAtTime(0.03, schedNow + 0.35); // Slow puff attack
      fluteGain.gain.exponentialRampToValueAtTime(0.0001, schedNow + 2.5); // Long natural decay

      fluteOsc.connect(fluteGain);
      fluteGain.connect(masterGain);
      fluteGain.connect(delayObj.delay);
      delayObj.delay.connect(masterGain);

      vibrato.start(schedNow);
      fluteOsc.start(schedNow);
      fluteOsc.stop(schedNow + 3.0);
      vibrato.stop(schedNow + 3.0);
    }
  }, 1800);
}

// EVA-01: Deep industrial cyberpunk drone and mecha glitch arpeggios
function playNeonGenesis() {
  const now = audioCtx.currentTime;

  // 1. Deep industrial drone (saw + detuned square)
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const droneGain = audioCtx.createGain();

  osc1.type = 'sawtooth';
  osc1.frequency.value = 51.91; // G#1
  
  osc2.type = 'square';
  osc2.frequency.value = 52.2; // Detuned

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(140, now);
  filter.Q.setValueAtTime(7, now);

  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.06; // Slow modulation of filter cutoff
  lfoGain.gain.value = 60;

  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  droneGain.gain.setValueAtTime(0, now);
  droneGain.gain.linearRampToValueAtTime(0.28, now + 3);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(droneGain);
  droneGain.connect(masterGain);

  osc1.start(now);
  osc2.start(now);
  lfo.start(now);

  osc1.gainNode = droneGain;
  osc2.gainNode = droneGain;
  lfo.gainNode = droneGain;
  activeNodes.push(osc1, osc2, lfo);

  // 2. High glitch telemetry arpeggiator (G# minor pentatonic)
  const arpNotes = [103.83, 123.47, 138.59, 155.56, 185.00, 207.65];
  let step = 0;

  schedulerTimer = setInterval(() => {
    if (audioCtx.state === 'suspended') return;
    const schedNow = audioCtx.currentTime;

    // Glitchy syncopation
    if (step % 8 !== 2 && step % 8 !== 6) {
      const baseFreq = arpNotes[step % arpNotes.length];
      const noteFreq = baseFreq * (Math.random() > 0.88 ? 4 : 2); // Double octave glitch spikes

      const pluckOsc = audioCtx.createOscillator();
      const pluckGain = audioCtx.createGain();
      const pluckFilter = audioCtx.createBiquadFilter();
      const delayObj = createDelayNode(0.42, 0.28); // Glitchy quick delay

      pluckOsc.type = 'triangle';
      pluckOsc.frequency.setValueAtTime(noteFreq, schedNow);

      pluckFilter.type = 'bandpass';
      pluckFilter.frequency.setValueAtTime(noteFreq * 2.5, schedNow);
      pluckFilter.Q.setValueAtTime(2.0, schedNow);

      pluckGain.gain.setValueAtTime(0, schedNow);
      pluckGain.gain.linearRampToValueAtTime(0.09, schedNow + 0.005);
      pluckGain.gain.exponentialRampToValueAtTime(0.0001, schedNow + 0.18);

      pluckOsc.connect(pluckFilter);
      pluckFilter.connect(pluckGain);
      pluckGain.connect(masterGain);
      pluckGain.connect(delayObj.delay);
      delayObj.delay.connect(masterGain);

      pluckOsc.start(schedNow);
      pluckOsc.stop(schedNow + 0.25);
    }
    step = (step + 1) % 16;
  }, 140); // Fast, cyber arpeggio
}

function playLoopOrProcedural(themeId, filePath, proceduralPlayFunc) {
  if (typeof fetch !== 'function') {
    proceduralPlayFunc();
    return;
  }

  fetch(filePath, { method: 'HEAD' })
    .then(response => {
      // Only proceed if the user hasn't switched to a different theme in the meantime
      if (currentLoopId !== themeId) return;

      if (response.ok) {
        console.log(`[Theme Audio] Playing generated Lyria loop for ${themeId}: ${filePath}`);
        playCustomAudioURL(filePath);
      } else {
        console.warn(`[Theme Audio] Generated loop not found at ${filePath}. Falling back to procedural synthesizer.`);
        proceduralPlayFunc();
      }
    })
    .catch(err => {
      if (currentLoopId !== themeId) return;
      console.warn(`[Theme Audio] Failed to check loop file at ${filePath}. Falling back to procedural synthesizer:`, err);
      proceduralPlayFunc();
    });
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

    console.log(`[Theme Audio] Loading upgraded music loop: ${themeId}...`);
    if (themeId === 'dark') {
      playLoopOrProcedural('dark', '/audio/tridorian_dark_loop.mp3', playTridorianDark);
    } else if (themeId === 'light') {
      playCleanLight();
    } else if (themeId === 'kitten') {
      playRainbowKitten();
    } else if (themeId === 'caribbean') {
      playCaribbeanMood();
    } else if (themeId === 'lunar') {
      playLoopOrProcedural('lunar', '/audio/lunar_vibe_loop.mp3', playLunarVibe);
    } else if (themeId === 'jungle') {
      playJungleSafari();
    } else if (themeId === 'genesis') {
      playLoopOrProcedural('genesis', '/audio/eva01_loop.mp3', playNeonGenesis);
    } else if (themeId === 'custom') {
      playCustomTheme();
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
