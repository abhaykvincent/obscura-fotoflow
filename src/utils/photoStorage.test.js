import {
    getWebStoragePath,
    getThumbStoragePath,
    getPhotoStoragePaths,
    extractExtension,
    extractPhotoIdFromPath,
    getCoverStoragePath,
} from './photoStorage';

describe('photoStorage - Project-Owned Photo Asset Storage Paths', () => {
    const domain = 'monalisa';
    const projectId = 'chris-antony-B4o7m';
    const photoId = 'session_123_file_0_abc123';
    const fileName = 'IM_00005.jpg';

    describe('extractExtension', () => {
        it('extracts lowercase extension from filename', () => {
            expect(extractExtension('IM_00005.jpg')).toBe('jpg');
            expect(extractExtension('photo.PNG')).toBe('png');
            expect(extractExtension('image.JPEG')).toBe('jpeg');
        });

        it('defaults to jpg when no extension', () => {
            expect(extractExtension('filename')).toBe('jpg');
            expect(extractExtension('')).toBe('jpg');
        });
    });

    describe('getWebStoragePath', () => {
        it('returns project-owned web path without collectionId', () => {
            const path = getWebStoragePath(domain, projectId, photoId, fileName);
            expect(path).toBe(`web/${domain}/${projectId}/${photoId}.jpg`);
        });

        it('does not contain collectionId in the path', () => {
            const path = getWebStoragePath(domain, projectId, photoId, fileName);
            expect(path).not.toMatch(/collection/);
            expect(path.split('/')).not.toContain('birthday-qr22E');
        });
    });

    describe('getThumbStoragePath', () => {
        it('returns project-owned thumb path with webp extension', () => {
            const path = getThumbStoragePath(domain, projectId, photoId, fileName);
            expect(path).toBe(`thumb/${domain}/${projectId}/${photoId}.webp`);
        });
    });

    describe('getPhotoStoragePaths', () => {
        it('returns both webPath and thumbPath', () => {
            const paths = getPhotoStoragePaths(domain, projectId, photoId, fileName);
            expect(paths.webPath).toBe(`web/${domain}/${projectId}/${photoId}.jpg`);
            expect(paths.thumbPath).toBe(`thumb/${domain}/${projectId}/${photoId}.webp`);
        });
    });

    describe('extractPhotoIdFromPath', () => {
        it('extracts photoId from web path', () => {
            const path = `web/${domain}/${projectId}/${photoId}.jpg`;
            expect(extractPhotoIdFromPath(path)).toBe(photoId);
        });

        it('extracts photoId from thumb path', () => {
            const path = `thumb/${domain}/${projectId}/${photoId}.webp`;
            expect(extractPhotoIdFromPath(path)).toBe(photoId);
        });

        it('returns null for non-matching paths', () => {
            expect(extractPhotoIdFromPath('')).toBe(null);
            expect(extractPhotoIdFromPath('web/monalisa')).toBe(null);
            expect(extractPhotoIdFromPath('covers/monalisa/proj-abc/cover.jpg')).toBe('cover');
        });
    });

    describe('getCoverStoragePath', () => {
        it('returns project-level cover path', () => {
            const path = getCoverStoragePath(domain, projectId, fileName);
            expect(path).toBe(`covers/${domain}/${projectId}/${fileName}`);
        });
    });

    describe('canonical path rules', () => {
        it('web and thumb paths share the same photoId', () => {
            const webPath = getWebStoragePath(domain, projectId, photoId, fileName);
            const thumbPath = getThumbStoragePath(domain, projectId, photoId, fileName);
            expect(extractPhotoIdFromPath(webPath)).toBe(extractPhotoIdFromPath(thumbPath));
        });

        it('same photoId produces deterministic paths regardless of filename', () => {
            const path1 = getWebStoragePath(domain, projectId, photoId, 'IMG_0001.jpg');
            const path2 = getWebStoragePath(domain, projectId, photoId, 'IMG_0002.jpg');
            expect(path1).toBe(path2);
        });
    });
});
