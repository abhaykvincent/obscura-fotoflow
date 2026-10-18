import { mergeCollectionPhotos } from './file-firestore';

describe('file-firestore - Collection photo union read', () => {
    const canonicalPhoto = (overrides = {}) => ({
        id: 'session_123_file_0_abc123',
        photoId: 'session_123_file_0_abc123',
        name: 'IM_00005.jpg',
        url: 'https://cdn.fotoflow.co/web/monalisa/proj-1/session_123_file_0_abc123.jpg',
        thumbUrl: 'https://cdn.fotoflow.co/thumb/monalisa/proj-1/session_123_file_0_abc123.webp',
        ...overrides,
    });

    const legacyPhoto = (overrides = {}) => ({
        name: 'IMG_0001.jpg',
        fileId: 'legacy_file_1',
        url: 'https://cdn.fotoflow.co/web/monalisa/proj-1/coll-1/IMG_0001.jpg',
        thumbUrl: 'https://cdn.fotoflow.co/thumb/monalisa/proj-1/coll-1/IMG_0001.webp',
        ...overrides,
    });

    describe('mergeCollectionPhotos', () => {
        it('regression: keeps legacy photos when new Project Photos exist (mixed project)', () => {
            const merged = mergeCollectionPhotos([canonicalPhoto()], [legacyPhoto()]);

            expect(merged).toHaveLength(2);
            expect(merged.map((p) => p.name)).toContain('IM_00005.jpg');
            expect(merged.map((p) => p.name)).toContain('IMG_0001.jpg');
        });

        it('returns legacy photos when no Project Photos exist yet', () => {
            const merged = mergeCollectionPhotos([], [legacyPhoto()]);
            expect(merged).toHaveLength(1);
            expect(merged[0].fileId).toBe('legacy_file_1');
        });

        it('returns Project Photos when no legacy uploadedFiles exist', () => {
            const merged = mergeCollectionPhotos([canonicalPhoto()], []);
            expect(merged).toHaveLength(1);
            expect(merged[0].photoId).toBe('session_123_file_0_abc123');
        });

        it('dedupes a legacy entry by fileId when already migrated to a Project Photo', () => {
            const legacy = legacyPhoto({ fileId: 'session_123_file_0_abc123' });
            const merged = mergeCollectionPhotos([canonicalPhoto()], [legacy]);

            expect(merged).toHaveLength(1);
            expect(merged[0].photoId).toBe('session_123_file_0_abc123');
        });

        it('dedupes a legacy entry by url when already migrated to a Project Photo', () => {
            const canonical = canonicalPhoto({
                url: 'https://cdn.fotoflow.co/web/monalisa/proj-1/legacy.jpg',
                thumbUrl: '',
            });
            const legacy = legacyPhoto({
                fileId: undefined,
                url: 'https://cdn.fotoflow.co/web/monalisa/proj-1/legacy.jpg',
            });
            const merged = mergeCollectionPhotos([canonical], [legacy]);

            expect(merged).toHaveLength(1);
        });

        it('keeps different photos that share an original filename', () => {
            const canonical = canonicalPhoto({ name: 'IMG_0001.jpg' });
            const legacy = legacyPhoto({ name: 'IMG_0001.jpg', fileId: 'legacy_file_1' });
            const merged = mergeCollectionPhotos([canonical], [legacy]);

            expect(merged).toHaveLength(2);
        });

        it('sorts the union by name', () => {
            const merged = mergeCollectionPhotos(
                [canonicalPhoto({ name: 'C.jpg' })],
                [
                    legacyPhoto({ name: 'A.jpg', fileId: 'legacy_file_1' }),
                    legacyPhoto({
                        name: 'B.jpg',
                        fileId: 'legacy_file_2',
                        url: 'https://cdn.fotoflow.co/web/monalisa/proj-1/coll-1/B.jpg',
                    }),
                ]
            );

            expect(merged.map((p) => p.name)).toEqual(['A.jpg', 'B.jpg', 'C.jpg']);
        });

        it('handles missing/empty inputs', () => {
            expect(mergeCollectionPhotos()).toEqual([]);
            expect(mergeCollectionPhotos(undefined, [legacyPhoto()])).toHaveLength(1);
        });
    });
});
