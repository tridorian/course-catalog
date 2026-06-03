import { useState, useEffect } from 'react';
import { injectCustomThemeStyles, getCustomTheme } from '../services/customTheme';

const THEME_STORAGE_KEY = 'tridorian_theme';
const VALID_THEMES = ['dark', 'light', 'kitten', 'caribbean', 'lunar', 'custom'];

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      // Warm up custom theme styles on startup
      const customVars = getCustomTheme();
      if (customVars) {
        injectCustomThemeStyles(customVars);
      }

      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return VALID_THEMES.includes(stored) ? stored : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    // Apply theme class to body
    document.body.className = theme === 'dark' ? '' : `theme-${theme}`;
    // Persist to localStorage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    if (VALID_THEMES.includes(newTheme)) {
      setThemeState(newTheme);
    }
  };

  return { theme, setTheme, VALID_THEMES };
}
