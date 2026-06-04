import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getProgressFile, saveCourseProgress, loadProgress, syncOfflineQueue, syncProgressToDrive } from '../services/googleDrive';
import { getAccessToken, signIn } from '../services/googleAuth';

vi.mock('../services/googleAuth', () => ({
  getAccessToken: vi.fn(),
  signIn: vi.fn(),
}));

describe('googleDrive service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getProgressFile', () => {
    it('throws error when no access token is available after signIn retry', async () => {
      getAccessToken.mockReturnValue(null);
      signIn.mockResolvedValue({ access_token: null });
      await expect(getProgressFile()).rejects.toThrow('No access token available');
    });

    it('returns existing file when file is found', async () => {
      getAccessToken.mockReturnValue('fake-token');
      const mockFile = { id: 'file-123', appProperties: { activeStepIndex: '2' } };
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ files: [mockFile] }),
      });

      const result = await getProgressFile();
      expect(result).toEqual(mockFile);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("name%20%3D%20'agy_course_progress.json'"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
          }),
        })
      );
    });

    it('creates a new file when file is not found', async () => {
      getAccessToken.mockReturnValue('fake-token');
      const newFile = { id: 'new-file-123', appProperties: { activeStepIndex: '0' } };

      // First fetch returns empty files array
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ files: [] }),
      });

      // Second fetch (POST) returns the new file
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => newFile,
      });

      const result = await getProgressFile();
      expect(result).toEqual(newFile);

      // Verify POST request
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'agy_course_progress.json',
            parents: ['appDataFolder'],
            mimeType: 'application/json',
          }),
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('loadProgress', () => {
    it('returns local progress when no access token is available', async () => {
      getAccessToken.mockReturnValue(null);
      localStorage.setItem('agy_local_progress', JSON.stringify({ 'track1_course1': { activeModuleId: '1' } }));
      const result = await loadProgress();
      expect(result).toEqual({
        progress: { 'track1_course1': { activeModuleId: '1' } },
        fileId: null
      });
    });

    it('loads and merges remote progress when token is available', async () => {
      getAccessToken.mockReturnValue('fake-token');
      localStorage.setItem('agy_local_progress', JSON.stringify({ 'track1_course1': { activeModuleId: '1' } }));

      // Mock getProgressFile return
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ files: [{ id: 'file-123' }] }),
      });

      // Mock driveFetch for file content
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ 'track1_course2': { activeModuleId: '2' } }),
      });

      const result = await loadProgress();
      expect(result.fileId).toBe('file-123');
      expect(result.progress).toEqual({
        'track1_course1': { activeModuleId: '1' },
        'track1_course2': { activeModuleId: '2' }
      });
    });
  });

  describe('saveCourseProgress', () => {
    it('saves progress to local storage and updates Drive', async () => {
      getAccessToken.mockReturnValue('fake-token');

      // Mock getProgressFile search (GET)
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ files: [{ id: 'file-123' }] }),
      });

      // Mock PATCH metadata (appProperties)
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      // Mock PATCH media content
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await saveCourseProgress('track-1', 'course-2', 3, [1, 2]);

      const localProgress = JSON.parse(localStorage.getItem('agy_local_progress'));
      expect(localProgress['track-1_course-2']).toEqual({
        activeModuleId: '3',
        completedIndices: ['1', '2'],
        lastUpdated: '2024-01-01T00:00:00.000Z'
      });

      // Verify the PATCH metadata call
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'https://www.googleapis.com/drive/v3/files/file-123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            appProperties: {
              'progress_track-1_course-2_active': '3',
              'progress_track-1_course-2_completed': '1,2',
              'lastUpdated': '2024-01-01T00:00:00.000Z'
            }
          })
        })
      );

      // Verify the PATCH media call
      expect(global.fetch).toHaveBeenNthCalledWith(
        3,
        'https://www.googleapis.com/drive/v3/files/file-123?uploadType=media',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            'track-1_course-2': {
              activeModuleId: '3',
              completedIndices: ['1', '2'],
              lastUpdated: '2024-01-01T00:00:00.000Z'
            }
          })
        })
      );
    });
  });

  describe('syncOfflineQueue', () => {
    it('syncs offline items to Drive and resolves queue', async () => {
      getAccessToken.mockReturnValue('fake-token');

      // Set up local storage queue and initial progress
      localStorage.setItem('agy_offline_queue', JSON.stringify([
        {
          trackId: 'track-1',
          courseId: 'course-2',
          update: {
            activeModuleId: '3',
            completedIndices: ['1', '2'],
            lastUpdated: '2024-01-01T00:00:00.000Z'
          }
        }
      ]));

      // Mock loadProgress (1. getProgressFile search, 2. fetch media content)
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ files: [{ id: 'file-123' }] }),
      });
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      // Mock PATCH metadata
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      // Mock PATCH media content
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await syncOfflineQueue();

      expect(localStorage.getItem('agy_offline_queue')).toBeNull();
      const localProgress = JSON.parse(localStorage.getItem('agy_local_progress'));
      expect(localProgress['track-1_course-2'].activeModuleId).toBe('3');
    });
  });

  describe('syncProgressToDrive', () => {
    it('syncs current local progress to Drive', async () => {
      getAccessToken.mockReturnValue('fake-token');
      localStorage.setItem('agy_local_progress', JSON.stringify({
        'theme_config': { theme: 'dark' }
      }));

      // Mock getProgressFile (GET)
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ files: [{ id: 'file-123' }] }),
      });

      // Mock PATCH media content
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await syncProgressToDrive();

      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        'https://www.googleapis.com/drive/v3/files/file-123?uploadType=media',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            'theme_config': { theme: 'dark' }
          })
        })
      );
    });
  });
});
