import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.scss';
import { getProjectsByEventId, getProjectsByLastUpdated, getProjectsByStatus, getRecentProjects, getUpcommingShoots } from '../../utils/projectFilters';
import ProjectCard from '../../components/Project/ProjectCard/ProjectCard';
import Refresh from '../../components/Refresh/Refresh';
import { useDispatch, useSelector } from 'react-redux';
import { selectProjects } from '../../app/slices/projectsSlice';
import { openModal, selectModal, closeModalWithAnimation } from '../../app/slices/modalSlice';
import { selectUser, selectUserStudio } from '../../app/slices/authSlice';
import StoragePie from '../../components/StoragePie/StoragePie';
import { toast } from 'sonner'
import SearchInput from '../../components/Search/SearchInput';
import { trackEvent } from '../../analytics/utils';
import EventCard from '../../components/Project/ProjectCard/EventCard';
import { getEventTimeAgo } from '../../utils/dateUtils';
import AddProjectModal from '../../components/Modal/AddProject/AddProject';
import WelcomeModal from '../../components/Modal/WelcomeModal/WelcomeModal';
import { fetchUserByEmail } from '../../firebase/functions/firestore';

function Home() {
    const dispatch = useDispatch()
    const projects = useSelector(selectProjects)
    const defaultStudio = useSelector(selectUserStudio)
    const user = useSelector(selectUser);
    const navigate = useNavigate();

    document.title = `FotoFlow | ${defaultStudio.name}`;
    const selectionCompletedProjects = getProjectsByStatus(projects, 'selected');
    const requestPendingProjects = getProjectsByStatus(projects, 'request-pending');
    const [selectedProjects, setSelectedProjects] = useState([])
    const [recentProjects, setRecentProjects] = useState([])
    const [upcommingShoots, setUpcommingShoots] = useState([])

    const modals = useSelector(selectModal);

    useEffect(() => {
        const checkWelcomeStatus = async () => {

            if (user && user.email) {
                const firestoreUser = await fetchUserByEmail(user.email);
                if (firestoreUser && firestoreUser.hasSeenWelcomeModal === false) {
                    if (projects.length === 0) {
                            dispatch(openModal('welcome'));
                    } else {
                        // This part is for closing if opened by mistake
                        if (modals.welcome) {
                            dispatch(closeModalWithAnimation('welcome'));
                        }
                    }
                }
            }
        };
        checkWelcomeStatus();
    }, [user, projects, modals, dispatch]);

    useEffect(() => {
        trackEvent('studio_home_view')
        setSelectedProjects(selectionCompletedProjects.slice(0, 8))
        setRecentProjects(getProjectsByLastUpdated(projects, 8))
        const unsortedUpcommingShoots = getUpcommingShoots(projects, 31)
        const sortedUpcommingShoots = unsortedUpcommingShoots.sort((a, b) => {
            const aDate = new Date(a.date);
            const bDate = new Date(b.date);
            return aDate - bDate;
        });
        setUpcommingShoots(sortedUpcommingShoots)
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
            <WelcomeModal />
            <AddProjectModal />

            <div className="home-header">
                <div className="search-bar">
                    <SearchInput />
                </div>

                <Link to={`/${defaultStudio.name}/notifications`}>
                    <div className="notifications">
                        <div className="new"></div>
                    </div>
                </Link>
                
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
                            onClick={() => dispatch(openModal('createProject'))}
                        >New</div>
                    </div>
                </div>
                {
                    projects.length > 0 ? (
                        <>
                            {selectedProjects.length !== 0 && <div className="section recent">
                                <h3 className='section-heading'>Selection Completed</h3>
                                <div className="projects selection">
                                    {
                                        selectedProjects.length !== 0 ? (
                                            selectionCompletedProjects.map((project, index) => (
                                                <ProjectCard
                                                    project={project}
                                                    key={project.id}
                                                    type='selection'
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
                                <div className="projects recent">
                                    {
                                        recentProjects.length !== 0 ? (
                                            recentProjects.map((project, index) => (
                                                <ProjectCard
                                                    project={project}
                                                    key={project.id}
                                                    type='home'
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
                    ) :
                        (<>
                            <div className="projects-list">
                                <div className="project new" onClick={() => dispatch(openModal('createProject'))}>
                                    <div className="project-cover"></div>
                                    <div className="project-details">
                                        <div className="details-top">
                                            <h4 className="project-title">New Project</h4>
                                            <p className="project-type"></p>
                                        </div>
                                    </div>
                                    <div className="project-options"></div>
                                </div >
                            </div>
                        </>)
                }

                {
                    upcommingShoots.length !== 0 && <div className="section shoots">
                        <h3 className='section-heading'>Upcoming shoots</h3>
                        <div className="shoots">
                            {(upcommingShoots?.length > 0 && upcommingShoots?.length !== undefined)
                                && upcommingShoots
                                    .map((event) => (
                                        <div key={event.id} className="time">
                                            <div className="status large">
                                                <div className="signal"></div>
                                            </div>
                                            <p className="in-ago-event-days">{getEventTimeAgo(event?.date)}</p>
                                            <div className="date">
                                                <h5>{new Date(event?.date).toLocaleString('default', { month: 'short' })}</h5>
                                                <h1>{event?.date.split('-')[2]}</h1>
                                            </div>

                                            <p className='time-number'>{new Date(event?.date).toLocaleTimeString('default', {
                                                hour: 'numeric', // Use numeric hour (e.g., 5)
                                                minute: '2-digit', // Use two-digit minutes (e.g., 30)
                                                hour12: true, // Use 12-hour format (e.g., AM/PM)
                                            })}</p>
                                            <p className='location'>{event?.location}</p>

                                            <p className='event-name-label'>{getProjectsByEventId(projects, event?.id)[0].name}</p>
                                            <p className='event-type-label'>{event?.type}</p>


                                        </div>
                                    ))
                            }
                        </div>
                    </div>

                }

            </main>

        </>
    );
}

export default Home;
