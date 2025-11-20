import React from 'react';
import { useDispatch } from 'react-redux';
import { closeModal } from '../../app/slices/modalSlice';
import './MatchingUsersModal.scss';

const MatchingUsersModal = ({ matchingUsers, matchingLeads }) => {
  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(closeModal('matchingUsers'));
  };

  return (
    <div className="modal-container matching-users-modal">
      <div className="modal matching-users-modal-content island">
        <div className="modal-header matching-users-modal-header">
          <h2>Matching Users or Leads Found</h2>
          <button onClick={handleClose}>&times;</button>
        </div>
        <div className="modal-body matching-users-modal-body">
          {matchingUsers.length > 0 && (
            <div>
              <h3>Matching Users</h3>
              <div>
                {matchingUsers.map((user) => (
                  <div key={user.id}>
                    <span className="matching-user-name">kkk{user.displayName}</span>
                     ({user.email})
                  </div>
                ))}
              </div>
            </div>
          )}
          {matchingLeads.length > 0 && (
            <div>
              <h3>Matching Leads</h3>
              <ul>
                {matchingLeads.map((lead) => (
                  <li key={lead.id}>
                    {lead.name} ({lead.email})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="modal-footer matching-users-modal-footer">
          <button onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default MatchingUsersModal;
