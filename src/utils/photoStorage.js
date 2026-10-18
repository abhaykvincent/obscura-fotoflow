/**
 * Project-Owned Photo Asset Storage Paths
 *
 * Canonical storage architecture for FotoFlow Photo Assets.
 *
 * Project = asset boundary. Photos live under the project, not the collection.
 *
 * Path patterns:
 *   web/{domain}/{projectId}/{photoId}.{ext}
 *   thumb/{domain}/{projectId}/{photoId}.{ext}
 *
 * collectionId is NEVER part of the canonical Photo Asset storage path.
 * The original filename is preserved in Photo metadata, not in the storage path.
 */

const WEB_PREFIX = 'web';
const THUMB_PREFIX = 'thumb';
const COVERS_PREFIX = 'covers';

/**
 * Extracts the file extension from a filename, lowercased, without the leading dot.
 * Returns 'jpg' as a safe default when no extension can be determined.
 */
export const extractExtension = (fileName) => {
    if (!fileName || typeof fileName !== 'string') return 'jpg';
    const parts = fileName.split('.');
    if (parts.length < 2) return 'jpg';
    return parts.pop().toLowerCase();
};

/**
 * Builds the canonical web storage path for a Project Photo.
 * @param {string} domain - studio domain
 * @param {string} projectId - project id
 * @param {string} photoId - canonical photo id (upload-generated fileId)
 * @param {string} fileName - original filename (used only for extension)
 * @returns {string} e.g. web/monalisa/proj-abc/photo-123.jpg
 */
export const getWebStoragePath = (domain, projectId, photoId, fileName) => {
    return `${WEB_PREFIX}/${domain}/${projectId}/${photoId}.${extractExtension(fileName)}`;
};

/**
 * Builds the canonical thumb storage path for a Project Photo.
 * @param {string} domain - studio domain
 * @param {string} projectId - project id
 * @param {string} photoId - canonical photo id
 * @param {string} fileName - original filename (used only for extension)
 * @returns {string} e.g. thumb/monalisa/proj-abc/photo-123.webp
 */
export const getThumbStoragePath = (domain, projectId, photoId, fileName) => {
    return `${THUMB_PREFIX}/${domain}/${projectId}/${photoId}.webp`;
};

/**
 * Returns both web and thumb storage paths for a photo.
 * Returns { webPath, thumbPath } matching the photo document storage schema.
 */
export const getPhotoStoragePaths = (domain, projectId, photoId, fileName) => ({
    webPath: getWebStoragePath(domain, projectId, photoId, fileName),
    thumbPath: getThumbStoragePath(domain, projectId, photoId, fileName),
});

/**
 * Extracts the photoId from a project-owned storage path.
 * Path format: {prefix}/{domain}/{projectId}/{photoId}.{ext}
 * Returns null if the path does not match the project-owned pattern.
 */
export const extractPhotoIdFromPath = (storagePath) => {
    if (!storagePath || typeof storagePath !== 'string') return null;
    const clean = storagePath.replace(/^\/+/, '');
    const segments = clean.split('/');
    // Expected: [prefix, domain, projectId, "photoId.ext"]
    if (segments.length < 4) return null;
    const fileSegment = segments[segments.length - 1];
    const photoId = fileSegment.split('.')[0];
    return photoId || null;
};

/**
 * Returns the cover storage path (project-level, unchanged by this refactor).
 */
export const getCoverStoragePath = (domain, projectId, fileName) => {
    return `${COVERS_PREFIX}/${domain}/${projectId}/${fileName}`;
};

export { WEB_PREFIX, THUMB_PREFIX, COVERS_PREFIX };
