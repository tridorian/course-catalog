import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminPanel from '../../components/AdminPanel';
import * as roleManager from '../../services/roleManager';

vi.mock('../../services/roleManager');
vi.mock('../../services/contentLoader', () => ({
  fetchCatalog: vi.fn(() => Promise.resolve({
    tracks: [
      {
        id: 'track1',
        title: 'Track One',
        courses: [
          { id: 'course1', title: 'Course One', status: 'Draft' },
          { id: 'course2', title: 'Course Two', status: 'Published' }
        ]
      }
    ]
  })),
  fetchTrackManifest: vi.fn(() => Promise.resolve({ courses: [] }))
}));

describe('AdminPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Access Denied" if user is a student', async () => {
    roleManager.checkUserRole.mockResolvedValue('student');

    render(
      <MemoryRouter>
        <AdminPanel />
      </MemoryRouter>
    );

    const accessDeniedMsg = await screen.findByText(/Access Denied/i);
    expect(accessDeniedMsg).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Trigger Catalog Sync/i })).not.toBeInTheDocument();
  });

  it('renders admin tools and course list if user is an admin', async () => {
    roleManager.checkUserRole.mockResolvedValue('admin');

    render(
      <MemoryRouter>
        <AdminPanel />
      </MemoryRouter>
    );

    const title = await screen.findByText(/tridorian Admin Control Center/i);
    expect(title).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Trigger Catalog Sync/i })).toBeInTheDocument();

    // Verify course status listing
    expect(screen.getByText('Course One')).toBeInTheDocument();
    expect(screen.getByText('DRAFT')).toBeInTheDocument();
    expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
  });

  it('triggers GitHub Repository Dispatch sync webhook on Sync click', async () => {
    roleManager.checkUserRole.mockResolvedValue('admin');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Workflow dispatched' })
    });

    render(
      <MemoryRouter>
        <AdminPanel />
      </MemoryRouter>
    );

    const syncButton = await screen.findByRole('button', { name: /Trigger Catalog Sync/i });
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    
    expect(screen.getByText(/Sync action dispatched successfully/i)).toBeInTheDocument();
  });
});
