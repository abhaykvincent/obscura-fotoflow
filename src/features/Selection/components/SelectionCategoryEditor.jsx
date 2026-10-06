import React from 'react';
import { DEFAULT_CATEGORY_TEMPLATES, newCategoryId } from '../../../utils/selectionGalleryUtils';

/**
 * Photographer-side category list editor: add / rename / limit / reorder / remove / required.
 */
export default function SelectionCategoryEditor({ categories = [], onChange }) {
  const emit = (next) => onChange && onChange(next.map((c, i) => ({ ...c, sortOrder: i })));

  const handleAdd = (template = null) => {
    const existing = categories.map((c) => c.id);
    const name = template?.name || `Category ${categories.length + 1}`;
    const id = newCategoryId(name, existing);
    emit([...categories, {
      id,
      name,
      maximumSelections: template?.limit ?? 10,
      limit: template?.limit ?? 10,
      minimumSelections: 0,
      required: false,
      selectedCount: 0,
      sortOrder: categories.length,
    }]);
  };

  const handleUpdate = (id, patch) => {
    emit(categories.map((c) => (c.id === id ? { ...c, ...patch, limit: patch.maximumSelections !== undefined ? patch.maximumSelections : c.limit } : c)));
  };

  const handleRemove = (id) => {
    emit(categories.filter((c) => c.id !== id));
  };

  const handleMove = (id, dir) => {
    const idx = categories.findIndex((c) => c.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= categories.length) return;
    const next = [...categories];
    const [moved] = next.splice(idx, 1);
    next.splice(j, 0, moved);
    emit(next);
  };

  return (
    <div className="selection-category-editor" data-testid="selection-category-editor">
      <div className="category-editor-header">
        <h4>Categories</h4>
        <div className="category-template-buttons">
          <button className="button secondary small" onClick={() => handleAdd(null)}>+ Add Category</button>
        </div>
      </div>
      <div className="category-template-row">
        {DEFAULT_CATEGORY_TEMPLATES.map((t) => (
          <button key={t.name} className="button secondary small outline" onClick={() => handleAdd(t)} title={`Add ${t.name} (${t.limit})`}>
            + {t.name}
          </button>
        ))}
      </div>
      {categories.length === 0 && <p className="muted">No categories — selections will go to a single bucket.</p>}
      {categories.map((c) => (
        <div key={c.id} className="category-editor-row">
          <input
            aria-label="Category name"
            value={c.name}
            onChange={(e) => handleUpdate(c.id, { name: e.target.value })}
            placeholder="Category name"
          />
          <label title="Maximum selections (empty = unlimited)">
            Max
            <input
              type="number"
              min="0"
              placeholder="∞"
              value={c.maximumSelections ?? ''}
              onChange={(e) => {
                const v = e.target.value === '' ? null : Math.max(0, parseInt(e.target.value || '0', 10));
                handleUpdate(c.id, { maximumSelections: v });
              }}
            />
          </label>
          <label title="Required minimum before completion">
            Min
            <input
              type="number"
              min="0"
              value={c.minimumSelections ?? 0}
              onChange={(e) => handleUpdate(c.id, { minimumSelections: Math.max(0, parseInt(e.target.value || '0', 10)) })}
            />
          </label>
          <label title="Required category">
            <input type="checkbox" checked={Boolean(c.required)} onChange={(e) => handleUpdate(c.id, { required: e.target.checked })} />
            Required
          </label>
          <button className="button secondary small" onClick={() => handleMove(c.id, -1)} title="Move up">↑</button>
          <button className="button secondary small" onClick={() => handleMove(c.id, 1)} title="Move down">↓</button>
          <button className="button secondary small" onClick={() => handleRemove(c.id)} title="Remove">✕</button>
        </div>
      ))}
    </div>
  );
}
