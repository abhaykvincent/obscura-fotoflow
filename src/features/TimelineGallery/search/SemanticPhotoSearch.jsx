import React, {
  memo,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import { getStoredApiKey } from '../../../services/geminiEmbeddingService';
import { searchPhotosBySemanticQuery } from '../../../services/semanticSearchService';
import { resolvePhotoEmbedding } from '../moments/embeddingResolver';
import { formatTime, resolveCaptureTimestamp } from '../segmentation/timestampUtils';
import { getThumbnailUrl } from '../../../utils/urlUtils';

const QUICK_PROMPTS = [
  '💍 Rings & jewelry details',
  '👰 Bride solo portrait',
  '🤵 Groom portrait',
  '🌅 Golden hour sunset',
  '🥂 Toast & cheers',
  '👥 Family group photo',
  '🍰 Cake cutting ceremony',
  '😄 Candid laughter & smiles',
];

const MATCH_LIMITS = [12, 24, 48, 100];

const SemanticPhotoSearch = memo(({
  photos = [],
  onOpenPhoto,
  onScrollToEmbeddingGenerator,
}) => {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [minSimilarity, setMinSimilarity] = useState(0.35);
  const [maxResults, setMaxResults] = useState(24);
  const [useSynthetic, setUseSynthetic] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);

  const abortControllerRef = useRef(null);

  // Compute number of photos that have valid embeddings
  const { photosWithEmbeddings, photosWithoutEmbeddings } = useMemo(() => {
    let withCount = 0;
    let withoutCount = 0;
    photos.forEach((p) => {
      const { vector } = resolvePhotoEmbedding(p);
      if (vector) withCount += 1;
      else withoutCount += 1;
    });
    return {
      photosWithEmbeddings: withCount,
      photosWithoutEmbeddings: withoutCount,
    };
  }, [photos]);

  const handleSearch = useCallback(async (searchQuery = query) => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResult(null);
      setActiveQuery('');
      return;
    }

    const apiKey = getStoredApiKey();
    if (!useSynthetic && !apiKey) {
      setSearchError('A Gemini API Key is required for live search. Enter it in the Vector Embeddings Generator or toggle Mock Mode.');
      return;
    }

    if (photosWithEmbeddings === 0) {
      setSearchError('No photos have Gemini Embedding 2 vectors yet. Generate embeddings first to enable search.');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    setSearchError(null);
    setActiveQuery(q);

    try {
      const result = await searchPhotosBySemanticQuery({
        photos,
        query: q,
        apiKey,
        minSimilarity,
        maxResults,
        useSynthetic,
        signal: controller.signal,
      });

      setSearchResult(result);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setSearchError(err.message || 'Semantic search failed.');
      }
    } finally {
      setIsSearching(false);
      abortControllerRef.current = null;
    }
  }, [query, useSynthetic, photosWithEmbeddings, photos, minSimilarity, maxResults]);

  // Quick prompt click handler
  const handlePromptClick = useCallback((promptText) => {
    // Strip emoji prefix for cleaner search text
    const cleanPrompt = promptText.replace(/^[^\w\s]+/, '').trim();
    setQuery(cleanPrompt);
    handleSearch(cleanPrompt);
  }, [handleSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    setActiveQuery('');
    setSearchResult(null);
    setSearchError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Re-filter matches when similarity threshold or maxResults changes
  useEffect(() => {
    if (activeQuery && searchResult && !isSearching) {
      handleSearch(activeQuery);
    }
  }, [minSimilarity, maxResults, activeQuery, searchResult, isSearching, handleSearch]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const getScoreBadgeClass = (score) => {
    if (score >= 65) return 'score-high';
    if (score >= 45) return 'score-mid';
    return 'score-low';
  };

  return (
    <section className="timeline-controls semantic-search-container" aria-label="Semantic Photo Search">
      <div className="timeline-controls-top">
        <div className="search-header-titles">
          <span className="timeline-eyebrow">Multimodal AI · Natural Language</span>
          <h3>Semantic Photo Search</h3>
          <p className="search-header-desc">
            Find photos by describing them naturally (objects, actions, atmosphere, subjects).
            Powered by <strong>Gemini Embedding 2</strong> cross-modal vector similarity.
          </p>
        </div>

        <div className="search-stats-badge">
          <span className={`search-dot ${photosWithEmbeddings > 0 ? 'is-ready' : 'is-warning'}`} />
          <span>
            {photosWithEmbeddings.toLocaleString()} of {photos.length.toLocaleString()} photos searchable
          </span>
        </div>
      </div>

      {/* Search Input Bar */}
      <form
        className="semantic-search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
      >
        <div className="search-input-wrapper">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            className="semantic-search-input"
            placeholder="Describe what you want to find (e.g. 'sunset couple portrait', 'wedding cake', 'laughing candid')..."
            value={query}
            disabled={isSearching}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={handleClear}
              title="Clear search"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="submit"
          className="timeline-button primary search-submit-btn"
          disabled={isSearching || !query.trim()}
        >
          {isSearching ? 'Searching…' : 'Search Photos'}
        </button>
      </form>

      {/* Quick Prompt Chips */}
      <div className="search-quick-prompts" aria-label="Example search prompts">
        <span className="quick-prompts-label">Try searching:</span>
        <div className="prompt-chips-wrapper">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="prompt-chip"
              disabled={isSearching}
              onClick={() => handlePromptClick(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Threshold & Options Bar */}
      <div className="search-options-bar">
        <label className="timeline-field threshold-slider">
          <span className="timeline-field-label">
            Min Similarity: <strong>{Math.round(minSimilarity * 100)}%</strong>
          </span>
          <input
            type="range"
            min="0.15"
            max="0.80"
            step="0.05"
            value={minSimilarity}
            onChange={(e) => setMinSimilarity(parseFloat(e.target.value))}
          />
        </label>

        <label className="timeline-field limit-field">
          <span className="timeline-field-label">Max results</span>
          <select
            value={maxResults}
            onChange={(e) => setMaxResults(parseInt(e.target.value, 10))}
          >
            {MATCH_LIMITS.map((limit) => (
              <option key={limit} value={limit}>
                Top {limit}
              </option>
            ))}
          </select>
        </label>

        <label className="moment-toggle mock-mode-toggle">
          <input
            type="checkbox"
            checked={useSynthetic}
            disabled={isSearching}
            onChange={(e) => setUseSynthetic(e.target.checked)}
          />
          <span>Mock / Test Mode</span>
        </label>

        {photosWithoutEmbeddings > 0 && (
          <span className="unembedded-hint">
            ⚠ {photosWithoutEmbeddings} photo{photosWithoutEmbeddings === 1 ? '' : 's'} missing embeddings
            {onScrollToEmbeddingGenerator && (
              <button
                type="button"
                className="btn-link"
                onClick={onScrollToEmbeddingGenerator}
              >
                (Embed now)
              </button>
            )}
          </span>
        )}
      </div>

      {/* Error Banner */}
      {searchError && (
        <div className="moment-embedding-warning search-error" role="alert">
          <strong>Search Error:</strong> {searchError}
        </div>
      )}

      {/* Results Header & Grid */}
      {searchResult && (
        <div className="search-results-section" aria-live="polite">
          <div className="search-results-summary">
            <span className="results-count">
              Found <strong>{searchResult.matches.length}</strong> photo{searchResult.matches.length === 1 ? '' : 's'} matching{' '}
              <em>"{searchResult.query}"</em> (≥ {Math.round(minSimilarity * 100)}% similarity)
            </span>
            <span className="search-time">in {searchResult.durationMs}ms</span>
          </div>

          {searchResult.matches.length === 0 ? (
            <div className="search-empty-state">
              <p>No photos matched <em>"{searchResult.query}"</em> at or above {Math.round(minSimilarity * 100)}% similarity.</p>
              <div className="empty-state-suggestions">
                <span>Tips:</span>
                <ul>
                  <li>Try lowering the <strong>Min Similarity</strong> slider above.</li>
                  <li>Use broader keywords (e.g. "outdoors", "portrait", "rings").</li>
                  <li>Ensure photos have Gemini Embedding 2 vectors generated.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="semantic-photo-grid" role="list">
              {searchResult.matches.map(({ photo, photoId, scorePercent }, index) => {
                const source = photo?.url || photo?.thumbUrl || '';
                const thumbnail = getThumbnailUrl(source);
                const captureTimestamp = resolveCaptureTimestamp(photo)?.timestamp ?? null;
                const title = `${photo?.name || 'Photo'} (${scorePercent}% match)${
                  Number.isFinite(captureTimestamp) ? ` — ${new Date(captureTimestamp).toLocaleString()}` : ''
                }`;

                return (
                  <button
                    key={photoId || index}
                    type="button"
                    className="semantic-photo-card"
                    onClick={() => onOpenPhoto?.(photo)}
                    title={title}
                    aria-label={title}
                  >
                    <div className="photo-thumb-wrapper">
                      <img
                        src={thumbnail}
                        alt={photo?.name || `Result photo ${index + 1}`}
                        loading="lazy"
                        decoding="async"
                      />
                      <span className={`match-badge ${getScoreBadgeClass(scorePercent)}`}>
                        {scorePercent}% match
                      </span>
                    </div>
                    <div className="photo-card-meta">
                      <span className="photo-name">{photo?.name || 'Photo'}</span>
                      <span className="photo-time">
                        {Number.isFinite(captureTimestamp) ? formatTime(captureTimestamp) : 'No time'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
});

SemanticPhotoSearch.displayName = 'SemanticPhotoSearch';

export default SemanticPhotoSearch;
