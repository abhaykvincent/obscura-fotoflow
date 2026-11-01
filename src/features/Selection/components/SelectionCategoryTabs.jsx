import React from 'react';
import { getCategoryLimit } from '../../../utils/selectionGalleryUtils';

/**
 * Category tabs / bucket selector.
 * Categories are selection buckets (not image collections).
 * Client selects while inside a category; the photo reference is
 * assigned to the active category on select.
 */
export default function SelectionCategoryTabs({ gallery, activeCategoryId, onChange, countsOverride = {} }) {
  const categories = gallery?.categories || [];
  if (categories.length === 0) return null;
  const active = activeCategoryId || categories[0]?.id;

  return (
    <div className="selection-category-tabs" data-testid="selection-category-tabs" role="tablist" aria-label="Selection categories">
      {categories.map((cat) => {
        const limit = getCategoryLimit(cat);
        const count = countsOverride[cat.id] !== undefined ? countsOverride[cat.id] : Number(cat.selectedCount || 0);
        const isActive = cat.id === active;
        const isFull = limit !== null && count >= limit;
        return (
          <button
            key={cat.id}
            role="tab"
            aria-selected={isActive}
            className={`category-tab ${isActive ? 'active' : ''} ${isFull ? 'full' : ''}`}
            onClick={() => onChange && onChange(cat.id)}
          >
            <span className="category-name">{cat.name}</span>
            <span className="category-count">
              {limit !== null ? `${count} / ${limit}` : `${count}`}
              {isFull ? ' ✓' : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}
