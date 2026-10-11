import React, { useEffect, useMemo, useState } from 'react';
import { fetchGallerySelections } from '../../../firebase/functions/selection-gallery-firestore';
import { getThumbnailUrl } from '../../../utils/urlUtils';

/**
 * Photographer "View Selection": selected photos + category + originating
 * collection + timestamp. Reads selection references (no duplicates).
 */
export default function SelectionPhotographerView({ domain, projectId, gallery, project }) {
  const [selections, setSelections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!domain || !projectId || !gallery?.id) return;
      setLoading(true);
      try {
        const rows = await fetchGallerySelections(domain, projectId, gallery.id);
        if (!cancelled) setSelections(rows);
      } catch (e) {
        console.error('Failed to load selections:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [domain, projectId, gallery?.id]);

  const photoByKey = useMemo(() => {
    const map = {};
    (project?.collections || []).forEach((c) => {
      (c.uploadedFiles || []).forEach((f) => {
        if (f.url) map[f.url] = { ...f, collectionId: c.id, collectionName: c.name };
        if (f.photoId) map[f.photoId] = { ...f, collectionId: c.id, collectionName: c.name };
        if (f.name) map[f.name] = { ...f, collectionId: c.id, collectionName: c.name };
      });
    });
    return map;
  }, [project]);

  const grouped = useMemo(() => {
    const groups = {};
    selections.forEach((s) => {
      const k = s.categoryId || 'uncategorized';
      if (!groups[k]) groups[k] = [];
      groups[k].push(s);
    });
    return groups;
  }, [selections]);

  const catName = (id) => gallery?.categories?.find((c) => c.id === id)?.name || (id === 'uncategorized' ? 'Uncategorized' : id);

  if (loading) return <p className="muted">Loading selections…</p>;

  return (
    <div className="selection-photographer-view" data-testid="selection-photographer-view">
      <h4>{gallery?.name} — {selections.length} selected</h4>
      {Object.keys(grouped).length === 0 && <p className="muted">No selections yet.</p>}
      {Object.entries(grouped).map(([catId, rows]) => (
        <div key={catId} className="spv-group">
          <h5>{catName(catId)} ({rows.length})</h5>
          <div className="spv-grid">
            {rows.map((s) => {
              const photo = photoByKey[s.photoKey] || photoByKey[s.photoId] || photoByKey[s.url] || {};
              const thumb = photo.url ? getThumbnailUrl(photo.url) : (s.url ? getThumbnailUrl(s.url) : '');
              return (
                <div key={s.id} className="spv-item" title={`${photo.collectionName || s.collectionId || ''} · ${s.selectedAt ? new Date(s.selectedAt).toLocaleString() : ''}`}>
                  {thumb ? <img src={thumb} alt="" loading="lazy" /> : <div className="spv-missing">{s.photoKey}</div>}
                  <div className="spv-meta">
                    <span>{photo.collectionName || s.collectionId || ''}</span>
                    <span>{s.selectedAt ? new Date(s.selectedAt).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
