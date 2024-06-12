import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.scss';
import { getProjectsByStatus, getRecentProjects } from '../../utils/projectFilters';
import ProjectCard from '../../components/Project/ProjectCard/ProjectCard';
function Home({ projects,loadProjects,openModal}) {

    document.title = `FotoFlow | Home`;
    const recentProjects = getRecentProjects(projects, 4);
    const selectionCompletedProjects = getProjectsByStatus(projects, 'selection-completed');
    const requestPendingProjects = getProjectsByStatus(projects, 'request-pending');


    return (
        <main className="home">
            <div className="welcome-section">
                <div className="welcome-content">
                    <div className='welcome-message-top user-name'>
                        <h1 className='welcome-message '>Hello,</h1>
                        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                            {/* Define the linear gradient */}
                            <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{ stopColor: '#54a134', stopOpacity: 1 }} />
                                <stop offset="100%" style={{ stopColor: '#3f7528', stopOpacity: 1 }} />
                            </linearGradient>
                            {/* Apply the gradient to the text */}
                            <text x="128px" y="46px" fontFamily="Arial" fontSize="3rem" font-fontWeight="800" fill="url(#textGradient)" textAnchor="middle">
                                Obscura ✨
                            </text>
                        </svg>
                    </div>
                    <h1 className='welcome-message'>Let's manage your Snaps </h1>
                </div>
                <div className="actions">
                    <div className="button primary"
                    onClick={openModal}
                    >Create Project</div>
                </div>
            </div>
            {
                projects.length > 0 ? (
                    <>
                        <div className="section recent">
                            <h3 className='section-heading'>Recent Projects</h3>
                            <div className="projects">
                            {
                                recentProjects.length !== 0? (
                                recentProjects.map((project, index) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                    /> 
                                ))
                                ) : (
                                    <p className="message">No recent projects</p>)
                            }
                            <Link className="project all" to={`/projects`} >
                                <div className="project-cover"
                                ></div>
                                <div className="project-details">
                                    <div className="details-top">

                                        <h4 className="project-title">See all Projects</h4>
                                        <p className="project-type"></p>
                                    </div>
                                </div>
                                <div className="project-options">
                                    
                                </div>
                            </Link>
                            </div>
                        </div>

                    </>
                ):
                (<>
                    <div className="section recent">
                        <h3 className='section-heading'>You dont have any projects cerated</h3>
                    </div>
                    <div className="projects-list">

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
                    </div >
                    </div>
                </>)
            }
            <div className="refresh">
                <p>
                    Refresh your projects to see the latest updates
                </p>
                <div className="button secondary"

                onClick={loadProjects}
                >Refresh</div>
            </div>
        </main>
    );
}

export default Home;
