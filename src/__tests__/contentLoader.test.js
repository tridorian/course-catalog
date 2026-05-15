import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchCourseManifest, fetchModuleContent } from '../services/contentLoader';

describe('contentLoader', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('fetchCourseManifest loads and validates a valid manifest', async () => {
    const mockManifest = {
      metadata: 'metadata.json',
      modules: [{ id: 1, title: 'Mod 1', file: 'mod1.json' }]
    };

    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockManifest,
    });

    const manifest = await fetchCourseManifest('track1', 'course1');
    expect(manifest).toEqual(mockManifest);
    expect(fetch).toHaveBeenCalledWith('./content/tracks/track1/course1/manifest.json');
  });

  it('fetchCourseManifest throws error on invalid manifest', async () => {
    const invalidManifest = { modules: [] }; // missing metadata

    fetch.mockResolvedValue({
      ok: true,
      json: async () => invalidManifest,
    });

    await expect(fetchCourseManifest('track1', 'course1')).rejects.toThrow('Invalid manifest: missing metadata field');
  });

  it('fetchModuleContent loads and validates a valid lab module', async () => {
    const mockModule = {
      title: 'Lab 1',
      type: 'lab',
      blocks: []
    };

    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockModule,
    });

    const moduleData = await fetchModuleContent('track1', 'course1', 'mod1.json');
    expect(moduleData).toEqual(mockModule);
  });

  it('fetchModuleContent throws error on invalid lab module', async () => {
    const invalidModule = {
      title: 'Lab 1',
      type: 'lab'
      // missing blocks
    };

    fetch.mockResolvedValue({
      ok: true,
      json: async () => invalidModule,
    });

    await expect(fetchModuleContent('track1', 'course1', 'mod1.json')).rejects.toThrow('Invalid lab module: missing blocks array');
  });

  it('handles fetch errors gracefully', async () => {
    fetch.mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    });

    await expect(fetchCourseManifest('track1', 'course1')).rejects.toThrow('Failed to load manifest: Not Found');
  });
});
