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
  fetchTrackManifest: vi.fn(() => Promise.resolve({ courses: [] })),
  fetchSyncConfig: vi.fn(() => Promise.resolve([]))
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

  it('triggers GitHub Repository Dispatch sync webhook on Sync click and displays workflow link', async () => {
    roleManager.checkUserRole.mockResolvedValue('admin');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        message: 'Catalog sync dispatched! GitHub Action is pulling Google Docs and deploying to Cloud Run.',
        workflowUrl: 'https://github.com/tridorian/course-catalog/actions/workflows/content-sync.yml'
      })
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

    const [calledUrl, calledOptions] = global.fetch.mock.calls[0];
    expect(calledUrl).toContain('/sync-catalog');
    expect(calledOptions.method).toBe('POST');
    expect(JSON.parse(calledOptions.body)).toHaveProperty('email');
    
    expect(await screen.findByText(/Sync Action Dispatched Successfully/i)).toBeInTheDocument();
    expect(screen.getByText(/Catalog sync dispatched! GitHub Action is pulling Google Docs and deploying to Cloud Run./i)).toBeInTheDocument();
    const workflowLink = screen.getByRole('link', { name: /View GitHub Actions Workflow/i });
    expect(workflowLink).toHaveAttribute('href', 'https://github.com/tridorian/course-catalog/actions/workflows/content-sync.yml');
  });

  it('handles sync dispatch errors and displays fallback button to GitHub Actions', async () => {
    roleManager.checkUserRole.mockResolvedValue('admin');
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 200,
      json: () => Promise.resolve({
        success: false,
        error: 'GITHUB_DISPATCH_TOKEN not set on server. You can trigger sync manually via GitHub Actions.',
        workflowUrl: 'https://github.com/tridorian/course-catalog/actions/workflows/content-sync.yml'
      })
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

    expect(await screen.findByText(/Sync Dispatch Encountered an Issue/i)).toBeInTheDocument();
    expect(screen.getByText(/GITHUB_DISPATCH_TOKEN not set on server/i)).toBeInTheDocument();
    const fallbackButton = screen.getByRole('link', { name: /Trigger via GitHub Actions/i });
    expect(fallbackButton).toHaveAttribute('href', 'https://github.com/tridorian/course-catalog/actions/workflows/content-sync.yml');
  });
});
