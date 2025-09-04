import React, { useState } from 'react';
import ImageGrid, { ImageDragOverlay } from './ImageGrid';
import Carousel from './Carousel';
import TextBlock from './TextBlock';
import SubGallery from './SubGallery';
import Embed from './Embed';
import { BsImage, BsCollection, BsTextareaT, BsCode } from 'react-icons/bs';
import './GallerySections.scss';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor as DndPointerSensor,
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

// Custom Pointer Sensor that ignores elements with data-no-dnd="true"
class CustomPointerSensor extends DndPointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown',
      handler: ({ nativeEvent: event }) => {
        if (
          !event.isPrimary ||
          event.button !== 0 ||
          event.target.closest('[data-no-dnd="true"]')
        ) {
          return false;
        }
        return true;
      },
    },
  ];
}

const sectionComponents = {
  'image-grid': ImageGrid,
  carousel: Carousel,
  'text-block': TextBlock,
  'sub-gallery': SubGallery,
  embed: Embed,
};

const SortableSection = ({ section, index, id, collectionId, collectionName, handleSectionUpdate, openDialog, isAnySectionDragging, handleDeleteSection, sections, handleMerge }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, data: { type: 'section' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  const SectionComponent = sectionComponents[section.type];

  const showTopMerge =
    index > 0 &&
    section.type === 'image-grid' &&
    sections[index - 1]?.type === 'image-grid';

  const showBottomMerge =
    index < sections.length - 1 &&
    section.type === 'image-grid' &&
    sections[index + 1]?.type === 'image-grid';

  return (
    <div ref={setNodeRef} style={style} className="section-wrapper" {...attributes} {...listeners}>
      <div className="toolbar vertical">
        <div className="tools-container">
          <button
            className='button text-only icon section-settings dark-icon'
            data-no-dnd="true"
          ></button>
          <button
            className='button text-only icon delete-red dark-icon'
            data-no-dnd="true"
            onClick={() => handleDeleteSection(section.id)}
          ></button>
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
            data-no-dnd="true"
          ></button>
          {showTopMerge && (
            <button
              className="merge-sections-icon"
              onClick={() => handleMerge(index - 1)}
              data-no-dnd="true"
            ></button>
          )}
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
            data-no-dnd="true"
          ></button>
          {showBottomMerge && (
            <button
              className="merge-sections-icon"
              onClick={() => handleMerge(index)}
              data-no-dnd="true"
            ></button>
          )}
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
  const [activeItem, setActiveItem] = useState(null);

  const sensors = useSensors(
    useSensor(CustomPointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleMerge = (index) => {
    const newSections = [...sections];
    const section1 = newSections[index];
    const section2 = newSections[index + 1];

    if (section1.type === 'image-grid' && section2.type === 'image-grid') {
      const mergedImages = [...(section1.images || []), ...(section2.images || [])];
      const updatedSection1 = { ...section1, images: mergedImages };
      newSections[index] = updatedSection1;
      newSections.splice(index + 1, 1);
      onSectionsUpdate(newSections);
    }
  };

  const handleSectionUpdate = (updatedSection, index) => {
    const newSections = [...sections];
    newSections[index] = updatedSection;
    onSectionsUpdate(newSections);
  };

  const handleDeleteSection = (sectionId) => {
    const newSections = sections.filter((s) => s.id !== sectionId);
    onSectionsUpdate(newSections);
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const type = active.data.current?.type;

    if (type === 'section') {
      const section = sections.find((s) => s.id === active.id);
      setActiveItem({ type: 'section', data: section });
    } else if (type === 'image') {
      const { image } = active.data.current;
      const node = active.rect.current.initial;
      const imageForOverlay = node ? { ...image, width: node.width, height: node.height } : image;
      setActiveItem({ type: 'image', data: imageForOverlay });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeType = active.data.current?.type;

    if (activeType === 'section') {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onSectionsUpdate(arrayMove(sections, oldIndex, newIndex));
      }
    } else if (activeType === 'image') {
      const fromSectionId = active.data.current.fromSection;
      let toSectionId = null;
      let newImageIndex = -1;

      const overType = over.data.current?.type;

      if (overType === 'image') {
        toSectionId = over.data.current.fromSection;
        newImageIndex = sections.find(s => s.id === toSectionId)?.images.findIndex(i => i.url === over.id) ?? -1;
      } else if (overType === 'section') {
        const toSection = sections.find(s => s.id === over.id);
        if (toSection?.type === 'image-grid') {
          toSectionId = over.id;
          newImageIndex = toSection.images.length; // Append
        }
      }

      if (!toSectionId) return;

      const fromSectionIndex = sections.findIndex(s => s.id === fromSectionId);
      const toSectionIndex = sections.findIndex(s => s.id === toSectionId);

      if (fromSectionIndex === -1 || toSectionIndex === -1) return;

      const fromSection = sections[fromSectionIndex];
      const imageIndex = fromSection.images.findIndex(img => img.url === active.id);
      if (imageIndex === -1) return;

      const newSections = JSON.parse(JSON.stringify(sections));
      const [movedImage] = newSections[fromSectionIndex].images.splice(imageIndex, 1);

      if (fromSectionId === toSectionId) {
        if (newImageIndex === -1) newImageIndex = newSections[toSectionIndex].images.length;
        newSections[toSectionIndex].images.splice(newImageIndex, 0, movedImage);
      } else {
        if (newImageIndex === -1) newImageIndex = newSections[toSectionIndex].images.length;
        newSections[toSectionIndex].images.splice(newImageIndex, 0, movedImage);
      }
      onSectionsUpdate(newSections);
    }
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
              <div className="section-wrapper default-wrapper">
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
                isAnySectionDragging={!!activeItem}
                handleDeleteSection={handleDeleteSection}
                sections={sections}
                handleMerge={handleMerge}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeItem ? (
            activeItem.type === 'section' ? (
              <SectionDragOverlay
                section={activeItem.data}
                id={id}
                collectionId={collectionId}
                collectionName={collectionName}
              />
            ) : activeItem.type === 'image' ? (
              <ImageDragOverlay image={activeItem.data} />
            ) : null
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
