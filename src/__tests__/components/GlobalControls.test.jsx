import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GlobalControls from '../../components/GlobalControls';
import * as themeAudio from '../../services/themeAudio';
import * as themeGenerator from '../../services/themeGenerator';
import { saveCustomTheme, getCustomThemes } from '../../services/customTheme';

// Mock theme audio service to prevent Web Audio API calls
vi.mock('../../services/themeAudio', () => ({
  getAudioState: vi.fn(() => ({ volume: 0.3, isMuted: false })),
  toggleMute: vi.fn(),
  setVolume: vi.fn(),
  playThemeMusic: vi.fn(),
}));

// Mock theme generator service to prevent external Gemini API calls
vi.mock('../../services/themeGenerator', () => ({
  generateThemeWithGemini: vi.fn(),
  generateMusicWithLyria: vi.fn(),
}));

describe('GlobalControls Theme Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Clear JSDOM cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  });

  it('verifies the default themes render in the picker', () => {
    const mockSetTheme = vi.fn();
    render(<GlobalControls theme="dark" setTheme={mockSetTheme} />);

    // Open the dropdown
    const pickerButton = screen.getByTestId('global-theme-picker');
    fireEvent.click(pickerButton);

    // Verify default themes are rendered
    expect(screen.getByText('🌿 tridorian Dark')).toBeInTheDocument();
    expect(screen.getByText('☀️ Clean Light')).toBeInTheDocument();
    expect(screen.getByText('🐱 Rainbow Kitten')).toBeInTheDocument();
    expect(screen.getByText('🏝️ Caribbean Mood')).toBeInTheDocument();
    expect(screen.getByText('🌙 Lunar Vibe')).toBeInTheDocument();
  });

  it('verifies the user can select default themes', () => {
    const mockSetTheme = vi.fn();
    render(<GlobalControls theme="dark" setTheme={mockSetTheme} />);

    // Open the dropdown
    const pickerButton = screen.getByTestId('global-theme-picker');
    fireEvent.click(pickerButton);

    // Select a theme
    const lightThemeOption = screen.getByTestId('theme-option-light');
    fireEvent.click(lightThemeOption);

    expect(mockSetTheme).toHaveBeenCalledWith('light');
    expect(themeAudio.playThemeMusic).toHaveBeenCalledWith('light');
  });

  it('verifies that custom themes are loaded and listed in the dropdown with a delete button', () => {
    const mockSetTheme = vi.fn();

    // Pre-populate a custom theme
    const customTheme = {
      id: 'custom_1',
      'theme-name': 'Forest Mist',
      'bg-base': '#102010',
      'accent-bg': '#00ff00',
      'text-main': '#ffffff',
      swatches: ['#102010', '#00ff00', '#ffffff'],
      generatedAt: new Date().toISOString()
    };
    saveCustomTheme(customTheme);

    render(<GlobalControls theme="dark" setTheme={mockSetTheme} />);

    // Open the dropdown
    const pickerButton = screen.getByTestId('global-theme-picker');
    fireEvent.click(pickerButton);

    // Verify custom theme renders
    expect(screen.getByText('Forest Mist')).toBeInTheDocument();

    // Verify delete button is present
    const deleteButton = screen.getByTestId('delete-theme-custom_1');
    expect(deleteButton).toBeInTheDocument();

    // Click delete button
    fireEvent.click(deleteButton);

    // Verify the custom theme is removed from the dropdown list
    expect(screen.queryByText('Forest Mist')).not.toBeInTheDocument();
    expect(getCustomThemes()).toEqual([]);
  });

  it('verifies that trying to generate a 4th theme displays the "Maximum limit of 3 custom themes reached" error', () => {
    const mockSetTheme = vi.fn();

    // Save 3 custom themes
    saveCustomTheme({ id: 'custom_1', 'theme-name': 'Theme One', generatedAt: new Date().toISOString() });
    saveCustomTheme({ id: 'custom_2', 'theme-name': 'Theme Two', generatedAt: new Date().toISOString() });
    saveCustomTheme({ id: 'custom_3', 'theme-name': 'Theme Three', generatedAt: new Date().toISOString() });

    render(<GlobalControls theme="dark" setTheme={mockSetTheme} />);

    // Open picker dropdown
    fireEvent.click(screen.getByTestId('global-theme-picker'));

    // Trigger the generator modal
    fireEvent.click(screen.getByTestId('ai-theme-gen-trigger'));

    // Type in prompt
    const textarea = screen.getByPlaceholderText(/e.g. Cyberpunk neon orange/i);
    fireEvent.change(textarea, { target: { value: 'Theme Four Prompt' } });

    // Click generate button
    const generateBtn = screen.getByRole('button', { name: /Generate Theme Colors/i });
    fireEvent.click(generateBtn);

    // Assert error message
    expect(screen.getByText(/Maximum limit of 3 custom themes reached/i)).toBeInTheDocument();
  });

  it('verifies that attempting to generate a theme within 1 hour of another custom theme shows the "You can only generate one custom theme per hour" rate limit message', () => {
    const mockSetTheme = vi.fn();
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;

    // Ensure fewer than 3 custom themes exist (e.g. 1 theme) with timestamp 30 mins ago
    const customTheme = {
      id: 'custom_1',
      'theme-name': 'Theme One',
      generatedAt: new Date(thirtyMinutesAgo).toISOString()
    };
    saveCustomTheme(customTheme);

    // Set last gen time in localStorage to 30 minutes ago
    localStorage.setItem('tridorian_last_theme_gen_time', thirtyMinutesAgo.toString());

    render(<GlobalControls theme="dark" setTheme={mockSetTheme} />);

    // Open picker dropdown
    fireEvent.click(screen.getByTestId('global-theme-picker'));

    // Trigger the generator modal
    fireEvent.click(screen.getByTestId('ai-theme-gen-trigger'));

    // Enter prompt
    const textarea = screen.getByPlaceholderText(/e.g. Cyberpunk neon orange/i);
    fireEvent.change(textarea, { target: { value: 'Theme Two Prompt' } });

    // Click generate button
    const generateBtn = screen.getByRole('button', { name: /Generate Theme Colors/i });
    fireEvent.click(generateBtn);

    // Assert rate limit message and remaining minutes
    expect(screen.getByText(/You can only generate one custom theme per hour/i)).toBeInTheDocument();
    expect(screen.getByText(/Please wait another 30 minute/i)).toBeInTheDocument();
  });

  it('successfully generates a new custom theme if rate limit and max limit are respected', async () => {
    const mockSetTheme = vi.fn();

    themeGenerator.generateThemeWithGemini.mockResolvedValue({
      id: 'custom_new',
      'theme-name': 'Nebula Sunset',
      'bg-base': '#120c1f',
      'accent-bg': '#ff00aa',
      'text-main': '#ffffff',
      swatches: ['#120c1f', '#ff00aa', '#ffffff']
    });

    themeGenerator.generateMusicWithLyria.mockResolvedValue('data:audio/mp3;base64,mock');

    render(<GlobalControls theme="dark" setTheme={mockSetTheme} />);

    // Open picker dropdown
    fireEvent.click(screen.getByTestId('global-theme-picker'));

    // Trigger the generator modal
    fireEvent.click(screen.getByTestId('ai-theme-gen-trigger'));

    // Enter prompt and API key
    const textarea = screen.getByPlaceholderText(/e.g. Cyberpunk neon orange/i);
    fireEvent.change(textarea, { target: { value: 'Nebula theme' } });

    const keyInput = screen.getByPlaceholderText(/Enter API Key/i);
    fireEvent.change(keyInput, { target: { value: 'test-api-key' } });

    // Click generate button
    const generateBtn = screen.getByRole('button', { name: /Generate Theme Colors/i });
    fireEvent.click(generateBtn);

    // Wait for the modal to close and state to update
    await waitFor(() => {
      expect(mockSetTheme).toHaveBeenCalledWith('custom');
      expect(themeAudio.playThemeMusic).toHaveBeenCalledWith('custom');
    });

    // Verify it saved the custom theme to storage
    const themes = getCustomThemes();
    expect(themes.length).toBe(1);
    expect(themes[0]['theme-name']).toBe('Nebula Sunset');
  });

  it('verifies the Background Sandbox interactive controls and CSS updates', () => {
    const mockSetTheme = vi.fn();
    render(<GlobalControls theme="dark" setTheme={mockSetTheme} />);

    // Open picker dropdown
    fireEvent.click(screen.getByTestId('global-theme-picker'));

    // Verify trigger button exists and click it to open
    const sandboxTrigger = screen.getByTestId('pattern-sandbox-trigger');
    expect(sandboxTrigger).toBeInTheDocument();
    fireEvent.click(sandboxTrigger);

    // Verify sliders are immediately visible
    const opacitySlider = screen.getByTestId('sandbox-opacity-slider');
    const scaleSlider = screen.getByTestId('sandbox-scale-slider');
    expect(opacitySlider).toBeInTheDocument();
    expect(scaleSlider).toBeInTheDocument();

    // Verify CSS variables are updated on document root
    const style = document.documentElement.style;
    expect(style.getPropertyValue('--test-pattern-opacity')).toBe('0.25');
    expect(style.getPropertyValue('--test-pattern-size')).toBe('1024px 1024px');

    // Change opacity and scale
    fireEvent.change(opacitySlider, { target: { value: '0.45' } });
    fireEvent.change(scaleSlider, { target: { value: '1.8' } });

    // Verify CSS updates correctly
    expect(style.getPropertyValue('--test-pattern-opacity')).toBe('0.45');
    expect(style.getPropertyValue('--test-pattern-size')).toBe('921.6px 921.6px');
    
    // Close sandbox to clear values
    fireEvent.click(sandboxTrigger);
    expect(style.getPropertyValue('--test-pattern-opacity')).toBe('');
    expect(style.getPropertyValue('--test-pattern-size')).toBe('');
  });

  it('updates volume on global scroll wheel events', () => {
    render(<GlobalControls theme="dark" setTheme={vi.fn()} />);

    // Trigger a wheel scroll event on the body
    const event = new WheelEvent('wheel', { deltaY: -100, bubbles: true });
    act(() => {
      window.dispatchEvent(event);
    });

    expect(themeAudio.setVolume).toHaveBeenCalledWith(0.35);
  });
});
