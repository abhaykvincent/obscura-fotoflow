import React, { useEffect, useRef, useState } from 'react';
import { addCollection } from '../../app/slices/projectsSlice';
import { showAlert } from '../../app/slices/alertSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { closeModal, closeModalWithAnimation, openModal, selectModal } from '../../app/slices/modalSlice';
import { selectUserStudio } from '../../app/slices/authSlice';
import { trackEvent } from '../../analytics/utils';
import { useModalFocus } from '../../hooks/modalInputFocus';
import { set } from 'date-fns';
import { storeLimitContext } from '../../utils/localStorageUtills';
import { model } from '../../firebase/app';
/* import { model } from '../../firebase/app'; */
// Mapping of placeholders based on project type
const projectTypePlaceholders = {
  Wedding: ['Save the Date', 'Engagement', 'Wedding Day', 'Reception', 'Bride', 'Groom', 'Couple'],
  Baptism: ['Ceremony', 'Family Portraits', 'Godparents', 'Celebration', 'Candle Lighting'],
  Birthday: ['Cake Cutting', 'Candles', 'Group Photos', 'Decorations', 'Party Games'],
  Maternity: ['Bump Photos', 'Family Maternity', 'Outdoor Shoot', 'Studio Shoot', 'Baby Announcement'],
  Newborn: ['First Photos', 'Family with Baby', 'Sleeping Poses', 'Tiny Details', 'Sibling Photos'],
  Anniversary: ['Couple Portraits', 'Vow Renewal', 'Celebration', 'Candlelight Dinner', 'Family Gathering'],
  Family: ['Family Portraits', 'Generational Photos', 'Outdoor Shoot', 'Holiday Photos', 'Candid Moments'],
  Group: ['Team Photos', 'Friends Gathering', 'Event Group Photos', 'Formal Portraits', 'Candid Shots'],
  Travel: ['Landscape Photos', 'Cultural Moments', 'Adventure Shots', 'Local Cuisine', 'Travel Diary'],
  Event: ['Event Highlights', 'Guest Photos', 'Decorations', 'Speeches', 'Candid Moments'],
};
function AddCollectionModal({ project }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const visible = useSelector(selectModal);
  const defaultStudio = useSelector(selectUserStudio);
  const collectionsLimit = {
    perProject: defaultStudio.domain === 'monalisa' ? 24 : 3,
  };
  let collectionsLength = project?.collections ? project.collections : 0;

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const nameInputRef = useRef(null);

  const validateForm = () => {
    let newErrors = {};
    if (!CollectionData.name.trim()) {
      newErrors.name = 'Gallery name is required';
    }
    setErrors(newErrors);
    if (newErrors.name) {
      nameInputRef.current.focus();
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (isSubmitting) return;

    if (!validateForm()) return;

    setIsSubmitting(true);
    const domain = defaultStudio.domain;
    onClose();

    if (collectionsLength.length < collectionsLimit.perProject) {
      setTimeout(() => {
        dispatch(addCollection({ domain, projectId: project.id, newCollection: CollectionData }))
          .then((id) => {
            trackEvent('collection_created', {
              project_id: project.id,
              collection_id: id.payload.collection.id,
            });
            dispatch(
              showAlert({
                type: 'success',
                message: `Collection <b>${CollectionData.name}</b> added successfully!`,
              })
            );
            navigate(`/${defaultStudio.domain}/gallery/${project.id}/${id.payload.collection.id}`);
          })
          .finally(() => setIsSubmitting(false));
      }, 500);
    } else {
      setIsSubmitting(false);
      dispatch(
        showAlert({
          id: project.id,
          type: 'error',
          message: `Project <b>${CollectionData.name}</b>'s 3 Gallery limit reached! Upgrade`,
        })
      );
      storeLimitContext('Galleries', '3 gallery per project limit reached');
      setTimeout(() => dispatch(openModal('upgrade')), 2000);
    }
  };
  /* async function run() {
    // Provide a prompt that contains text
    const prompt = "Write a story about a magic backpack."
  
    // To generate text output, call generateContent with the text input
    const result = await model.generateContent(prompt);
  
    const response = result.response;
    const text = response.text();
    console.log(text);
  }
  run(); */
  
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
                        onChange={handleInputChange}
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