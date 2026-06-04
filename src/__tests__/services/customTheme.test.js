import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getCustomThemes, 
  saveCustomTheme, 
  getCustomTheme, 
  deleteCustomTheme, 
  setActiveCustomTheme,
  getPatternSvg,
  injectCustomThemeStyles,
  hexToRgb,
  rgbToHex,
  getLuminance,
  getContrastRatio,
  enforceContrast,
  safeLocalStorageSet
} from '../../services/customTheme';

describe('Custom Theme Service', () => {
  beforeEach(() => {
    localStorage.clear();
    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    // Remove style element if present
    const styleTag = document.getElementById('tridorian-custom-theme');
    if (styleTag) styleTag.remove();
  });

  it('should return empty list initially if no themes exist', () => {
    const list = getCustomThemes();
    expect(list).toEqual([]);
  });

  it('should correctly save and retrieve a custom theme', () => {
    const newTheme = {
      'bg-base': '#112233',
      'accent-bg': '#ff5500',
      'theme-name': 'Orange Fire'
    };

    saveCustomTheme(newTheme);

    const themes = getCustomThemes();
    expect(themes.length).toBe(1);
    expect(themes[0]['theme-name']).toBe('Orange Fire');
    expect(themes[0].id).toBeDefined();
    expect(themes[0].generatedAt).toBeDefined();

    const active = getCustomTheme();
    expect(active.id).toBe(themes[0].id);
    expect(active['theme-name']).toBe('Orange Fire');
  });

  it('should support up to 3 custom themes and update active status correctly', () => {
    const theme1 = { id: 'theme_1', 'theme-name': 'Theme One' };
    const theme2 = { id: 'theme_2', 'theme-name': 'Theme Two' };
    const theme3 = { id: 'theme_3', 'theme-name': 'Theme Three' };

    saveCustomTheme(theme1);
    saveCustomTheme(theme2);
    saveCustomTheme(theme3);

    const themes = getCustomThemes();
    expect(themes.length).toBe(3);
    expect(themes.map(t => t.id)).toContain('theme_1');
    expect(themes.map(t => t.id)).toContain('theme_2');
    expect(themes.map(t => t.id)).toContain('theme_3');

    // setActiveCustomTheme should make theme2 active
    setActiveCustomTheme(theme2);
    const active = getCustomTheme();
    expect(active.id).toBe('theme_2');
  });

  it('should correctly delete a theme and clean up storage/cookie if active theme was deleted', () => {
    const theme1 = { id: 'theme_1', 'theme-name': 'Theme One' };
    const theme2 = { id: 'theme_2', 'theme-name': 'Theme Two' };

    saveCustomTheme(theme1);
    saveCustomTheme(theme2);

    // Make theme2 active
    setActiveCustomTheme(theme2);
    expect(getCustomTheme().id).toBe('theme_2');

    // Save mock audio cache
    localStorage.setItem('tridorian_custom_theme_audio_theme_2', 'data:audio/mpeg;base64,mock');

    // Delete theme2
    deleteCustomTheme('theme_2');

    const themes = getCustomThemes();
    expect(themes.length).toBe(1);
    expect(themes[0].id).toBe('theme_1');

    // Audio cache should be removed
    expect(localStorage.getItem('tridorian_custom_theme_audio_theme_2')).toBeNull();

    // Active theme (theme2) was deleted, so it should fallback to theme1
    expect(getCustomTheme().id).toBe('theme_1');

    // Delete the last remaining theme
    deleteCustomTheme('theme_1');
    expect(getCustomTheme()).toBeNull();
  });

  describe('getPatternSvg', () => {
    it('returns grid SVG data URI', () => {
      const svg = getPatternSvg('grid', '#ff0000', '#00ff00');
      expect(svg).toContain('data:image/svg+xml;base64,');
    });

    it('returns circuit SVG data URI with accent and border colors', () => {
      const svg = getPatternSvg('circuit', '#ff0000', '#00ff00');
      expect(svg).toContain('data:image/svg+xml;base64,');
    });

    it('returns empty string for none pattern', () => {
      const svg = getPatternSvg('none');
      expect(svg).toBe('');
    });
  });

  describe('injectCustomThemeStyles', () => {
    it('creates style tag and sets custom properties with background patterns and gradients', () => {
      const themeVars = {
        'bg-base': '#100a20',
        'bg-gradient': 'linear-gradient(135deg, #100a20 0%, #05030a 100%)',
        'bg-pattern': 'circuit',
        'accent-bg': '#7928ca',
        'border-main': '#444444',
        'text-main': '#ffffff'
      };

      injectCustomThemeStyles(themeVars);

      const styleTag = document.getElementById('tridorian-custom-theme');
      expect(styleTag).not.toBeNull();
      expect(styleTag.textContent).toContain('--bg-base: #100a20');
      expect(styleTag.textContent).toContain('--bg-gradient: linear-gradient(135deg, #100a20 0%, #05030a 100%)');
      expect(styleTag.textContent).toContain('background-image: url("data:image/svg+xml;base64,');
      expect(styleTag.textContent).toContain('background-size: 80px 80px');
    });

    it('uses bg-pattern-image-url if provided', () => {
      const themeVars = {
        'bg-base': '#100a20',
        'accent-bg': '#7928ca',
        'text-main': '#ffffff',
        'bg-pattern-image-url': 'data:image/png;base64,mockImageGeneratedByImagen'
      };

      injectCustomThemeStyles(themeVars);

      const styleTag = document.getElementById('tridorian-custom-theme');
      expect(styleTag).not.toBeNull();
      expect(styleTag.textContent).toContain('url("data:image/png;base64,mockImageGeneratedByImagen")');
    });
  });

  describe('Contrast Enforcement Utilities', () => {
    it('should calculate correct luminance for standard colors', () => {
      expect(getLuminance(255, 255, 255)).toBe(1); // White
      expect(getLuminance(0, 0, 0)).toBe(0); // Black
    });

    it('should calculate correct contrast ratio between white and black', () => {
      const white = { r: 255, g: 255, b: 255 };
      const black = { r: 0, g: 0, b: 0 };
      expect(getContrastRatio(white, black)).toBeCloseTo(21, 1);
    });

    it('should enforce contrast and return the original color if it meets contrast requirements', () => {
      // White text on dark base has high contrast, should remain unchanged
      const text = '#ffffff';
      const bg = '#000000';
      const adjusted = enforceContrast(text, bg, 4.5);
      expect(adjusted.toLowerCase()).toBe('#ffffff');
    });

    it('should adjust text color if it has low contrast against the background', () => {
      // Low contrast: dark gray text (#444444) on dark background (#111111)
      const text = '#444444';
      const bg = '#111111';
      const adjusted = enforceContrast(text, bg, 4.5);
      // Since background is dark, the text should have been lightened
      const adjustedRgb = hexToRgb(adjusted);
      const bgRgb = hexToRgb(bg);
      expect(getContrastRatio(adjustedRgb, bgRgb)).toBeGreaterThanOrEqual(4.5);
    });

    it('should adjust text color to satisfy a high target contrast ratio of 7.0', () => {
      const text = '#888888';
      const bg = '#111111';
      const adjusted = enforceContrast(text, bg, 7.0);
      const adjustedRgb = hexToRgb(adjusted);
      const bgRgb = hexToRgb(bg);
      expect(getContrastRatio(adjustedRgb, bgRgb)).toBeGreaterThanOrEqual(7.0);
    });
  });

  describe('safeLocalStorageSet quota protection', () => {
    it('should evict non-active themes to make space but keep active theme intact', () => {
      const activeTheme = { id: 'theme_active', 'theme-name': 'Active Theme', generatedAt: '2026-06-04T00:00:00Z' };
      const inactiveTheme = { id: 'theme_inactive', 'theme-name': 'Inactive Theme', generatedAt: '2026-06-03T00:00:00Z' };

      // Save themes
      saveCustomTheme(inactiveTheme);
      saveCustomTheme(activeTheme);
      setActiveCustomTheme(activeTheme);

      // Verify they are saved
      expect(getCustomThemes().length).toBe(2);
      expect(getCustomTheme().id).toBe('theme_active');

      // Mock localStorage.setItem to throw QuotaExceededError on the first call,
      // but succeed on subsequent calls (after eviction)
      let callsCount = 0;
      const originalSetItem = localStorage.setItem;
      
      const mockSetItem = vi.fn((key, value) => {
        callsCount++;
        // Throw quota error only for the heavy audio key on the first attempt
        if (key === 'heavy_audio_key' && callsCount === 1) {
          const err = new Error('QuotaExceededError');
          err.name = 'QuotaExceededError';
          throw err;
        }
        return originalSetItem.call(localStorage, key, value);
      });
      localStorage.setItem = mockSetItem;

      // Call safeLocalStorageSet
      const result = safeLocalStorageSet('heavy_audio_key', 'some_large_audio_base64_data');
      
      // Restore original
      localStorage.setItem = originalSetItem;

      expect(result).toBe(true);
      
      // Inactive theme should be evicted
      const themes = getCustomThemes();
      expect(themes.length).toBe(1);
      expect(themes[0].id).toBe('theme_active');
      
      // Active theme should NOT be evicted
      expect(getCustomTheme().id).toBe('theme_active');
    });
  });

  describe('Robust fallback and parsing error handling', () => {
    it('should fall back to localStorage if cookie JSON is truncated/invalid', () => {
      const activeTheme = { id: 'theme_cookie_fallback', 'theme-name': 'Fallback Theme' };
      localStorage.setItem('tridorian_custom_theme_vars', JSON.stringify(activeTheme));
      
      // Set a truncated/broken JSON cookie
      document.cookie = 'tridorian_custom_theme_vars={"id":"theme_cookie_fallback"; path=/; SameSite=Lax';

      const resolved = getCustomTheme();
      expect(resolved).not.toBeNull();
      expect(resolved.id).toBe('theme_cookie_fallback');
    });

    it('should fall back to agy_local_progress._custom_theme if cookie and local vars keys are missing', () => {
      const activeTheme = { id: 'theme_progress_fallback', 'theme-name': 'Progress Theme' };
      const localProgress = {
        _custom_theme: activeTheme,
        _custom_themes: [activeTheme]
      };
      localStorage.setItem('agy_local_progress', JSON.stringify(localProgress));

      const resolved = getCustomTheme();
      expect(resolved).not.toBeNull();
      expect(resolved.id).toBe('theme_progress_fallback');
    });

    it('should fall back to agy_local_progress._custom_themes if themes list key is missing', () => {
      const theme1 = { id: 'theme_1', 'theme-name': 'Theme One' };
      const theme2 = { id: 'theme_2', 'theme-name': 'Theme Two' };
      const localProgress = {
        _custom_themes: [theme1, theme2]
      };
      localStorage.setItem('agy_local_progress', JSON.stringify(localProgress));

      const resolvedThemes = getCustomThemes();
      expect(resolvedThemes.length).toBe(2);
      expect(resolvedThemes.map(t => t.id)).toContain('theme_1');
      expect(resolvedThemes.map(t => t.id)).toContain('theme_2');
    });
  });
});

