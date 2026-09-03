import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({ asyncUtilTimeout: 5000 });

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

if (typeof global.window !== 'undefined') {
  Object.defineProperty(global.window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });
}

// Lightweight mock for Web Audio API AudioContext & webkitAudioContext
class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.destination = {};
    this.state = 'running';
  }

  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        value: 440,
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        linearRampToValueAtTime: () => {}
      },
      connect: () => {},
      disconnect: () => {},
      start: () => {},
      stop: () => {}
    };
  }

  createGain() {
    return {
      gain: {
        value: 1,
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        linearRampToValueAtTime: () => {}
      },
      connect: () => {},
      disconnect: () => {}
    };
  }

  createBufferSource() {
    return {
      buffer: null,
      connect: () => {},
      start: () => {},
      stop: () => {}
    };
  }

  close() {
    return Promise.resolve();
  }

  resume() {
    return Promise.resolve();
  }

  suspend() {
    return Promise.resolve();
  }
}

if (typeof window !== 'undefined') {
  window.AudioContext = window.AudioContext || MockAudioContext;
  window.webkitAudioContext = window.webkitAudioContext || MockAudioContext;

  if (window.HTMLMediaElement) {
    window.HTMLMediaElement.prototype.play = window.HTMLMediaElement.prototype.play || (() => Promise.resolve());
    window.HTMLMediaElement.prototype.pause = window.HTMLMediaElement.prototype.pause || (() => {});
    window.HTMLMediaElement.prototype.load = window.HTMLMediaElement.prototype.load || (() => {});
  }
}

if (typeof global !== 'undefined') {
  global.AudioContext = global.AudioContext || MockAudioContext;
  global.webkitAudioContext = global.webkitAudioContext || MockAudioContext;
}
