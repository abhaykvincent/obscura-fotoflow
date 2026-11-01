import React, {
  memo,
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  getStoredApiKey,
  setStoredApiKey,
  DEFAULT_OUTPUT_DIMENSION,
} from '../../../services/geminiEmbeddingService';
import {
  selectPhotosForEmbedding,
  runPhotoEmbeddingBatch,
} from '../../../services/photoEmbeddingOrchestrator';
import { resolvePhotoEmbedding } from './embeddingResolver';

const PRESETS = [5, 10, 25, 50];

const PhotoEmbeddingControls = memo(({
  photos = [],
  selectedSegment = null,
  domain,
  projectId,
  collectionId,
  onEmbeddingsGenerated,
}) => {
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [showApiKey, setShowApiKey] = useState(false);
  const [useSynthetic, setUseSynthetic] = useState(false);
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [scopeSegmentOnly, setScopeSegmentOnly] = useState(false);
  const [photoCount, setPhotoCount] = useState(10);
  const [isExpanded, setIsExpanded] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [runError, setRunError] = useState(null);

  const abortControllerRef = useRef(null);

  // Sync API key updates
  const handleApiKeyChange = useCallback((event) => {
    const val = event.target.value;
    setApiKey(val);
    setStoredApiKey(val);
  }, []);

  // Compute pool of target photos
  const candidatePool = useMemo(() => {
    if (scopeSegmentOnly && selectedSegment?.photos) {
      return selectedSegment.photos;
    }
    return photos;
  }, [photos, scopeSegmentOnly, selectedSegment]);

  const stats = useMemo(() => {
    let embedded = 0;
    let missing = 0;
    candidatePool.forEach((p) => {
      const { vector } = resolvePhotoEmbedding(p);
      if (vector) embedded += 1;
      else missing += 1;
    });
    return {
      total: candidatePool.length,
      embedded,
      missing,
    };
  }, [candidatePool]);

  // Actual candidate list based on options
  const targetCandidates = useMemo(() => {
    return selectPhotosForEmbedding(candidatePool, {
      limit: photoCount,
      onlyMissing,
    });
  }, [candidatePool, photoCount, onlyMissing]);

  const maxSelectable = onlyMissing ? stats.missing : stats.total;

  const handleStart = useCallback(async () => {
    if (isRunning) return;

    if (!useSynthetic && !apiKey.trim()) {
      setRunError('Please enter a Gemini API Key or toggle Synthetic Test Mode.');
      setIsExpanded(true);
      return;
    }

    if (targetCandidates.length === 0) {
      setRunError('No eligible photos to embed with the current filters.');
      return;
    }

    setIsRunning(true);
    setRunError(null);
    setRunResult(null);
    setProgress({ current: 0, total: targetCandidates.length, percent: 0, status: 'starting' });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await runPhotoEmbeddingBatch({
        photos: targetCandidates,
        photoCount: targetCandidates.length,
        onlyMissing: false, // already filtered
        domain,
        projectId,
        collectionId,
        apiKey: apiKey.trim(),
        dimension: DEFAULT_OUTPUT_DIMENSION,
        useSynthetic,
        signal: controller.signal,
        onProgress: setProgress,
      });

      setRunResult(result);
      if (result.successful.length > 0 && onEmbeddingsGenerated) {
        onEmbeddingsGenerated(result.updatedMap);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setRunError(err.message || 'Embedding generation failed.');
      }
    } finally {
      setIsRunning(false);
      setProgress(null);
      abortControllerRef.current = null;
    }
  }, [
    isRunning,
    useSynthetic,
    apiKey,
    targetCandidates,
    domain,
    projectId,
    collectionId,
    onEmbeddingsGenerated,
  ]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Cleanup abort on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <section className="timeline-controls photo-embedding-controls" aria-label="Gemini Embedding 2 controls">
      <div className="timeline-controls-top">
        <div className="embedding-controls-header">
          <span className="timeline-eyebrow">Developer AI · Gemini Embedding 2</span>
          <h3>Vector Embeddings Generator</h3>
          <p className="embedding-controls-desc">
            Embed photos with Gemini Embedding 2 vectors and persist to Firestore for Moment Detection.
            Runs on <strong>explicit manual trigger only</strong>.
          </p>
        </div>

        <button
          type="button"
          className="timeline-button embedding-config-toggle"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Hide Settings' : 'API & Mode Settings'}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="embedding-metrics-bar">
        <div className="embedding-metric">
          <span className="embedding-metric-label">Photos in Scope</span>
          <span className="embedding-metric-value">{stats.total}</span>
        </div>
        <div className="embedding-metric">
          <span className="embedding-metric-label">With Embeddings</span>
          <span className="embedding-metric-value text-success">{stats.embedded}</span>
        </div>
        <div className="embedding-metric">
          <span className="embedding-metric-label">Missing Embeddings</span>
          <span className="embedding-metric-value text-warning">{stats.missing}</span>
        </div>
        <div className="embedding-metric target-metric">
          <span className="embedding-metric-label">Target to Embed</span>
          <span className="embedding-metric-value text-accent">{targetCandidates.length}</span>
        </div>
      </div>

      {/* Expandable API Key & Mode Settings */}
      {isExpanded && (
        <div className="embedding-settings-drawer">
          <div className="embedding-settings-grid">
            <label className="timeline-field">
              <span className="timeline-field-label">
                Gemini API Key
                <small className="api-key-status">
                  {apiKey.trim() ? '✓ Key configured' : '⚠ Key required (unless test mode)'}
                </small>
              </span>
              <div className="api-key-input-wrapper">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="AIzaSy..."
                  value={apiKey}
                  disabled={isRunning || useSynthetic}
                  onChange={handleApiKeyChange}
                />
                <button
                  type="button"
                  className="timeline-button"
                  onClick={() => setShowApiKey((v) => !v)}
                  title={showApiKey ? 'Hide key' : 'Show key'}
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <small className="moment-field-hint">
                Stored in browser localStorage for this domain. Free tier keys available at ai.google.dev.
              </small>
            </label>

            <div className="embedding-mode-toggles">
              <label className="moment-toggle">
                <input
                  type="checkbox"
                  checked={useSynthetic}
                  disabled={isRunning}
                  onChange={(e) => setUseSynthetic(e.target.checked)}
                />
                <span>
                  Synthetic Test Embeddings (Mock Mode)
                  <small>Generates instant deterministic vectors offline without calling Gemini API.</small>
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Photo Count Selection & Filtering Controls */}
      <div className="timeline-control-row embedding-trigger-row">
        <label className="timeline-field count-field">
          <span className="timeline-field-label">Photos to embed</span>
          <input
            type="number"
            min="1"
            max={Math.max(1, maxSelectable)}
            value={photoCount}
            disabled={isRunning}
            onChange={(e) => {
              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
              setPhotoCount(val);
            }}
          />
        </label>

        {/* Quick Count Presets */}
        <div className="embedding-presets">
          <span className="timeline-field-label">Presets</span>
          <div className="preset-buttons">
            {PRESETS.map((count) => (
              <button
                key={count}
                type="button"
                className={`timeline-button preset-btn ${photoCount === count ? 'active' : ''}`}
                disabled={isRunning}
                onClick={() => setPhotoCount(count)}
              >
                {count}
              </button>
            ))}
            <button
              type="button"
              className={`timeline-button preset-btn ${photoCount >= stats.missing && stats.missing > 0 ? 'active' : ''}`}
              disabled={isRunning || stats.missing === 0}
              onClick={() => setPhotoCount(stats.missing || 1)}
            >
              All Missing ({stats.missing})
            </button>
          </div>
        </div>

        {/* Filter Checkboxes */}
        <div className="embedding-filters">
          <label className="moment-toggle">
            <input
              type="checkbox"
              checked={onlyMissing}
              disabled={isRunning}
              onChange={(e) => setOnlyMissing(e.target.checked)}
            />
            <span>Only photos lacking embeddings</span>
          </label>

          {selectedSegment && (
            <label className="moment-toggle">
              <input
                type="checkbox"
                checked={scopeSegmentOnly}
                disabled={isRunning}
                onChange={(e) => setScopeSegmentOnly(e.target.checked)}
              />
              <span>Focus on selected segment ({selectedSegment.photos.length} photos)</span>
            </label>
          )}
        </div>

        {/* Action Buttons: Explicit Trigger */}
        <div className="timeline-control-actions embedding-actions">
          {!isRunning ? (
            <button
              type="button"
              className="timeline-button primary embedding-start-btn"
              onClick={handleStart}
              disabled={targetCandidates.length === 0}
            >
              ✨ Generate Embeddings ({targetCandidates.length} photos)
            </button>
          ) : (
            <button
              type="button"
              className="timeline-button danger embedding-stop-btn"
              onClick={handleStop}
            >
              ⏹ Stop Generation
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar & Status */}
      {isRunning && progress && (
        <div className="embedding-progress-container" role="status" aria-live="polite">
          <div className="embedding-progress-bar-bg">
            <div
              className="embedding-progress-bar-fill"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="embedding-progress-status">
            <span>
              Embedding photo {progress.current} of {progress.total}
              {progress.photoName ? ` (${progress.photoName})` : ''}…
            </span>
            <span>{progress.percent}%</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {runError && (
        <div className="moment-embedding-warning embedding-error" role="alert">
          <strong>Embedding Error:</strong> {runError}
        </div>
      )}

      {/* Results Summary */}
      {runResult && !isRunning && (
        <div className="embedding-result-summary" role="status">
          <span className="result-badge success">
            ✓ Successfully embedded and saved {runResult.successful.length} photo{runResult.successful.length === 1 ? '' : 's'}
          </span>
          <span className="result-time">
            Time: {(runResult.durationMs / 1000).toFixed(1)}s
          </span>
          {runResult.failed.length > 0 && (
            <span className="result-badge error">
              ⚠ {runResult.failed.length} failed
            </span>
          )}
        </div>
      )}
    </section>
  );
});

PhotoEmbeddingControls.displayName = 'PhotoEmbeddingControls';

export default PhotoEmbeddingControls;
