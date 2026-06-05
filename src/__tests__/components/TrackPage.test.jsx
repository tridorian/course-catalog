import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TrackPage from '../../components/TrackPage';
import * as contentLoader from '../../services/contentLoader';

vi.mock('../../services/contentLoader');

describe('TrackPage Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderTrackPage = (initialRoute = '/test-track') => {
    // A mock component to verify navigation
    const DashboardMock = () => <div data-testid="dashboard-mock">Dashboard</div>;
    const CourseMock = () => <div data-testid="course-mock">Course</div>;

    render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/" element={<DashboardMock />} />
          <Route path="/:trackId" element={<TrackPage />} />
          <Route path="/:trackId/:courseId" element={<CourseMock />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('displays loading state initially', () => {
    // Mock an unresolved promise to keep it in loading state
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    contentLoader.fetchTrackManifest.mockReturnValue(promise);

    renderTrackPage();

    expect(screen.getByText(/Loading Tridorian System/i)).toBeInTheDocument();
  });

  it('renders track data successfully', async () => {
    contentLoader.fetchTrackManifest.mockResolvedValue({
      track_id: 'test-track',
      title: 'Test Track Title',
      description: 'Test Track Description',
      courses: [
        {
          id: 'course-1',
          title: 'Course 1 Title',
          description: 'Course 1 Description',
          modules: 3,
          icon: 'Rocket'
        },
        {
          id: 'course-2',
          title: 'Course 2 Title',
          description: 'Course 2 Description',
          modules: 5,
          icon: 'Cpu'
        }
      ]
    });

    renderTrackPage();

    // Verify loading state disappears
    await waitFor(() => {
      expect(screen.queryByText(/LOADING TRACK DATA/i)).not.toBeInTheDocument();
    });

    // Verify track details are rendered
    expect(screen.getByText('Test Track Title')).toBeInTheDocument();
    expect(screen.getByText('Test Track Description')).toBeInTheDocument();
    expect(screen.getByText(/2 courses available/i)).toBeInTheDocument();

    // Verify courses are rendered
    expect(screen.getByText('Course 1 Title')).toBeInTheDocument();
    expect(screen.getByText('Course 1 Description')).toBeInTheDocument();
    expect(screen.getByText(/3 MODULES/i)).toBeInTheDocument();

    expect(screen.getByText('Course 2 Title')).toBeInTheDocument();
    expect(screen.getByText('Course 2 Description')).toBeInTheDocument();
    expect(screen.getByText(/5 MODULES/i)).toBeInTheDocument();
  });

  it('displays error state when track manifest fails to load', async () => {
    contentLoader.fetchTrackManifest.mockRejectedValue(new Error('Network Error: Failed to fetch manifest'));

    renderTrackPage();

    await waitFor(() => {
      expect(screen.queryByText(/LOADING TRACK DATA/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Track Not Found/i)).toBeInTheDocument();
    expect(screen.getByText('Network Error: Failed to fetch manifest')).toBeInTheDocument();
  });

  it('navigates to dashboard when RETURN TO DASHBOARD button is clicked on error state', async () => {
    contentLoader.fetchTrackManifest.mockRejectedValue(new Error('Manifest not found'));

    renderTrackPage();

    await waitFor(() => {
      expect(screen.getByText(/Track Not Found/i)).toBeInTheDocument();
    });

    const returnButton = screen.getByRole('button', { name: /RETURN TO DASHBOARD/i });
    fireEvent.click(returnButton);

    // Verify navigation to dashboard
    expect(screen.getByTestId('dashboard-mock')).toBeInTheDocument();
  });

  it('navigates to dashboard when ALL TRACKS breadcrumb is clicked', async () => {
    contentLoader.fetchTrackManifest.mockResolvedValue({
      track_id: 'test-track',
      title: 'Test Track Title',
      description: 'Test Track Description',
      courses: []
    });

    renderTrackPage();

    await waitFor(() => {
      expect(screen.getByText('Test Track Title')).toBeInTheDocument();
    });

    const breadcrumb = screen.getByRole('button', { name: /ALL TRACKS/i });
    fireEvent.click(breadcrumb);

    // Verify navigation to dashboard
    expect(screen.getByTestId('dashboard-mock')).toBeInTheDocument();
  });

  it('navigates to course page when a course card is clicked', async () => {
    contentLoader.fetchTrackManifest.mockResolvedValue({
      track_id: 'test-track',
      title: 'Test Track Title',
      description: 'Test Track Description',
      courses: [
        {
          id: 'course-1',
          title: 'Course 1 Title',
          description: 'Course 1 Description',
          modules: 3,
          icon: 'Rocket'
        }
      ]
    });

    renderTrackPage();

    await waitFor(() => {
      expect(screen.getByText('Course 1 Title')).toBeInTheDocument();
    });

    const courseCard = screen.getByRole('button', { name: /Course 1 Title/i });
    fireEvent.click(courseCard);

    // Verify navigation to course
    expect(screen.getByTestId('course-mock')).toBeInTheDocument();
  });
});
