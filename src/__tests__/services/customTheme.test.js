import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getCustomThemes, 
  saveCustomTheme, 
  getCustomTheme, 
  deleteCustomTheme, 
  setActiveCustomTheme,
  getPatternSvg,
  injectCustomThemeStyles
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
      expect(svg).toContain('data:image/svg+xml');
      expect(svg).toContain('stroke="%2300ff00"');
    });

    it('returns circuit SVG data URI with accent and border colors', () => {
      const svg = getPatternSvg('circuit', '#ff0000', '#00ff00');
      expect(svg).toContain('fill="%23ff0000"');
      expect(svg).toContain('stroke="%2300ff00"');
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
      expect(styleTag.textContent).toContain('background-image: url("data:image/svg+xml;utf8,');
      expect(styleTag.textContent).toContain('background-size: 80px 80px');
    });
  });
});
