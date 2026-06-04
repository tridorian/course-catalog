// src/services/themeAudio.js
// Simplified Native Audio Player for tridorian Course Catalog
// Plays high-fidelity ambient music loops using standard HTMLAudioElement.
import { getCustomTheme } from './customTheme';

let currentLoopId = null;
let isUnlocked = false;
let audioElement = null;
let hasAudioSource = false;

// Persistent preference keys
const VOL_KEY = 'tridorian_audio_volume';
const MUTE_KEY = 'tridorian_audio_muted';

const state = {
  volume: parseFloat(localStorage.getItem(VOL_KEY) || '0.3'),
  isMuted: localStorage.getItem(MUTE_KEY) === 'true'
};

function initAudio() {
  if (audioElement) return;
  audioElement = new Audio();
  audioElement.loop = true;
  audioElement.crossOrigin = "anonymous";
  
  // Set initial volume & mute
  audioElement.volume = state.volume;
  audioElement.muted = state.isMuted;
}

export function playThemeMusic(themeId) {
  try {
    initAudio();
    isUnlocked = true;

    if (currentLoopId === themeId) {
      if (audioElement && audioElement.paused && hasAudioSource) {
        const playPromise = audioElement.play();
        if (playPromise !== undefined && typeof playPromise.catch === 'function') {
          playPromise.catch(err => {
            console.warn("[Theme Audio] Auto-play prevented:", err);
          });
        }
      }
      return;
    }

    currentLoopId = themeId;
    audioElement.pause();

    let src = '';
    if (themeId === 'dark') {
      src = '/audio/tridorian_dark_loop.mp3';
    } else if (themeId === 'light') {
      src = '/audio/clean_light_loop.mp3';
    } else if (themeId === 'kitten') {
      src = '/audio/rainbow_kitten_loop.mp3';
    } else if (themeId === 'caribbean') {
      src = '/audio/caribbean_mood_loop.mp3';
    } else if (themeId === 'lunar') {
      src = '/audio/lunar_vibe_loop.mp3';
    } else if (themeId === 'jungle') {
      src = '/audio/jungle_safari_loop.mp3';
    } else if (themeId === 'genesis') {
      src = '/audio/eva01_loop.mp3';
    } else if (themeId === 'custom') {
      const customVars = getCustomTheme();
      src = customVars?.id 
        ? (localStorage.getItem(`tridorian_custom_theme_audio_${customVars.id}`) || localStorage.getItem('tridorian_custom_theme_audio'))
        : localStorage.getItem('tridorian_custom_theme_audio');
    }

    if (src) {
      console.log(`[Theme Audio] Loading high-fidelity music loop for ${themeId}: ${src.slice(0, 100)}`);
      audioElement.src = src;
      hasAudioSource = true;
      const playPromise = audioElement.play();
      if (playPromise !== undefined && typeof playPromise.catch === 'function') {
        playPromise.catch(err => {
          console.warn("[Theme Audio] Playback prevented by browser autoplay policy:", err);
        });
      }
    } else {
      console.log(`[Theme Audio] No loop file found for theme: ${themeId}. Playback stopped.`);
      audioElement.src = '';
      hasAudioSource = false;
    }
  } catch (e) {
    console.warn("[Theme Audio] Audio play failed:", e);
  }
}

export function stopThemeMusic() {
  currentLoopId = null;
  hasAudioSource = false;
  if (audioElement) {
    audioElement.pause();
    audioElement.src = '';
  }
}

export function setVolume(vol) {
  state.volume = Math.max(0, Math.min(1, vol));
  try {
    localStorage.setItem(VOL_KEY, state.volume.toString());
    if (audioElement) {
      audioElement.volume = state.volume;
    }
  } catch (e) {}
}

export function toggleMute() {
  state.isMuted = !state.isMuted;
  try {
    localStorage.setItem(MUTE_KEY, state.isMuted.toString());
    if (audioElement) {
      audioElement.muted = state.isMuted;
    }
  } catch (e) {}
  return state.isMuted;
}

export function getAudioState() {
  return { ...state, currentLoopId };
}

export function isAudioUnlocked() {
  return isUnlocked;
}
