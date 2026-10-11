import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import SelectionCategoryEditor from './SelectionCategoryEditor';
import { normalizeGallery } from '../../../utils/selectionGalleryUtils';

/**
 * Photographer-side create / configure modal for a Selection Gallery.
 * Props: initial (gallery or null), onSave(payload), onClose, saving
 */
export default function SelectionGalleryConfigModal({ initial = null, onSave, onClose, saving = false }) {
  const [name, setName] = useState(initial?.name || 'Album Selection');
  const [mode, setMode] = useState(initial?.selectionMode || 'limit');
  const [limit, setLimit] = useState(initial?.selectionLimit ?? 80);
  const [categories, setCategories] = useState(() => (initial?.categories || []).map((c) => ({ ...c })));

  useEffect(() => {
    if (initial) {
      const g = normalizeGallery(initial);
      setName(g.name);
      setMode(g.selectionMode);
      setLimit(g.selectionLimit ?? 80);
      setCategories(g.categories.map((c) => ({ ...c })));
    }
  }, [initial]);

  const handleSave = () => {
    const payload = {
      name: (name || 'Album Selection').trim() || 'Album Selection',
      selectionMode: mode,
      selectionLimit: mode === 'unlimited' ? null : Math.max(1, parseInt(limit || '0', 10) || 1),
      categories: categories.map((c, i) => ({
        ...c,
        sortOrder: i,
        maximumSelections: c.maximumSelections === '' ? null : c.maximumSelections,
        limit: c.maximumSelections === '' ? null : c.maximumSelections,
      })),
    };
    onSave && onSave(payload);
  };

  // Escape closes; body scroll is already locked by the parent ShareGallery modal.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Portal to document.body: the global `.modal-container` is `position: fixed`
  // without `top: 0` and ShareGallery's `.modal-body` has backdrop-filter +
  // overflow scroll, which traps fixed descendants (containing block) and
  // strands the dialog off-screen while its `top: 0` backdrop still covers
  // the viewport (backdrop visible, dialog missing). As a direct body child
  // this behaves like every other app modal.
  return createPortal(
    <div className="selection-gallery-config-modal modal-container" data-testid="selection-gallery-config">
      <div className="modal create-project island">
        <div className="modal-header">
          <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">{initial?.id ? 'Configure Selection Gallery' : 'Create Selection Gallery'}</div>
        </div>
        <div className="modal-body">
          <div className="form-section">
            <div className="field">
              <label htmlFor="sgm-name">Gallery name</label>
              <input
                id="sgm-name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Album Selection"
              />
            </div>
            <div className="field">
              <label>Selection mode</label>
              <div className="field-options project-validity-options">
                <div className="radio-button-group">
                  <input
                    type="radio"
                    id="sgm-mode-limit"
                    name="selection-mode"
                    checked={mode === 'limit'}
                    onChange={() => setMode('limit')}
                  />
                  <label htmlFor="sgm-mode-limit">Set limit</label>
                </div>
                <div className="radio-button-group">
                  <input
                    type="radio"
                    id="sgm-mode-unlimited"
                    name="selection-mode"
                    checked={mode === 'unlimited'}
                    onChange={() => setMode('unlimited')}
                  />
                  <label htmlFor="sgm-mode-unlimited">No limit</label>
                </div>
              </div>
            </div>
            {mode === 'limit' && (
              <div className="field">
                <label htmlFor="sgm-limit">Maximum selections</label>
                <input
                  id="sgm-limit"
                  type="number"
                  min="1"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                />
              </div>
            )}
            <SelectionCategoryEditor categories={categories} onChange={setCategories} />
          </div>
        </div>
        <div className="actions">
          <div className="button secondary" onClick={onClose}>Cancel</div>
          <div className={`button primary${saving ? ' disabled' : ''}`} onClick={saving ? undefined : handleSave}>
            {saving ? 'Saving…' : initial?.id ? 'Save Changes' : 'Create Gallery'}
          </div>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>,
    document.body,
  );
}
