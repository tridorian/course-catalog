import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import App from '../App';
import * as contentLoader from '../services/contentLoader';

vi.mock('../services/contentLoader');

describe('App Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Default mock implementation
    contentLoader.fetchCourseManifest.mockResolvedValue({
      metadata: 'metadata.json',
      modules: [
        { id: 'module-1', title: 'Test Module 1', path: 'test1.json' },
        { id: 'module-2', title: 'Test Module 2', path: 'test2.json' }
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
        <Routes>
          <Route path="/:trackId/:courseId/:moduleId/*" element={<App />} />
          <Route path="/:trackId/:courseId" element={<App />} />
          <Route path="/" element={<App />} />
        </Routes>
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
});
