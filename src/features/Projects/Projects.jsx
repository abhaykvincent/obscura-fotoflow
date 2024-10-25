import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Import React Router components
import AddProjectModal from '../../components/Modal/AddProject';
import './Projects.scss';
import ProjectCard from '../../components/Project/ProjectCard/ProjectCard';
import Refresh from '../../components/Refresh/Refresh';
import { useDispatch, useSelector } from 'react-redux';
import { selectProjects } from '../../app/slices/projectsSlice';
import { openModal } from '../../app/slices/modalSlice';
import { getRecentProjects } from '../../utils/projectFilters';

function Projects() {
    const dispatch = useDispatch()
    
    const projects = useSelector(selectProjects)
    const [recentProjects, setRecentProjects] = useState([])
    useEffect(() => {
        setRecentProjects(getRecentProjects(projects))
    }, [projects]);
    return (
        <main className="projects">
            <div className="projects-header">
                <h1>Projects</h1>
                <div className="actions">
                    <div className="button primary icon add"
                        onClick={()=>dispatch(openModal('createProject'))}
                    >New</div>
                </div>
            </div>
            <div className="view-control">
                <div className="control-wrap">
                    <div className="controls">
                        <div className={`control ctrl-all active`} >All</div>
                        <div className={`control ctrl-draft`} >Archived</div>
                    </div>
                    <div className={`active`}></div>
                </div>
                <div className="control-wrap">
                    <div className="controls">
                        <div className={`control ctrl-all active`} ><div className="icon card-view"></div></div>
                        <div className={`control ctrl-active disabled`} ><div className="icon list-view"></div></div>
                    </div>
                    <div className={`active`}></div>
                </div>
            </div>
            <div className="projects-list">
                { 
                recentProjects.length !== 0? (
                    recentProjects.map((project, index) => (
                        <ProjectCard 
                        project={project}
                        key={project.id}
                    /> 
                    ))) : (
                        <>
                            <div className="section recent">
                                <h3 className='section-heading'>Recent Projects</h3>
                            </div>

                            <div className="project new"
                                onClick={()=>{dispatch(openModal('createProject'))}}
                            >
                                <div className="project-cover" ></div>
                                <div className="project-details">
                                    <div className="details-top">

                                        <h4 className="project-title">Create Your First Project</h4>
                                        <p className="project-type"></p>
                                    </div>
                                </div>
                                <div className="project-options"></div>
                            </div>
                        </>
                    )
                }
            </div>

          <AddProjectModal />
            {/* Refresh Projects Data from cloud */}
            <Refresh/>
            
        </main>
    );
}

export default Projects;
// Line Complexity  1.0 -> 