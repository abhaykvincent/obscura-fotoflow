import {
  generateSyntheticEmbedding,
  generateGeminiEmbedding,
  getStoredApiKey,
  setStoredApiKey,
  API_KEY_STORAGE_KEY,
} from './geminiEmbeddingService';

describe('geminiEmbeddingService', () => {
  afterEach(() => {
    window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    jest.restoreAllMocks();
  });

  describe('generateSyntheticEmbedding', () => {
    it('produces a deterministic vector for identical inputs', () => {
      const v1 = generateSyntheticEmbedding('photo-123-IMG_001.JPG', 128);
      const v2 = generateSyntheticEmbedding('photo-123-IMG_001.JPG', 128);
      expect(v1).toEqual(v2);
    });

    it('produces distinct vectors for different inputs', () => {
      const v1 = generateSyntheticEmbedding('photo-1', 128);
      const v2 = generateSyntheticEmbedding('photo-2', 128);
      expect(v1).not.toEqual(v2);
    });

    it('generates a non-zero, unit-normalized vector with requested dimension', () => {
      const dim = 64;
      const v = generateSyntheticEmbedding('test-seed', dim);
      expect(v).toHaveLength(dim);

      // Verify unit length (sum of squares ≈ 1)
      const sumSquares = v.reduce((sum, val) => sum + val * val, 0);
      expect(sumSquares).toBeGreaterThan(0.95);
      expect(sumSquares).toBeLessThan(1.05);
    });
  });

  describe('API key storage', () => {
    it('stores and retrieves API key in localStorage', () => {
      setStoredApiKey('test-key-abc-123');
      expect(getStoredApiKey()).toBe('test-key-abc-123');
    });

    it('clears API key when set to empty string', () => {
      setStoredApiKey('temporary-key');
      setStoredApiKey('');
      expect(getStoredApiKey()).toBe('');
    });
  });

  describe('generateGeminiEmbedding', () => {
    it('throws when apiKey is missing', async () => {
      await expect(
        generateGeminiEmbedding({ imageBase64: 'abc', apiKey: '' })
      ).rejects.toThrow(/Gemini API Key is required/);
    });

    it('throws when imageBase64 is missing', async () => {
      await expect(
        generateGeminiEmbedding({ imageBase64: '', apiKey: 'key' })
      ).rejects.toThrow(/Image base64 data is required/);
    });

    it('parses successful API response and returns vector and metadata', async () => {
      const mockVector = [0.1, -0.2, 0.3, 0.4, -0.5, 0.6, 0.7, -0.8];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          embedding: {
            values: mockVector,
          },
        }),
      });

      const result = await generateGeminiEmbedding({
        imageBase64: 'fake-base64',
        apiKey: 'valid-test-key',
        outputDimensionality: 8,
      });

      expect(result.vector).toEqual(mockVector);
      expect(result.dimension).toBe(8);
      expect(result.model).toBe('gemini-embedding-2');
    });

    it('handles HTTP 429 quota error with descriptive message', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({
          error: { message: 'Quota exceeded for QuotaMetric: GenerateRequestsPerMinute' },
        }),
      });

      await expect(
        generateGeminiEmbedding({
          imageBase64: 'fake-base64',
          apiKey: 'test-key',
        })
      ).rejects.toThrow(/429 Rate Limit Exceeded/);
    });
  });
});
