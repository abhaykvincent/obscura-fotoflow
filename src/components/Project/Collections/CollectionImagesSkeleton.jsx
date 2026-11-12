import React from 'react';

const DEFAULT_TILE_COUNT = 16;

const CollectionImagesSkeleton = ({ count = DEFAULT_TILE_COUNT }) => (
    <div className="gallary skeleton-gallery" aria-busy="true" aria-label="Loading photos">
        <div className="photos">
            {Array.from({ length: count }).map((_, index) => (
                <div className="photo-wrap photo-skeleton" key={index}>
                    <div className="photo-skeleton-tile"></div>
                </div>
            ))}
        </div>
    </div>
);

export default CollectionImagesSkeleton;
