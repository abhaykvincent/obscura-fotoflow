import React, { useEffect, useState } from 'react';
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

  return (
    <div className="selection-gallery-config-modal modal-container" data-testid="selection-gallery-config">
      <div className="modal island">
        <div className="modal-header">
          <div className="modal-title">{initial?.id ? 'Configure Selection Gallery' : 'Create Selection Gallery'}</div>
          <button className="button secondary small" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Album Selection" />
          </label>
          <div className="selection-mode-row">
            <label>
              <input type="radio" checked={mode === 'limit'} onChange={() => setMode('limit')} /> Set limit
            </label>
            <label>
              <input type="radio" checked={mode === 'unlimited'} onChange={() => setMode('unlimited')} /> No limit
            </label>
          </div>
          {mode === 'limit' && (
            <label>
              Maximum selections
              <input type="number" min="1" value={limit} onChange={(e) => setLimit(e.target.value)} />
            </label>
          )}
          <SelectionCategoryEditor categories={categories} onChange={setCategories} />
        </div>
        <div className="actions">
          <button className="button secondary" onClick={onClose}>Cancel</button>
          <button className="button primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : initial?.id ? 'Save Changes' : 'Create Gallery'}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
