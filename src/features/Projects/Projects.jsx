import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// Selectors and actions
import { selectUserStudio } from '../../app/slices/authSlice';
import { selectProjects } from '../../app/slices/projectsSlice';
import { openModal } from '../../app/slices/modalSlice';
// Utility functions
import { getProjectsByStatus, getRecentProjects } from '../../utils/projectFilters';
// Components
import AddProjectModal from '../../components/Modal/AddProject';
import ProjectCard from '../../components/Project/ProjectCard/ProjectCard';
import SearchInput from '../../components/Search/SearchInput';
import Refresh from '../../components/Refresh/Refresh';
// Styles
import './Projects.scss';
import { retrieveProjectsViewType, storeProjectsViewType } from '../../utils/localStorageUtills';

function Projects() {
    const dispatch = useDispatch();
    const defaultStudio = useSelector(selectUserStudio);
    const projects = useSelector(selectProjects);
    
    const [recentProjects, setRecentProjects] = useState([]);
    const [selectedTab, setSelectedTab] = useState('all');
    const localViewType = retrieveProjectsViewType()
    console.log(localViewType)
    const [viewType, setViewType] = useState( localViewType|| 'cards');
    document.title = `${defaultStudio.name} | Projects`;

    useEffect(()=>{
        storeProjectsViewType(viewType);
    },[viewType])
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

        // If there are no projects, show a First Project Initiator
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
    
        // Render projects - Grouped by month
        return Object.keys(groupedProjects).map((month,index) => (
            <div key={index} className="month-group" style={{ '--group-index': index + 1 }} >
                <h3 className="month-name">{month}</h3>
                <div className={`projects-list ${viewType}`}>
                {groupedProjects[month].map((project) => (
                    <ProjectCard project={project} key={project.id} />
                ))}
                </div>
            </div>
        ));
    };
    

    return (
        <>
            {/* Modals */}
            <AddProjectModal />

            {/* App Header */}
            <div className="projects-page-header">
            <div className="search-bar">
                <SearchInput />
            </div>
            </div>
            {/* Main - Projects */}
            <main className="projects">
                {/* Page Header */}
                <div className="projects-header">
                    <h1>Projects</h1>
                    <div className="actions">
                        <div className="button primary icon add" onClick={handleNewProjectClick}>
                            New
                        </div>
                    </div>
                </div>

                {/* Controls */}
                {projects.length>0 && <div className="view-control">
                    {/* Filter Controls */}
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

                    {/* View Controls */}
                    <div className="control-wrap view-type-controls">
                        <div className="controls">
                            <div className={`control ctrl-all ${viewType==='cards' && 'active'}`}>
                                <div className="icon card-view"
                                    onClick={() => setViewType('cards')}
                                ></div>
                            </div>
                            <div className={`control ctrl-all ${viewType==='list' && 'active'}`}>
                                <div className="icon list-view"
                                    onClick={() => setViewType('list')}
                                ></div>
                            </div>
                        </div>
                        <div className="active"></div>
                    </div>
                </div>}

                {/* Render Projects */}
                {renderProjectList()}

                <Refresh />
            </main>
        </>
    );
}

export default Projects;
