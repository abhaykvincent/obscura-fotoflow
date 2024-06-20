import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Import React Router components
import AddProjectModal from '../../components/Modal/AddProject';
import './Projects.scss';
import ProjectCard from '../../components/Project/ProjectCard/ProjectCard';

function Projects({ projects, openModal,addProject, showAlert, isLoading }) {
    useEffect(() => {
        console.log(projects);
    }, [projects]);
    return (
        <main className="projects">
            <div className="projects-header">
                <h1>Projects</h1>
                <div className="actions">
                    <div className="button primary"
                        onClick={openModal}
                    >Create Project</div>
                </div>
            </div>
            <div className="view-control">
                <div className="control-wrap">
                    <div className="controls">
                        <div className={`control active`} >All</div>
                        <div className={`control `} >Active</div>
                        <div className={`control `} >Starred</div>
                        <div className={`control `} >This Week</div>
                        <div className={`control `} >Today</div>
                    </div>
                    <div className={`active`}></div>
                </div>
            </div>
            <div className="projects-list">
                {projects.length !== 0? (
                    projects.map((project, index) => (
                        <ProjectCard 
                        key={project.id}
                        project={project}
                        index={index}
                    /> 
                    ))) : (
                        <>
                        <div className="section recent">
                <h3 className='section-heading'>Recent Projects</h3>
                        </div>

                        <div className="project new"  
                            onClick={openModal}
                        >
                            <div className="project-cover"
                            ></div>
                            <div className="project-details">
                                <div className="details-top">

                                    <h4 className="project-title">Create Your First Project</h4>
                                    <p className="project-type"></p>
                                </div>
                            </div>
                            <div className="project-options">
                                
                            </div>
                        </div>
                        </>
                    )
                    }
                </div>
            
            
        </main>
    );

}

export default Projects;
