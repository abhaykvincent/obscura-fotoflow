import {
    buildProjectPhoto,
    legacyPhotoToPhotoInput,
} from './photo-firestore';

describe('photo-firestore - Canonical Photo Model', () => {
    const domain = 'monalisa';
    const projectId = 'chris-antony-B4o7m';
    const photoId = 'session_123_file_0_abc123';

    describe('buildProjectPhoto', () => {
        it('creates canonical photo document with all required fields', () => {
            const photo = buildProjectPhoto({
                domain,
                projectId,
                photoId,
                name: 'IM_00005.jpg',
                originalSize: 2457600,
                lastModified: 1700000000000,
                dateTimeOriginal: '2023-06-15T10:30:00Z',
                dimensions: { width: 4032, height: 3024 },
                urls: {
                    web: 'https://cdn.fotoflow.co/web/monalisa/proj-abc/photo-123.jpg',
                    thumb: 'https://cdn.fotoflow.co/thumb/monalisa/proj-abc/photo-123.webp',
                },
                storage: {
                    webPath: 'web/monalisa/proj-abc/photo-123.jpg',
                    thumbPath: 'thumb/monalisa/proj-abc/photo-123.webp',
                },
                status: 'active',
                collectionId: 'birthday-qr22E',
            });

            expect(photo.id).toBe(photoId);
            expect(photo.name).toBe('IM_00005.jpg');
            expect(photo.originalSize).toBe(2457600);
            expect(photo.dateTimeOriginal).toBe('2023-06-15T10:30:00Z');
            expect(photo.dimensions).toEqual({ width: 4032, height: 3024 });
            expect(photo.urls.web).toContain('cdn.fotoflow.co');
            expect(photo.urls.thumb).toContain('cdn.fotoflow.co');
            expect(photo.storage.webPath).toBe('web/monalisa/proj-abc/photo-123.jpg');
            expect(photo.storage.thumbPath).toBe('thumb/monalisa/proj-abc/photo-123.webp');
            expect(photo.status).toBe('active');
            expect(photo.collectionIds).toEqual(['birthday-qr22E']);
            expect(photo.createdAt).toBeDefined();
            expect(photo.updatedAt).toBeDefined();
        });

        it('uses photoId as canonical identity, not filename', () => {
            const photo = buildProjectPhoto({
                domain, projectId, photoId,
                name: 'duplicate-name.jpg',
                originalSize: 1000,
                storage: { webPath: 'web/x.jpg', thumbPath: 'thumb/x.jpg' },
            });
            expect(photo.id).toBe(photoId);
            expect(photo.name).toBe('duplicate-name.jpg');
        });

        it('generates defaults for optional fields', () => {
            const photo = buildProjectPhoto({
                domain, projectId, photoId,
                name: 'test.jpg',
                storage: { webPath: 'web/x.jpg', thumbPath: 'thumb/x.jpg' },
            });
            expect(photo.originalSize).toBe(0);
            expect(photo.dimensions).toEqual({ width: 0, height: 0 });
            expect(photo.collectionIds).toEqual([]);
            expect(photo.status).toBe('active');
            expect(photo.dateTimeOriginal).toBeDefined();
        });
    });

    describe('legacyPhotoToPhotoInput', () => {
        it('converts legacy uploadedFiles object to canonical photo input', () => {
            const legacy = {
                name: 'IMG_0005.jpg',
                fileId: 'session_123_file_0_abc123',
                url: 'https://cdn.fotoflow.co/web/monalisa/proj-abc/coll-1/IMG_0005.jpg',
                thumbUrl: 'https://cdn.fotoflow.co/thumb/monalisa/proj-abc/coll-1/IMG_0005.webp',
                originalSize: 3000000,
                lastModified: 1700000000000,
                dateTimeOriginal: '2023-06-15T10:30:00Z',
                dimensions: { width: 4032, height: 3024 },
                status: 'selected',
            };

            const input = legacyPhotoToPhotoInput(legacy, domain, projectId);

            expect(input.photoId).toBe('session_123_file_0_abc123');
            expect(input.name).toBe('IMG_0005.jpg');
            expect(input.originalSize).toBe(3000000);
            expect(input.dateTimeOriginal).toBe('2023-06-15T10:30:00Z');
            expect(input.dimensions).toEqual({ width: 4032, height: 3024 });
            expect(input.status).toBe('selected');
            expect(input.urls.web).toBe(legacy.url);
            expect(input.storage.webPath).toBe(`web/${domain}/${projectId}/session_123_file_0_abc123.jpg`);
            expect(input.storage.thumbPath).toBe(`thumb/${domain}/${projectId}/session_123_file_0_abc123.webp`);
        });

        it('derives photoId from url when no fileId present', () => {
            const legacy = {
                name: 'photo.jpg',
                url: 'https://cdn.fotoflow.co/web/monalisa/proj-abc/coll-1/photo.jpg',
            };
            const input = legacyPhotoToPhotoInput(legacy, domain, projectId);
            expect(input.photoId).toBe('https://cdn.fotoflow.co/web/monalisa/proj-abc/coll-1/photo.jpg');
        });

        it('preserves original filename as metadata, not identity', () => {
            const legacy = {
                name: 'IMG_0001.jpg',
                url: 'https://cdn.fotoflow.co/web/x/y/z/IMG_0001.jpg',
                fileId: 'unique-file-id-123',
            };
            const input = legacyPhotoToPhotoInput(legacy, domain, projectId);
            expect(input.photoId).toBe('unique-file-id-123');
            expect(input.name).toBe('IMG_0001.jpg');
            expect(input.photoId).not.toBe('IMG_0001.jpg');
        });
    });
});
