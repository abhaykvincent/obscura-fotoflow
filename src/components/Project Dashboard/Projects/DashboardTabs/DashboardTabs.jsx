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
            <div className="galleries">
              {project.collections.length === 0 ? (
                <>  
                    <div className="gallery new" 
                    onClick={()=>dispatch(openModal('createCollection'))}>
                      <div className="heading-section">

                  <h3 className='heading'>Galleries <span>{project.collections.length}</span></h3>
                      </div>
                    <div className="thumbnails">
                      <div className="thumbnail thumb1">
                        <div className="backthumb bthumb1"
                        >
                    <div className="button primary outline">New </div></div>
                        <div className="backthumb bthumb2"></div>
                        <div className="backthumb bthumb3"></div>
                        <div className="backthumb bthumb4"></div>
                      </div>
                    </div>
                    
                  </div>

                </>
              ) : (
                <>
                <div className="gallery-overview">
                  <div className="galleries">
                    
                    {
                      project.collections.map((collection,index)=>{
                        return(
                          <Link key={index} className={`gallery ${project.projectCover==="" && 'no-images'}`} to={`/${defaultStudio.domain}/gallery/${project.id}/${collection.id}`}>
                            <div className="thumbnails">
                              <div className="thumbnail thumb1">
                                <div className="backthumb bthumb1"
                                style={
                                  {
                                    backgroundImage:
                                    `url(${project.projectCover!==""?project.projectCover:'https://img.icons8.com/external-others-abderraouf-omara/64/FFFFFF/external-images-photography-and-equipements-others-abderraouf-omara.png'})`
                                  }}
                                ></div>
                                <div className="backthumb bthumb2"></div>
                                <div className="backthumb bthumb3"></div>
                              </div>
                              <div className="thumbnail thumb2">
                                <div className="backthumb bthumb1 count"style={
                                  {
                                    backgroundImage:
                                      `url(${project.projectCover?project.projectCover:''})`
                                }}></div>
                                <div className="backthumb bthumb2"></div>
                                <div className="backthumb bthumb3"></div>
                              </div>
                              <div className="thumbnail thumb3">
                                <div className="backthumb bthumb1 count" style={
                                {
                                  backgroundImage:
                                    `url(${project.projectCover?project.projectCover:''})`
                                }}>
                                
                                {project.uploadedFilesCount!==0? project.uploadedFilesCount+' Photos': '0 Photos'}</div>
                                <div className="backthumb bthumb2"></div>
                                <div className="backthumb bthumb3"></div>
                              </div>
                            </div>
                              <h3 className='collection-name'>{collection.name}</h3>
                          </Link>
                        )
                      })
                    }
                    
                  </div>
                </div>
          </>
                
                )
              }
            </div>
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
