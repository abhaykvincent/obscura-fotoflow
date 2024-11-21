import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// Selectors and actions
import { selectProjects } from '../../app/slices/projectsSlice';
import { selectUserStudio } from '../../app/slices/authSlice';
import { openModal } from '../../app/slices/modalSlice';
// Utility functions
import { getProjectsByStatus, getRecentProjects } from '../../utils/projectFilters';
// Components
import AddProjectModal from '../../components/Modal/AddProject';
import ProjectCard from '../../components/Project/ProjectCard/ProjectCard';
import Refresh from '../../components/Refresh/Refresh';
// Styles
import './Projects.scss';
import SearchInput from '../../components/Search/SearchInput';
import { set } from 'date-fns';

function Projects() {
    const defaultStudio = useSelector(selectUserStudio);
    const dispatch = useDispatch();
    document.title = `${defaultStudio.name} | Projects`;

    const projects = useSelector(selectProjects);
    const [recentProjects, setRecentProjects] = useState([]);
    const [selectedProjects, setSelectedProjects] = useState([]);
    const [selectedTab, setSelectedTab] = useState('all');


    useEffect(() => {
        setRecentProjects(getRecentProjects(projects));
        if(selectedTab === 'all') {
            setRecentProjects(projects);
        } else if(selectedTab === 'selected') {
            setRecentProjects(getProjectsByStatus(projects, 'selected'))
        }
    }, [projects, selectedTab]);

    const handleNewProjectClick = () => dispatch(openModal('createProject'));

    const renderProjectList = () => {
        if (recentProjects.length === 0) {
            return (
                <>
                    {recentProjects.length !== 0  ? 
                    <>
                        <div className="section recent">
                            <h3 className="section-heading">Create Your First Project</h3>
                        </div>
                        <div className="projects-list">
                            <div className="project new" onClick={handleNewProjectClick}>
                                <div className="project-cover"></div>
                                <div className="project-details">
                                    <div className="details-top">
                                        <h4 className="project-title">Create Project</h4>
                                    </div>
                                </div>
                                <div className="project-options"></div>
                            </div>
                        </div>
                    </>:
                    <div className="section recent">
                    <h3 className="section-heading">No selection completed projects found.</h3>
                </div>
                    }
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
            
            </>
        ));
    };
    

    return (
        <>
            <AddProjectModal />

            <div className="projects-page-header">
            <div className="search-bar">
                <SearchInput />
            </div>
            </div>
            <main className="projects">
                <div className="projects-header">
                    <h1>Projects</h1>
                    <div className="actions">
                        <div className="button primary icon add" onClick={handleNewProjectClick}>
                            New
                        </div>
                    </div>
                </div>

                {projects.length>0 && <div className="view-control">
                    <div className="control-wrap">
                        <div className="controls">
                            <div className={`${selectedTab === 'all' && 'active'} control ctrl-all`} 
                                onClick={() => setSelectedTab('all')}
                            
                            >All</div>
                            <div className={`${selectedTab === 'selected' && 'active'} control ctrl-draft`}
                                onClick={() => setSelectedTab('selected')}
                            >Selected</div>
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
                </div>}

                    {renderProjectList()}

                <Refresh />
            </main>
        </>
    );
}

export default Projects;
