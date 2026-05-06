/**
 * Google Drive API v3 interactions using appProperties for progress tracking.
 */

import { getAccessToken } from './googleAuth';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';
const PROGRESS_FILE_NAME = 'agv_course_progress.json';

async function driveFetch(url, options = {}) {
  const token = getAccessToken();
  if (!token) throw new Error('No access token available');

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Drive API error');
  }

  if (response.status === 204) return null;
  return response.json();
}

/**
 * Finds the progress file in Drive or creates it if it doesn't exist.
 * Returns the file metadata including appProperties.
 */
export async function getProgressFile() {
  const q = `name = '${PROGRESS_FILE_NAME}' and trashed = false`;
  const data = await driveFetch(`${DRIVE_API_BASE}?q=${encodeURIComponent(q)}&fields=files(id,appProperties)`);

  if (data.files && data.files.length > 0) {
    return data.files[0];
  }

  // Create file if not found
  return driveFetch(DRIVE_API_BASE, {
    method: 'POST',
    body: JSON.stringify({
      name: PROGRESS_FILE_NAME,
      mimeType: 'application/json',
      // Store initial progress in appProperties
      appProperties: {
        activeStepIndex: '0',
        lastUpdated: new Date().toISOString()
      }
    })
  });
}

/**
 * Updates the activeStepIndex in the file's appProperties.
 */
export async function saveProgress(fileId, stepIndex) {
  return driveFetch(`${DRIVE_API_BASE}/${fileId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      appProperties: {
        activeStepIndex: stepIndex.toString(),
        lastUpdated: new Date().toISOString()
      }
    })
  });
}
