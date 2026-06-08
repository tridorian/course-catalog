import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import RouteAnnouncer from './components/RouteAnnouncer';
import LoadingFallback from './components/LoadingFallback';
import { useTheme } from './hooks/useTheme';
import * as themeAudio from './services/themeAudio';

// Lazy-loaded components for all main views
const Dashboard = lazy(() => import('./components/Dashboard'));
const TrackPage = lazy(() => import('./components/TrackPage'));
const AppContent = lazy(() => import('./components/AppContent'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const HelpSection = lazy(() => import('./components/HelpSection'));

export default function App() {
  const { theme, setTheme } = useTheme();

  // Developer utility to clear themes & reset counter via query parameter "?reset_themes=true"
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reset_themes') === 'true') {
        localStorage.removeItem('tridorian_custom_themes_list');
        localStorage.removeItem('tridorian_last_theme_gen_time');
        localStorage.removeItem('tridorian_custom_theme_vars');
        localStorage.removeItem('tridorian_custom_theme_audio');
        
        // Clean up from agy_local_progress
        const localProg = JSON.parse(localStorage.getItem('agy_local_progress') || '{}');
        delete localProg['_custom_themes'];
        delete localProg['_custom_theme'];
        localStorage.setItem('agy_local_progress', JSON.stringify(localProg));

        // Reset cookie active theme references
        document.cookie = 'tridorian_custom_theme_vars=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        // Clear dynamic style tag if present
        const styleTag = document.getElementById('tridorian-custom-theme');
        if (styleTag) styleTag.remove();

        // Reset theme setting state
        setTheme('dark');

        // Clear query param and reload
        const url = new URL(window.location.href);
        url.searchParams.delete('reset_themes');
        window.history.replaceState({}, '', url.pathname + url.search);
        window.location.reload();
      }
    } catch (e) {
      console.warn("Dev Tool reset error:", e);
    }
  }, [setTheme]);

  // Unlock browser audio context on user interaction and start theme music
  useEffect(() => {
    if (themeAudio.isAudioUnlocked()) return;

    const handleInteraction = () => {
      if (themeAudio.isAudioUnlocked()) return;
      themeAudio.playThemeMusic(theme);

      // Clean up event listeners immediately
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [theme]);

  // Transition theme music dynamically when theme state changes (if already initialized/playing)
  useEffect(() => {
    const audioState = themeAudio.getAudioState();
    if (audioState.currentLoopId && audioState.currentLoopId !== theme) {
      themeAudio.playThemeMusic(theme);
    }
  }, [theme]);

  return (
    <>
      <RouteAnnouncer />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Dashboard theme={theme} setTheme={setTheme} />} />
          <Route path="/admin" element={<AdminPanel theme={theme} setTheme={setTheme} />} />
          <Route path="/help" element={<HelpSection theme={theme} setTheme={setTheme} />} />
          <Route path="/:trackId" element={<TrackPage theme={theme} setTheme={setTheme} />} />
          <Route path="/:trackId/:courseId" element={<AppContent theme={theme} setTheme={setTheme} />} />
          <Route path="/:trackId/:courseId/:moduleId" element={<AppContent theme={theme} setTheme={setTheme} />} />
        </Routes>
      </Suspense>
    </>
  );
}
