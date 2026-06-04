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

export function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    const isQuotaError = e.name === 'QuotaExceededError' || e.code === 22 || e.message?.toLowerCase().includes('quota');
    if (isQuotaError) {
      console.warn(`[Storage] LocalStorage quota exceeded. Evicting oldest custom theme to clear space...`);
      try {
        const rawList = localStorage.getItem('tridorian_custom_themes_list');
        if (rawList) {
          const themes = JSON.parse(rawList);
          if (Array.isArray(themes) && themes.length > 0) {
            // Find active theme ID to protect it
            const activeRaw = localStorage.getItem('tridorian_custom_theme_vars');
            let activeId = '';
            if (activeRaw) {
              try {
                const active = JSON.parse(activeRaw);
                activeId = active?.id || '';
              } catch (err) {}
            }

            // Filter out themes that are active
            let candidates = themes.filter(t => t.id !== activeId);
            
            while (candidates.length > 0) {
              // Sort candidates by generatedAt (oldest first)
              candidates.sort((a, b) => new Date(a.generatedAt || 0) - new Date(b.generatedAt || 0));
              const oldest = candidates[0];
              console.warn(`[Storage] Evicting older custom theme to clear space: ${oldest['theme-name']} (${oldest.id})`);
              
              // Remove this candidate from list
              const newThemes = themes.filter(t => t.id !== oldest.id);
              localStorage.setItem('tridorian_custom_themes_list', JSON.stringify(newThemes));
              localStorage.removeItem(`tridorian_custom_theme_audio_${oldest.id}`);
              
              // Update candidates list
              candidates = candidates.filter(t => t.id !== oldest.id);
              
              // Retry write
              try {
                localStorage.setItem(key, value);
                console.log(`[Storage] Quota recovered! Saved key ${key} successfully after eviction.`);
                return true;
              } catch (writeErr) {
                console.warn(`[Storage] Write still failing after evicting ${oldest.id}. Trying next candidate...`);
              }
            }
            console.warn(`[Storage] No more inactive themes to evict. Quota cleanup finished.`);
          }
        }
      } catch (err) {
        console.error(`[Storage] Eviction failed during quota recovery:`, err);
      }
    }
    console.error(`[Storage] safeLocalStorageSet failed for key ${key}:`, e);
    return false;
  }
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
    let raw = localStorage.getItem(CUSTOM_THEMES_LIST_KEY);
    if (!raw) {
      // Try to load from agy_local_progress if themes list is missing/cleared
      try {
        const localProg = JSON.parse(localStorage.getItem('agy_local_progress') || '{}');
        if (localProg._custom_themes) {
          raw = JSON.stringify(localProg._custom_themes);
          localStorage.setItem(CUSTOM_THEMES_LIST_KEY, raw);
        }
      } catch (err) {
        console.warn("[getCustomThemes] Failed to parse agy_local_progress:", err);
      }
    }
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
        safeLocalStorageSet(CUSTOM_THEMES_LIST_KEY, JSON.stringify(list));
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
export function saveCustomTheme(vars, skipSync = false) {
  try {
    if (!vars) return;
    console.log("[saveCustomTheme] Called with vars:", JSON.stringify(vars), "skipSync:", skipSync);
    
    // Assign ID and timestamp if missing
    if (!vars.id) {
      vars.id = `custom_${Date.now()}`;
      console.log(`[saveCustomTheme] Assigned new ID: ${vars.id}`);
    }
    if (!vars.generatedAt) {
      vars.generatedAt = new Date().toISOString();
    }

    // Extract background image base64 if present in vars
    if (vars['bg-pattern-image-url'] && vars['bg-pattern-image-url'].startsWith('data:image')) {
      const imgData = vars['bg-pattern-image-url'];
      console.log(`[saveCustomTheme] Extracting base64 image (size: ${imgData.length}) to local storage key: tridorian_custom_theme_image_${vars.id}`);
      safeLocalStorageSet(`tridorian_custom_theme_image_${vars.id}`, imgData);
      // Replace with lightweight reference to save storage and prevent QuotaExceededError
      vars['bg-pattern-image-url'] = `local:image_${vars.id}`;
      console.log(`[saveCustomTheme] Set bg-pattern-image-url to: ${vars['bg-pattern-image-url']}`);
    }

    const themes = getCustomThemes();
    const updatedThemes = themes.filter(t => t.id !== vars.id);
    updatedThemes.push(vars);

    // Save themes list
    safeLocalStorageSet(CUSTOM_THEMES_LIST_KEY, JSON.stringify(updatedThemes));
 
    // Save active theme reference (for backwards compatibility/cookie load)
    const activeStr = JSON.stringify(vars);
    setCookie(CUSTOM_THEME_COOKIE, activeStr, 30);
    safeLocalStorageSet(CUSTOM_THEME_COOKIE, activeStr);
 
    injectCustomThemeStyles(vars);
 
    // Sync state to standard progress profile object for Drive sync
    try {
      const LOCAL_PROGRESS_KEY = 'agy_local_progress';
      const localProg = JSON.parse(localStorage.getItem(LOCAL_PROGRESS_KEY) || '{}');
      localProg['_custom_themes'] = updatedThemes;
      localProg['_custom_theme'] = vars;
      safeLocalStorageSet(LOCAL_PROGRESS_KEY, JSON.stringify(localProg));
      if (!skipSync) {
        console.log("[saveCustomTheme] Syncing progress to Drive...");
        syncProgressToDrive();
      } else {
        console.log("[saveCustomTheme] Skipping sync to Drive (intermediate state).");
      }
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
    safeLocalStorageSet(CUSTOM_THEME_COOKIE, activeStr);
 
    injectCustomThemeStyles(vars);
 
    // Sync state to standard progress profile object for Drive sync
    try {
      const LOCAL_PROGRESS_KEY = 'agy_local_progress';
      const localProg = JSON.parse(localStorage.getItem(LOCAL_PROGRESS_KEY) || '{}');
      localProg['_custom_theme'] = vars;
      safeLocalStorageSet(LOCAL_PROGRESS_KEY, JSON.stringify(localProg));
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
    
    // 1. Try reading and parsing cookie
    const cookieRaw = getCookie(CUSTOM_THEME_COOKIE);
    if (cookieRaw) {
      try {
        const parsed = JSON.parse(cookieRaw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (e) {
        console.warn("[getCustomTheme] Failed to parse cookie theme JSON, trying fallback...", e);
      }
    }

    // 2. Try reading and parsing localStorage
    const localRaw = localStorage.getItem(CUSTOM_THEME_COOKIE);
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      } catch (e) {
        console.warn("[getCustomTheme] Failed to parse localStorage theme JSON, trying fallback...", e);
      }
    }

    // 3. Try reading from agy_local_progress
    try {
      const localProg = JSON.parse(localStorage.getItem('agy_local_progress') || '{}');
      if (localProg._custom_theme) {
        return localProg._custom_theme;
      }
    } catch (e) {
      console.warn("[getCustomTheme] Failed to parse agy_local_progress...", e);
    }

    // 4. Fallback to the last custom theme in the list
    if (themes.length > 0) {
      return themes[themes.length - 1];
    }

    return null;
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

    // Cleanup audio and image cache
    localStorage.removeItem(`tridorian_custom_theme_audio_${id}`);
    localStorage.removeItem(`tridorian_custom_theme_image_${id}`);

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
      safeLocalStorageSet(LOCAL_PROGRESS_KEY, JSON.stringify(localProg));
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

// Helper to parse hex to RGB
export function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return null;
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    return {
      r: parseInt(cleanHex[0] + cleanHex[0], 16),
      g: parseInt(cleanHex[1] + cleanHex[1], 16),
      b: parseInt(cleanHex[2] + cleanHex[2], 16)
    };
  }
  if (cleanHex.length === 6) {
    return {
      r: parseInt(cleanHex.substring(0, 2), 16),
      g: parseInt(cleanHex.substring(2, 4), 16),
      b: parseInt(cleanHex.substring(4, 6), 16)
    };
  }
  return null;
}

// Helper to convert RGB to Hex
export function rgbToHex(r, g, b) {
  const clamp = (val) => Math.max(0, Math.min(255, Math.round(val)));
  return '#' + ((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1);
}

// Relative luminance formula (WCAG 2.0)
export function getLuminance(r, g, b) {
  const a = [r, g, b].map(function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Get contrast ratio
export function getContrastRatio(rgb1, rgb2) {
  if (!rgb1 || !rgb2) return 1;
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// Adjust text color to ensure minimum contrast against background
export function enforceContrast(textHex, bgHex, minContrast = 4.5) {
  const textRgb = hexToRgb(textHex);
  const bgRgb = hexToRgb(bgHex);
  if (!textRgb || !bgRgb) return textHex;

  let ratio = getContrastRatio(textRgb, bgRgb);
  if (ratio >= minContrast) return textHex;

  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const makeLighter = bgLuminance < 0.5;

  let currentRgb = { ...textRgb };
  for (let step = 1; step <= 20; step++) {
    const factor = step / 20;
    if (makeLighter) {
      currentRgb.r = Math.round(textRgb.r + (255 - textRgb.r) * factor);
      currentRgb.g = Math.round(textRgb.g + (255 - textRgb.g) * factor);
      currentRgb.b = Math.round(textRgb.b + (255 - textRgb.b) * factor);
    } else {
      currentRgb.r = Math.round(textRgb.r * (1 - factor));
      currentRgb.g = Math.round(textRgb.g * (1 - factor));
      currentRgb.b = Math.round(textRgb.b * (1 - factor));
    }
    
    ratio = getContrastRatio(currentRgb, bgRgb);
    if (ratio >= minContrast) {
      return rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);
    }
  }

  return makeLighter ? '#ffffff' : '#000000';
}

function getBase64Svg(xml) {
  const base64 = typeof btoa !== 'undefined' ? btoa(xml) : Buffer.from(xml).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

export function getPatternSvg(patternType, accentColor, borderColor) {
  const accent = accentColor || '#22c55e';
  const border = borderColor || 'rgba(34, 197, 94, 0.2)';
  
  let svgXml = '';
  switch (patternType) {
    case 'grid':
      svgXml = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="${border}" stroke-width="1"/></svg>`;
      break;
    case 'dots':
      svgXml = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5" fill="${border}"/></svg>`;
      break;
    case 'stripes':
      svgXml = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="M0,40 L40,0 M-10,10 L10,-10 M30,50 L50,30" fill="none" stroke="${border}" stroke-width="1.5"/></svg>`;
      break;
    case 'waves':
      svgXml = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="30" viewBox="0 0 60 30"><path d="M 0 15 Q 15 0, 30 15 T 60 15" fill="none" stroke="${border}" stroke-width="1.5"/></svg>`;
      break;
    case 'circuit':
      svgXml = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><path d="M0,20 L40,20 L50,30 L80,30 M30,0 L30,40 L40,50 L40,80 M60,80 L60,60 L70,50" fill="none" stroke="${border}" stroke-width="1"/><circle cx="50" cy="30" r="3" fill="${accent}"/><circle cx="40" cy="50" r="3" fill="${accent}"/></svg>`;
      break;
    default:
      return '';
  }
  
  return getBase64Svg(svgXml);
}

function getMatchingBgImage(themeName = '', prompt = '', isLight = false) {
  const combined = ((themeName || '') + ' ' + (prompt || '')).toLowerCase();
  
  if (combined.includes('jeep') || combined.includes('jungle') || combined.includes('safari') || combined.includes('forest') || combined.includes('jurassic') || combined.includes('dino') || combined.includes('dinosaur')) {
    return '/jurassic_jeep_bg.png';
  }
  if (combined.includes('eva') || combined.includes('genesis') || combined.includes('mecha') || combined.includes('cyber') || combined.includes('neon') || combined.includes('purple')) {
    return '/neon_genesis_bg.png';
  }
  if (combined.includes('lunar') || combined.includes('moon') || combined.includes('space') || combined.includes('night') || combined.includes('black') || combined.includes('monochrome') || combined.includes('darkness')) {
    return '/lunar_vibe_bg.png';
  }
  if (combined.includes('caribbean') || combined.includes('sea') || combined.includes('beach') || combined.includes('ocean') || combined.includes('island') || combined.includes('water') || combined.includes('teal')) {
    return '/caribbean_mood_bg.png';
  }
  if (combined.includes('kitten') || combined.includes('cat') || combined.includes('rainbow') || combined.includes('pink') || combined.includes('playful') || combined.includes('cute')) {
    return '/rainbow_kitten_bg.png';
  }

  return isLight ? '/clean_light_bg.png' : '/tridorian_dark_bg.png';
}

export function injectCustomThemeStyles(vars) {
  if (!vars) return;
  console.log("[injectCustomThemeStyles] Called with vars:", JSON.stringify(vars));
  let styleTag = document.getElementById('tridorian-custom-theme');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'tridorian-custom-theme';
    document.head.appendChild(styleTag);
  }

  const bgPanel = vars['bg-panel'] || '#0d180f';
  const bgBase = vars['bg-base'] || '#080c08';
  const accentBg = vars['accent-bg'] || '#22c55e';

  // Enforce WCAG AAA 7.0:1 contrast ratio programmatically for readability
  const textMain = enforceContrast(vars['text-main'] || '#f0fdf4', bgPanel, 7.0);
  const textMuted = enforceContrast(vars['text-muted'] || '#86efac', bgPanel, 7.0);
  const accentText = enforceContrast(vars['accent-text'] || '#4ade80', bgPanel, 7.0);
  const accentFg = enforceContrast(vars['accent-fg'] || '#ffffff', accentBg, 5.0);

  const isLight = textMain ? isDarkColor(textMain) : false;

  const quizCorrectBg = isLight ? 'rgba(25, 135, 84, 0.08)' : 'rgba(16, 185, 129, 0.15)';
  const quizCorrectText = isLight ? '#0f5132' : '#34d399';
  const quizCorrectBorder = isLight ? 'rgba(25, 135, 84, 0.25)' : 'rgba(16, 185, 129, 0.4)';
  const quizIncorrectBg = isLight ? 'rgba(220, 53, 69, 0.08)' : 'rgba(244, 63, 94, 0.15)';
  const quizIncorrectText = isLight ? '#842029' : '#fda4af';
  const quizIncorrectBorder = isLight ? 'rgba(220, 53, 69, 0.25)' : 'rgba(244, 63, 94, 0.4)';

  const patternType = vars['bg-pattern'] || 'grid';
  const patternSvg = getPatternSvg(patternType, accentBg, vars['border-main'] || vars['accent-border']);

  let bgImageRule = '';
  let bgSizeRule = '';
  let opacityRule = '';
  let repeatRule = '';

  let bgImageUrl = vars['bg-pattern-image-url'] || '';
  if (bgImageUrl && bgImageUrl.startsWith('local:image_')) {
    try {
      const stored = localStorage.getItem(`tridorian_custom_theme_image_${vars.id}`);
      console.log(`[injectCustomThemeStyles] Looking up tridorian_custom_theme_image_${vars.id}, found length: ${stored ? stored.length : 'null'}`);
      bgImageUrl = stored || '';
    } catch (e) {
      console.warn(`[injectCustomThemeStyles] Failed to load local image for ${vars.id}:`, e);
      bgImageUrl = '';
    }
  }

  console.log(`[injectCustomThemeStyles] Resolved background image URL size/type: ${bgImageUrl ? (bgImageUrl.startsWith('data:') ? 'base64 data URL length ' + bgImageUrl.length : bgImageUrl) : 'none'}`);

  if (bgImageUrl) {
    // We have a custom generated background image from Imagen!
    // Display ONLY this custom image, with no patterns layered on top of it.
    bgImageRule = `background-image: url("${bgImageUrl}");`;
    bgSizeRule = `background-size: cover;`;
    opacityRule = `opacity: 0.25;`;
    repeatRule = `background-repeat: no-repeat; background-position: center; background-attachment: fixed;`;
  } else if (patternSvg) {
    // If no custom image is ready/provided, render only the custom-colored SVG pattern lines/dots
    bgImageRule = `background-image: url("${patternSvg}");`;
    bgSizeRule = `background-size: ${patternType === 'circuit' ? '80px 80px' : patternType === 'waves' ? '60px 30px' : '40px 40px'};`;
    opacityRule = `opacity: ${patternType === 'none' ? '0.15' : '0.45'};`;
    repeatRule = `background-repeat: repeat;`;
  } else {
    // No pattern, no image
    bgImageRule = `background-image: none;`;
    bgSizeRule = `background-size: auto;`;
    opacityRule = `opacity: 0;`;
    repeatRule = `background-repeat: no-repeat;`;
  }

  const accentColor = accentBg;
  // Futuristic AI/tech crosshair reticle cursor
  const cursorSvgXml = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="${accentColor}" stroke-width="1.5" opacity="0.8"/><circle cx="12" cy="12" r="2" fill="${accentColor}"/><line x1="12" y1="2" x2="12" y2="5" stroke="${accentColor}" stroke-width="1.2" opacity="0.6"/><line x1="12" y1="19" x2="12" y2="22" stroke="${accentColor}" stroke-width="1.2" opacity="0.6"/><line x1="2" y1="12" x2="5" y2="12" stroke="${accentColor}" stroke-width="1.2" opacity="0.6"/><line x1="19" y1="12" x2="22" y2="12" stroke="${accentColor}" stroke-width="1.2" opacity="0.6"/></svg>`;
  // Click/Pointer state: dash-array circle with pointer element
  const pointerSvgXml = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="${accentColor}" stroke-width="2" stroke-dasharray="3 2"/><circle cx="12" cy="12" r="3" fill="${accentColor}"/><path d="M12,4 L15,8 L9,8 Z" fill="${accentColor}" opacity="0.95"/></svg>`;

  const cursorSvg = getBase64Svg(cursorSvgXml);
  const pointerSvg = getBase64Svg(pointerSvgXml);

  styleTag.textContent = `
    .theme-custom {
      color-scheme: ${isLight ? 'light' : 'dark'};
      --bg-base: ${bgBase};
      --bg-gradient: ${vars['bg-gradient'] || 'none'};
      --bg-panel: ${bgPanel};
      --bg-muted: ${vars['bg-muted'] || '#122517'};
      --bg-elevated: ${vars['bg-elevated'] || '#1a3321'};
      --text-main: ${textMain};
      --text-muted: ${textMuted};
      --border-main: ${vars['border-main'] || '#1f3d25'};
      --border-subtle: ${vars['border-subtle'] || '#132817'};
      --accent-bg: ${accentBg};
      --accent-fg: ${accentFg};
      --accent-text: ${accentText};
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
      ${bgImageRule}
      ${bgSizeRule}
      ${opacityRule}
      ${repeatRule}
    }
    .theme-custom ::-webkit-scrollbar-thumb {
      background: var(--accent-bg);
      border: 2px solid var(--bg-panel);
      border-radius: 6px;
    }
    .theme-custom ::-webkit-scrollbar-track {
      background: var(--bg-muted);
    }
    body.theme-custom button:not(:disabled):not(.rounded-xl):not(.rounded-2xl):hover,
    body.theme-custom a:not(.rounded-xl):not(.rounded-2xl):hover,
    body.theme-custom nav div.group:hover,
    body.theme-custom .rounded-xl:hover,
    body.theme-custom .rounded-2xl:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-accent);
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    body.theme-custom .progress-bar-fill {
      background: linear-gradient(90deg, var(--bg-muted) 0%, var(--accent-bg) 100%);
    }
    body.theme-custom {
      cursor: url("${cursorSvg}") 12 12, auto;
    }
    body.theme-custom a,
    body.theme-custom button,
    body.theme-custom [role="button"] {
      cursor: url("${pointerSvg}") 12 12, pointer;
    }
  `;
}
