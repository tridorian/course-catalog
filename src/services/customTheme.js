// src/services/customTheme.js
// Stores, manages, and injects dynamic custom themes in browser cookies/localStorage.
import { syncProgressToDrive } from './googleDrive';

const CUSTOM_THEME_COOKIE = 'tridorian_custom_theme_vars';
const CUSTOM_THEMES_LIST_KEY = 'tridorian_custom_themes_list';

export function setCookie(name, value, days = 30) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "; expires=" + date.toUTCString();
  document.cookie = name + "=" + (encodeURIComponent(value) || "") + expires + "; path=/; SameSite=Lax";
}

export function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
}

// Get the array of all custom themes
export function getCustomThemes() {
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_LIST_KEY);
    if (!raw) {
      // Migrate legacy single theme if present
      const legacy = getCookie(CUSTOM_THEME_COOKIE) || localStorage.getItem(CUSTOM_THEME_COOKIE);
      if (legacy) {
        const theme = JSON.parse(legacy);
        if (theme && !theme.id) {
          theme.id = 'custom_legacy';
          theme['theme-name'] = theme['theme-name'] || 'Legacy Custom Theme';
        }
        const list = [theme];
        localStorage.setItem(CUSTOM_THEMES_LIST_KEY, JSON.stringify(list));
        return list;
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// Save a theme into the themes list and set it as active
export function saveCustomTheme(vars) {
  try {
    if (!vars) return;
    
    // Assign ID and timestamp if missing
    if (!vars.id) {
      vars.id = `custom_${Date.now()}`;
    }
    if (!vars.generatedAt) {
      vars.generatedAt = new Date().toISOString();
    }

    const themes = getCustomThemes();
    const updatedThemes = themes.filter(t => t.id !== vars.id);
    updatedThemes.push(vars);

    // Save themes list
    localStorage.setItem(CUSTOM_THEMES_LIST_KEY, JSON.stringify(updatedThemes));

    // Save active theme reference (for backwards compatibility/cookie load)
    const activeStr = JSON.stringify(vars);
    setCookie(CUSTOM_THEME_COOKIE, activeStr, 30);
    localStorage.setItem(CUSTOM_THEME_COOKIE, activeStr);

    injectCustomThemeStyles(vars);

    // Sync state to standard progress profile object for Drive sync
    try {
      const LOCAL_PROGRESS_KEY = 'agy_local_progress';
      const localProg = JSON.parse(localStorage.getItem(LOCAL_PROGRESS_KEY) || '{}');
      localProg['_custom_themes'] = updatedThemes;
      localProg['_custom_theme'] = vars;
      localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(localProg));
      syncProgressToDrive();
    } catch (err) {
      console.warn("Failed to store custom themes in user progress profile:", err);
    }
  } catch (e) {
    console.error("Failed to save custom theme:", e);
  }
}

// Set an existing custom theme as active
export function setActiveCustomTheme(vars) {
  try {
    if (!vars) return;
    const activeStr = JSON.stringify(vars);
    setCookie(CUSTOM_THEME_COOKIE, activeStr, 30);
    localStorage.setItem(CUSTOM_THEME_COOKIE, activeStr);

    injectCustomThemeStyles(vars);

    // Sync state to standard progress profile object for Drive sync
    try {
      const LOCAL_PROGRESS_KEY = 'agy_local_progress';
      const localProg = JSON.parse(localStorage.getItem(LOCAL_PROGRESS_KEY) || '{}');
      localProg['_custom_theme'] = vars;
      localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(localProg));
      syncProgressToDrive();
    } catch (err) {
      console.warn("Failed to store custom theme in user progress profile:", err);
    }
  } catch (e) {
    console.error("Failed to set active custom theme:", e);
  }
}

// Get active custom theme vars or a specific one by ID
export function getCustomTheme(id = '') {
  try {
    const themes = getCustomThemes();
    if (id) {
      return themes.find(t => t.id === id) || null;
    }
    const raw = getCookie(CUSTOM_THEME_COOKIE) || localStorage.getItem(CUSTOM_THEME_COOKIE);
    return raw ? JSON.parse(raw) : (themes.length > 0 ? themes[themes.length - 1] : null);
  } catch (e) {
    return null;
  }
}

// Delete a custom theme by ID
export function deleteCustomTheme(id) {
  try {
    const themes = getCustomThemes();
    const updatedThemes = themes.filter(t => t.id !== id);
    localStorage.setItem(CUSTOM_THEMES_LIST_KEY, JSON.stringify(updatedThemes));

    // Cleanup audio cache
    localStorage.removeItem(`tridorian_custom_theme_audio_${id}`);

    // If active theme was deleted, clear active cookie/localStorage
    const active = getCustomTheme();
    if (active && active.id === id) {
      setCookie(CUSTOM_THEME_COOKIE, '', -1);
      localStorage.removeItem(CUSTOM_THEME_COOKIE);
      // Remove style element
      const styleTag = document.getElementById('tridorian-custom-theme');
      if (styleTag) styleTag.remove();
    }

    // Sync updated list to standard progress profile object
    try {
      const LOCAL_PROGRESS_KEY = 'agy_local_progress';
      const localProg = JSON.parse(localStorage.getItem(LOCAL_PROGRESS_KEY) || '{}');
      localProg['_custom_themes'] = updatedThemes;
      if (active && active.id === id) {
        delete localProg['_custom_theme'];
      }
      localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(localProg));
      syncProgressToDrive();
    } catch (err) {}
  } catch (e) {
    console.error("Failed to delete custom theme:", e);
  }
}

// Inject styling variables for .theme-custom class dynamically
function isDarkColor(hex) {
  if (!hex || typeof hex !== 'string') return true;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  }
  return true;
}

export function getPatternSvg(patternType, accentColor, borderColor) {
  const accent = accentColor || '#22c55e';
  const border = borderColor || 'rgba(34, 197, 94, 0.2)';
  
  switch (patternType) {
    case 'grid':
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="${encodeURIComponent(border)}" stroke-width="1"/></svg>`;
    case 'dots':
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5" fill="${encodeURIComponent(border)}"/></svg>`;
    case 'stripes':
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="M0,40 L40,0 M-10,10 L10,-10 M30,50 L50,30" fill="none" stroke="${encodeURIComponent(border)}" stroke-width="1.5"/></svg>`;
    case 'waves':
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="30" viewBox="0 0 60 30"><path d="M 0 15 Q 15 0, 30 15 T 60 15" fill="none" stroke="${encodeURIComponent(border)}" stroke-width="1.5"/></svg>`;
    case 'circuit':
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><path d="M0,20 L40,20 L50,30 L80,30 M30,0 L30,40 L40,50 L40,80 M60,80 L60,60 L70,50" fill="none" stroke="${encodeURIComponent(border)}" stroke-width="1"/><circle cx="50" cy="30" r="3" fill="${encodeURIComponent(accent)}"/><circle cx="40" cy="50" r="3" fill="${encodeURIComponent(accent)}"/></svg>`;
    default:
      return '';
  }
}

// Inject styling variables for .theme-custom class dynamically
export function injectCustomThemeStyles(vars) {
  if (!vars) return;
  let styleTag = document.getElementById('tridorian-custom-theme');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'tridorian-custom-theme';
    document.head.appendChild(styleTag);
  }

  const isLight = vars['text-main'] ? isDarkColor(vars['text-main']) : false;

  const quizCorrectBg = isLight ? 'rgba(25, 135, 84, 0.08)' : 'rgba(16, 185, 129, 0.15)';
  const quizCorrectText = isLight ? '#0f5132' : '#34d399';
  const quizCorrectBorder = isLight ? 'rgba(25, 135, 84, 0.25)' : 'rgba(16, 185, 129, 0.4)';
  const quizIncorrectBg = isLight ? 'rgba(220, 53, 69, 0.08)' : 'rgba(244, 63, 94, 0.15)';
  const quizIncorrectText = isLight ? '#842029' : '#fda4af';
  const quizIncorrectBorder = isLight ? 'rgba(220, 53, 69, 0.25)' : 'rgba(244, 63, 94, 0.4)';

  const patternType = vars['bg-pattern'] || 'grid';
  const patternSvg = getPatternSvg(patternType, vars['accent-bg'], vars['border-main'] || vars['accent-border']);

  styleTag.textContent = `
    .theme-custom {
      color-scheme: ${isLight ? 'light' : 'dark'};
      --bg-base: ${vars['bg-base'] || '#080c08'};
      --bg-gradient: ${vars['bg-gradient'] || 'none'};
      --bg-panel: ${vars['bg-panel'] || '#0d180f'};
      --bg-muted: ${vars['bg-muted'] || '#122517'};
      --bg-elevated: ${vars['bg-elevated'] || '#1a3321'};
      --text-main: ${vars['text-main'] || '#f0fdf4'};
      --text-muted: ${vars['text-muted'] || '#86efac'};
      --border-main: ${vars['border-main'] || '#1f3d25'};
      --border-subtle: ${vars['border-subtle'] || '#132817'};
      --accent-bg: ${vars['accent-bg'] || '#22c55e'};
      --accent-fg: ${vars['accent-fg'] || '#ffffff'};
      --accent-text: ${vars['accent-text'] || '#4ade80'};
      --accent-muted: ${vars['accent-muted'] || 'rgba(34, 197, 94, 0.08)'};
      --accent-border: ${vars['accent-border'] || 'rgba(34, 197, 94, 0.25)'};
      --shadow-accent: ${vars['shadow-accent'] || '0 0 15px rgba(34, 197, 94, 0.2)'};
      --quiz-correct-bg: ${quizCorrectBg};
      --quiz-correct-text: ${quizCorrectText};
      --quiz-correct-border: ${quizCorrectBorder};
      --quiz-incorrect-bg: ${quizIncorrectBg};
      --quiz-incorrect-text: ${quizIncorrectText};
      --quiz-incorrect-border: ${quizIncorrectBorder};
    }
    .theme-custom .theme-pattern-grid {
      background-image: ${patternSvg ? `url("${patternSvg}")` : 'none'};
      background-size: ${patternType === 'circuit' ? '80px 80px' : patternType === 'waves' ? '60px 30px' : '40px 40px'};
      opacity: ${patternType === 'none' ? '0' : '0.45'};
    }
  `;
}
