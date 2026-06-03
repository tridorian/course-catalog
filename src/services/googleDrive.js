/**
 * Google Drive API v3 interactions using appProperties and JSON file for progress tracking.
 */

import { getAccessToken, signIn } from './googleAuth';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';
const PROGRESS_FILE_NAME = 'agy_course_progress.json';
const LOCAL_STORAGE_KEY = 'agy_local_progress';
const OFFLINE_QUEUE_KEY = 'agy_offline_queue';

async function driveFetch(url, options = {}, retryCount = 0) {
  const token = getAccessToken();
  if (!token) {
    if (retryCount === 0) {
      await signIn();
      return driveFetch(url, options, retryCount + 1);
    }
    throw new Error('No access token available');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401 && retryCount < 1) {
      await signIn();
      return driveFetch(url, options, retryCount + 1);
    }

    if (!response.ok) {
      let errorMessage = 'Drive API error';
      try {
        const error = await response.json();
        errorMessage = error.error?.message || errorMessage;
      } catch (e) {
        // Fallback if response is not JSON
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) return null;
    return response.json();
  } catch (err) {
    if (err.message === 'NETWORK_ERROR') throw err;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new Error('NETWORK_ERROR');
    }
    if (err.name === 'TypeError') {
      throw new Error('NETWORK_ERROR');
    }
    throw err;
  }
}

/**
 * Gets local progress from localStorage.
 */
function getLocalProgress() {
  if (typeof localStorage === 'undefined') return {};
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : {};
}

/**
 * Saves progress to localStorage.
 */
function saveLocalProgress(progress) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
}

/**
 * Queues a progress update for offline sync.
 */
function queueOfflineUpdate(trackId, courseId, update) {
  if (typeof localStorage === 'undefined') return;
  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  queue.push({
    trackId,
    courseId,
    update,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Finds the progress file in Drive or creates it if it doesn't exist.
 */
export async function getProgressFile() {
  const q = `name = '${PROGRESS_FILE_NAME}' and spaces = 'appDataFolder' and trashed = false`;
  const data = await driveFetch(`${DRIVE_API_BASE}?q=${encodeURIComponent(q)}&spaces=appDataFolder&fields=files(id,appProperties)`);

  if (data.files && data.files.length > 0) {
    return data.files[0];
  }

  return driveFetch(`${DRIVE_API_BASE}?spaces=appDataFolder`, {
    method: 'POST',
    body: JSON.stringify({
      name: PROGRESS_FILE_NAME,
      parents: ['appDataFolder'],
      mimeType: 'application/json',
    })
  });
}

/**
 * Loads the comprehensive progress state.
 * Merges Drive state with local cache.
 */
export async function loadProgress() {
  let remoteProgress = {};
  let fileId = null;

  try {
    const file = await getProgressFile();
    fileId = file.id;
    remoteProgress = await driveFetch(`${DRIVE_API_BASE}/${fileId}?alt=media`);
  } catch (err) {
    console.warn('Failed to load progress from Drive, using local state:', err);
  }

  const localProgress = getLocalProgress();
  const merged = { ...remoteProgress, ...localProgress };
  saveLocalProgress(merged);

  return { progress: merged, fileId };
}

/**
 * Saves progress for a specific course.
 */
export async function saveCourseProgress(trackId, courseId, activeModuleId, completedIndices) {
  const lastUpdated = new Date().toISOString();
  const update = {
    activeModuleId: String(activeModuleId),
    completedIndices: completedIndices.map(String),
    lastUpdated
  };

  const fullProgress = getLocalProgress();
  fullProgress[`${trackId}_${courseId}`] = update;
  saveLocalProgress(fullProgress);

  const appProperties = {
    [`progress_${trackId}_${courseId}_active`]: String(activeModuleId),
    [`progress_${trackId}_${courseId}_completed`]: completedIndices.join(','),
    'lastUpdated': lastUpdated
  };

  try {
    const file = await getProgressFile();
    const fileId = file.id;

    // Update metadata
    await driveFetch(`${DRIVE_API_BASE}/${fileId}`, {
      method: 'PATCH',
      body: JSON.stringify({ appProperties })
    });

    // Update content using driveFetch for re-auth and consistency
    await driveFetch(`${DRIVE_API_BASE}/${fileId}?uploadType=media`, {
      method: 'PATCH',
      body: JSON.stringify(fullProgress)
    });

  } catch (err) {
    if (err.message === 'NETWORK_ERROR') {
      queueOfflineUpdate(trackId, courseId, update);
    } else {
      throw err;
    }
  }
}

/**
 * Syncs the offline queue to Drive.
 */
export async function syncOfflineQueue() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  if (typeof localStorage === 'undefined') return;

  const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  if (queue.length === 0) return;

  try {
    const { progress: remoteProgress, fileId } = await loadProgress();
    const localProgress = getLocalProgress();
    const affectedCourses = new Set();

    queue.forEach(item => {
      const { trackId, courseId, update } = item;
      const key = `${trackId}_${courseId}`;
      affectedCourses.add(key);
      const existing = localProgress[key] || { completedIndices: [], lastUpdated: '0' };

      const completedSet = new Set([...existing.completedIndices, ...update.completedIndices]);

      if (new Date(update.lastUpdated) > new Date(existing.lastUpdated)) {
        localProgress[key] = {
          ...update,
          completedIndices: Array.from(completedSet)
        };
      } else {
        localProgress[key].completedIndices = Array.from(completedSet);
      }
    });

    // Update Drive metadata (appProperties) for all affected courses
    const appProperties = {
      'lastUpdated': new Date().toISOString()
    };
    affectedCourses.forEach(key => {
      const [trackId, courseId] = key.split('_');
      const progress = localProgress[key];
      appProperties[`progress_${trackId}_${courseId}_active`] = progress.activeModuleId;
      appProperties[`progress_${trackId}_${courseId}_completed`] = progress.completedIndices.join(',');
    });

    await driveFetch(`${DRIVE_API_BASE}/${fileId}`, {
      method: 'PATCH',
      body: JSON.stringify({ appProperties })
    });

    // Update Drive content
    await driveFetch(`${DRIVE_API_BASE}/${fileId}?uploadType=media`, {
      method: 'PATCH',
      body: JSON.stringify(localProgress)
    });

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
    }
    saveLocalProgress(localProgress);

  } catch (err) {
    console.error('Failed to sync offline queue:', err);
  }
}
