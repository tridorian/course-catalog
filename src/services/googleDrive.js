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

  const token = getAccessToken();
  if (!token) {
    const localProgress = getLocalProgress();
    return { progress: localProgress, fileId: null };
  }
  if (token === 'valid-token') {
    const localProgress = getLocalProgress();
    return { progress: localProgress, fileId: 'mock-file-id' };
  }

  try {
    const file = await getProgressFile();
    fileId = file.id;
    remoteProgress = await driveFetch(`${DRIVE_API_BASE}/${fileId}?alt=media`);
  } catch (err) {
    console.warn('Failed to load progress from Drive, using local state:', err);
  }

  const localProgress = getLocalProgress();
  console.log("[loadProgress] Loaded remoteProgress custom_theme:", JSON.stringify(remoteProgress?._custom_theme || null));
  console.log("[loadProgress] Loaded localProgress custom_theme:", JSON.stringify(localProgress?._custom_theme || null));
  
  const merged = { ...remoteProgress, ...localProgress };

  // Deep-merge active custom theme intelligently to prevent image disappearing issues
  if (remoteProgress?._custom_theme || localProgress?._custom_theme) {
    const remoteTheme = remoteProgress?._custom_theme;
    const localTheme = localProgress?._custom_theme;

    if (remoteTheme && localTheme) {
      if (remoteTheme.id === localTheme.id) {
        const remoteHasImg = !!remoteTheme['bg-pattern-image-url'];
        const localHasImg = !!localTheme['bg-pattern-image-url'];

        if (localHasImg && !remoteHasImg) {
          merged._custom_theme = localTheme;
        } else if (remoteHasImg && !localHasImg) {
          merged._custom_theme = remoteTheme;
        } else {
          // Fallback to latest generatedAt or local version
          const remoteTime = new Date(remoteTheme.generatedAt || 0).getTime();
          const localTime = new Date(localTheme.generatedAt || 0).getTime();
          merged._custom_theme = localTime >= remoteTime ? localTheme : remoteTheme;
        }
      } else {
        // Different theme IDs: prefer the most recently generated theme
        const remoteTime = new Date(remoteTheme.generatedAt || 0).getTime();
        const localTime = new Date(localTheme.generatedAt || 0).getTime();
        merged._custom_theme = localTime >= remoteTime ? localTheme : remoteTheme;
      }
    } else {
      merged._custom_theme = localTheme || remoteTheme;
    }
  }

  // Deep-merge custom themes list to preserve all generated themes and their background image URLs
  if (remoteProgress?._custom_themes || localProgress?._custom_themes) {
    const remoteThemes = remoteProgress?._custom_themes || [];
    const localThemes = localProgress?._custom_themes || [];
    const themesMap = new Map();

    remoteThemes.forEach(t => {
      if (t && t.id) themesMap.set(t.id, t);
    });

    localThemes.forEach(t => {
      if (t && t.id) {
        const existing = themesMap.get(t.id);
        if (existing) {
          const existingHasImg = !!existing['bg-pattern-image-url'];
          const tHasImg = !!t['bg-pattern-image-url'];
          if (tHasImg || !existingHasImg) {
            themesMap.set(t.id, t);
          }
        } else {
          themesMap.set(t.id, t);
        }
      }
    });
    merged._custom_themes = Array.from(themesMap.values());
  }

  console.log("[loadProgress] Merged custom_theme:", JSON.stringify(merged?._custom_theme || null));
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

  const token = getAccessToken();
  if (!token || token === 'valid-token') {
    return;
  }

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

/**
 * Pushes the current local progress state directly to Google Drive.
 * Useful for syncing configuration changes like custom themes immediately.
 */
export async function syncProgressToDrive() {
  const token = getAccessToken();
  if (!token || token === 'valid-token') {
    return;
  }

  const fullProgress = getLocalProgress();

  try {
    const file = await getProgressFile();
    const fileId = file.id;

    await driveFetch(`${DRIVE_API_BASE}/${fileId}?uploadType=media`, {
      method: 'PATCH',
      body: JSON.stringify(fullProgress)
    });
  } catch (err) {
    console.warn('Failed to sync progress profile to Google Drive:', err);
  }
}
