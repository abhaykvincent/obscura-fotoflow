import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Preview from '../../features/Preview/Preview';
import useAdminAuth from '../../hooks/useAdminAuth';
import TimelineControls from './TimelineControls';
import TimelineSummary from './TimelineSummary';
import TimelineSegment from './TimelineSegment';
import TimelineExcluded from './TimelineExcluded';
import MomentDetectionControls from './moments/MomentDetectionControls';
import MomentDetectionSummary from './moments/MomentDetectionSummary';
import { DEFAULT_MOMENT_CONFIG, normalizeMomentConfig } from './moments/momentConfig';
import { runMomentDetectionAsync } from './moments/momentDetectionEngine';
import {
  DEFAULT_SEGMENTATION_CONFIG,
  runTemporalSegmentation,
} from './segmentation/temporalSegmentation';
import { formatGap, photoIdentity } from './segmentation/timestampUtils';
import './TimelineGallery.scss';

const INITIAL_VISIBLE_SEGMENTS = 6;
const SEGMENT_PAGE_SIZE = 6;

const TimelineGallery = ({ photos = [], projectId, collectionId }) => {
  const isAdmin = useAdminAuth();

  const [draftConfig, setDraftConfig] = useState({ ...DEFAULT_SEGMENTATION_CONFIG });
  const [appliedConfig, setAppliedConfig] = useState({ ...DEFAULT_SEGMENTATION_CONFIG });
  const [runNonce, setRunNonce] = useState(0);

  const [result, setResult] = useState(null);
  const [isComputing, setIsComputing] = useState(true);
  const [computeError, setComputeError] = useState(null);

  const [momentDraftConfig, setMomentDraftConfig] = useState({ ...DEFAULT_MOMENT_CONFIG });
  const [momentAppliedConfig, setMomentAppliedConfig] = useState({ ...DEFAULT_MOMENT_CONFIG });
  const [momentRunNonce, setMomentRunNonce] = useState(0);
  const [momentResult, setMomentResult] = useState(null);
  const [isDetectingMoments, setIsDetectingMoments] = useState(false);
  const [momentProgress, setMomentProgress] = useState(null);
  const [momentError, setMomentError] = useState(null);

  const forceMomentRunRef = useRef(false);

  const [selectedSegmentId, setSelectedSegmentId] = useState(null);
  const [visibleSegmentCount, setVisibleSegmentCount] = useState(INITIAL_VISIBLE_SEGMENTS);

  const [preview, setPreview] = useState({ isOpen: false, index: 0 });

  const loadMoreRef = useRef(null);

  // Apply configuration changes automatically (debounced), so the developer
  // sees a new segmentation without a page reload while typing stays smooth.
  useEffect(() => {
    if (!isAdmin) return undefined;
    const timer = window.setTimeout(() => {
      setAppliedConfig(draftConfig);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [draftConfig, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    const timer = window.setTimeout(() => {
      setMomentAppliedConfig(normalizeMomentConfig(momentDraftConfig));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [momentDraftConfig, isAdmin]);

  // Segmentation runs outside render. Yielding once with setTimeout lets the
  // controls paint before the (pure, O(n log n) for time-gap) calculation runs.
  useEffect(() => {
    if (!isAdmin) {
      setResult(null);
      setIsComputing(false);
      return undefined;
    }

    let cancelled = false;
    setIsComputing(true);
    setComputeError(null);

    const timer = window.setTimeout(() => {
      try {
        const next = runTemporalSegmentation(photos, appliedConfig);
        if (cancelled) return;
        setResult(next);
        setMomentResult(null);
        setVisibleSegmentCount(INITIAL_VISIBLE_SEGMENTS);
        setSelectedSegmentId(null);
      } catch (error) {
        if (cancelled) return;
        setComputeError(error);
      } finally {
        if (!cancelled) setIsComputing(false);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [photos, appliedConfig, runNonce, isAdmin]);

  // Moment detection is independent of segmentation: re-running it never
  // re-runs temporal segmentation, and per-segment results are cached by
  // photo IDs + timestamps + config.
  useEffect(() => {
    if (!isAdmin || !momentAppliedConfig.enabled || !result) {
      setIsDetectingMoments(false);
      setMomentProgress(null);
      setMomentError(null);
      return undefined;
    }

    const controller = new AbortController();
    setIsDetectingMoments(true);
    setMomentError(null);

    const timer = window.setTimeout(async () => {
      try {
        const next = await runMomentDetectionAsync(result, momentAppliedConfig, {
          force: forceMomentRunRef.current,
          signal: controller.signal,
          onProgress: setMomentProgress,
        });
        if (!controller.signal.aborted) setMomentResult(next);
      } catch (error) {
        if (!controller.signal.aborted && error.name !== 'AbortError') {
          setMomentError(error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsDetectingMoments(false);
          setMomentProgress(null);
          forceMomentRunRef.current = false;
        }
      }
    }, 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [result, momentAppliedConfig, momentRunNonce, isAdmin]);

  useEffect(() => {
    if (!selectedSegmentId || !result) return;
    const stillExists = result.segments.some((segment) => segment.id === selectedSegmentId);
    if (!stillExists) setSelectedSegmentId(null);
  }, [result, selectedSegmentId]);

  // Preview uses the chronologically sorted valid photos first, followed by the
  // excluded photos so missing-timestamp images can still be inspected.
  const previewImages = useMemo(() => {
    if (!result) return [];
    return [...result.sortedPhotos, ...result.invalidPhotos];
  }, [result]);

  const previewIndexByKey = useMemo(() => {
    const map = new Map();
    previewImages.forEach((photo, index) => {
      const key = photoIdentity(photo);
      if (key && !map.has(key)) map.set(key, index);
    });
    return map;
  }, [previewImages]);

  const openPhoto = useCallback((photo) => {
    const key = photoIdentity(photo);
    const index = previewIndexByKey.get(key) ?? 0;
    setPreview({ isOpen: true, index });
  }, [previewIndexByKey]);

  const closePreview = useCallback(() => {
    setPreview((current) => ({ ...current, isOpen: false }));
  }, []);

  const setPreviewIndex = useCallback((index) => {
    setPreview((current) => ({ ...current, index }));
  }, []);

  // Match the existing gallery preview behavior: hide chrome while inspecting.
  useEffect(() => {
    const header = document.querySelector('.header');
    const sidebar = document.querySelector('.sidebar');
    const projectInfo = document.querySelector('.project-info');

    const restoreChrome = () => {
      if (header) header.style.display = 'grid';
      if (sidebar) sidebar.style.display = 'flex';
      if (projectInfo) projectInfo.style.display = 'grid';
      document.body.style.overflow = 'auto';
    };

    if (preview.isOpen) {
      if (header) header.style.display = 'none';
      if (sidebar) sidebar.style.display = 'none';
      if (projectInfo) projectInfo.style.display = 'none';
      document.body.style.overflow = 'hidden';
      return restoreChrome;
    }

    restoreChrome();
    return undefined;
  }, [preview.isOpen]);

  // Infinite reveal for segment headers only. Photo tiles are still limited
  // per segment, so a shoot with thousands of images never mounts them all.
  useEffect(() => {
    if (!result || visibleSegmentCount >= result.segments.length) return undefined;

    const node = loadMoreRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleSegmentCount((count) => Math.min(
          count + SEGMENT_PAGE_SIZE,
          result.segments.length,
        ));
      }
    }, { rootMargin: '600px' });

    observer.observe(node);
    return () => observer.disconnect();
  }, [result, visibleSegmentCount]);

  // Defense in depth: the parent also falls back to the default gallery mode,
  // but this component can never render for a non-admin even if mounted alone.
  if (!isAdmin) return null;

  const visibleSegments = result ? result.segments.slice(0, visibleSegmentCount) : [];
  const remainingSegments = result ? result.segments.length - visibleSegments.length : 0;

  return (
    <div className="timeline-gallery">
      <div className="timeline-intro">
        <div>
          <span className="timeline-eyebrow">Developer / experimental</span>
          <h2>Timeline (New)</h2>
          <p>
            Chronological capture timeline with automatic temporal segmentation
            and experimental Moment Detection inside each segment. Read-only —
            photo records, embeddings, selection state, and ordering are untouched.
          </p>
        </div>
        {isComputing && result && <span className="timeline-working">Re-segmenting…</span>}
        {!isComputing && isDetectingMoments && result && (
          <span className="timeline-working">
            Detecting Moments{momentProgress ? ` ${momentProgress.completed}/${momentProgress.total}` : '…'}
          </span>
        )}
      </div>

      <TimelineControls
        config={draftConfig}
        appliedConfig={appliedConfig}
        isComputing={isComputing}
        onChange={setDraftConfig}
        onRerun={() => {
          setAppliedConfig(draftConfig);
          setRunNonce((value) => value + 1);
        }}
        onReset={() => {
          setDraftConfig({ ...DEFAULT_SEGMENTATION_CONFIG });
          setAppliedConfig({ ...DEFAULT_SEGMENTATION_CONFIG });
          setRunNonce((value) => value + 1);
        }}
      />

      <MomentDetectionControls
        config={momentDraftConfig}
        appliedConfig={momentAppliedConfig}
        isDetecting={isDetectingMoments}
        stats={momentResult?.stats || null}
        onChange={setMomentDraftConfig}
        onRegenerate={() => {
          setMomentAppliedConfig(normalizeMomentConfig(momentDraftConfig));
          forceMomentRunRef.current = true;
          setMomentRunNonce((value) => value + 1);
        }}
        onReset={() => {
          setMomentDraftConfig({ ...DEFAULT_MOMENT_CONFIG });
          setMomentAppliedConfig({ ...DEFAULT_MOMENT_CONFIG });
          forceMomentRunRef.current = true;
          setMomentRunNonce((value) => value + 1);
        }}
      />

      {computeError && (
        <div className="timeline-error" role="alert">
          Segmentation failed: {computeError.message}
        </div>
      )}

      {momentError && (
        <div className="timeline-error" role="alert">
          Moment detection failed: {momentError.message}
        </div>
      )}

      {!result && isComputing && (
        <div className="timeline-loading">
          <span className="timeline-spinner" />
          <p>Preparing timeline and normalizing capture timestamps…</p>
        </div>
      )}

      {result && (
        <>
          <TimelineSummary stats={result.stats} />

          {momentAppliedConfig.enabled && momentResult && (
            <MomentDetectionSummary
              stats={momentResult.stats}
              config={momentAppliedConfig}
            />
          )}

          {result.stats.totalPhotos === 0 && (
            <div className="timeline-empty">No photos in this gallery yet.</div>
          )}

          {result.stats.totalPhotos > 0 && result.segments.length === 0 && (
            <div className="timeline-empty">
              No photos have a usable capture timestamp. All {result.stats.excludedPhotos} photos are listed below as excluded.
            </div>
          )}

          <div className="timeline-track" role="list" aria-label="Chronological photo timeline">
            {visibleSegments.map((segment) => (
              <React.Fragment key={segment.id}>
                {segment.gapFromPreviousMs !== null && (
                  <div className="timeline-boundary" aria-hidden="true">
                    <span className="timeline-boundary-line" />
                    <span className={`timeline-boundary-label ${segment.gapFromPreviousMs > 0 ? 'has-gap' : ''}`}>
                      {segment.gapFromPreviousMs > 0
                        ? `temporal boundary · ${formatGap(segment.gapFromPreviousMs)} gap`
                        : 'temporal boundary · continuous'}
                    </span>
                    <span className="timeline-boundary-line" />
                  </div>
                )}

                <div role="listitem">
                  <TimelineSegment
                    segment={segment}
                    isSelected={selectedSegmentId === segment.id}
                    onSelect={(id) => setSelectedSegmentId((current) => (current === id ? null : id))}
                    onOpenPhoto={openPhoto}
                    momentDetectionEnabled={momentAppliedConfig.enabled}
                    momentResult={momentResult?.momentsBySegmentId.get(segment.id) || null}
                  />
                </div>
              </React.Fragment>
            ))}
          </div>

          {remainingSegments > 0 && (
            <div className="timeline-load-more" ref={loadMoreRef}>
              <button
                type="button"
                className="timeline-button"
                onClick={() => setVisibleSegmentCount((count) => count + SEGMENT_PAGE_SIZE)}
              >
                Load more segments ({remainingSegments} remaining)
              </button>
            </div>
          )}

          <TimelineExcluded photos={result.invalidPhotos} onOpenPhoto={openPhoto} />
        </>
      )}

      {preview.isOpen && previewImages.length > 0 && (
        <Preview
          images={previewImages}
          image={previewImages[preview.index] || previewImages[0]}
          previewIndex={preview.index}
          setPreviewIndex={setPreviewIndex}
          imagesLength={previewImages.length}
          closePreview={closePreview}
          projectId={projectId}
          collectionId={collectionId}
        />
      )}
    </div>
  );
};

export default TimelineGallery;
