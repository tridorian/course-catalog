import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadProgress, saveCourseProgress, syncOfflineQueue, getProgressFile } from '../../services/googleDrive';
import { getAccessToken, signIn } from '../../services/googleAuth';

// Mock googleAuth
vi.mock('../../services/googleAuth', () => ({
  getAccessToken: vi.fn(),
  signIn: vi.fn(),
}));

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';

describe('googleDrive service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
    // Default navigator.onLine to true
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
      writable: true,
    });

    // Provide a default implementation for fetch that returns a valid response object
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadProgress', () => {
    it('should load progress from Drive and merge with local storage', async () => {
      getAccessToken.mockReturnValue('fake-token');

      const mockFile = { id: 'file-123', appProperties: {} };
      const mockContent = { 'track-1_course-1': { activeModuleId: 'step-2', completedIndices: ['0', '1'], lastUpdated: '2023-01-01T00:00:00.000Z' } };

      // Mock getProgressFile search
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [mockFile] }),
      });

      // Mock file content fetch
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockContent,
      });

      const result = await loadProgress();

      expect(result.progress).toEqual(mockContent);
      expect(result.fileId).toBe('file-123');
      expect(JSON.parse(localStorage.getItem('agv_local_progress'))).toEqual(mockContent);
    });

    it('should use local storage if Drive fetch fails', async () => {
      getAccessToken.mockReturnValue('fake-token');
      const localData = { 'track-1_course-1': { activeModuleId: 'step-3', completedIndices: ['0', '1', '2'], lastUpdated: '2023-01-02T00:00:00.000Z' } };
      localStorage.setItem('agv_local_progress', JSON.stringify(localData));

      fetch.mockRejectedValue(new Error('Drive unreachable'));

      const result = await loadProgress();

      expect(result.progress).toEqual(localData);
      expect(result.fileId).toBeNull();
    });
  });

  describe('saveCourseProgress', () => {
    it('should save progress to Drive and localStorage', async () => {
      getAccessToken.mockReturnValue('fake-token');
      const mockFile = { id: 'file-123' };

      // Mock getProgressFile search
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ files: [mockFile] }),
      });

      // Mock metadata PATCH
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      // Mock content PATCH (media upload)
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await saveCourseProgress('track-1', 'course-1', 'step-5', [0, 1, 2, 3, 4]);

      const localProgress = JSON.parse(localStorage.getItem('agv_local_progress'));
      expect(localProgress['track-1_course-1'].activeModuleId).toBe('step-5');
      expect(localProgress['track-1_course-1'].completedIndices).toEqual(['0', '1', '2', '3', '4']);

      // Verify metadata PATCH call
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${DRIVE_API_BASE}/file-123`),
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('progress_track-1_course-1_active'),
        })
      );
    });

    it('should queue update if offline', async () => {
      getAccessToken.mockReturnValue('fake-token');
      Object.defineProperty(navigator, 'onLine', { value: false });

      // driveFetch should throw NETWORK_ERROR
      fetch.mockImplementation(() => { throw { name: 'TypeError' }; });

      await saveCourseProgress('track-1', 'course-1', 'step-5', [0, 1, 2]);

      const queue = JSON.parse(localStorage.getItem('agv_offline_queue'));
      expect(queue).toHaveLength(1);
      expect(queue[0].trackId).toBe('track-1');
      expect(queue[0].update.activeModuleId).toBe('step-5');
    });
  });

  describe('syncOfflineQueue', () => {
    it('should merge queued items and upload to Drive', async () => {
      getAccessToken.mockReturnValue('fake-token');

      const offlineQueue = [
        {
          trackId: 'track-1',
          courseId: 'course-1',
          update: { activeModuleId: 'step-2', completedIndices: ['0', '1'], lastUpdated: '2023-01-02T00:00:00.000Z' }
        }
      ];
      localStorage.setItem('agv_offline_queue', JSON.stringify(offlineQueue));

      const localData = {
        'track-1_course-1': { activeModuleId: 'step-1', completedIndices: ['0'], lastUpdated: '2023-01-01T00:00:00.000Z' }
      };
      localStorage.setItem('agv_local_progress', JSON.stringify(localData));

      // Mock loadProgress calls
      // 1. getProgressFile
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [{ id: 'file-123' }] }),
      });
      // 2. driveFetch content
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      // 3. Media upload PATCH
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await syncOfflineQueue();

      const mergedProgress = JSON.parse(localStorage.getItem('agv_local_progress'));
      expect(mergedProgress['track-1_course-1'].activeModuleId).toBe('step-2');
      expect(mergedProgress['track-1_course-1'].completedIndices).toEqual(['0', '1']);
      expect(localStorage.getItem('agv_offline_queue')).toBeNull();
    });
  });

  describe('driveFetch 401 handling', () => {
    it('should retry once if 401 encountered', async () => {
      fetch.mockClear();
      getAccessToken.mockReturnValue('fresh-token');

      // First call returns 401
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: { get: () => 'application/json' },
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      // signIn will be called
      signIn.mockResolvedValueOnce({});

      // Second call (retry) returns success
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ files: [{ id: 'test-id' }] }),
      });

      const q = `name = 'test'`;
      await getProgressFile(); // This calls driveFetch

      expect(signIn).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer fresh-token',
          }),
        })
      );
    });
  });
});
