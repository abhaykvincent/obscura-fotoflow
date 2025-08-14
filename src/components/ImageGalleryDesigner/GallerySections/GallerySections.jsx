import React, { useState } from 'react';
import ImageGrid from './ImageGrid';
import Carousel from './Carousel';
import TextBlock from './TextBlock';
import SubGallery from './SubGallery';
import Embed from './Embed';
import { BsImage, BsCollection, BsTextareaT, BsCode } from 'react-icons/bs';
import './GallerySections.scss';
import { orderBy } from 'firebase/firestore';

const sectionComponents = {
  'image-grid': ImageGrid,
  carousel: Carousel,
  'text-block': TextBlock,
  'sub-gallery': SubGallery,
  embed: Embed,
};

const GallerySections = ({id, collectionId, collectionName, sections, onSectionsUpdate }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [insertionIndex, setInsertionIndex] = useState(null);

  const handleSectionUpdate = (updatedSection, index) => {
    const newSections = [...sections];
    newSections[index] = updatedSection;
    onSectionsUpdate(newSections);
  };

  const handleMoveUp = (index) => {
    if (index > 0) {
      const newSections = [...sections];
      const [movedSection] = newSections.splice(index, 1);
      newSections.splice(index - 1, 0, movedSection);
      onSectionsUpdate(newSections);
    }
  };

  const handleMoveDown = (index) => {
    if (index < sections.length - 1) {
      const newSections = [...sections];
      const [movedSection] = newSections.splice(index, 1);
      newSections.splice(index + 1, 0, movedSection);
      onSectionsUpdate(newSections);
    }
  };

  const addSection = (type) => {
    const newSection = { 
      
      type, 
      id: Date.now(),
      images:[],
      order: insertionIndex,
    };
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
              <div className="toolbar vertical">
                <div className="tools-container">
                  <button className='button text-only  icon section-settings dark-icon'></button>                                  
                  <button  className='button text-only  icon delete-red dark-icon'></button>
                </div>
                <div className="tools-container">                                    
                  <button className='button text-only  icon move-up dark-icon' onClick={() => handleMoveUp(index)}></button>            
                  <button className='button text-only  icon move-down dark-icon' onClick={() => handleMoveDown(index)}></button>  
                </div>
              </div>
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
                  id={id}
                  collectionId={collectionId}
                  collectionName={collectionName}

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
                <div className="section-option-icon"><BsImage /></div>
                <div className="section-option-text">
                  <h3>Media</h3>
                  <p>Create a media section.</p>
                </div>
                <div className="section-option-add">+</div>
              </div>
              <div className="section-option" onClick={() => addSection('sub-gallery')}>
                <div className="section-option-icon"><BsCollection /></div>
                <div className="section-option-text">
                  <h3>Sub-Galleryuytfv</h3>
                  <p>Add multiple galleries.</p>
                </div>
                <div className="section-option-add">+</div>
              </div>
              <div className="section-option" onClick={() => addSection('text-block')}>
                <div className="section-option-icon"><BsTextareaT /></div>
                <div className="section-option-text">
                  <h3>Text</h3>
                  <p>Add a title and paragraph.</p>
                </div>
                <div className="section-option-add">+</div>
              </div>
              <div className="section-option" onClick={() => addSection('embed')}>
                <div className="section-option-icon"><BsCode /></div>
                <div className="section-option-text">
                  <h3>Embed</h3>
                  <p>Paste an embed code.</p>
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
