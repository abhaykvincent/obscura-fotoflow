import React from 'react';
import ImageGrid from '../ImageGalleryDesigner/GallerySections/ImageGrid';

const SectionRenderer = ({ section }) => {
  switch (section.type) {
    case 'image-grid':
      return <ImageGrid section={section} />;
    default:
      return <div>Unknown Section Type</div>;
  }
};

export default SectionRenderer;
