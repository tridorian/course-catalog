import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../../components/Dashboard';
import * as googleAuth from '../../services/googleAuth';
import * as googleDrive from '../../services/googleDrive';
import * as contentLoader from '../../services/contentLoader';

vi.mock('../../services/googleAuth');
vi.mock('../../services/googleDrive');
vi.mock('../../services/contentLoader');

const mockCatalog = {
  tracks: [
    {
      id: 'track1',
      title: 'Track One',
      description: 'First track description',
      icon: 'BookOpen',
      courses: [
        { id: 'course1', title: 'Course One', modules: 4 },
        { id: 'course2', title: 'Course Two', modules: 3 }
      ]
    }
  ]
};

describe('Dashboard Onboarding & Progress UX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    contentLoader.fetchCatalog.mockResolvedValue(mockCatalog);
    // Mock localStorage
    const localStore = {};
    vi.spyOn(localStorage, 'getItem').mockImplementation((key) => localStore[key] || null);
    vi.spyOn(localStorage, 'setItem').mockImplementation((key, val) => { localStore[key] = String(val); });
  });

  it('renders "Connect Google Drive" banner when access token is missing', async () => {
    googleAuth.getAccessToken.mockReturnValue(null);

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Wait for catalog to load and render
    await screen.findByText('Track One');

    // Verify banner is shown
    expect(screen.getByText(/Connect Google Drive to Sync Progress/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Connect Google Drive to sync progress/i })).toBeInTheDocument();
  });

  it('triggers signIn flow when "Connect Sync" button is clicked', async () => {
    googleAuth.getAccessToken.mockReturnValue(null);
    googleAuth.signIn.mockResolvedValue({ access_token: 'fake-new-token' });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    const button = await screen.findByRole('button', { name: /Connect Google Drive to sync progress/i });
    fireEvent.click(button);

    expect(googleAuth.signIn).toHaveBeenCalledTimes(1);
  });

  it('shows connected state and no onboarding banner when access token is present', async () => {
    googleAuth.getAccessToken.mockReturnValue('valid-token');

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await screen.findByText('Track One');

    // Banner should not be present
    expect(screen.queryByText(/Connect Google Drive to Sync Progress/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Drive Sync Connected/i)).toBeInTheDocument();
  });

  it('calculates and displays course/track progress from localStorage progress state', async () => {
    googleAuth.getAccessToken.mockReturnValue('valid-token');
    
    // Setup local progress: 2 completed steps out of 4 modules for course1, 0 for course2 (2 / 7 modules total = 28.5%)
    const mockProgress = {
      track1_course1: {
        completedIndices: ['0', '1'],
        activeModuleId: 'mod2',
        lastUpdated: new Date().toISOString()
      }
    };
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'agy_local_progress') return JSON.stringify(mockProgress);
      return null;
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await screen.findByText('Track One');

    // 2 completed steps in course1 (4 modules) + 0 in course2 (3 modules) = 2 completed out of 7 total modules
    // 2/7 = ~29% complete
    expect(screen.getByText(/29% Complete/i)).toBeInTheDocument();
  });
});
