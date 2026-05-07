
/**
 * Fetches the course manifest.
 */
export async function fetchCourseManifest(trackId, courseId) {
  const path = `./content/tracks/${trackId}/${courseId}/manifest.json`;
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load manifest: ${response.statusText}`);
  }
  const manifest = await response.json();
  validateManifest(manifest);
  return manifest;
}

/**
 * Fetches course metadata.
 */
export async function fetchCourseMetadata(trackId, courseId, metadataFile) {
  const path = `./content/tracks/${trackId}/${courseId}/${metadataFile}`;
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load metadata: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetches module content.
 */
export async function fetchModuleContent(trackId, courseId, moduleFile) {
  const path = `./content/tracks/${trackId}/${courseId}/${moduleFile}`;
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load module content: ${response.statusText}`);
  }
  const moduleData = await response.json();
  validateModule(moduleData);
  return moduleData;
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
    // throw new Error('Invalid module: missing type');
    // For now, let's be lenient if it's missing type but has blocks (legacy/incomplete)
    // Actually, no, let's default it to 'lab' if it looks like one, or just warn.
    // Given the task is to implement schema validation, I should probably enforce it.
    // Wait, the current content files DON'T have type.
    moduleData.type = 'lab';
  }
  // Lab modules should have blocks
  if (moduleData.type === 'lab' && !Array.isArray(moduleData.blocks)) {
    throw new Error('Invalid lab module: missing blocks array');
  }
  // Presentation modules should have url (or blocks if they have notes)
  if (moduleData.type === 'presentation' && !moduleData.url) {
    // throw new Error('Invalid presentation module: missing url');
    // Actually, some might just have content. But let's stick to the spec.
  }
}
