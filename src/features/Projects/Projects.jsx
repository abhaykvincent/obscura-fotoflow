import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// Selectors and actions
import { selectProjects } from '../../app/slices/projectsSlice';
import { selectUserStudio } from '../../app/slices/authSlice';
import { openModal } from '../../app/slices/modalSlice';
// Utility functions
import { getRecentProjects } from '../../utils/projectFilters';
// Components
import AddProjectModal from '../../components/Modal/AddProject';
import ProjectCard from '../../components/Project/ProjectCard/ProjectCard';
import Refresh from '../../components/Refresh/Refresh';
// Styles
import './Projects.scss';

function Projects() {
    const defaultStudio = useSelector(selectUserStudio);
    const dispatch = useDispatch();
    document.title = `${defaultStudio.name} | Projects`;

    const projects = useSelector(selectProjects);
    const [recentProjects, setRecentProjects] = useState([]);

    useEffect(() => {
        setRecentProjects(getRecentProjects(projects));
    }, [projects]);

    const handleNewProjectClick = () => dispatch(openModal('createProject'));

    const renderProjectList = () => {
        if (recentProjects.length === 0) {
            return (
                <>
                    <div className="section recent">
                        <h3 className="section-heading">Recent Projects</h3>
                    </div>
                    <div className="project new" onClick={handleNewProjectClick}>
                        <div className="project-cover"></div>
                        <div className="project-details">
                            <div className="details-top">
                                <h4 className="project-title">Create Your First Project</h4>
                            </div>
                        </div>
                        <div className="project-options"></div>
                    </div>
                </>
            );
        }
    
        // Group projects by month
        const groupedProjects = recentProjects.reduce((groups, project) => {
            const projectMonth = new Date(project.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!groups[projectMonth]) {
                groups[projectMonth] = [];
            }
            groups[projectMonth].push(project);
            return groups;
        }, {});
    
        // Render projects grouped by month
        return Object.keys(groupedProjects).map((month,index) => (
            <>
            <div key={month} className="month-group" style={{ '--group-index': index + 1 }} >
                <h3 className="month-name">{month}</h3>
                <div className="projects-list">
                {groupedProjects[month].map((project) => (
                    <ProjectCard project={project} key={project.id} />
                ))}
                </div>
            </div>
            <div key={month} className="month-group" style={{ '--group-index': index + 2 }} >
                <h3 className="month-name">{month}</h3>
                <div className="projects-list">
                {groupedProjects[month].map((project) => (
                    <ProjectCard project={project} key={project.id} />
                ))}
                </div>
            </div>
            
            </>
        ));
    };
    

    return (
        <>
            <AddProjectModal />
            <main className="projects">
                <div className="projects-header">
                    <h1>Projects</h1>
                    <div className="actions">
                        <div className="button primary icon add" onClick={handleNewProjectClick}>
                            New
                        </div>
                    </div>
                </div>

                <div className="view-control">
                    <div className="control-wrap">
                        <div className="controls">
                            <div className="control ctrl-all active">All</div>
                            <div className="control ctrl-draft">Archived</div>
                        </div>
                        <div className="active"></div>
                    </div>
                    <div className="control-wrap">
                        <div className="controls">
                            <div className="control ctrl-all active">
                                <div className="icon card-view"></div>
                            </div>
                            <div className="control ctrl-active disabled">
                                <div className="icon list-view"></div>
                            </div>
                        </div>
                        <div className="active"></div>
                    </div>
                </div>

                    {renderProjectList()}

                <Refresh />
            </main>
        </>
    );
}

export default Projects;
