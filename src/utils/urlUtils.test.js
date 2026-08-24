import { 
  getPhotoDeliveryUrl, 
  getImageUrlByQuality, 
  getThumbnailUrl, 
  getOriginalUrl,
  getCoverUrl,
  getWebUrl,
  getThumbnailUrl1 
} from './urlUtils';

describe('urlUtils - Image Delivery Gateway', () => {
  const CDN_DOMAIN = 'https://fotoflow-r2-shield.fotoflow-cloud.workers.dev';
  const SAMPLE_FIREBASE_URL = 'https://firebasestorage.googleapis.com/v0/b/fotoflow-studio.firebasestorage.app/o/web%2Fmonalisa%2Fabigail-%26-amigail-q2qSQ%2Fbirthday-B0VMK%2FIM_00014.jpg?alt=media&token=12345';
  const SAMPLE_COVERS_FIREBASE_URL = 'https://firebasestorage.googleapis.com/v0/b/fotoflow-studio.firebasestorage.app/o/covers%2Fmonalisa%2Fproject-123%2Fcover.jpg?alt=media&token=67890';
  const SAMPLE_EMULATOR_URL = 'http://127.0.0.1:9199/v0/b/fotoflow-studio.firebasestorage.app/o/web%2Fmonalisa%2Fabigail-%26-amigail-q2qSQ%2Fbirthday-B0VMK%2FIM_00014.jpg?alt=media';
  const SAMPLE_GCS_URL = 'https://storage.googleapis.com/fotoflow-studio.firebasestorage.app/web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg';
  const SAMPLE_CDN_URL = `${CDN_DOMAIN}/web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`;
  const SAMPLE_OLD_CDN_URL = '/cdn-gallery/fotoflow-studio.firebasestorage.app/web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg';

  describe('getPhotoDeliveryUrl and getImageUrlByQuality', () => {
    it('returns empty string for null, undefined, or empty inputs', () => {
      expect(getPhotoDeliveryUrl(null)).toBe('');
      expect(getPhotoDeliveryUrl(undefined)).toBe('');
      expect(getPhotoDeliveryUrl('')).toBe('');
      expect(getImageUrlByQuality(null)).toBe('');
    });

    it('transforms Firebase Storage URL to Cloudflare R2 Worker web URL by default', () => {
      const result = getPhotoDeliveryUrl(SAMPLE_FIREBASE_URL);
      expect(result).toBe(`${CDN_DOMAIN}/web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`);
    });

    it('transforms Firebase Storage URL to thumb quality', () => {
      const result = getPhotoDeliveryUrl(SAMPLE_FIREBASE_URL, 'thumb');
      expect(result).toBe(`${CDN_DOMAIN}/thumb/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`);
    });

    it('transforms Firebase Storage URL to original quality', () => {
      const result = getPhotoDeliveryUrl(SAMPLE_FIREBASE_URL, 'original');
      expect(result).toBe(`${CDN_DOMAIN}/original/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`);
    });

    it('transforms Firebase Storage URL to covers quality without altering path', () => {
      const result = getPhotoDeliveryUrl(SAMPLE_COVERS_FIREBASE_URL, 'covers');
      expect(result).toBe(`${CDN_DOMAIN}/covers/monalisa/project-123/cover.jpg`);
    });

    it('transforms Firebase Storage web URL to covers quality preserving web path', () => {
      const result = getPhotoDeliveryUrl(SAMPLE_FIREBASE_URL, 'covers');
      expect(result).toBe(`${CDN_DOMAIN}/web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`);
    });

    it('transforms studio cover path with getCoverUrl preserving original path', () => {
      const studioCoverUrl = 'https://firebasestorage.googleapis.com/v0/b/fotoflow-studio.firebasestorage.app/o/studios%2Fmonalisa%2Fprojects%2F123%2Fcover.jpg?alt=media';
      expect(getCoverUrl(studioCoverUrl)).toBe(`${CDN_DOMAIN}/studios/monalisa/projects/123/cover.jpg`);
    });

    it('transforms Storage Emulator URL correctly', () => {
      const result = getPhotoDeliveryUrl(SAMPLE_EMULATOR_URL, 'thumb');
      expect(result).toBe(`${CDN_DOMAIN}/thumb/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`);
    });

    it('transforms GCS URL correctly', () => {
      const result = getPhotoDeliveryUrl(SAMPLE_GCS_URL, 'web');
      expect(result).toBe(`${CDN_DOMAIN}/web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`);
    });

    it('swaps quality when URL is already a Cloudflare CDN URL', () => {
      const result = getPhotoDeliveryUrl(SAMPLE_CDN_URL, 'thumb');
      expect(result).toBe(`${CDN_DOMAIN}/thumb/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`);
    });

    it('transforms old /cdn-gallery/ path to Cloudflare CDN URL', () => {
      const result = getPhotoDeliveryUrl(SAMPLE_OLD_CDN_URL, 'web');
      expect(result).toBe(`${CDN_DOMAIN}/web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`);
    });

    it('preserves external non-storage URLs', () => {
      const externalUrl = 'https://img.icons8.com/?size=100&id=UVEiJZnIRQiE&format=png';
      expect(getPhotoDeliveryUrl(externalUrl, 'thumb')).toBe(externalUrl);

      const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA';
      expect(getPhotoDeliveryUrl(dataUrl, 'web')).toBe(dataUrl);

      const blobUrl = 'blob:http://localhost:3000/1234-5678';
      expect(getPhotoDeliveryUrl(blobUrl, 'thumb')).toBe(blobUrl);
    });
  });

  describe('Convenience helper functions', () => {
    it('getThumbnailUrl returns thumb quality', () => {
      expect(getThumbnailUrl(SAMPLE_FIREBASE_URL)).toBe(`${CDN_DOMAIN}/thumb/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`);
    });

    it('getOriginalUrl returns original quality', () => {
      expect(getOriginalUrl(SAMPLE_FIREBASE_URL)).toBe(`${CDN_DOMAIN}/original/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`);
    });

    it('getCoverUrl returns cdn url preserving the underlying path', () => {
      expect(getCoverUrl(SAMPLE_FIREBASE_URL)).toBe(`${CDN_DOMAIN}/web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`);
      expect(getCoverUrl(SAMPLE_COVERS_FIREBASE_URL)).toBe(`${CDN_DOMAIN}/covers/monalisa/project-123/cover.jpg`);
    });

    it('getWebUrl returns web quality', () => {
      expect(getWebUrl(SAMPLE_FIREBASE_URL)).toBe(`${CDN_DOMAIN}/web/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`);
    });

    it('getThumbnailUrl1 is backward-compatible with getThumbnailUrl', () => {
      expect(getThumbnailUrl1(SAMPLE_FIREBASE_URL)).toBe(`${CDN_DOMAIN}/thumb/monalisa/abigail-&-amigail-q2qSQ/birthday-B0VMK/IM_00014.jpg`);
    });
  });
});
