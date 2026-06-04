import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getProgressFile, saveProgress } from '../services/googleDrive';
import { getAccessToken } from '../services/googleAuth';

vi.mock('../services/googleAuth', () => ({
  getAccessToken: vi.fn(),
}));

describe('googleDrive service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
    // Mock date to ensure consistent JSON body matching if needed,
    // but we can also use expect.stringContaining
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getProgressFile', () => {
    it('throws error when no access token is available', async () => {
      getAccessToken.mockReturnValue(null);
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
        expect.stringContaining("name%20%3D%20'agv_course_progress.json'"),
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
        'https://www.googleapis.com/drive/v3/files',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'agv_course_progress.json',
            mimeType: 'application/json',
            appProperties: {
              activeStepIndex: '0',
              lastUpdated: '2024-01-01T00:00:00.000Z'
            }
          }),
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('throws error when Drive API returns an error response', async () => {
      getAccessToken.mockReturnValue('fake-token');
      global.fetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: { message: 'Insufficient permissions' } }),
      });

      await expect(getProgressFile()).rejects.toThrow('Insufficient permissions');
    });

    it('throws generic error when Drive API returns an error without message', async () => {
      getAccessToken.mockReturnValue('fake-token');
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: {} }),
      });

      await expect(getProgressFile()).rejects.toThrow('Drive API error');
    });
  });

  describe('saveProgress', () => {
    it('throws error when no access token is available', async () => {
      getAccessToken.mockReturnValue(null);
      await expect(saveProgress('file-123', 3)).rejects.toThrow('No access token available');
    });

    it('updates file progress successfully', async () => {
      getAccessToken.mockReturnValue('fake-token');
      const updatedFile = { id: 'file-123', appProperties: { activeStepIndex: '3' } };

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => updatedFile,
      });

      const result = await saveProgress('file-123', 3);
      expect(result).toEqual(updatedFile);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/drive/v3/files/file-123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            appProperties: {
              activeStepIndex: '3',
              lastUpdated: '2024-01-01T00:00:00.000Z'
            }
          }),
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('returns null when response status is 204', async () => {
      getAccessToken.mockReturnValue('fake-token');

      global.fetch.mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await saveProgress('file-123', 3);
      expect(result).toBeNull();
    });
  });
});
