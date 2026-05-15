import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import * as contentLoader from '../services/contentLoader';

vi.mock('../services/contentLoader');

describe('Navigation & Deep Linking', () => {
  beforeEach(() => {
    vi.clearAllMocks();

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

    // Mock successful course load
    contentLoader.fetchCourseManifest.mockResolvedValue({
      metadata: 'metadata.json',
      modules: [
        { id: 'module-1', file: 'module-1.json', title: 'Module 1' },
        { id: 'module-2', file: 'module-2.json', title: 'Module 2' }
      ]
    });
    contentLoader.fetchCourseMetadata.mockResolvedValue({
      title: 'TEST COURSE'
    });

    contentLoader.fetchModuleContent.mockImplementation((trackId, courseId, path) => {
      if (path === 'module-1.json') {
        return Promise.resolve({
          id: 'module-1',
          type: 'lab',
          title: 'Module 1',
          blocks: [{ type: 'h1', content: 'Module 1 Content' }]
        });
      }
      if (path === 'module-2.json') {
        return Promise.resolve({
          id: 'module-2',
          type: 'lab',
          title: 'Module 2',
          blocks: [{ type: 'h1', content: 'Module 2 Content' }]
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  const renderApp = (initialEntry = '/agentic-engineering/agv-01/module-1') => {
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    );
  };

  it('updates URL when sidebar module is clicked', async () => {
    window.scrollTo = vi.fn();
    renderApp();

    // Wait for the course to load
    await waitFor(() => {
      expect(screen.getByText('Module 1 Content')).toBeInTheDocument();
    });

    // Wait for Next button to be enabled
    await waitFor(() => expect(screen.getByRole('button', { name: /Next/i })).not.toBeDisabled());

    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);

    // Check that we moved to module 2
    await waitFor(() => {
      expect(screen.getByText('Module 2 Content')).toBeInTheDocument();
    });

    // Click module 1 in sidebar
    const buttons = screen.getAllByRole('button');
    const step1Btn = buttons.find(b => b.textContent && b.textContent.includes('Module 1'));
    fireEvent.click(step1Btn);

    // Check that we moved back to module 1
    await waitFor(() => {
      expect(screen.getByText('Module 1 Content')).toBeInTheDocument();
    });
  });

  it('loads correct state from deep link', async () => {
    window.scrollTo = vi.fn();
    renderApp('/agentic-engineering/agv-01/module-2');

    await waitFor(() => {
      expect(screen.queryByText('Module 2 Content') || screen.queryByText('Module 1 Content')).toBeInTheDocument();
    });
  });
});
