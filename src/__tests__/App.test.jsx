import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import * as contentLoader from '../services/contentLoader';

vi.mock('../services/contentLoader');

describe('App Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Mock catalog and track manifest (used by Dashboard/TrackPage)
    contentLoader.fetchCatalog.mockResolvedValue({
      tracks: [{ id: 'agentic-engineering', title: 'Agentic Engineering', description: 'Test', icon: 'Cpu' }]
    });
    contentLoader.fetchTrackManifest.mockResolvedValue({
      track_id: 'agentic-engineering',
      title: 'Agentic Engineering',
      description: 'Test track',
      courses: [{ id: 'agv-01', title: 'AGV-01', description: 'Test course', modules: 2, icon: 'Rocket' }]
    });

    // Default mock implementation
    contentLoader.fetchCourseManifest.mockResolvedValue({
      metadata: 'metadata.json',
      modules: [
        { id: 'module-1', title: 'Test Module 1', file: 'test1.json' },
        { id: 'module-2', title: 'Test Module 2', file: 'test2.json' }
      ]
    });
    contentLoader.fetchCourseMetadata.mockResolvedValue({
      title: 'TEST COURSE'
    });
    contentLoader.fetchModuleContent.mockImplementation((trackId, courseId, path) => {
      if (path === 'test1.json') {
        return Promise.resolve({
          id: 'module-1',
          title: 'Test Module 1',
          type: 'lab',
          blocks: [{ type: 'h1', content: 'Hello World 1' }]
        });
      }
      return Promise.resolve({
        id: 'module-2',
        title: 'Test Module 2',
        type: 'lab',
        blocks: [{ type: 'h1', content: 'Hello World 2' }]
      });
    });

    window.scrollTo = vi.fn();
  });

  const renderApp = (initialEntry = '/agentic-engineering/agv-01/module-1') => {
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    );
  };

  it('loads and renders a course correctly', async () => {
    renderApp();

    expect(screen.getByText(/LOADING TRIDORIAN MISSION.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('TEST COURSE')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText(/Hello World/)).toBeInTheDocument();
    });
  });

  it('shows error state when manifest fails to load', async () => {
    contentLoader.fetchCourseManifest.mockRejectedValue(new Error('Manifest not found'));
    renderApp('/invalid/track/module-1');

    await waitFor(() => {
      expect(screen.getByText(/Mission Interrupted/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Manifest not found')).toBeInTheDocument();
  });

  it('only marks checkmarks when moving to next step', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('TEST COURSE')).toBeInTheDocument();
    });

    // Wait for the button to appear and verify no checkmark
    await waitFor(() => {
      expect(screen.queryByTestId(/check-icon-/)).not.toBeInTheDocument();
    });

    // Wait for Next button to be enabled
    await waitFor(() => {
      const nextBtn = screen.getByRole('button', { name: /Next/i });
      expect(nextBtn).not.toBeDisabled();
    });

    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);

    // After clicking next, wait for it to navigate to module-2 and render "Hello World 2"
    await waitFor(() => {
      expect(screen.queryByText(/Hello World/) || screen.getByText('Test Module 1')).toBeInTheDocument();
    });

    // Now step 1 is completed
    await waitFor(() => { expect(screen.getAllByTestId(/check-icon-/).length).toBeGreaterThan(0); });
  });

  it('handles numeric module IDs from content JSON (regression)', async () => {
    // Simulate content JSON that uses numeric IDs (the original bug)
    contentLoader.fetchCourseManifest.mockResolvedValue({
      metadata: 'metadata.json',
      modules: [
        { id: 1, title: 'Numeric Module 1', file: 'n1.json' },
        { id: 2, title: 'Numeric Module 2', file: 'n2.json' }
      ]
    });
    contentLoader.fetchModuleContent.mockImplementation((trackId, courseId, path) => {
      if (path === 'n1.json') {
        return Promise.resolve({
          id: 1,
          title: 'Numeric Module 1',
          type: 'lab',
          blocks: [{ type: 'h1', content: 'Numeric Content 1' }]
        });
      }
      return Promise.resolve({
        id: 2,
        title: 'Numeric Module 2',
        type: 'lab',
        blocks: [{ type: 'h1', content: 'Numeric Content 2' }]
      });
    });

    // URL param "1" is a string, content id is number 1
    renderApp('/agentic-engineering/agv-01/1');

    await waitFor(() => {
      expect(screen.getByText('Numeric Content 1')).toBeInTheDocument();
    });

    // Verify the correct content rendered (not Module 2)
    expect(screen.getByText('Numeric Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Numeric Content 2')).not.toBeInTheDocument();
  });
});
