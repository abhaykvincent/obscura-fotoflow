import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.scss';
import { getProjectsByLastUpdated, getProjectsByStatus, getRecentProjects, getUpcommingShoots } from '../../utils/projectFilters';
import ProjectCard from '../../components/Project/ProjectCard/ProjectCard';
import Refresh from '../../components/Refresh/Refresh';
import { useDispatch, useSelector } from 'react-redux';
import { selectProjects } from '../../app/slices/projectsSlice';
import { openModal } from '../../app/slices/modalSlice';
import { selectUserStudio } from '../../app/slices/authSlice';
import StoragePie from '../../components/StoragePie/StoragePie';
import AddProjectModal from '../../components/Modal/AddProject';
import {  toast } from 'sonner'
import SearchInput from '../../components/Search/SearchInput';
import { trackEvent } from '../../analytics/utils';
import EventCard from '../../components/Project/ProjectCard/EventCard';
function Home() {
    const dispatch = useDispatch()
    const projects = useSelector(selectProjects)
    const defaultStudio = useSelector(selectUserStudio)
    document.title = `FotoFlow | ${defaultStudio.name}`;
    const selectionCompletedProjects = getProjectsByStatus(projects, 'selected');
    const requestPendingProjects = getProjectsByStatus(projects, 'request-pending');
    console.log(selectionCompletedProjects)
    const [selectedProjects, setSelectedProjects] = useState([])
    const [recentProjects, setRecentProjects] = useState([])
    const [upcommingShoots, setUpcommingShoots] = useState([])
    useEffect(() => {
        trackEvent('studio_home_view')
        setSelectedProjects(selectionCompletedProjects)
        setRecentProjects(getProjectsByLastUpdated(projects, 8))
        setUpcommingShoots(getUpcommingShoots(projects, 2))
    }, [])
    useEffect(() => {
        if(projects.length===0){
            setTimeout(() => {
                dispatch(openModal('createProject'))
            }, 3000)
        }
    }, [projects])
    useEffect(() => {
        trackEvent('studio_home_view')
        setSelectedProjects(selectionCompletedProjects)
        setRecentProjects(getProjectsByLastUpdated(projects, 8))
    }, [])

    useEffect(() => {
    
        // Exclude selectedProjects from recentProjects
        const filteredRecentProjects = getProjectsByLastUpdated(projects, 8).filter(project => 
            !selectedProjects.some(selected => selected.id === project.id)
        );
    
        setRecentProjects(filteredRecentProjects);
    }, [selectedProjects]);
    return (
        <>
          <AddProjectModal />
        
            <div className="home-header">
            <div className="search-bar">
                <SearchInput />
            </div>
            </div>
            <main className="home">
                {/*  */}
                <div className="welcome-section">
                    <div className="welcome-content">
                        <div className='welcome-message-top user-name'>
                            <h1 className='welcome-message '>Hello, <span className='iconic-gradient'>{defaultStudio?.name} </span></h1>
                            
                        </div>
                        <h1 className='welcome-message sub-message'>{
                        projects.length === 0 ?
                        "Create your first project" :
                        "Let's manage your Snaps"
                        } </h1>
                    </div>

                    <div className="storage-pie-wrap" >
                        {/* <StoragePie height={120} totalSpace={1000} usedSpace={10} active/>
                        <StoragePie height={120}totalSpace={1000} usedSpace={10} /> */}
                    </div>

                    <div className="actions">
                        <div className="button primary icon add"
                            onClick={()=>dispatch(openModal('createProject'))}
                        >New</div>
                    </div>
                </div>
                {
                    projects.length > 0 ? (
                        <>
                            {selectedProjects.length !== 0 && <div className="section recent">
                                <h3 className='section-heading'>Selection Completed</h3>
                                <div className="projects">
                                {
                                    selectedProjects.length !== 0? (
                                        selectionCompletedProjects.map((project, index) => (
                                        <ProjectCard
                                            project={project}
                                            key={project.id}
                                        /> 
                                    ))
                                    ) : (
                                        <p className="message">Selection completed projects</p>)
                                }
                                </div>
                            </div>
                            }
                            <div className="section recent">
                                <h3 className='section-heading'>Recent Projects</h3>
                                <div className="projects">
                                {
                                    recentProjects.length !== 0? (
                                    recentProjects.map((project, index) => (
                                        <ProjectCard
                                            project={project}
                                            key={project.id}
                                        /> 
                                    ))
                                    ) : (
                                        <p className="message">No recent projects</p>)
                                }
                                <Link className="project all" to={`/${defaultStudio.domain}/projects`} >
                                    <div className="cover-wrap">
                                        <div className="project-cover"></div>
                                    </div>
                                    <div className="project-details">
                                        <div className="details-top">

                                            <h4 className="project-title">See all Projects</h4>
                                            <p className="project-type"></p>
                                        </div>
                                    </div>
                                </Link>
                                </div>
                            </div>

                        </>
                    ):
                    (<>
                        <div className="projects-list">

                        <div className="project new" 
                            
                        onClick={()=>dispatch(openModal('createProject'))}
                        >
                            <div className="project-cover"
                            ></div>
                            <div className="project-details">
                                <div className="details-top">
                                    <h4 className="project-title">New Project</h4>
                                    <p className="project-type"></p>
                                </div>
                            </div>
                            <div className="project-options">
                                
                            </div>
                        </div >
                        <div className="project upload" 
                            
                        onClick={()=>dispatch(openModal('createProject'))}
                        >
                            <div className="project-cover"
                            ></div>
                            <div className="project-details">
                                <div className="details-top">
                                    <h4 className="project-title">Upload Photos</h4>
                                    <p className="project-type"></p>
                                </div>
                            </div>
                            <div className="project-options">
                                
                            </div>
                        </div >
                        </div>
                    </>)
                }
                
                {
                upcommingShoots.length !== 0 && <div className="section shoots">
                    <h3 className='section-heading'>Upcomming shoots</h3>
                    <div className="projects">
                            {upcommingShoots.map((event, index) => (
                            <EventCard
                            event={event}
                            key={event.id}
                        /> 
                            ))}
                    </div>
                </div>

                }
                
                <Refresh/>
            </main>

        </>
    );
}

export default Home;
