import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import { useTheme } from './hooks/useTheme';
import * as themeAudio from './services/themeAudio';
import LoadingFallback from './components/LoadingFallback';

// Lazy-loaded components for all main views
const Dashboard = lazy(() => import('./components/Dashboard'));
const TrackPage = lazy(() => import('./components/TrackPage'));
const AppContent = lazy(() => import('./components/AppContent'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const HelpSection = lazy(() => import('./components/HelpSection'));

export default function App() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reset_themes') === 'true') {
        localStorage.removeItem('tridorian_custom_themes_list');
        localStorage.removeItem('tridorian_last_theme_gen_time');
        localStorage.removeItem('tridorian_custom_theme_vars');
        localStorage.removeItem('tridorian_custom_theme_audio');
        const localProg = JSON.parse(localStorage.getItem('agy_local_progress') || '{}');
        delete localProg['_custom_themes'];
        delete localProg['_custom_theme'];
        localStorage.setItem('agy_local_progress', JSON.stringify(localProg));
        document.cookie = 'tridorian_custom_theme_vars=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        const styleTag = document.getElementById('tridorian-custom-theme');
        if (styleTag) styleTag.remove();
        setTheme('dark');
        const url = new URL(window.location.href);
        url.searchParams.delete('reset_themes');
        window.history.replaceState({}, '', url.pathname + url.search);
        window.location.reload();
      }
    } catch (e) {
      console.warn("Dev Tool reset error:", e);
    }
  }, [setTheme]);

  useEffect(() => {
    if (themeAudio.isAudioUnlocked()) return;
    const handleInteraction = () => {
      if (themeAudio.isAudioUnlocked()) return;
      themeAudio.playThemeMusic(theme);
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

  useEffect(() => {
    const audioState = themeAudio.getAudioState();
    if (audioState.currentLoopId && audioState.currentLoopId !== theme) {
      themeAudio.playThemeMusic(theme);
    }
  }, [theme]);

  return (
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
  );
}
