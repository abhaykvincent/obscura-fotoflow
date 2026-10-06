import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchGalleries,
  createGallery,
  updateGallery,
  activateGallery,
  reopenGallery,
  selectGalleriesForProject,
} from '../../../app/slices/selectionGalleriesSlice';
import { completeSelectionGallery as apiComplete } from '../../../firebase/functions/selection-gallery-firestore';
import SelectionGalleryConfigModal from './SelectionGalleryConfigModal';
import { getGalleryURL } from '../../../utils/urlUtils';
import CopyButton from '../../../components/CopyButton/CopyButton';
import { showAlert } from '../../../app/slices/alertSlice';

/**
 * Photographer-side Selection Galleries summary + management.
 * Shows name / status / count / limit / % / categories / activity.
 */
export default function SelectionGalleryManager({ domain, project, compact = false }) {
  const dispatch = useDispatch();
  const galleries = useSelector((s) => selectGalleriesForProject(s, project?.id));
  const [showConfig, setShowConfig] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (domain && project?.id) {
      dispatch(fetchGalleries({ domain, projectId: project.id }));
    }
  }, [dispatch, domain, project?.id]);

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editing?.id && editing.id !== 'new') {
        await dispatch(updateGallery({ domain, projectId: project.id, galleryId: editing.id, updates: payload })).unwrap();
      } else {
        await dispatch(createGallery({ domain, projectId: project.id, payload })).unwrap();
        dispatch(fetchGalleries({ domain, projectId: project.id }));
      }
      setShowConfig(false);
      setEditing(null);
    } catch (e) {
      dispatch(showAlert({ type: 'error', message: `Could not save gallery: ${e.message}` }));
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = (gallery) => `${window.location.protocol}//${window.location.host}/${domain}/selection/${project.id}/gallery/${gallery.id}`;

  return (
    <div className="selection-gallery-manager" data-testid="selection-gallery-manager">
      <div className="sgm-header">
        <h3>Selection Galleries</h3>
        <button
          className="button primary small"
          onClick={() => { setEditing({ id: 'new' }); setShowConfig(true); }}
        >
          + Create Selection Gallery
        </button>
      </div>
      {(!galleries || galleries.length === 0) && (
        <p className="muted">No selection galleries yet. Create one to ask clients for limited, categorized selections without duplicating photos.</p>
      )}
      <div className="sgm-list">
        {(galleries || []).map((g) => {
          const limit = g.selectionMode === 'unlimited' ? null : g.selectionLimit;
          const pct = limit ? Math.min(100, Math.round(((g.selectedCount || 0) / limit) * 100)) : 0;
          return (
            <div key={g.id} className={`sgm-card status-${g.status}`}>
              <div className="sgm-card-main">
                <div className="sgm-name">{g.name}</div>
                <div className="sgm-meta">
                  <span className={`status-badge ${g.status}`}>{g.status}</span>
                  <span>{limit !== null ? `${g.selectedCount || 0} / ${limit} (${pct}%)` : `${g.selectedCount || 0} selected`}</span>
                  {g.categories?.length > 0 && <span>{g.categories.length} categories</span>}
                  {g.completedAt && <span>Completed {new Date(g.completedAt).toLocaleDateString()}</span>}
                </div>
                {g.categories?.length > 0 && !compact && (
                  <div className="sgm-categories">
                    {g.categories.map((c) => (
                      <span key={c.id} className="sgm-cat">
                        {c.name} {c.maximumSelections !== null && c.maximumSelections !== undefined ? `${c.selectedCount || 0}/${c.maximumSelections}` : `${c.selectedCount || 0}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="sgm-actions">
                <button className="button secondary small" onClick={() => { setEditing(g); setShowConfig(true); }}>Configure</button>
                {g.status === 'draft' && (
                  <button className="button primary small outline" onClick={() => dispatch(activateGallery({ domain, projectId: project.id, galleryId: g.id }))}>
                    Activate
                  </button>
                )}
                {g.status === 'completed' && (
                  <button className="button secondary small" onClick={() => dispatch(reopenGallery({ domain, projectId: project.id, galleryId: g.id }))}>
                    Reopen
                  </button>
                )}
                {g.status === 'active' && (
                  <>
                    <CopyButton text={handleCopyLink(g)} className="button secondary small" title="Copy client link" onCopied={() => dispatch(showAlert({ type: 'success', message: 'Selection link copied!' }))} />
                    <a className="button secondary small" href={handleCopyLink(g)} target="_blank" rel="noreferrer">Open</a>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {showConfig && (
        <SelectionGalleryConfigModal
          initial={editing?.id === 'new' ? null : editing}
          saving={saving}
          onSave={handleSave}
          onClose={() => { setShowConfig(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
