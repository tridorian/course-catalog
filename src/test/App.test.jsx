import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import App from '../App';
import * as contentLoader from '../services/contentLoader';

vi.mock('../services/contentLoader');

describe('App Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default mock implementation
    contentLoader.fetchCourseManifest.mockResolvedValue({
      metadata: 'metadata.json',
      modules: [{ id: 1, title: 'Test Module', file: 'test.json' }]
    });
    contentLoader.fetchCourseMetadata.mockResolvedValue({
      title: 'TEST COURSE'
    });
    contentLoader.fetchModuleContent.mockResolvedValue({
      id: 1,
      title: 'Test Module',
      type: 'lab',
      blocks: [{ type: 'h1', content: 'Hello World' }]
    });

    // Mock scrollTo
    window.scrollTo = vi.fn();
  });

  it('loads and renders a course correctly', async () => {
    window.location.hash = '#/labs/agv-01';

    render(<App />);

    expect(screen.getByText(/LOADING TRIDORIAN MISSION.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('TEST COURSE')).toBeInTheDocument();
    });

    // ContentRenderer renders h1 with the content
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('shows error state when manifest fails to load', async () => {
    contentLoader.fetchCourseManifest.mockRejectedValue(new Error('Manifest not found'));
    window.location.hash = '#/invalid/track';

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Mission Interrupted/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Manifest not found')).toBeInTheDocument();
  });
});
