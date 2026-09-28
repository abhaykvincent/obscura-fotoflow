import {
  getCdnUrl,
  getCdnBaseUrl,
  encodeStoragePath,
  extractStoragePath,
  swapQualityPrefix,
  isEmulatorUrl,
  isNonStorageUrl,
  DEFAULT_CDN_BASE_URL,
} from './cdnUrl';

describe('cdnUrl - Canonical FotoFlow CDN Generation', () => {
  const CDN_DOMAIN = 'https://cdn.fotoflow.co';
  const SAMPLE_PATH = 'web/monalisa/chris-antony-B4o7m/baptism-ovNjH/IM_00005.jpg';
  const SAMPLE_FIREBASE_URL = 'https://firebasestorage.googleapis.com/v0/b/fotoflow-studio.firebasestorage.app/o/web%2Fmonalisa%2Fabigail-%26-amigail-q2qSQ%2Fbirthday-B0VMK%2FIM_00014.jpg?alt=media&token=12345';
  const SAMPLE_COVERS_FIREBASE_URL = 'https://firebasestorage.googleapis.com/v0/b/fotoflow-studio.firebasestorage.app/o/covers%2Fmonalisa%2Fproject-123%2Fcover.jpg?alt=media&token=67890';
  const SAMPLE_EMULATOR_URL = 'http://127.0.0.1:9199/v0/b/fotoflow-studio.firebasestorage.app/o/web%2Fmonalisa%2Fabigail-%26-amigail-q2qSQ%2Fbirthday-B0VMK%2FIM_00014.jpg?alt=media';
  const SAMPLE_GCS_URL = 'https://storage.googleapis.com/fotoflow-studio.firebasestorage.app/web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg';
  const SAMPLE_OLD_WORKER_URL = 'https://fotoflow-r2-shield.fotoflow-cloud.workers.dev/web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg';
  const SAMPLE_OLD_PROXY_URL = '/cdn-gallery/fotoflow-studio.firebasestorage.app/web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg';

  describe('getCdnBaseUrl', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('defaults to canonical production hostname https://cdn.fotoflow.co', () => {
      delete process.env.REACT_APP_CDN_BASE_URL;
      delete process.env.REACT_APP_IMAGE_CDN_URL;
      expect(getCdnBaseUrl()).toBe(DEFAULT_CDN_BASE_URL);
    });

    it('respects REACT_APP_CDN_BASE_URL if configured', () => {
      process.env.REACT_APP_CDN_BASE_URL = 'https://custom-cdn.example.com/';
      expect(getCdnBaseUrl()).toBe('https://custom-cdn.example.com');
    });

    it('respects REACT_APP_IMAGE_CDN_URL as fallback environment variable', () => {
      delete process.env.REACT_APP_CDN_BASE_URL;
      process.env.REACT_APP_IMAGE_CDN_URL = 'https://cdn-image.example.com/';
      expect(getCdnBaseUrl()).toBe('https://cdn-image.example.com');
    });
  });

  describe('encodeStoragePath', () => {
    it('preserves path slashes while encoding special characters', () => {
      const path = 'web/studio space/project #1/photo (1).jpg';
      const encoded = encodeStoragePath(path);
      expect(encoded).toBe('web/studio%20space/project%20%231/photo%20(1).jpg');
    });

    it('avoids double-encoding already encoded segments', () => {
      const path = 'web/monalisa/abigail-%26-amigail-q2qSQ/photo.jpg';
      const encoded = encodeStoragePath(path);
      expect(encoded).toBe('web/monalisa/abigail-&-amigail-q2qSQ/photo.jpg');
    });

    it('handles query characters safely in path segment', () => {
      const path = 'web/monalisa/project/photo?version=1.jpg';
      const encoded = encodeStoragePath(path);
      expect(encoded).toBe('web/monalisa/project/photo%3Fversion=1.jpg');
    });
  });

  describe('extractStoragePath', () => {
    it('extracts path from raw storage path', () => {
      expect(extractStoragePath(SAMPLE_PATH)).toBe(SAMPLE_PATH);
    });

    it('extracts path from Firebase Storage URL', () => {
      expect(extractStoragePath(SAMPLE_FIREBASE_URL)).toBe('web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg');
    });

    it('extracts path from canonical CDN URL', () => {
      const cdnUrl = `${CDN_DOMAIN}/${SAMPLE_PATH}`;
      expect(extractStoragePath(cdnUrl)).toBe(SAMPLE_PATH);
    });

    it('extracts path from legacy Cloudflare Worker URL', () => {
      expect(extractStoragePath(SAMPLE_OLD_WORKER_URL)).toBe('web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg');
    });

    it('extracts path from legacy /cdn-gallery/ proxy URL', () => {
      expect(extractStoragePath(SAMPLE_OLD_PROXY_URL)).toBe('web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg');
    });

    it('extracts path from direct GCS URL', () => {
      expect(extractStoragePath(SAMPLE_GCS_URL)).toBe('web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg');
    });
  });

  describe('swapQualityPrefix', () => {
    it('swaps web to thumb', () => {
      expect(swapQualityPrefix('web/domain/project/img.jpg', 'thumb')).toBe('thumb/domain/project/img.jpg');
    });

    it('swaps thumb to original', () => {
      expect(swapQualityPrefix('thumb/domain/project/img.jpg', 'original')).toBe('original/domain/project/img.jpg');
    });

    it('prepends quality if no existing prefix matches', () => {
      expect(swapQualityPrefix('custom/domain/project/img.jpg', 'thumb')).toBe('thumb/custom/domain/project/img.jpg');
    });
  });

  describe('getCdnUrl', () => {
    it('returns empty string for null, undefined, or empty string', () => {
      expect(getCdnUrl(null)).toBe('');
      expect(getCdnUrl(undefined)).toBe('');
      expect(getCdnUrl('')).toBe('');
    });

    it('constructs CDN URL from raw storage path', () => {
      const result = getCdnUrl(SAMPLE_PATH);
      expect(result).toBe(`${CDN_DOMAIN}/${SAMPLE_PATH}`);
    });

    it('is idempotent when given an existing canonical CDN URL', () => {
      const cdnUrl = `${CDN_DOMAIN}/${SAMPLE_PATH}`;
      expect(getCdnUrl(cdnUrl)).toBe(cdnUrl);
    });

    it('converts Firebase download URL to canonical CDN URL', () => {
      const result = getCdnUrl(SAMPLE_FIREBASE_URL);
      expect(result).toBe(`${CDN_DOMAIN}/web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`);
    });

    it('converts Firebase URL to requested thumb quality', () => {
      const result = getCdnUrl(SAMPLE_FIREBASE_URL, 'thumb');
      expect(result).toBe(`${CDN_DOMAIN}/thumb/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`);
    });

    it('converts Firebase URL to requested original quality', () => {
      const result = getCdnUrl(SAMPLE_FIREBASE_URL, 'original');
      expect(result).toBe(`${CDN_DOMAIN}/original/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`);
    });

    it('handles cover URLs without mangling covers prefix', () => {
      const result = getCdnUrl(SAMPLE_COVERS_FIREBASE_URL, 'covers');
      expect(result).toBe(`${CDN_DOMAIN}/covers/monalisa/project-123/cover.jpg`);
    });

    it('converts old Worker dev URLs to canonical CDN URL', () => {
      const result = getCdnUrl(SAMPLE_OLD_WORKER_URL);
      expect(result).toBe(`${CDN_DOMAIN}/web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`);
    });

    it('converts old /cdn-gallery/ proxy URLs to canonical CDN URL', () => {
      const result = getCdnUrl(SAMPLE_OLD_PROXY_URL);
      expect(result).toBe(`${CDN_DOMAIN}/web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`);
    });

    it('preserves non-storage external URLs and special schemes', () => {
      const iconUrl = 'https://img.icons8.com/?size=100&id=UVEiJZnIRQiE&format=png';
      expect(getCdnUrl(iconUrl)).toBe(iconUrl);

      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA';
      expect(getCdnUrl(dataUrl)).toBe(dataUrl);

      const blobUrl = 'blob:http://localhost:3000/1234-5678';
      expect(getCdnUrl(blobUrl)).toBe(blobUrl);
    });

    it('preserves and transforms Storage Emulator URLs', () => {
      const result = getCdnUrl(SAMPLE_EMULATOR_URL, 'thumb');
      expect(result).toBe('http://127.0.0.1:9199/v0/b/fotoflow-studio.firebasestorage.app/o/thumb%2Fmonalisa%2Fabigail-%26-amigail-q2qSQ%2Fbirthday-B0VMK%2FIM_00014.jpg?alt=media');
    });
  });
});
