import {
  cosineSimilarity,
  searchPhotosBySemanticQuery,
} from './semanticSearchService';
import { generateSyntheticEmbedding } from './geminiEmbeddingService';

describe('semanticSearchService', () => {
  describe('cosineSimilarity', () => {
    it('returns 1 for identical vectors', () => {
      const v = [0.5, 0.5, 0.5, 0.5];
      expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5);
    });

    it('returns 0 for orthogonal vectors', () => {
      const v1 = [1, 0, 0];
      const v2 = [0, 1, 0];
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(0, 5);
    });

    it('returns -1 for opposite vectors', () => {
      const v1 = [0.6, 0.8];
      const v2 = [-0.6, -0.8];
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(-1, 5);
    });

    it('handles zero or invalid vectors safely without throwing', () => {
      expect(cosineSimilarity([], [])).toBe(0);
      expect(cosineSimilarity(null, [1, 2])).toBe(0);
      expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
    });
  });

  describe('searchPhotosBySemanticQuery', () => {
    const dim = 32;
    const vMatch = generateSyntheticEmbedding('query:sunset bride', dim);
    const vDistant = generateSyntheticEmbedding('other topic completely', dim);

    const photos = [
      {
        id: 'p1',
        name: 'sunset_1.jpg',
        embeddings: { geminiEmbedding2: { vector: vMatch, dimension: dim } },
      },
      {
        id: 'p2',
        name: 'cake_2.jpg',
        embeddings: { geminiEmbedding2: { vector: vDistant, dimension: dim } },
      },
      {
        id: 'p3',
        name: 'no_embedding.jpg',
      },
    ];

    it('returns empty matches when query is blank', async () => {
      const res = await searchPhotosBySemanticQuery({
        photos,
        query: '   ',
        useSynthetic: true,
        dimension: dim,
      });
      expect(res.matches).toHaveLength(0);
      expect(res.totalSearched).toBe(3);
    });

    it('ranks photos matching the query highest', async () => {
      const res = await searchPhotosBySemanticQuery({
        photos,
        query: 'sunset bride',
        useSynthetic: true,
        dimension: dim,
        minSimilarity: 0.1,
      });

      expect(res.totalWithEmbeddings).toBe(2);
      expect(res.totalWithoutEmbeddings).toBe(1);
      expect(res.matches.length).toBeGreaterThanOrEqual(1);

      // p1 should be ranked #1 with high similarity (~1)
      expect(res.matches[0].photoId).toBe('p1');
      expect(res.matches[0].similarity).toBeCloseTo(1, 2);
      expect(res.matches[0].scorePercent).toBeGreaterThanOrEqual(99);
    });

    it('filters out photos below minSimilarity threshold', async () => {
      const res = await searchPhotosBySemanticQuery({
        photos,
        query: 'sunset bride',
        useSynthetic: true,
        dimension: dim,
        minSimilarity: 0.95, // strict threshold
      });

      // Only p1 should pass
      expect(res.matches).toHaveLength(1);
      expect(res.matches[0].photoId).toBe('p1');
    });

    it('respects maxResults limit', async () => {
      const res = await searchPhotosBySemanticQuery({
        photos,
        query: 'sunset bride',
        useSynthetic: true,
        dimension: dim,
        minSimilarity: -1, // include all
        maxResults: 1,
      });

      expect(res.matches).toHaveLength(1);
    });
  });
});
