// src/services/customTheme.js
// Stores and injects dynamic custom themes in browser cookies/localStorage.

const CUSTOM_THEME_COOKIE = 'tridorian_custom_theme_vars';

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

export function saveCustomTheme(vars) {
  try {
    const str = JSON.stringify(vars);
    setCookie(CUSTOM_THEME_COOKIE, str, 30);
    localStorage.setItem(CUSTOM_THEME_COOKIE, str); // redundancy
    injectCustomThemeStyles(vars);
  } catch (e) {
    console.error("Failed to save custom theme:", e);
  }
}

export function getCustomTheme() {
  try {
    const raw = getCookie(CUSTOM_THEME_COOKIE) || localStorage.getItem(CUSTOM_THEME_COOKIE);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function injectCustomThemeStyles(vars) {
  if (!vars) return;
  let styleTag = document.getElementById('tridorian-custom-theme');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'tridorian-custom-theme';
    document.head.appendChild(styleTag);
  }

  styleTag.textContent = `
    .theme-custom {
      color-scheme: dark;
      --bg-base: ${vars['bg-base'] || '#080c08'};
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
    }
  `;
}
