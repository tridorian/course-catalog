import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import App from '../../App';
import * as googleAuth from '../../services/googleAuth';
import * as googleDrive from '../../services/googleDrive';
import * as contentLoader from '../../services/contentLoader';

vi.mock('../../services/googleAuth');
vi.mock('../../services/googleDrive');
vi.mock('../../services/contentLoader');

const mockManifest = {
  metadata: { file: 'metadata.json' },
  modules: [
    { id: 'mod1', title: 'Module 1', file: 'mod1.md' },
    { id: 'mod2', title: 'Module 2', file: 'mod2.md' }
  ]
};

describe('Sidebar Progress Management & Reset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    googleAuth.getAccessToken.mockReturnValue('valid-token');
    contentLoader.fetchCourseManifest.mockResolvedValue(mockManifest);
    contentLoader.fetchCourseMetadata.mockResolvedValue({ title: 'Test Course' });
    contentLoader.fetchModuleContent.mockImplementation((trackId, courseId, filename) => {
      const id = filename.replace('.md', '');
      return Promise.resolve({ id, title: `Title ${id}`, duration: '5 min' });
    });
    googleDrive.loadProgress.mockResolvedValue({
      fileId: 'file123',
      progress: {
        track1_course1: {
          completedIndices: ['0'],
          activeModuleId: 'mod1',
          lastUpdated: new Date().toISOString()
        }
      }
    });
  });

  it('renders "Reset Progress" button in the sidebar', async () => {
    render(
      <MemoryRouter initialEntries={['/track1/course1/mod1']}>
        <App />
      </MemoryRouter>
    );

    // Wait for course to load
    const resetButton = await screen.findByRole('button', { name: /Reset all progress for this course/i });
    expect(resetButton).toBeInTheDocument();
  });

  it('opens confirmation modal when "Reset Progress" is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/track1/course1/mod1']}>
        <App />
      </MemoryRouter>
    );

    const resetButton = await screen.findByRole('button', { name: /Reset all progress for this course/i });
    fireEvent.click(resetButton);

    expect(screen.getByText(/Are you sure you want to reset your progress/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm Reset/i })).toBeInTheDocument();
  });

  it('invokes saveCourseProgress with empty list and clears state on Confirm Reset', async () => {
    googleDrive.saveCourseProgress.mockResolvedValue();

    render(
      <MemoryRouter initialEntries={['/track1/course1/mod1']}>
        <App />
      </MemoryRouter>
    );

    const resetButton = await screen.findByRole('button', { name: /Reset all progress for this course/i });
    fireEvent.click(resetButton);

    const confirmButton = screen.getByRole('button', { name: /Confirm Reset/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(googleDrive.saveCourseProgress).toHaveBeenCalledWith('track1', 'course1', 'mod1', []);
    });

    // Check that modal closes
    expect(screen.queryByText(/Are you sure you want to reset/i)).not.toBeInTheDocument();
  });

  it('allows checking/unchecking completion states by clicking checkboxes directly in the sidebar', async () => {
    googleDrive.saveCourseProgress.mockResolvedValue();

    render(
      <MemoryRouter initialEntries={['/track1/course1/mod1']}>
        <App />
      </MemoryRouter>
    );

    // The first module is completed (index 0) due to setup.
    // Locate the checkbox or click target to toggle completion
    const toggleButtons = await screen.findAllByTestId(/toggle-complete-/);
    expect(toggleButtons.length).toBe(2);

    // Toggle off the first module (index 0)
    fireEvent.click(toggleButtons[0]);

    await waitFor(() => {
      // It should trigger progress save with empty completed list
      expect(googleDrive.saveCourseProgress).toHaveBeenCalledWith('track1', 'course1', 'mod1', []);
    });

    // Toggle on the second module (index 1)
    fireEvent.click(toggleButtons[1]);
    await waitFor(() => {
      expect(googleDrive.saveCourseProgress).toHaveBeenCalledWith('track1', 'course1', 'mod1', [1]);
    });
  });
});
