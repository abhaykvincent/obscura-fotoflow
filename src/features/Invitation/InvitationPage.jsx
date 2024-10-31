import React, { useEffect, useState } from 'react';
import Editor from './Editor.jsx';
import Preview from './Preview';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInvitation, selectProjects, updateInvitation } from '../../app/slices/projectsSlice.js';
import { useParams } from 'react-router';
import './InvitationPage.scss'; // Add styles as needed
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { selectDomain } from '../../app/slices/authSlice.js';
import { openModal } from '../../app/slices/modalSlice.js';
import { showAlert } from '../../app/slices/alertSlice.js';
import { delay } from '../../utils/generalUtils.js';

const InvitationPage = () => {
  const dispatch= useDispatch();
  const { projectId } = useParams();
  console.log(projectId)
  const domain = useSelector(selectDomain)

  const projects = useSelector(selectProjects);
  const [project, setProject] = useState(null);
  const [invitationData, setInvitationData] = useState({
    coverPhoto: '',
    backgroundColor: '#FF5733',
    groomName: '',
    brideName: '',
    context:'',
    title: '',
    events: [],
    message:'',
    background: {
      value: 'background-option-1'
    }
  });
  const [pubishingStatus, setPublishingStatus] = useState('idle');
  useEffect(() => {
    // Define event types based on project.type
    const eventMapping = {
      Wedding: [{ 
        name: "Wedding" ,
        title:'We are getting married!',
      }],
      Birthday: [{
         name: "Birthday" ,
         title:'Happy Birthday!',
      }
      ],
      Baptism: [{ 
        name: "Baptism",
        title:"I'm getting baptized!",
       }],
      "First Holy Communion": [{ name: "First Holy Communion" }],
      // Add more mappings as needed
    };
    console.log(project)
    // Set the events based on project.type
    if (project?.type && eventMapping[project.type]) {
      setInvitationData((prevData) => ({
        ...prevData,
        coverPhoto: project?.projectCover,
        events: eventMapping[project.type],
        context:eventMapping[project.type][0].context,
        groomName: project?.invitation?.groomName,
        brideName: project?.invitation?.brideName,
        title:project?.invitation?.title,
        message:project?.invitation?.message,
      }));
    }
  }, [project]);

  useEffect(() => {
    const selectedProject = projects.find((p) => p.id === projectId);
    if (selectedProject) {
      console.log(selectedProject)
      setProject(selectedProject);
    }
  }, [projects, projectId, domain, dispatch]);
  
  useEffect(() => {
    console.log('invitationData:', invitationData);
  }, [invitationData]);

  // Functions
  const handleDataChange = (updatedData) => {
    setInvitationData((prev) => ({ ...prev, ...updatedData }));
  };
  
  const publishInvitation = async () => {
    setPublishingStatus('publishing');
    //delay
    await delay(1000)
    dispatch(updateInvitation({ domain, projectId, invitationData }))
    .then(() => {
      setPublishingStatus('published');
      dispatch(showAlert({ type: 'success', message: `Invitation updated successfully!` }));
    })
    .catch((error) => {
      setPublishingStatus('error');
      dispatch(showAlert({ type: 'error', message: 'Failed to update invitation. Please try again.' }));
    });
  };

  useEffect(() => {
    console.log('publishingStatus:', pubishingStatus);
  }, [pubishingStatus]);

  return (
    <>
    <div className="project-info invitation-page-header">
      <div className="breadcrumbs">
        <Link className="back highlight" to={`/${domain}/invitation/${encodeURIComponent(projectId)}`}>{project?.name}</Link>
      </div>
      <div className="client">
        <h1>Invitation</h1>
        {/* <div className="view-control">
          <div className="control-wrap">
            <div className="controls">
                <div className={`control ctrl-all active`} >All</div>
                <div className={`control ctrl-draft`} >Archived</div>
            </div>
            <div className={`active`}></div>
          </div>
        </div> */}
        
      </div>
      <div className="project-options">
        <Link className={`button secondary outline icon preview-icon `} target="_blank" to={`/${domain}/invitation/${projectId}`} >Preview</Link>
        <div className={`button primary share icon publish-icon publish-button ${pubishingStatus}`} onClick={publishInvitation} >Publish</div>
        
      </div>
    </div>
    <main className="invitation-page">
      <Editor  data={invitationData} onChange={handleDataChange} />
      <Preview editor data={invitationData} project={project}/>
    </main>
    </>
    
  );
};

export default InvitationPage;
