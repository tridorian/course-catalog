import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchModuleContent, fetchCourseManifest, fetchCourseMetadata } from '../services/contentLoader';

describe('Performance - Caching', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('measures repeated fetch calls with caching', async () => {
    const mockManifest = {
      metadata: 'metadata.json',
      modules: [{ id: 1, title: 'Mod 1', file: 'mod1.json' }]
    };

    const mockModule = {
      title: 'Lab 1',
      type: 'lab',
      blocks: []
    };

    const mockMetadata = {
      title: "Title"
    };

    fetch.mockImplementation((url) => {
        if(url.includes('manifest')) return Promise.resolve({ ok: true, json: async () => mockManifest });
        if(url.includes('metadata')) return Promise.resolve({ ok: true, json: async () => mockMetadata });
        return Promise.resolve({ ok: true, json: async () => mockModule });
    });

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      await fetchCourseManifest('track1', 'course1');
      await fetchCourseMetadata('track1', 'course1', 'metadata.json');
      await fetchModuleContent('track1', 'course1', 'mod1.json');
    }
    const end = performance.now();

    const fetchCount = fetch.mock.calls.length;
    console.log(`[Optimized] Fetched 100 times. Actual fetch calls: ${fetchCount}`);
    console.log(`[Optimized] Time taken: ${end - start}ms`);

    expect(fetchCount).toBe(3);
  });
});
