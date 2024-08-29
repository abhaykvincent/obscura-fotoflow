import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Import React Router components
import AddProjectModal from '../../components/Modal/AddProject';
import './Projects.scss';
import ProjectCard from '../../components/Project/ProjectCard/ProjectCard';
import Refresh from '../../components/Refresh/Refresh';
import { useDispatch, useSelector } from 'react-redux';
import { selectProjects } from '../../app/slices/projectsSlice';
import { openModal } from '../../app/slices/modalSlice';

function Projects() {
    const dispatch = useDispatch()
    const projects = useSelector(selectProjects)
    useEffect(() => {

    console.log(projects)
    }, [projects]);
    return (
        <main className="projects">
            <div className="projects-header">
                <h1>Projects</h1>
                <div className="actions">
                    <div className="button primary icon add"
                        onClick={()=>dispatch(openModal('createProject'))}
                    >Create Project</div>
                </div>
            </div>
            <div className="view-control">
                <div className="control-wrap">
                    <div className="controls">
                        <div className={`control ctrl-all active`} >All</div>
                        <div className={`control ctrl-active`} >Upcoming</div>
                        <div className={`control ctrl-pending`} >In Progres</div>
                        <div className={`control ctrl-draft`} >Completed</div>
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
                projects.length !== 0? (
                    projects.map((project, index) => (
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
            {/* Refresh Projects Data from cloud */}
            <Refresh/>
            
        </main>
    );
}

export default Projects;
// Line Complexity  1.0 -> 