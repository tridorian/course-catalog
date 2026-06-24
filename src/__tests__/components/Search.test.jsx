import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TrackPage from '../../components/TrackPage';
import * as contentLoader from '../../services/contentLoader';
import * as roleManager from '../../services/roleManager';

vi.mock('../../services/contentLoader');
vi.mock('../../services/roleManager');

const mockTrackData = {
  track_id: 'test-track',
  title: 'Test Track',
  description: 'A track for testing search',
  courses: [
    {
      id: 'course-1',
      title: 'Introduction to Testing',
      description: 'Learn the basics of unit testing.',
      modules: 3,
      icon: 'Rocket',
      status: 'Published'
    },
    {
      id: 'course-2',
      title: 'Advanced React Patterns',
      description: 'Master hooks and performance.',
      modules: 5,
      icon: 'Cpu',
      status: 'Published'
    },
    {
      id: 'course-3',
      title: 'Draft Course',
      description: 'This should be hidden for students.',
      modules: 2,
      icon: 'Edit',
      status: 'Draft'
    }
  ]
};

describe('TrackPage Search Functionality', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    contentLoader.fetchTrackManifest.mockResolvedValue(mockTrackData);
    roleManager.checkUserRole.mockResolvedValue('student');
  });

  const renderTrackPage = () => {
    render(
      <MemoryRouter initialEntries={['/test-track']}>
        <Routes>
          <Route path="/:trackId" element={<TrackPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders all published courses initially', async () => {
    renderTrackPage();
    await waitFor(() => {
      expect(screen.getByText('Introduction to Testing')).toBeInTheDocument();
      expect(screen.getByText('Advanced React Patterns')).toBeInTheDocument();
      expect(screen.queryByText('Draft Course')).not.toBeInTheDocument();
    });
    expect(screen.getByText(/2 courses available/i)).toBeInTheDocument();
  });

  it('filters courses by title', async () => {
    renderTrackPage();
    await waitFor(() => screen.getByPlaceholderText(/Search modules.../i));

    const searchInput = screen.getByPlaceholderText(/Search modules.../i);
    fireEvent.change(searchInput, { target: { value: 'React' } });

    expect(screen.queryByText('Introduction to Testing')).not.toBeInTheDocument();
    expect(screen.getByText('Advanced React Patterns')).toBeInTheDocument();
    expect(screen.getByText(/1 course available/i)).toBeInTheDocument();
  });

  it('filters courses by description', async () => {
    renderTrackPage();
    await waitFor(() => screen.getByPlaceholderText(/Search modules.../i));

    const searchInput = screen.getByPlaceholderText(/Search modules.../i);
    fireEvent.change(searchInput, { target: { value: 'unit testing' } });

    expect(screen.getByText('Introduction to Testing')).toBeInTheDocument();
    expect(screen.queryByText('Advanced React Patterns')).not.toBeInTheDocument();
  });

  it('is case-insensitive', async () => {
    renderTrackPage();
    await waitFor(() => screen.getByPlaceholderText(/Search modules.../i));

    const searchInput = screen.getByPlaceholderText(/Search modules.../i);
    fireEvent.change(searchInput, { target: { value: 'react' } });

    expect(screen.getByText('Advanced React Patterns')).toBeInTheDocument();
  });

  it('shows "No missions found" when no courses match', async () => {
    renderTrackPage();
    await waitFor(() => screen.getByPlaceholderText(/Search modules.../i));

    const searchInput = screen.getByPlaceholderText(/Search modules.../i);
    fireEvent.change(searchInput, { target: { value: 'Non-existent' } });

    expect(screen.getByText(/No missions found/i)).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your search query for "Non-existent"/i)).toBeInTheDocument();
    expect(screen.getByText(/0 courses available/i)).toBeInTheDocument();
  });

  it('clears search when "X" button is clicked', async () => {
    renderTrackPage();
    await waitFor(() => screen.getByPlaceholderText(/Search modules.../i));

    const searchInput = screen.getByPlaceholderText(/Search modules.../i);
    fireEvent.change(searchInput, { target: { value: 'React' } });

    const clearButton = screen.getByLabelText(/Clear search/i);
    fireEvent.click(clearButton);

    expect(searchInput.value).toBe('');
    expect(screen.getByText('Introduction to Testing')).toBeInTheDocument();
    expect(screen.getByText('Advanced React Patterns')).toBeInTheDocument();
  });

  it('clears search when "Clear Search" button in empty state is clicked', async () => {
    renderTrackPage();
    await waitFor(() => screen.getByPlaceholderText(/Search modules.../i));

    const searchInput = screen.getByPlaceholderText(/Search modules.../i);
    fireEvent.change(searchInput, { target: { value: 'Non-existent' } });

    // Using exact string match to avoid matching the "Clear search" aria-label of the X button
    const clearSearchLink = screen.getByRole('button', { name: 'Clear Search' });
    fireEvent.click(clearSearchLink);

    expect(searchInput.value).toBe('');
    expect(screen.getByText('Introduction to Testing')).toBeInTheDocument();
  });
});
