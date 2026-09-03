import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AppContent from '../../components/AppContent';
import { AuthContext } from '../../context/AuthContext';
import * as contentLoader from '../../services/contentLoader';
import * as roleManager from '../../services/roleManager';

vi.mock('../../services/contentLoader');
vi.mock('../../services/roleManager');
vi.mock('../../services/googleDrive', () => ({
  loadProgress: vi.fn().mockResolvedValue({ progress: {}, fileId: null }),
  saveCourseProgress: vi.fn().mockResolvedValue({}),
  syncOfflineQueue: vi.fn()
}));
vi.mock('../../services/googleAuth', () => ({
  getAccessToken: vi.fn().mockReturnValue(null),
  signIn: vi.fn().mockResolvedValue({ access_token: 'mock-token' }),
  signOut: vi.fn(),
  initGoogleAuth: vi.fn().mockResolvedValue(true)
}));

const mockManifest = {
  metadata: 'metadata.json',
  modules: [
    { id: 'mod-1', title: 'Module 1 - Intro', file: 'mod1.json' },
    { id: 'mod-2', title: 'Module 2 - Deep Dive', file: 'mod2.json' },
    { id: 'mod-3', title: 'Module 3 - Advanced', file: 'mod3.json' },
    { id: 'mod-4', title: 'Module 4 - Lab', file: 'mod4.json' },
    { id: 'mod-5', title: 'Module 5 - Capstone', file: 'mod5.json' }
  ]
};

const mockMetadata = {
  title: 'Agentic Engineering Mastery'
};

describe('20% Course Preview Gating in AppContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    roleManager.checkUserRole.mockResolvedValue('student');
    contentLoader.fetchCourseManifest.mockResolvedValue(mockManifest);
    contentLoader.fetchCourseMetadata.mockResolvedValue(mockMetadata);
    contentLoader.fetchTrackManifest.mockResolvedValue({
      track_id: 'agentic-track',
      title: 'Agentic Track',
      courses: [{ id: 'course-1', title: 'Agentic Engineering Mastery' }]
    });

    contentLoader.fetchModuleContent.mockImplementation((trackId, courseId, file) => {
      const modId = file.replace('.json', '');
      return Promise.resolve({
        id: `mod-${modId.replace('mod', '')}`,
        title: `Module ${modId.replace('mod', '')} Content`,
        type: 'lab',
        blocks: [
          { type: 'h1', content: `Lab Block for ${modId}` },
          { type: 'p', content: `Secret instructions for ${modId}` }
        ]
      });
    });
  });

  const renderWithAuth = (initialPath, authValue) => {
    return render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/:trackId/:courseId" element={<AppContent theme="dark" setTheme={() => {}} />} />
            <Route path="/:trackId/:courseId/:moduleId" element={<AppContent theme="dark" setTheme={() => {}} />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('allows unauthenticated users to access modules within the first 20% preview limit', async () => {
    const unauthContext = {
      user: null,
      role: 'student',
      token: null,
      isAuthenticated: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn()
    };

    // 5 modules total -> 20% limit = ceil(5 * 0.2) = 1 preview module (mod-1 at index 0)
    renderWithAuth('/agentic-track/course-1/mod-1', unauthContext);

    await waitFor(() => {
      expect(screen.getByText('Lab Block for mod1')).toBeInTheDocument();
    });

    // Lock card should NOT be shown for mod-1
    expect(screen.queryByText(/Unlock Full Course Access/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/PREVIEW LIMIT REACHED/i)).not.toBeInTheDocument();
  });

  it('gates access with sleek lock card for unauthenticated users past the 20% limit', async () => {
    const unauthContext = {
      user: null,
      role: 'student',
      token: null,
      isAuthenticated: false,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn()
    };

    // mod-2 is at index 1 >= previewModuleLimit (1) -> MUST be gated
    renderWithAuth('/agentic-track/course-1/mod-2', unauthContext);

    await waitFor(() => {
      expect(screen.getByText(/Unlock Full Course Access/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/PREVIEW LIMIT REACHED: You are previewing the first 20% of this course/i)).toBeInTheDocument();
    // Lab content must NOT be exposed
    expect(screen.queryByText('Lab Block for mod2')).not.toBeInTheDocument();
    expect(screen.queryByText('Secret instructions for mod2')).not.toBeInTheDocument();

    // Footer unlock button must be present
    expect(screen.getByRole('button', { name: /Sign In with Google to Unlock/i })).toBeInTheDocument();
  });

  it('triggers signIn() when user clicks "Sign In with Google" on the preview limit card', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({});
    const unauthContext = {
      user: null,
      role: 'student',
      token: null,
      isAuthenticated: false,
      isLoading: false,
      signIn: mockSignIn,
      signOut: vi.fn()
    };

    renderWithAuth('/agentic-track/course-1/mod-2', unauthContext);

    await waitFor(() => {
      expect(screen.getByText(/Unlock Full Course Access/i)).toBeInTheDocument();
    });

    const signInButtons = screen.getAllByRole('button', { name: /Sign In with Google/i });
    expect(signInButtons.length).toBeGreaterThan(0);

    fireEvent.click(signInButtons[0]);
    expect(mockSignIn).toHaveBeenCalled();
  });

  it('fully unlocks all modules when user is authenticated', async () => {
    const authContext = {
      user: { email: 'engineer@tridorian.com', name: 'Engineer', role: 'student' },
      role: 'student',
      token: 'valid-jwt',
      isAuthenticated: true,
      isLoading: false,
      signIn: vi.fn(),
      signOut: vi.fn()
    };

    // mod-3 (index 2) is beyond 20%, but authenticated user has full access
    renderWithAuth('/agentic-track/course-1/mod-3', authContext);

    await waitFor(() => {
      expect(screen.getByText('Lab Block for mod3')).toBeInTheDocument();
    });

    expect(screen.getByText('Secret instructions for mod3')).toBeInTheDocument();
    expect(screen.queryByText(/Unlock Full Course Access/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/PREVIEW LIMIT REACHED/i)).not.toBeInTheDocument();
  });
});
