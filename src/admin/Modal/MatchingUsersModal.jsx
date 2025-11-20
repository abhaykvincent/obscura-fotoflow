import React from 'react';
import { useDispatch } from 'react-redux';
import './MatchingUsersModal.scss';
import { closeModal } from '../../app/slices/modalSlice';

const MatchingUsersModal = ({ matchingUsers, matchingLeads }) => {
  const dispatch = useDispatch();

  const handleClose = () => {
    dispatch(closeModal());
  };

  return (
    <div className="matching-users-modal">
      <div className="matching-users-modal-content">
        <div className="matching-users-modal-header">
          <h2>Matching Users or Leads Found</h2>
          <button onClick={handleClose}>&times;</button>
        </div>
        <div className="matching-users-modal-body">
          {matchingUsers.length > 0 && (
            <div>
              <h3>Matching Users</h3>
              <ul>
                {matchingUsers.map((user) => (
                  <li key={user.id}>
                    {user.name} ({user.email})
                  </li>
                ))}
              </ul>
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
        <div className="matching-users-modal-footer">
          <button onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default MatchingUsersModal;
