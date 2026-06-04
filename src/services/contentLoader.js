let cache = new Map();

// Allow tests to clear the cache
export function clearCache() {
  cache.clear();
}

async function fetchWithCache(path, errorMessagePrefix, validateFn) {
  if (cache.has(path)) {
    // Return a deeply cloned object to avoid reference mutations by consumers
    const data = await cache.get(path);
    return JSON.parse(JSON.stringify(data));
  }

  const promise = fetch(path).then(async (response) => {
    if (!response.ok) {
      throw new Error(`${errorMessagePrefix}: ${response.statusText}`);
    }
    const data = await response.json();
    if (validateFn) {
      validateFn(data);
    }
    return data;
  }).catch(err => {
    cache.delete(path);
    throw err;
  });

  cache.set(path, promise);
  // Return a cloned copy so the cache remains unmutated
  const data = await promise;
  return JSON.parse(JSON.stringify(data));
}

/**
 * Fetches the root catalog listing all available tracks.
 */
export async function fetchCatalog() {
  const path = `/content/catalog.json`;
  return fetchWithCache(path, `Failed to load catalog`);
}

/**
 * Fetches a track manifest listing all courses in a track.
 */
export async function fetchTrackManifest(trackId) {
  const path = `/content/tracks/${trackId}/track.json`;
  // Preserving exact previous error message
  return fetchWithCache(path, `Track not found`).catch(err => {
      if (err.message.startsWith('Track not found:')) throw err;
      throw new Error(`Track not found: ${trackId}`);
  });
}

/**
 * Fetches the course manifest.
 */
export async function fetchCourseManifest(trackId, courseId) {
  const path = `/content/tracks/${trackId}/${courseId}/manifest.json`;
  return fetchWithCache(path, `Failed to load manifest`, validateManifest);
}

/**
 * Fetches course metadata.
 */
export async function fetchCourseMetadata(trackId, courseId, metadataFile) {
  const path = `/content/tracks/${trackId}/${courseId}/${metadataFile}`;
  return fetchWithCache(path, `Failed to load metadata`);
}

/**
 * Fetches module content.
 */
export async function fetchModuleContent(trackId, courseId, moduleFile) {
  const path = `/content/tracks/${trackId}/${courseId}/${moduleFile}`;
  return fetchWithCache(path, `Failed to load module content`, validateModule);
}

/**
 * Validates the course manifest structure.
 */
function validateManifest(manifest) {
  if (!manifest.metadata) {
    throw new Error('Invalid manifest: missing metadata field');
  }
  if (!Array.isArray(manifest.modules)) {
    throw new Error('Invalid manifest: modules must be an array');
  }
}

/**
 * Validates a module's structure.
 */
function validateModule(moduleData) {
  if (!moduleData.title) {
    throw new Error('Invalid module: missing title');
  }
  if (!moduleData.type) {
    moduleData.type = 'lab';
  }
  // Lab modules should have blocks
  if (moduleData.type === 'lab' && !Array.isArray(moduleData.blocks)) {
    throw new Error('Invalid lab module: missing blocks array');
  }
}
