import React, { useState } from 'react';
import ImageGrid from './ImageGrid';
import Carousel from './Carousel';
import TextBlock from './TextBlock';
import SubGallery from './SubGallery';
import Embed from './Embed';
import { BsImage, BsCollection, BsTextareaT, BsCode, BsGripVertical } from 'react-icons/bs';
import './GallerySections.scss';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const sectionComponents = {
  'image-grid': ImageGrid,
  carousel: Carousel,
  'text-block': TextBlock,
  'sub-gallery': SubGallery,
  embed: Embed,
};

const SortableSection = ({ section, index, id, collectionId, collectionName, handleSectionUpdate, openDialog, isAnySectionDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  const SectionComponent = sectionComponents[section.type];

  return (
    <div ref={setNodeRef} style={style} className="section-wrapper" {...attributes} {...listeners}>
      <div className="toolbar vertical">
        <div className="tools-container">
          <button className='button text-only icon section-settings dark-icon' onMouseDown={(e) => e.stopPropagation()}></button>
          <button className='button text-only icon delete-red dark-icon' onMouseDown={(e) => e.stopPropagation()}></button>
        </div>
        <div className="tools-container">
          {/* No specific drag handle icon needed here anymore */}
        </div>
      </div>
      {!isAnySectionDragging && (
        <div className="add-section-icon-container top">
          <button
            className="add-section-icon"
            onClick={() => openDialog(index)}
            onMouseDown={(e) => e.stopPropagation()}
          >
          </button>
        </div>
      )}
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
      {!isAnySectionDragging && (
        <div className="add-section-icon-container bottom">
          <button
            className="add-section-icon"
            onClick={() => openDialog(index + 1)}
            onMouseDown={(e) => e.stopPropagation()}
          >
          </button>
        </div>
      )}
    </div>
  );
};

// New component for the drag overlay
const SectionDragOverlay = ({ section, id, collectionId, collectionName }) => {
  const SectionComponent = sectionComponents[section.type];

  return (
    <div className="section-wrapper is-dragging-overlay">
      <div className="toolbar vertical">
        <div className="tools-container">
          <button className='button text-only icon section-settings dark-icon'></button>
          <button className='button text-only icon delete-red dark-icon'></button>
        </div>
        <div className="tools-container">
        </div>
      </div>
      {SectionComponent ? (
        <SectionComponent
          section={section}
          onSectionUpdate={() => {}}
          id={id}
          collectionId={collectionId}
          collectionName={collectionName}
        />
      ) : null}
    </div>
  );
}


const GallerySections = ({id, collectionId, collectionName, sections, onSectionsUpdate }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [insertionIndex, setInsertionIndex] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSectionUpdate = (updatedSection, index) => {
    const newSections = [...sections];
    newSections[index] = updatedSection;
    onSectionsUpdate(newSections);
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveSection(sections.find((s) => s.id === active.id));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newSections = arrayMove(sections, oldIndex, newIndex);
        onSectionsUpdate(newSections);
      }
    }
    setActiveSection(null);
  };

  const addSection = (type) => {
    const newSection = {
      type,
      id: `${type}-${Date.now()}`, // More robust ID
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        autoScroll={false}
      >
        <SortableContext
          items={sections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="section-container">
            {sections.length === 0 && (
              <div className="section-wrapper">
                <div className="add-section-icon-container top">
                  <button className="add-section-icon" onClick={() => openDialog(0)}>
                  </button>
                </div>
              </div>
            )}
            {sections.map((section, index) => (
              <SortableSection
                key={section.id}
                index={index}
                section={section}
                handleSectionUpdate={handleSectionUpdate}
                openDialog={openDialog}
                id={id}
                collectionId={collectionId}
                collectionName={collectionName}
                isAnySectionDragging={!!activeSection}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeSection ? (
            <SectionDragOverlay
              section={activeSection}
              id={id}
              collectionId={collectionId}
              collectionName={collectionName}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

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
                  <h3>Sub-Gallery</h3>
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
