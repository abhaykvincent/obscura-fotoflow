import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.scss';
import { getProjectsByEventId, getProjectsByLastUpdated, getProjectsByStatus, getRecentProjects, getUpcommingShoots } from '../../utils/projectFilters';
import ProjectCard from '../../components/Project/ProjectCard/ProjectCard';
import ProjectCardRedefined from '../../components/Project/ProjectCard/ProjectCardRedefined';
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
import { acceptSelectionReset, declineSelectionReset, getSelectionRequests, removeRequestLocally, selectSelectionRequests } from '../../app/slices/selectionRequestSlice';
import { getExtensionRequests, selectExtensionRequests, acceptExtension, declineExtension, removeExtensionRequestLocally } from '../../app/slices/extensionRequestSlice';
import { showAlert } from '../../app/slices/alertSlice';

function Home() {
    const dispatch = useDispatch()
    const projects = useSelector(selectProjects)
    const defaultStudio = useSelector(selectUserStudio)
    const user = useSelector(selectUser);
    const selectionRequests = useSelector(selectSelectionRequests);
    const extensionRequests = useSelector(selectExtensionRequests);
    const navigate = useNavigate();

    document.title = `FotoFlow | ${defaultStudio.name}`;
    const [viewType, setViewType] = useState('cards');
    const selectionCompletedProjects = getProjectsByStatus(projects, 'selected');
    const [selectedProjects, setSelectedProjects] = useState([])
    const [recentProjects, setRecentProjects] = useState([])
    const [upcommingShoots, setUpcommingShoots] = useState([])
    const [isAddButtonVisible, setIsAddButtonVisible] = useState(true);
    const addButtonRef = useRef(null);

    const modals = useSelector(selectModal);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsAddButtonVisible(entry.isIntersecting);
            },
            { threshold: 0 }
        );

        if (addButtonRef.current) {
            observer.observe(addButtonRef.current);
        }

        return () => {
            if (addButtonRef.current) {
                observer.unobserve(addButtonRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (defaultStudio?.domain) {
            dispatch(getSelectionRequests(defaultStudio.domain));
            dispatch(getExtensionRequests(defaultStudio.domain));
        }
    }, [defaultStudio, dispatch]);

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
                <Link to={`/${defaultStudio.name}/notifications`}>
                    {/* <div className="notifications">
                        <div className="new"></div>
                    </div> */}
                </Link>
                
                <div className="search-bar">
                    <SearchInput />
                </div>
            </div>
            <main className="home">
                {!isAddButtonVisible && (
                    <div className="mobile-actions">
                        <div className="button primary icon icon-only add-mobile"
                            onClick={() => dispatch(openModal('createProject'))}
                        ></div>
                    </div>
                )}
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

                    <div className="actions" ref={addButtonRef}>
                        <div className="button primary icon add"
                            onClick={() => dispatch(openModal('createProject'))}
                        >New</div>
                    </div>
                </div>

                {/* Unified Action Center */}
                {(selectionRequests.length > 0 || extensionRequests.length > 0) && (
                    <div className="section action-center">
                        <h3 className='section-heading'>Urgent Tasks</h3>
                        <div className="action-requests-carousel">
                            {selectionRequests.map((request) => (
                                <div key={request.id} className="action-card selection-reset">
                                    <div className="action-icon reset"></div>
                                    <div className="action-content">
                                        <p className="action-title">Selection Reset</p>
                                        <p className="action-desc"><b>{request.projectName}</b> wants to select again.</p>
                                    </div>
                                    <div className="action-btns">
                                        <div className="btn-icon reject" onClick={() => {
                                            dispatch(declineSelectionReset({ domain: defaultStudio.domain, projectId: request.projectId }));
                                            dispatch(showAlert({ type: 'info', message: 'Selection reset request cancelled.' }));
                                        }}></div>
                                        <div className="btn-icon accept" onClick={() => {
                                            dispatch(acceptSelectionReset({ domain: defaultStudio.domain, projectId: request.projectId }));
                                            dispatch(showAlert({ type: 'success', message: 'Selection reset allowed!' }));
                                        }}></div>
                                        <div className="btn-text" onClick={() => {
                                            const project = projects.find(p => p.id === request.projectId);
                                            if (project) {
                                                dispatch(removeRequestLocally(request.projectId));
                                                navigate(`/${defaultStudio.domain}/project/${project.id}`, { state: { openModal: 'shareGallery' } });
                                            }
                                        }}>Manage</div>
                                    </div>
                                </div>
                            ))}
                            {extensionRequests.map((request) => (
                                <div key={request.id} className="action-card extension">
                                    <div className="action-icon clock"></div>
                                    <div className="action-content">
                                        <p className="action-title">Gallery Extension</p>
                                        <p className="action-desc"><b>{request.projectName}</b> wants an extension.</p>
                                    </div>
                                    <div className="action-btns">
                                        <div className="btn-icon reject" onClick={() => {
                                            dispatch(declineExtension({ domain: defaultStudio.domain, projectId: request.projectId }));
                                            dispatch(showAlert({ type: 'info', message: 'Extension request cancelled.' }));
                                        }}></div>
                                        <div className="btn-icon accept" onClick={() => {
                                            dispatch(acceptExtension({ domain: defaultStudio.domain, projectId: request.projectId }));
                                            dispatch(showAlert({ type: 'success', message: 'Extension request approved!' }));
                                        }}></div>
                                        <div className="btn-text" onClick={() => {
                                            const project = projects.find(p => p.id === request.projectId);
                                            if (project) {
                                                dispatch(removeExtensionRequestLocally(request.projectId));
                                                navigate(`/${defaultStudio.domain}/project/${project.id}`);
                                            }
                                        }}>Manage</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {
                    projects.length > 0 ? (
                        <>
                            {selectedProjects.length !== 0 && <div className="section recent">
                                <div className="section-header-inline">
                                    <h3 className='section-heading'>Selection Completed</h3>
                                    <div className="view-control-mini">
                                        <div className={`control ${viewType === 'cards' ? 'active' : ''}`} onClick={() => setViewType('cards')}>
                                            <div className="icon card-view"></div>
                                        </div>
                                        <div className={`control ${viewType === 'redefined' ? 'active' : ''}`} onClick={() => setViewType('redefined')}>
                                            <div className="icon redefined-view"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="projects selection">
                                    {
                                        selectedProjects.length !== 0 ? (
                                            selectionCompletedProjects.map((project, index) => (
                                                viewType === 'redefined' ? (
                                                    <ProjectCardRedefined
                                                        project={project}
                                                        key={project.id}
                                                        type='selection'
                                                    />
                                                ) : (
                                                    <ProjectCard
                                                        project={project}
                                                        key={project.id}
                                                        type='selection'
                                                    />
                                                )
                                            ))
                                        ) : (
                                            <p className="message">Selection completed projects</p>)
                                    }
                                </div>
                            </div>
                            }
                            {recentProjects.length !== 0 && <div className="section recent">
                                <h3 className='section-heading'>Recent Projects</h3>
                                <div className="projects recent">
                                    {
                                        recentProjects.length !== 0 ? (
                                            recentProjects.map((project, index) => (
                                                viewType === 'redefined' ? (
                                                    <ProjectCardRedefined
                                                        project={project}
                                                        key={project.id}
                                                        type='home'
                                                    />
                                                ) : (
                                                    <ProjectCard
                                                        project={project}
                                                        key={project.id}
                                                        type='home'
                                                    />
                                                )
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
                            </div>}

                        </>
                    ) :
                        (<>
                        <div className="mascot-empty-projects">
                            <div className="mascot-image"></div>
                            <p className="mascot-label">
                                <span className='highlight'>Create your first Project</span>
                                <span>Click the <span className='highlight button primary small icon add'
                            onClick={() => dispatch(openModal('createProject'))}
                                > New </span> button to create your project</span>
                                </p>
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
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true,
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
