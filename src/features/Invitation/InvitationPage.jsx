import React, { useEffect, useState } from 'react';
import Editor from './Editor.jsx';
import Preview from './Preview';
import { useDispatch, useSelector } from 'react-redux';
import { selectProjects } from '../../app/slices/projectsSlice.js';
import { useParams } from 'react-router';
import './InvitationPage.scss'; // Add styles as needed
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { selectDomain } from '../../app/slices/authSlice.js';
import { openModal } from '../../app/slices/modalSlice.js';

const InvitationPage = () => {
  const dispatch= useDispatch();

    const { id } = useParams();
  const projects = useSelector(selectProjects);
  const domain = useSelector(selectDomain)

  const [project, setProject] = useState(null);
  const [invitationData, setInvitationData] = useState({
    coverPhoto: null,
    backgroundColor: '#FF5733',
    groomName: project?.name,
    brideName: '',
    title: 'We’re Getting Married!',
    events: [],
    background: {
      value: 'background-option-1.png'
    }
  });
  useEffect(() => {
    // Define event types based on project.type
    const eventMapping = {
      Wedding: [{ name: "Wedding" }],
      Birthday: [{ name: "Birthday" }],
      Baptism: [{ name: "Baptism" }],
      "First Holy Communion": [{ name: "First Holy Communion" }],
      // Add more mappings as needed
    };
console.log(project)
    // Set the events based on project.type
    if (project?.type && eventMapping[project.type]) {
      setInvitationData((prevData) => ({
        ...prevData,
        events: eventMapping[project.type]
      }));
    }
  }, [project]);

  useEffect(() => {
    const selectedProject = projects?.find((p) => p.id === id);
    setProject(selectedProject);
  }, [projects, id]);


  const handleDataChange = (updatedData) => {
    setInvitationData((prev) => ({ ...prev, ...updatedData }));
  };

  return (
    <>
    <div className="project-info">
      <div className="breadcrumbs">
        <Link className="back highlight" to={`/${domain}/project/${encodeURIComponent(id)}`}>{project?.name}</Link>
      </div>
      <div className="client">
        <h1>Invitation</h1>
        <div className="view-control">
          <div className="control-wrap">
            <div className="controls">
                <div className={`control ctrl-all active`} >All</div>
                <div className={`control ctrl-draft`} >Archived</div>
            </div>
            <div className={`active`}></div>
          </div>
        </div>
        
      </div>
      <div className="project-options">
        <div className="button primary share" onClick={()=>dispatch(openModal('shareGallery'))} target="_blank">Publish</div>


        <DropdownMenu>
          <DropdownMenuTrigger >
            <div className="icon options"></div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
          <DropdownMenuItem>New Gallery</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                // Your action for Delete
                dispatch(openModal('confirmDeletecollection'));
              }}
            >
              Delete Gallery
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>



      
      </div>
    </div>
    <main className="invitation-page">
      
      <Editor data={invitationData} onChange={handleDataChange} />
      <Preview data={invitationData} project={project}/>
    </main>
    </>
    
  );
};

export default InvitationPage;
