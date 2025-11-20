import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModalWithAnimation, openModal, selectModal, closeModal } from '../../../app/slices/modalSlice';
import { showLoading, hideLoading } from '../../../app/slices/loadingSlice';
import { useModalFocus } from '../../../hooks/modalInputFocus';
import UserDetails from './UserDetails';
import { addUser } from '../../../app/slices/usersSlice'; // This will be created
import { showAlert } from '../../../app/slices/alertSlice';
import { findMatchingUsersOrLeads } from '../../../utils/firestoreUtils';
import MatchingUsersModal from '../MatchingUsersModal';
import './AddUser.scss';

function AddUserModal() {
  const dispatch = useDispatch();
  const { addUser: isVisible, matchingUsers: isMatchingUsersModalVisible } = useSelector(selectModal);

  const initialUserData = {
    displayName: '',
    email: '',
    studioName: '',
    phone: '',
    domain: '',
    role: 'user', // Default role
  };

  const [userData, setUserData] = useState(initialUserData);
  const [errors, setErrors] = useState({});
  const [matchingUsers, setMatchingUsers] = useState([]);
  const [matchingLeads, setMatchingLeads] = useState([]);

  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const studioNameInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const domainInputRef = useRef(null);
  const modalRef = useModalFocus(isVisible);

  const onClose = () => {
    dispatch(closeModalWithAnimation('addUser'));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleBlur = (event) => {
    // This function is now empty
  };

  const handleSubmit = async () => {
    // Basic validation
    const newErrors = {};
    if (!userData.displayName.trim()) newErrors.displayName = 'Name is required';
    if (!userData.email.trim()) newErrors.email = 'Email is required';
    if (!userData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!userData.domain.trim()) newErrors.domain = 'Domain is required';
    if (!userData.studioName.trim()) newErrors.studioName = 'Studio Name is required';
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.displayName) nameInputRef.current?.focus();
      else if (newErrors.email) emailInputRef.current?.focus();
      else if (newErrors.phone) phoneInputRef.current?.focus();
      else if (newErrors.domain) domainInputRef.current?.focus();
      else if (newErrors.studioName) studioNameInputRef.current?.focus();
      return;
    }

    dispatch(showLoading(`Checking for existing users...`));
    const { matchingUsers, matchingLeads } = await findMatchingUsersOrLeads(userData.email, userData.phone);
    setMatchingUsers(matchingUsers);
    setMatchingLeads(matchingLeads);

    if (matchingUsers.length > 0 || matchingLeads.length > 0) {
      dispatch(hideLoading());
      dispatch(openModal('matchingUsers'));
      return;
    }

    dispatch(showLoading(`Creating user ${userData.displayName}...`));
    onClose();

    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for animation

    try {
      await dispatch(addUser(userData));
      dispatch(showAlert({ type: 'success', message: 'User created successfully!' }));
    } catch (error) {
      console.error('Error creating user:', error);
      dispatch(showAlert({ type: 'error', message: `Failed to create user: ${error.message}` }));
    } finally {
      dispatch(hideLoading());
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="modal-container" ref={modalRef}>
        <div className="modal create-user-modal island">
          <div className="modal-header">
            <div className="modal-controls">
              <div className="control close" onClick={onClose}></div>
              <div className="control minimize"></div>
              <div className="control maximize"></div>
            </div>
            <div className="modal-title">
              New User
              <p className="modal-subtitle">Create a new user account</p>
            </div>
          </div>
          <div className="modal-body">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <UserDetails
                userData={userData}
                errors={errors}
                handleInputChange={handleInputChange}
                handleBlur={handleBlur}
                nameInputRef={nameInputRef}
                emailInputRef={emailInputRef}
                studioNameInputRef={studioNameInputRef}
                domainInputRef={domainInputRef}
                phoneInputRef={phoneInputRef}
              />
            </form>
          </div>
          <div className="actions">
            <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="button primary icon new" onClick={handleSubmit}>
              Create User
            </button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={onClose}></div>
      </div>
      {isMatchingUsersModalVisible && <MatchingUsersModal matchingUsers={matchingUsers} matchingLeads={matchingLeads} />}
    </>
  );
}

export default AddUserModal;
