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
        {sections.length === 0 && (

          <div className="section-wrapper">
            <div className="add-section-icon-container top">
              <button className="add-section-icon" onClick={() => openDialog(0)}>
                
              </button>
            </div>
          </div>
        )}
        {sections.map((section, index) => {
          const SectionComponent = sectionComponents[section.type];
          return (
            <div key={section.id} className="section-wrapper">
              <div className="add-section-icon-container top">
                <button
                  className="add-section-icon"
                  onClick={() => openDialog(index)}
                >
                  
                </button>
              </div>
              {SectionComponent ? (
                <SectionComponent
                  section={section}
                  onSectionUpdate={(updatedSection) =>
                    handleSectionUpdate(updatedSection, index)
                  }
                />
              ) : null}
              <div className="add-section-icon-container bottom">
                <button
                  className="add-section-icon"
                  onClick={() => openDialog(index + 1)}
                >
                  
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {dialogOpen && (
        <div className="add-section-dialog-overlay" onClick={() => setDialogOpen(false)}>
          <div className="add-section-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="add-section-dialog-header">
              <h2>Add a Section</h2>
              <button className="close-dialog" onClick={() => setDialogOpen(false)}>&times;</button>
            </div>
            <div className="add-section-dialog-body">
              <div className="section-option" onClick={() => addSection('image-grid')}>
                <div className="section-option-icon">ICON</div>
                <div className="section-option-text">
                  <h3>Media</h3>
                  <p>Create a media section.</p>
                </div>
                <div className="section-option-add">+</div>
              </div>
              <div className="section-option" onClick={() => addSection('text-block')}>
                <div className="section-option-icon">ICON</div>
                <div className="section-option-text">
                  <h3>Text</h3>
                  <p>Add a title and paragraph.</p>
                </div>
                <div className="section-option-add">+</div>
              </div>
            </div>
            <div className="add-section-dialog-footer">
              <p>You can add multiple sections to a gallery. <a>Learn more</a></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GallerySections;
