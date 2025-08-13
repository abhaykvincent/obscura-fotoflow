import React, { useState } from 'react';
import ImageGrid from './ImageGrid';
import Carousel from './Carousel';
import TextBlock from './TextBlock';
import './GallerySections.scss';

const sectionComponents = {
  'image-grid': ImageGrid,
  carousel: Carousel,
  'text-block': TextBlock,
};

const GallerySections = ({ sections, onSectionsUpdate }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [insertionIndex, setInsertionIndex] = useState(null);

  const handleSectionUpdate = (updatedSection, index) => {
    const newSections = [...sections];
    newSections[index] = updatedSection;
    onSectionsUpdate(newSections);
  };

  const addSection = (type) => {
    const newSection = { type, id: Date.now() };
    const newSections = [...sections];
    newSections.splice(insertionIndex, 0, newSection);
    onSectionsUpdate(newSections);
    setDialogOpen(false);
    setInsertionIndex(null);
  };

  const openDialog = (index) => {
    setInsertionIndex(index);
    setDialogOpen(true);
  };

  return (
    <div className="gallery-sections">
      <div className="section-container">
        {sections.map((section, index) => {
          const SectionComponent = sectionComponents[section.type];
          return (
            <div key={section.id} className="section-wrapper">
              {SectionComponent ? (
                <SectionComponent
                  section={section}
                  onSectionUpdate={(updatedSection) =>
                    handleSectionUpdate(updatedSection, index)
                  }
                />
              ) : null}
              <div className="add-section-icon-container">
                <button
                  className="add-section-icon"
                  onClick={() => openDialog(index + 1)}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
        {sections.length === 0 && (
          <div className="add-section-icon-container">
            <button className="add-section-icon" onClick={() => openDialog(0)}>
              +
            </button>
          </div>
        )}
      </div>

      {dialogOpen && (
        <div className="add-section-dialog-overlay">
          <div className="add-section-dialog">
            <h3>Add Section</h3>
            <button onClick={() => addSection('image-grid')}>
              Add Image Grid
            </button>
            <button onClick={() => addSection('carousel')}>
              Add Carousel
            </button>
            <button onClick={() => addSection('text-block')}>
              Add Text Block
            </button>
            <button
              className="close-dialog"
              onClick={() => setDialogOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GallerySections;
