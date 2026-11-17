/* eslint-disable import/first */
const mockStore = new Map();

const mockBuildPath = (parent, segments = []) => {
    const base = parent && parent.path
        ? parent.path
        : (typeof parent === 'string' ? parent : '');
    const parts = base ? [base, ...segments] : segments.filter((s) => typeof s === 'string');
    return { path: parts.join('/'), id: parts[parts.length - 1] };
};

const mockSnapshot = (path) => ({
    exists: () => mockStore.has(path),
    data: () => mockStore.get(path),
});

const mockApplyValue = (existing, value) => {
    if (value && typeof value === 'object' && typeof value.__increment === 'number') {
        return (Number(existing) || 0) + value.__increment;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        const base = existing && typeof existing === 'object' && !Array.isArray(existing)
            ? { ...existing }
            : {};
        Object.entries(value).forEach(([key, nested]) => {
            base[key] = mockApplyValue(base[key], nested);
        });
        return base;
    }
    return value;
};

const mockApplyWrite = (path, data = {}, { merge = false } = {}) => {
    const existing = merge ? { ...(mockStore.get(path) || {}) } : {};
    Object.entries(data).forEach(([key, value]) => {
        existing[key] = mockApplyValue(existing[key], value);
    });
    mockStore.set(path, existing);
};

jest.mock('firebase/firestore', () => ({
    doc: (parent, ...segments) => mockBuildPath(parent, segments),
    collection: (parent, ...segments) => mockBuildPath(parent, segments),
    getDoc: async (ref) => mockSnapshot(ref.path),
    getDocs: async () => ({ docs: [], size: 0 }),
    setDoc: async (ref, data, options) => mockApplyWrite(ref.path, data, options),
    updateDoc: async (ref, data) => mockApplyWrite(ref.path, data, { merge: true }),
    runTransaction: async (db, callback) => {
        const transaction = {
            get: async (ref) => mockSnapshot(ref.path),
            set: (ref, data, options) => mockApplyWrite(ref.path, data, options),
            update: (ref, data) => mockApplyWrite(ref.path, data, { merge: true }),
            delete: (ref) => mockStore.delete(ref.path),
        };
        return callback(transaction);
    },
    increment: (value) => ({ __increment: value }),
    arrayUnion: (...values) => ({ __arrayUnion: values }),
    arrayRemove: (...values) => ({ __arrayRemove: values }),
    query: (ref) => ref,
    where: () => null,
    orderBy: () => null,
    limit: () => null,
    startAfter: () => null,
}));

jest.mock('../app', () => ({ db: {} }));
jest.mock('../../utils/uploadOperations', () => ({
    getStorageForDomain: jest.fn(async () => ({})),
}));
jest.mock('firebase/storage', () => ({
    ref: jest.fn((storage, path) => ({ path })),
    deleteObject: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../utils/storageOperations', () => ({
    deleteProjectFromStorage: jest.fn(async () => {}),
}));

import { createProjectPhoto, deleteProjectPhoto, removePhotoFromCollection } from './photo-firestore';
import { deleteProjectFromFirestore } from './project-firestore';

const DOMAIN = 'monalisa';
const PROJECT_ID = 'project-1';
const STUDIO_PATH = `studios/${DOMAIN}`;
const PROJECT_PATH = `studios/${DOMAIN}/projects/${PROJECT_ID}`;
const studioUsed = () => mockStore.get(STUDIO_PATH)?.usage?.storage?.used || 0;

const seedStudioAndProject = ({ used = 0, totalFileSize = 0, storage } = {}) => {
    mockStore.set(STUDIO_PATH, { usage: { storage: { used } } });
    mockStore.set(PROJECT_PATH, {
        id: PROJECT_ID,
        uploadedFilesCount: 0,
        totalFileSize,
        ...(storage ? { storage } : {}),
    });
};

const photoInput = (overrides = {}) => ({
    photoId: 'photo-1',
    name: 'IMAGE_0001.jpg',
    originalSize: 10_000_000,
    lastModified: 1700000000000,
    dimensions: { width: 100, height: 100 },
    urls: { web: 'https://cdn/web.jpg', thumb: 'https://cdn/thumb.webp' },
    storage: { webPath: 'web/a.jpg', thumbPath: 'thumb/a.webp' },
    status: 'active',
    ...overrides,
});

describe('studio storage accounting regression', () => {
    beforeEach(() => {
        mockStore.clear();
        jest.clearAllMocks();
    });

    it('new photo: 10 MB original size increments studio usage by exactly 10 MB', async () => {
        seedStudioAndProject();
        await createProjectPhoto(DOMAIN, PROJECT_ID, photoInput());

        expect(studioUsed()).toBe(10);
        expect(mockStore.get(PROJECT_PATH).totalFileSize).toBe(10_000_000);
        expect(mockStore.get(`${PROJECT_PATH}/photos/photo-1`).originalSize).toBe(10_000_000);
    });

    it('small file: 250,000 bytes increments usage by 0.25 MB', async () => {
        seedStudioAndProject();
        await createProjectPhoto(DOMAIN, PROJECT_ID, photoInput({ originalSize: 250_000 }));

        expect(studioUsed()).toBe(0.25);
    });

    it('retry: creating the same photoId twice increments only once', async () => {
        seedStudioAndProject();
        await createProjectPhoto(DOMAIN, PROJECT_ID, photoInput());
        const retry = await createProjectPhoto(DOMAIN, PROJECT_ID, photoInput());

        expect(retry.created).toBe(false);
        expect(studioUsed()).toBe(10);
        expect(mockStore.get(PROJECT_PATH).uploadedFilesCount).toBe(1);
    });

    it('invalid size: negative, NaN or infinite values reject without mutation', async () => {
        seedStudioAndProject();

        await expect(createProjectPhoto(DOMAIN, PROJECT_ID, photoInput({ originalSize: -1 }))).rejects.toThrow();
        await expect(createProjectPhoto(DOMAIN, PROJECT_ID, photoInput({ originalSize: NaN }))).rejects.toThrow();
        await expect(createProjectPhoto(DOMAIN, PROJECT_ID, photoInput({ originalSize: Infinity }))).rejects.toThrow();

        expect(studioUsed()).toBe(0);
        expect(mockStore.has(`${PROJECT_PATH}/photos/photo-1`)).toBe(false);
    });

    it('photo deletion: 10 MB photo decrements usage once; repeated deletion is a no-op', async () => {
        seedStudioAndProject();
        await createProjectPhoto(DOMAIN, PROJECT_ID, photoInput({ storage: {} }));

        const first = await deleteProjectPhoto(DOMAIN, PROJECT_ID, 'photo-1', { force: true });
        const second = await deleteProjectPhoto(DOMAIN, PROJECT_ID, 'photo-1', { force: true });

        expect(first.deleted).toBe(true);
        expect(second.deleted).toBe(false);
        expect(studioUsed()).toBe(0);
        expect(mockStore.get(PROJECT_PATH).totalFileSize).toBe(0);
    });

    it('collection unlink: removing a relationship does not change studio usage', async () => {
        seedStudioAndProject();
        await createProjectPhoto(DOMAIN, PROJECT_ID, photoInput({ collectionId: 'collection-1' }));
        mockStore.set(`${PROJECT_PATH}/collections/collection-1`, {
            id: 'collection-1',
            photoIds: ['photo-1'],
            photoCount: 1,
        });

        const before = studioUsed();
        await removePhotoFromCollection(DOMAIN, PROJECT_ID, 'collection-1', 'photo-1');

        expect(studioUsed()).toBe(before);
        expect(mockStore.has(`${PROJECT_PATH}/photos/photo-1`)).toBe(true);
    });

    it('legacy migration policy: creating an already-accounted asset does not increment usage', async () => {
        seedStudioAndProject({ used: 10 });
        await createProjectPhoto(DOMAIN, PROJECT_ID, photoInput(), {
            accountStorage: false,
            accountProjectCounters: false,
        });

        expect(studioUsed()).toBe(10);
        expect(mockStore.get(PROJECT_PATH).totalFileSize).toBe(0);
        expect(mockStore.has(`${PROJECT_PATH}/photos/photo-1`)).toBe(true);
    });

    it('project deletion: decrements by totalFileSize bytes converted to MB and cannot double-decrement', async () => {
        seedStudioAndProject({ used: 20, totalFileSize: 20_000_000 });

        await deleteProjectFromFirestore(DOMAIN, '', PROJECT_ID);

        expect(studioUsed()).toBe(0);
        expect(mockStore.has(PROJECT_PATH)).toBe(false);

        await expect(deleteProjectFromFirestore(DOMAIN, '', PROJECT_ID)).rejects.toThrow();
        expect(studioUsed()).toBe(0);
    });

    it('project deletion: archived project was already removed from hot usage', async () => {
        seedStudioAndProject({ used: 0, totalFileSize: 5_000_000, storage: { status: 'archive' } });

        await deleteProjectFromFirestore(DOMAIN, '', PROJECT_ID);

        expect(studioUsed()).toBe(0);
        expect(mockStore.has(PROJECT_PATH)).toBe(false);
    });

    it('unit boundary: quota and used are both decimal MB', async () => {
        seedStudioAndProject({ used: 0 });
        mockStore.set(STUDIO_PATH, {
            usage: { storage: { used: 0, quota: 100 * 1000 } },
        });

        await createProjectPhoto(DOMAIN, PROJECT_ID, photoInput());

        expect(studioUsed()).toBe(10);
        expect(mockStore.get(STUDIO_PATH).usage.storage.quota).toBe(100_000);
    });
});
