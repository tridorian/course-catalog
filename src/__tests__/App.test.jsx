import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import * as contentLoader from '../services/contentLoader';

vi.mock('../services/contentLoader');

describe('App Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();

    // Mock catalog and track manifest (used by Dashboard/TrackPage)
    contentLoader.fetchCatalog.mockResolvedValue({
      tracks: [{ id: 'agentic-engineering', title: 'Agentic Engineering', description: 'Test', icon: 'Cpu' }]
    });
    contentLoader.fetchTrackManifest.mockResolvedValue({
      track_id: 'agentic-engineering',
      title: 'Agentic Engineering',
      description: 'Test track',
      courses: [
        { id: 'agy-101', title: 'AGY-101', description: 'Test course 1', modules: 2, icon: 'Rocket' },
        { id: 'agy-102', title: 'AGY-102', description: 'Test course 2', modules: 2, icon: 'Flame' }
      ]
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

  const renderApp = async (initialEntry = '/agentic-engineering/agy-101/module-1') => {
    let result;
    await act(async () => {
       result = render(
        <MemoryRouter initialEntries={[initialEntry]}>
          <App />
        </MemoryRouter>
      );
    });
    return result;
  };

  it('loads and renders a course correctly', async () => {
    await renderApp();

    await waitFor(() => {
      expect(screen.getAllByText('TEST COURSE')[0]).toBeInTheDocument();
    }, { timeout: 10000 });

    await waitFor(() => {
      expect(screen.queryByText(/Hello World/)).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('shows error state when manifest fails to load', async () => {
    contentLoader.fetchCourseManifest.mockRejectedValue(new Error('Manifest not found'));
    await renderApp('/invalid/track/module-1');

    await waitFor(() => {
      expect(screen.getByText(/Mission Interrupted/i)).toBeInTheDocument();
    }, { timeout: 10000 });

    expect(screen.getByText('Manifest not found')).toBeInTheDocument();
  });

  it('only marks checkmarks when moving to next step', async () => {
    await renderApp();

    await waitFor(() => {
      expect(screen.getAllByText('TEST COURSE')[0]).toBeInTheDocument();
    }, { timeout: 10000 });

    // Wait for the content to be loaded
    await waitFor(() => {
        expect(screen.queryByText(/Hello World 1/)).toBeInTheDocument();
    }, { timeout: 10000 });

    // Verify initial state: no check icon for step 0
    expect(screen.queryByTestId('check-icon-0')).not.toBeInTheDocument();

    // Find and click 'Next'
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    // Verify step 0 is now marked as complete
    await waitFor(() => {
      expect(screen.getByTestId('check-icon-0')).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('handles numeric module IDs from content JSON (regression)', async () => {
    // Force a module with numeric ID "1"
    contentLoader.fetchCourseManifest.mockResolvedValue({
      metadata: 'metadata.json',
      modules: [{ id: "1", title: 'Numeric Module', file: 'num.json' }]
    });
    contentLoader.fetchModuleContent.mockResolvedValue({
      id: "1",
      title: 'Numeric Module',
      type: 'lab',
      blocks: [{ type: 'p', content: 'Numeric content' }]
    });

    await renderApp('/agentic-engineering/agy-101/1');

    await waitFor(() => {
      expect(screen.getAllByText(/Numeric Module/i)[0]).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('locks progression if active module contains a quiz', async () => {
    // Override test1.json mock to have a quiz
    contentLoader.fetchModuleContent.mockImplementation((trackId, courseId, path) => {
      if (path === 'test1.json') {
        return Promise.resolve({
          id: 'module-1',
          title: 'Quiz Module',
          type: 'lab',
          blocks: [
            { type: 'h1', content: 'Hello World 1' },
            { type: 'h2', content: 'Check your understanding' },
            { type: 'p', content: 'Question 1: Is this a test?' },
            { type: 'list', items: ['A) Yes', 'B) No'] },
            { type: 'p', content: 'Correct Answer: A' }
          ]
        });
      }
      return Promise.resolve({
        id: 'module-2',
        title: 'Test Module 2',
        type: 'lab',
        blocks: [{ type: 'h1', content: 'Hello World 2' }]
      });
    });

    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    await renderApp();

    await waitFor(() => {
      expect(screen.getAllByText(/Quiz Module/i)[0]).toBeInTheDocument();
    }, { timeout: 10000 });

    // Check that quiz question is displayed
    await waitFor(() => {
      expect(screen.getByText('Is this a test?')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Next button should be disabled
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    expect(nextBtn).toBeDisabled();

    // Clicking completion checkbox in the sidebar for active step should show alert
    const checkboxToggle = screen.getByTestId('toggle-complete-0');
    fireEvent.click(checkboxToggle);
    expect(alertMock).toHaveBeenCalledWith(expect.stringContaining("Comprehension check required"));

    // Select the correct option: "Yes"
    const optionBtn = screen.getByRole('button', { name: /Yes/i });
    fireEvent.click(optionBtn);

    // Submit answer
    const submitBtn = screen.getByRole('button', { name: /Submit Answer/i });
    fireEvent.click(submitBtn);

    // Quiz passed, nextBtn should be enabled
    await waitFor(() => {
      expect(nextBtn).not.toBeDisabled();
    }, { timeout: 10000 });

    // Clean up
    alertMock.mockRestore();
  });

  it('displays Next Course button in celebration modal and footer when there is a next course', async () => {
    await renderApp('/agentic-engineering/agy-101/module-2');

    await waitFor(() => {
      expect(screen.getAllByText('TEST COURSE')[0]).toBeInTheDocument();
    }, { timeout: 10000 });

    // Complete course
    const completeBtn = screen.getByRole('button', { name: /Complete Course/i });
    await act(async () => {
      fireEvent.click(completeBtn);
    });

    // Verify celebration modal shows Next Course button
    await waitFor(() => {
      expect(screen.getByText(/Badge Unlocked/i)).toBeInTheDocument();
      expect(screen.getByText(/Next Course: AGY-102/i)).toBeInTheDocument();
    }, { timeout: 10000 });

    // Click Return to Course Map to dismiss it
    const dismissBtn = screen.getByRole('button', { name: /Return to Course Map/i });
    await act(async () => {
      fireEvent.click(dismissBtn);
    });

    // Verify we are back on Track Overview (TrackPage)
    await waitFor(() => {
      expect(screen.getByText('Agentic Engineering')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Navigate back to the course page from TrackPage
    const courseBtn = screen.getByRole('button', { name: /AGY-101/i });
    await act(async () => {
      fireEvent.click(courseBtn);
    });

    // Verify we are on Course page
    await waitFor(() => {
      expect(screen.getByText('Course Map')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Go back to Module 2 to check its footer
    const reviewBtns = screen.getAllByRole('button', { name: /Review Module/i });
    await act(async () => {
      fireEvent.click(reviewBtns[1]);
    });

    // Footer should also show Next Course button now that it's completed
    await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Next Course/i })).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('displays track completion prompt in celebration modal and footer when it is the last course', async () => {
    contentLoader.fetchCourseMetadata.mockResolvedValue({
      title: 'AGY-102'
    });
    // agy-102 is the last course in our mocked track
    await renderApp('/agentic-engineering/agy-102/module-2');

    await waitFor(() => {
      expect(screen.getAllByText('AGY-102')[0]).toBeInTheDocument();
    }, { timeout: 10000 });

    const completeBtn = screen.getByRole('button', { name: /Complete Course/i });
    await act(async () => {
      fireEvent.click(completeBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/Track Completed!/i)).toBeInTheDocument();
      expect(screen.getByText(/Return to Dashboard/i)).toBeInTheDocument();
    }, { timeout: 10000 });

    const dismissBtn = screen.getByRole('button', { name: /Return to Course Map/i });
    await act(async () => {
      fireEvent.click(dismissBtn);
    });

    // Verify we are back on Track Overview (TrackPage)
    await waitFor(() => {
      expect(screen.getByText('Agentic Engineering')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Navigate back to the course page from TrackPage
    const courseBtn2 = screen.getByRole('button', { name: /AGY-102/i });
    await act(async () => {
      fireEvent.click(courseBtn2);
    });

    // Verify we are on Course page
    await waitFor(() => {
      expect(screen.getByText('Course Map')).toBeInTheDocument();
    }, { timeout: 10000 });

    // Go back to Module 2 to check its footer
    const reviewBtns2 = screen.getAllByRole('button', { name: /Review Module/i });
    await act(async () => {
      fireEvent.click(reviewBtns2[1]);
    });

    // Footer should show "Complete Track" button
    await waitFor(() => {
        expect(screen.getByRole('button', { name: /Complete Track/i })).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('loads progress from localStorage if not signed in / no token', async () => {
    const mockProgress = {
      'agentic-engineering_agy-101': {
        completedIndices: [0],
        activeModuleId: 'module-2',
        lastUpdated: new Date().toISOString()
      }
    };
    localStorage.setItem('agy_local_progress', JSON.stringify(mockProgress));

    await renderApp();

    await waitFor(() => {
      expect(screen.getByTestId('check-icon-0')).toBeInTheDocument();
    }, { timeout: 10000 });
  });
});
