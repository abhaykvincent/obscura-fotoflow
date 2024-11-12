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

function DashboardTabs({ project }) {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('galleries');
  const defaultStudio = useSelector(selectUserStudio);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'galleries':
        return (
          <div className="gallery-overview">
            {/* Replace with gallery card display logic */}
              {project.collections.length === 0 ? (
            <div className="galleries">
                    <div className="gallery new" 
                    onClick={()=>dispatch(openModal('createCollection'))}>
                      
                    <div className="thumbnails">
                      <div className="thumbnail thumb1">
                        <div className="backthumb bthumb1"
                        ></div>
                        <div className="backthumb bthumb2"></div>
                        <div className="backthumb bthumb3"></div>
                        <div className="backthumb bthumb4"></div>
                      </div>
                    </div>
                    <p className='button primary outline '>New Gallery</p>
                  </div>

                  </div>
              ) : (
                <>
               
            <CollectionsPanel {...{project,collectionId:project.collections[0]?.id}}/>
          </>
                
                )
              }
          </div>
        );

      case 'shoots':
        return (
          <DashboardEvents project={project}/>
        );

      case 'invoices':
        return (
          <DashboardPayments project={project} />
        );

      case 'payments':
        return (
          <DashboardExpances project={project} />             
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
          className={`button secondary tab-button ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          Invoices
        </button>
        <button
          className={`button secondary tab-button ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Payments
        </button>
      </div>
      <div className="tab-content">{renderTabContent()}</div>
    </div>
  );
}

export default DashboardTabs;
