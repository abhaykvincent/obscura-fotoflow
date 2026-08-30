import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { openModal } from '../../../../app/slices/modalSlice';
import CrewCard from '../../../Cards/CrewCard/CrewCard';
import DashboardPayments from '../../Payments/Payments';
import DashboardExpances from '../../Expances/Expances';
import { showAlert } from '../../../../app/slices/alertSlice';
import { selectUserStudio } from '../../../../app/slices/authSlice';
import DashboardEvents from '../../Events/Events';
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import CollectionsPanel from '../../../Project/Collections/CollectionsPanel';
import EmptyGalleriesState from '../EmptyGalleriesState/EmptyGalleriesState';
import HistoryLog from '../HistoryLog/HistoryLog';

function DashboardTabs({ project, activeTab: propActiveTab, setActiveTab: propSetActiveTab, setSelectedEventId }) {
  const dispatch = useDispatch();
  const [localActiveTab, setLocalActiveTab] = useState('galleries');
  const activeTab = propActiveTab || localActiveTab;
  const setActiveTab = propSetActiveTab || setLocalActiveTab;
  const defaultStudio = useSelector(selectUserStudio);

  const renderTabContent = () => {
    const isArchived = project.status === 'archive' || project.storage?.status === 'archive';
    const isExpired = project.status === 'expired';

    switch (activeTab) {
      case 'galleries':
        return (
          <div className="gallery-overview">
            {project.collections.length === 0 ? (
              !isExpired && (
                <div className="galleries">
                  <div className="heading-section">
                    <h3 className="heading">Galleries <span>{project.collections.length}</span></h3>
                    <button
                      type="button"
                      className="button primary small"
                      disabled={isArchived || isExpired}
                      onClick={() => dispatch(openModal('createCollection'))}
                    >
                      + Create Gallery
                    </button>
                  </div>
                  <EmptyGalleriesState
                    disabled={isArchived || isExpired}
                    onCreate={() => dispatch(openModal('createCollection'))}
                  />
                </div>
              )
            ) : (
              <>
                <CollectionsPanel {...{project, collectionId: project.collections[0]?.id}}/>
              </>
            )}
          </div>
        );

      case 'shoots':
        return (
          <DashboardEvents project={project} setSelectedEventId={setSelectedEventId}/>
        );

      case 'financials':
      case 'invoices':
        return (
          <DashboardPayments project={project} />
        );

      case 'history':
        return (
          <HistoryLog project={project} />
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard-tabs">
      <div className="tabs">
        <button
          className={`button secondary tab-button ${activeTab === 'galleries' ? 'active' : ''}`}
          onClick={() => setActiveTab('galleries')}
        >
          Galleries
        </button>
        <button
          className={`button secondary tab-button ${activeTab === 'shoots' ? 'active' : ''}`}
          onClick={() => setActiveTab('shoots')}
        >
          Shoots
        </button>
        <button
          className={`button secondary tab-button ${(activeTab === 'financials' || activeTab === 'invoices') ? 'active' : ''}`}
          onClick={() => setActiveTab('financials')}
        >
          Financials
        </button>
        <button
          className={`button secondary tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History Log
        </button>
      </div>
      <div className="tab-content">{renderTabContent()}</div>
    </div>
  );
}

export default DashboardTabs;
