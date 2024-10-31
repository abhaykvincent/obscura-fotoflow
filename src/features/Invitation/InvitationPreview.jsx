import React, { useEffect } from 'react'
import { useSelector } from 'react-redux';
import { useParams } from 'react-router';
import { selectProjects } from '../../app/slices/projectsSlice';
import Preview from './Preview';
import { fetchProject } from '../../firebase/functions/firestore';

function InvitationPreview() {
    const { projectId } = useParams();
    const projects = useSelector(selectProjects);
    const [project, setProject] = React.useState(null);
    const { studioName } = useParams();
    const fetchProjectData = async () => {
        try {
          const projectData = await fetchProject(studioName,projectId);
    
          console.log(projectData)
          setProject(projectData);
        } catch (error) {
          console.error('Failed to fetch project:', error);
        }
      };

    useEffect(() => {
        fetchProjectData();
      }, []);
  return (
    <main className={`invitation-preview  client-POV`}>

        <Preview data={project?.invitation} project={project} />
    </main>
  )
}

export default InvitationPreview