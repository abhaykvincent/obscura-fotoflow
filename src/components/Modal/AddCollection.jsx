import React, { useEffect, useRef, useState } from 'react';
import { addCollection } from '../../app/slices/projectsSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { closeModal, closeModalWithAnimation, openModal, selectModal } from '../../app/slices/modalSlice';
import { selectUserStudio } from '../../app/slices/authSlice';
import { trackEvent } from '../../analytics/utils';
import { useModalFocus } from '../../hooks/modalInputFocus';
import { storeLimitContext } from '../../utils/localStorageUtills';
import { selectStudio } from '../../app/slices/studioSlice';

// Mapping of placeholders based on project type
const projectTypePlaceholders = {
  Wedding: ['Save the Date', 'Engagement', 'Wedding Day', 'Reception', 'Bride', 'Groom', 'Album'],
  Baptism: ['Baptism','Ceremony', 'Family', 'Godparents', 'Album'],
  Birthday: ['Birthday', 'Party','Group', 'Decorations'],
  Maternity: [ 'Maternity','Outdoor ','Bump Photos', 'Family Maternity', 'Studio Shoot'],
  Newborn: ['Sleeping Poses', 'Family with Baby', 'Sibling'],
  Headshot: [ 'Portraits','Group', 'Fashion','Professional'],
  Anniversary: ['Couple', 'Celebration','Family Gathering'],
  Family: ['Family', 'Generational Photos', 'Outdoor', 'Holiday', 'Candid Moments'],
  Group: ['Team', 'Friends ', 'Event','Candid Shots'],
  Travel: ['Travel','Landscape', 'Cultural', 'Adventure', 'Food'],
  Event: ['Highlights', 'Guest', 'Decorations', 'Speeches', 'Candid'],
};
function AddCollectionModal({ project }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const visible = useSelector(selectModal);
  const defaultStudio = useSelector(selectUserStudio);
  const studio = useSelector(selectStudio);
  console.log(studio);
  const collectionsLimit = {
    perProject: defaultStudio.domain === 'monalisa' ? 24 : 
    studio.planName === 'Core' ? 3 : 12,
    
  };

  const collectionsLength = project?.collections || [];

  const [CollectionData, setCollectionData] = useState({
    name: '',
    status: 'empty',
    images: [],
    imagesUrl: [],
  });

  const onClose = () => dispatch(closeModalWithAnimation('createCollection'));

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setCollectionData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
const handleSuggestedNameChange = (event) => {
  const { value } = event.target;

  const updatedData = {
    ...CollectionData,
    name: value,
  };

  setCollectionData(updatedData); // update local state
};


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const nameInputRef = useRef(null);

  const validateForm = (data) => {
    
    let newErrors = {};

    if (!(data.name || '').trim()) {
      newErrors.name = 'Gallery name is required';
    }

    setErrors(newErrors);

    if (newErrors.name) {
      nameInputRef.current.focus();
    }

    return Object.keys(newErrors).length === 0;
  };


 const handleSubmit = () => {
  let data = CollectionData;
  if (isSubmitting) return;

  const isValid = validateForm(data); // validate passed data
  if (!isValid) return;

  setIsSubmitting(true);
  const domain = defaultStudio.domain;
  onClose();

  if (collectionsLength.length < collectionsLimit.perProject) {
    setTimeout(() => {
      dispatch(
        addCollection({
          domain,
          projectId: project.id,
          newCollection: data,
        })
      )
        .then((id) => {
          trackEvent('collection_created', {
            project_id: project.id,
            collection_id: id.payload.collection.id,
          });

          dispatch(
            showAlert({
              type: 'success',
              message: `Collection <b>${data.name}</b> added successfully!`,
            })
          );

          navigate(
            `/${defaultStudio.domain}/gallery/${project.id}/${id.payload.collection.id}`
          );
        })
        .finally(() => setIsSubmitting(false));
    }, 500);
  } else {
    setIsSubmitting(false);

    dispatch(
      showAlert({
        id: project.id,
        type: 'error',
        message: `Project <b>${data.name}</b>'s 3 Gallery limit reached! Upgrade`,
      })
    );

    storeLimitContext('Galleries', '3 gallery per project limit reached');

    setTimeout(() => dispatch(openModal('upgrade')), 2000);
  }
};

  
  const modalRef = useModalFocus(visible.createCollection);
  if (!visible.createCollection) {
    return null;
  }

  // Get placeholders based on project type
  const placeholders = projectTypePlaceholders[project.type] || [`${project.type} Gallery`];

  return (
    <div className="modal-container" ref={modalRef}>
      <div className="modal create-project island">

        <div className="modal-header">
          <div className="modal-controls">
            <div className="control close" onClick={onClose}></div>
            <div className="control minimize"></div>
            <div className="control maximize"></div>
          </div>
          <div className="modal-title">
            Create Gallery
            <p className="modal-subtitle">- {project.name}'s {project.type}</p>
          </div>
        </div>
        
        <div className="modal-body">
          <div className="form-section">
            <div className="field">

              <label htmlFor="">Gallery name</label>
              <input
                name="name"
                ref={nameInputRef}
                value={CollectionData.name}
                type="text"
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={placeholders[0]} // Dynamically set placeholder
              />

              <label htmlFor=""></label>
              <div className="project-validity-options">
                {projectTypePlaceholders[project.type]
                  ?.filter(
                    (placeholder) =>
                      !CollectionData.name.includes(placeholder) &&
                      !project.collections?.some((collection) => collection.name === placeholder)
                  )
                  .map((placeholder, index) => (
                    <div className="radio-button-group" key={index}>
                      <input
                        type="radio"
                        id={`template-${placeholder.toLowerCase().replace(/\s+/g, '-')}`}
                        name="name"
                        value={placeholder}
                        checked={CollectionData.name === placeholder}
                        onChange={handleSuggestedNameChange}
                      />
                      <label htmlFor={`template-${placeholder.toLowerCase().replace(/\s+/g, '-')}`}>
                        {placeholder}
                      </label>
                    </div>
                  ))}
              </div>

              {errors.name && <div className="error">{errors.name}</div>}
            </div>
          </div>
        </div>

        <div className="actions">
          <div className="button secondary" onClick={onClose}>
            Cancel
          </div>
          <div className="button primary" onClick={handleSubmit}>
            Create
          </div>
        </div>

      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default AddCollectionModal;