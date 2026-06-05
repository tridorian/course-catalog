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

  const renderApp = (initialEntry = '/agentic-engineering/agy-101/module-1') => {
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
      expect(screen.getAllByText('TEST COURSE')[0]).toBeInTheDocument();
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
      expect(screen.getAllByText('TEST COURSE')[0]).toBeInTheDocument();
    });

    // Wait for the button to appear and verify no checkmark
    await waitFor(() => {
      expect(screen.queryByTestId(/check-icon-/)).not.toBeInTheDocument();
    });

    // Wait for Next button to be enabled
    await waitFor(() => {
      const nextBtn = screen.getByRole('button', { name: /Next module/i });
      expect(nextBtn).not.toBeDisabled();
    });

    const nextBtn = screen.getByRole('button', { name: /Next module/i });
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
    renderApp('/agentic-engineering/agy-101/1');

    await waitFor(() => {
      expect(screen.getByText('Numeric Content 1')).toBeInTheDocument();
    });

    // Verify the correct content rendered (not Module 2)
    expect(screen.getByText('Numeric Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Numeric Content 2')).not.toBeInTheDocument();
  });

  it('locks progression if active module contains a quiz', async () => {
    // Override test1.json mock to have a quiz
    contentLoader.fetchModuleContent.mockImplementation((trackId, courseId, path) => {
      if (path === 'test1.json') {
        return Promise.resolve({
          id: 'module-1',
          title: 'Test Module 1',
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

    renderApp();

    await waitFor(() => {
      expect(screen.getAllByText('TEST COURSE')[0]).toBeInTheDocument();
    });

    // Check that quiz question is displayed
    await waitFor(() => {
      expect(screen.getByText('Is this a test?')).toBeInTheDocument();
    });

    // Next button should be disabled
    const nextBtn = screen.getByRole('button', { name: /Next module/i });
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
    });

    // Clean up
    alertMock.mockRestore();
  });

  it('displays Next Course button in celebration modal and footer when there is a next course', async () => {
    // Go to module 2 (the last module of agy-101)
    renderApp('/agentic-engineering/agy-101/module-2');

    await waitFor(() => {
      expect(screen.getAllByText('TEST COURSE')[0]).toBeInTheDocument();
    });

    // Complete course
    const completeBtn = screen.getByRole('button', { name: /Complete this course/i });
    fireEvent.click(completeBtn);

    // Verify celebration modal shows Next Course button
    await waitFor(() => {
      expect(screen.getByText(/Badge Unlocked/i)).toBeInTheDocument();
      expect(screen.getByText(/Next Course: AGY-102/i)).toBeInTheDocument();
    });

    // Click Return to Course Map to dismiss it
    const dismissBtn = screen.getByRole('button', { name: /Return to Course Map/i });
    fireEvent.click(dismissBtn);

    // Verify we are back on Track Overview (TrackPage)
    await waitFor(() => {
      expect(screen.getByText('Agentic Engineering')).toBeInTheDocument();
    });

    // Navigate back to the course page from TrackPage
    const courseBtn = screen.getByRole('button', { name: /agy-101/i });
    fireEvent.click(courseBtn);

    // Verify we are on Course page
    await waitFor(() => {
      expect(screen.getByText('Course Map')).toBeInTheDocument();
    });

    // Go back to Module 2 to check its footer
    const reviewBtns = screen.getAllByRole('button', { name: /Review Module/i });
    fireEvent.click(reviewBtns[1]);

    // Now that the course is completed, the footer of the last module should show Review Badge and Next Course buttons
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Review course badge/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Continue to next course: AGY-102/i })).toBeInTheDocument();
    });
  });

  it('displays track completion prompt in celebration modal and footer when it is the last course', async () => {
    // Go to module 2 (last module of agy-102, which is the last course in the track)
    renderApp('/agentic-engineering/agy-102/module-2');

    await waitFor(() => {
      expect(screen.getAllByText('TEST COURSE')[0]).toBeInTheDocument();
    });

    // Complete course
    const completeBtn = screen.getByRole('button', { name: /Complete this course/i });
    fireEvent.click(completeBtn);

    // Verify celebration modal shows track completion prompt
    await waitFor(() => {
      expect(screen.getByText(/Track Completed!/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Return to Dashboard/i })).toBeInTheDocument();
    });

    // Click Return to Course Map to dismiss it
    const dismissBtn2 = screen.getByRole('button', { name: /Return to Course Map/i });
    fireEvent.click(dismissBtn2);

    // Verify we are back on Track Overview (TrackPage)
    await waitFor(() => {
      expect(screen.getByText('Agentic Engineering')).toBeInTheDocument();
    });

    // Navigate back to the course page from TrackPage
    const courseBtn2 = screen.getByRole('button', { name: /agy-102/i });
    fireEvent.click(courseBtn2);

    // Verify we are on Course page
    await waitFor(() => {
      expect(screen.getByText('Course Map')).toBeInTheDocument();
    });

    // Go back to Module 2 to check its footer
    const reviewBtns2 = screen.getAllByRole('button', { name: /Review Module/i });
    fireEvent.click(reviewBtns2[1]);

    // Now that the course is completed and it's the last course, the footer of the last module should show Review Badge and Complete Track
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Review course badge/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Complete track and return to catalog/i })).toBeInTheDocument();
    });
  });

  it('loads progress from localStorage if not signed in / no token', async () => {
    const mockProgress = {
      'agentic-engineering_agy-101': {
        activeModuleId: 'module-2',
        completedIndices: ['0'],
        lastUpdated: new Date().toISOString()
      }
    };
    localStorage.setItem('agy_local_progress', JSON.stringify(mockProgress));

    renderApp();

    await waitFor(() => {
      expect(screen.getAllByText('TEST COURSE')[0]).toBeInTheDocument();
    });

    // Check that module-1 (index 0) has a checkmark indicating completion
    await waitFor(() => {
      expect(screen.getAllByTestId(/check-icon-/).length).toBe(1);
    });

    // Clean up
    localStorage.removeItem('agy_local_progress');
  });
});
