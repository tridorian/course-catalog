
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SyncStatus from '../../components/SyncStatus';
import App from '../../App';
import * as googleDrive from '../../services/googleDrive';
import * as googleAuth from '../../services/googleAuth';

vi.mock('../../services/googleDrive');
vi.mock('../../services/googleAuth');
vi.mock('../../services/contentLoader', () => ({
  fetchCourseManifest: vi.fn(() => Promise.resolve({ metadata: {}, modules: [] })),
  fetchCourseMetadata: vi.fn(() => Promise.resolve({ title: 'Test Course' })),
  fetchModuleContent: vi.fn(() => Promise.resolve({ id: 'mod1', title: 'Module 1' })),
  fetchCatalog: vi.fn(() => Promise.resolve({ tracks: [] }))
}));

describe('SyncStatus Component', () => {
  it('renders synced state correctly', () => {
    render(<SyncStatus status="synced" />);
    expect(screen.getByText('Synced')).toBeInTheDocument();
    expect(screen.getByTestId('sync-status-synced')).toBeInTheDocument();
  });

  it('renders syncing state correctly', () => {
    render(<SyncStatus status="syncing" />);
    expect(screen.getByText('Syncing')).toBeInTheDocument();
    expect(screen.getByTestId('sync-status-syncing')).toBeInTheDocument();
  });

  it('renders error state correctly and handles retry', () => {
    const onRetry = vi.fn();
    render(<SyncStatus status="error" onRetry={onRetry} />);
    
    const errorBadge = screen.getByTestId('sync-status-error');
    expect(errorBadge).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    
    fireEvent.click(errorBadge);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('returns null for unknown status', () => {
    const { container } = render(<SyncStatus status="unknown" />);
    expect(container.firstChild).toBeNull();
  });
});

describe('Resume Last Session Banner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    googleAuth.getAccessToken.mockReturnValue('fake-token');
  });

  it('shows resume banner when session differs and no moduleId in URL', async () => {
    googleDrive.getProgressFile.mockResolvedValue({
      id: 'file123',
      appProperties: {
        trackId: 'track1',
        courseId: 'course1',
        moduleId: 'mod1'
      }
    });

    render(
      <MemoryRouter initialEntries={['/track1/course1']}>
        <App />
      </MemoryRouter>
    );

    const banner = await screen.findByText(/Resume Session\?/i);
    expect(banner).toBeInTheDocument();
    expect(screen.getByText(/course1 \/ mod1/i)).toBeInTheDocument();
  });

  it('does not show resume banner when already on a module URL', async () => {
    googleDrive.getProgressFile.mockResolvedValue({
      id: 'file123',
      appProperties: {
        trackId: 'track1',
        courseId: 'course1',
        moduleId: 'mod1'
      }
    });

    render(
      <MemoryRouter initialEntries={['/track1/course1/mod1']}>
        <App />
      </MemoryRouter>
    );

    // Wait a bit to ensure it doesn't appear
    await new Promise(r => setTimeout(r, 100));
    expect(screen.queryByText(/Resume Session\?/i)).not.toBeInTheDocument();
  });

  it('navigates to saved session when Resume is clicked', async () => {
    googleDrive.getProgressFile.mockResolvedValue({
      id: 'file123',
      appProperties: {
        trackId: 'track1',
        courseId: 'course1',
        moduleId: 'mod1'
      }
    });

    render(
      <MemoryRouter initialEntries={['/track1/course1']}>
        <App />
      </MemoryRouter>
    );

    const resumeButton = await screen.findByText(/RESUME MISSION/i);
    fireEvent.click(resumeButton);

    expect(screen.queryByText(/Resume Session\?/i)).not.toBeInTheDocument();
  });
});
