import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../../components/Dashboard';
import { fetchCatalog } from '../../services/contentLoader';

// Mock the contentLoader service
vi.mock('../../services/contentLoader', () => ({
  fetchCatalog: vi.fn(),
}));

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Dashboard', () => {
  // Suppress specific console outputs during tests
  const originalConsoleError = console.error;

  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn(); // Suppress expected console.errors in tests
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renders loading state initially', async () => {
    // Create a promise that doesn't resolve immediately to keep it in loading state
    let resolvePromise;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    fetchCatalog.mockReturnValue(pendingPromise);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('INITIALIZING TRIDORIAN...')).toBeInTheDocument();

    // Resolve promise to clean up
    await act(async () => {
      resolvePromise({ tracks: [] });
    });
  });

  it('renders error state when fetchCatalog fails', async () => {
    const errorMessage = 'Network error fetching catalog';
    fetchCatalog.mockRejectedValue(new Error(errorMessage));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for the error state to render
    await waitFor(() => {
      expect(screen.getByText('CATALOG UNAVAILABLE')).toBeInTheDocument();
    });
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders catalog tracks on successful fetch', async () => {
    const mockCatalog = {
      tracks: [
        {
          id: 'track-1',
          title: 'Track One',
          description: 'Description for track one',
          icon: 'BookOpen'
        },
        {
          id: 'track-2',
          title: 'Track Two',
          description: 'Description for track two',
          icon: 'Code'
        }
      ]
    };
    fetchCatalog.mockResolvedValue(mockCatalog);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for the tracks to render
    await waitFor(() => {
      expect(screen.getByText('Course Catalog')).toBeInTheDocument();
    });

    expect(screen.getByText('Track One')).toBeInTheDocument();
    expect(screen.getByText('Description for track one')).toBeInTheDocument();
    expect(screen.getByText('Track Two')).toBeInTheDocument();
    expect(screen.getByText('Description for track two')).toBeInTheDocument();
  });

  it('navigates to track on click', async () => {
    const mockCatalog = {
      tracks: [
        {
          id: 'track-1',
          title: 'Track One',
          description: 'Description for track one',
          icon: 'BookOpen'
        }
      ]
    };
    fetchCatalog.mockResolvedValue(mockCatalog);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for the track to render
    const trackButton = await screen.findByRole('button', { name: /Track One/i });

    trackButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('/track-1');
  });
});
