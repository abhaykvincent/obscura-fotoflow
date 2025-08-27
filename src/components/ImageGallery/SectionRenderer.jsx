import React from 'react';
import ImageGrid from '../ImageGalleryDesigner/GallerySections/ImageGrid';
import Carousel from '../ImageGalleryDesigner/GallerySections/Carousel';
import TextBlock from '../ImageGalleryDesigner/GallerySections/TextBlock';
import SubGallery from '../ImageGalleryDesigner/GallerySections/SubGallery';
import Embed from '../ImageGalleryDesigner/GallerySections/Embed';

const SectionRenderer = ({ section }) => {
  switch (section.type) {
    case 'image-grid':
      return <ImageGrid section={section} isViewOnly={true} />;
    case 'carousel':
      return <Carousel section={section} isViewOnly={true} />;
    case 'text-block':
      return <TextBlock section={section} isViewOnly={true} />;
    case 'sub-gallery':
      return <SubGallery section={section} isViewOnly={true} />;
    case 'embed':
      return <Embed section={section} isViewOnly={true} />;
    default:
      return <div>Unknown Section Type</div>;
  }
};

export default SectionRenderer;
