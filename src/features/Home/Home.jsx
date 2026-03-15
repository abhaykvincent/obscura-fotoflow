import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Home.scss';
import { getProjectsByEventId, getProjectsByLastUpdated, getProjectsByStatus, getRecentProjects, getUpcommingShoots, getProjectsByStorageStatus } from '../../utils/projectFilters';
import ProjectCard from '../../components/Project/ProjectCard/ProjectCard';
import Refresh from '../../components/Refresh/Refresh';
import { useDispatch, useSelector } from 'react-redux';
import { selectProjects } from '../../app/slices/projectsSlice';
import { openModal, selectModal, closeModalWithAnimation } from '../../app/slices/modalSlice';
import { selectUser, selectUserStudio } from '../../app/slices/authSlice';
import { fetchStudio, selectStudioStorageUsage } from '../../app/slices/studioSlice';
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
import { convertMegabytes } from '../../utils/stringUtils';

function Home() {
    const dispatch = useDispatch()
    const projects = useSelector(selectProjects)
    const defaultStudio = useSelector(selectUserStudio)
    const user = useSelector(selectUser);
    const selectionRequests = useSelector(selectSelectionRequests);
    const extensionRequests = useSelector(selectExtensionRequests);
    const storageUsage = useSelector(selectStudioStorageUsage);
    const navigate = useNavigate();

    document.title = `FotoFlow | ${defaultStudio.name}`;
    
    const [filter, setFilter] = useState('all');
    const [recentProjects, setRecentProjects] = useState([]);
    const [upcommingShoots, setUpcommingShoots] = useState([]);
    const [isAddButtonVisible, setIsAddButtonVisible] = useState(true);
    const addButtonRef = useRef(null);

    const modals = useSelector(selectModal);

    const selectionCompletedProjects = useMemo(() => getProjectsByStatus(projects, 'selected'), [projects]);
    const pendingActionsCount = selectionRequests.length + extensionRequests.length;

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
            dispatch(fetchStudio({ currentDomain: defaultStudio.domain }));
        }
    }, [defaultStudio, dispatch]);

    useEffect(() => {
        const checkWelcomeStatus = async () => {
            if (user && user.email) {
                const firestoreUser = await fetchUserByEmail(user.email);
                if (firestoreUser && firestoreUser.hasSeenWelcomeModal === false) {
                    if (projects.length === 0) {
                        dispatch(openModal('welcome'));
                    } else if (modals.welcome) {
                        dispatch(closeModalWithAnimation('welcome'));
                    }
                }
            }
        };
        checkWelcomeStatus();
    }, [user, projects, modals, dispatch]);

    useEffect(() => {
        trackEvent('studio_home_view');
        
        const unsortedUpcommingShoots = getUpcommingShoots(projects, 31);
        const sortedUpcommingShoots = unsortedUpcommingShoots.sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });
        setUpcommingShoots(sortedUpcommingShoots);
    }, [projects]);

    const filteredProjects = useMemo(() => {
        let result = projects;
        if (filter === 'active') result = projects.filter(p => p.status === 'active' && p.storage?.status !== 'archive');
        if (filter === 'drafts') result = projects.filter(p => p.status === 'draft');
        if (filter === 'archived') result = getProjectsByStorageStatus(projects, 'archive');
        
        // Exclude selectedProjects from recent results in the "Recent Projects" section
        return getProjectsByLastUpdated(result, 12).filter(project => 
            !selectionCompletedProjects.some(selected => selected.id === project.id)
        );
    }, [projects, filter, selectionCompletedProjects]);

    useEffect(() => {
        setRecentProjects(filteredProjects);
    }, [filteredProjects]);

    const storageString = useMemo(() => {
        if (!storageUsage) return '0 / 0';
        const used = convertMegabytes(storageUsage.used || 0);
        const total = convertMegabytes(storageUsage.quota || 5000); // Default 5GB if no quota
        return `${used} / ${total}`;
    }, [storageUsage]);

    return (
        <>
            <WelcomeModal />
            <AddProjectModal />

            <div className="home-header">
                <div className="header-left">
                    <h1 className='welcome-message'>Hello, <span className='iconic-gradient'>{defaultStudio?.name}</span></h1>
                </div>
                
                <div className="search-bar">
                    <SearchInput />
                </div>

                <div className="header-actions" ref={addButtonRef}>
                    <div className="button primary icon add"
                        onClick={() => dispatch(openModal('createProject'))}
                    >New</div>
                </div>
            </div>

            <main className="home">
                {/* Metrics Ribbon */}
                <div className="metrics-ribbon">
                    <div className="metric-item">
                        <span className="label">Storage Used:</span>
                        <span className="value">{storageString}</span>
                    </div>
                    <div className="metric-divider"></div>
                    <div className="metric-item">
                        <span className="label">Active Galleries:</span>
                        <span className="value">{projects.length}</span>
                    </div>
                    <div className="metric-divider"></div>
                    <div className="metric-item">
                        <span className="label">Pending Actions:</span>
                        <span className="value status-alert">{pendingActionsCount}</span>
                    </div>
                </div>

                {/* Combined Action Center */}
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

                {!isAddButtonVisible && (
                    <div className="mobile-actions">
                        <div className="button primary icon icon-only add-mobile"
                            onClick={() => dispatch(openModal('createProject'))}
                        ></div>
                    </div>
                )}

                {projects.length > 0 ? (
                    <>
                        {/* Active Focus: Selection Completed */}
                        {selectionCompletedProjects.length > 0 && (
                            <div className="section active-focus">
                                <h3 className='section-heading'>Selection Completed</h3>
                                <div className="projects grid-3-col">
                                    {selectionCompletedProjects.map((project) => (
                                        <ProjectCard
                                            project={project}
                                            key={project.id}
                                            type='selection'
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Project Library */}
                        <div className="section library">
                            <div className="section-header-inline">
                                <h3 className='section-heading'>Project Library</h3>
                                <div className="filter-chips">
                                    {['all', 'active', 'drafts', 'archived'].map((item) => (
                                        <div 
                                            key={item} 
                                            className={`chip ${filter === item ? 'active' : ''}`}
                                            onClick={() => setFilter(item)}
                                        >
                                            {item.charAt(0).toUpperCase() + item.slice(1)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="projects library-grid">
                                {recentProjects.length > 0 ? (
                                    recentProjects.map((project) => (
                                        <ProjectCard
                                            project={project}
                                            key={project.id}
                                            type='home'
                                        />
                                    ))
                                ) : (
                                    <p className="message">No projects found in this category.</p>
                                )}
                                <Link className="project all-link" to={`/${defaultStudio.domain}/projects`} >
                                    <div className="all-link-content">
                                        <h4>See all Projects</h4>
                                        <div className="arrow-icon"></div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="mascot-empty-projects">
                        <div className="mascot-image"></div>
                        <p className="mascot-label">
                            <span className='highlight'>Create your first Project</span>
                            <span>Click the <span className='highlight button primary small icon add'
                                onClick={() => dispatch(openModal('createProject'))}
                            > New </span> button to create your project</span>
                        </p>
                    </div>
                )}

                {upcommingShoots.length > 0 && (
                    <div className="section shoots">
                        <h3 className='section-heading'>Upcoming shoots</h3>
                        <div className="shoots-carousel">
                            {upcommingShoots.map((event) => (
                                <div key={event.id} className="shoot-card">
                                    <div className="shoot-status">
                                        <div className="signal"></div>
                                        <span className="days-left">{getEventTimeAgo(event?.date)}</span>
                                    </div>
                                    <div className="shoot-date-box">
                                        <span className="month">{new Date(event?.date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="day">{event?.date.split('-')[2]}</span>
                                    </div>
                                    <div className="shoot-info">
                                        <p className="time">{new Date(event?.date).toLocaleTimeString('default', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true,
                                        })}</p>
                                        <p className='project-name'>{getProjectsByEventId(projects, event?.id)[0]?.name}</p>
                                        <p className='event-type'>{event?.type}</p>
                                        <p className='location'>{event?.location}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}

export default Home;

