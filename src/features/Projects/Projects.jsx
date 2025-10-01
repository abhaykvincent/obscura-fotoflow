import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'; // Import useRef
import { useDispatch, useSelector } from 'react-redux'

// --- Selectors and Actions ---
import { selectUserStudio } from '../../app/slices/authSlice';
import { selectProjects } from '../../app/slices/projectsSlice';
import { openModal } from '../../app/slices/modalSlice';

// --- Utility Functions ---
import {  getProjectsByStatus, getProjectsByStorageStatus} from '../../utils/projectFilters';
import { retrieveProjectsViewType, storeProjectsViewType } from '../../utils/localStorageUtills';

// --- Components ---
import AddProjectModal from '../../components/Modal/AddProject/AddProject';
import ProjectCard from '../../components/Project/ProjectCard/ProjectCard';
import SearchInput from '../../components/Search/SearchInput';
import Refresh from '../../components/Refresh/Refresh';

// --- Styles ---
import './Projects.scss';

// --- Constants ---
const FILTER_TABS = {
    ALL: 'all',
    SELECTED: 'selected',
    ARCHIVED: 'archived'
};

const VIEW_TYPES = {
    CARDS: 'cards',
    LIST: 'list',
};

const MODAL_IDS = {
    CREATE_PROJECT: 'createProject',
};

const DAY_RANGES = {
    INITIAL: 180,
    LOAD_MORE_1: 180,
    LOAD_MORE_2: 360,
    ALL_TIME: 720,
};

// --- Helper Functions ---
const sortProjectsByDateDesc = (a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB.getTime() - dateA.getTime();
};

const groupProjectsByMonth = (projects) => {
    const grouped = projects.reduce((groups, project) => {
        const date = project.createdAt ? new Date(project.createdAt) : new Date();
        const projectMonthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });

        if (!groups[projectMonthYear]) {
            groups[projectMonthYear] = [];
        }
        groups[projectMonthYear].push(project);
        return groups;
    }, {});

    const sortedMonthKeys = Object.keys(grouped).sort((a, b) => {
        const dateA = new Date(a + " 1, 1970");
        const dateB = new Date(b + " 1, 1970");
        return dateB.getTime() - dateA.getTime();
    });

    return sortedMonthKeys.map(month => ({
        month,
        projects: [...grouped[month]].sort(sortProjectsByDateDesc)
    }));
};


// --- Main Component ---
function Projects() {
    const dispatch = useDispatch();
    const defaultStudio = useSelector(selectUserStudio);
    const allProjects = useSelector(selectProjects);

    // --- State ---
    const [selectedTab, setSelectedTab] = useState(FILTER_TABS.ALL);
    const initialViewType = retrieveProjectsViewType() || VIEW_TYPES.CARDS;
    const [viewType, setViewType] = useState(initialViewType);
    const [visibleDays, setVisibleDays] = useState(DAY_RANGES.INITIAL);
    // Ref to store the keys of initially loaded month groups
    const initialMonthKeysRef = useRef(new Set());

    // --- Effects ---
    useEffect(() => {
        if (defaultStudio?.domain) {
            document.title = `${defaultStudio.domain} | Projects`;
        }
    }, [defaultStudio?.domain]);

    useEffect(() => {
        storeProjectsViewType(viewType);
    }, [viewType]);

    // --- Memoized Derived Data ---
    const filteredProjects = useMemo(() => {
        const now = new Date();
        const cutoffDate = new Date(now.setDate(now.getDate() - visibleDays));

        const projectsWithinRange = allProjects.filter(project => {
            const projectDate = new Date(project.createdAt);
            // Ensure projectDate is a valid date before comparison
            return !isNaN(projectDate) && projectDate >= cutoffDate;
        });

        if (selectedTab === FILTER_TABS.ARCHIVED) {
            return getProjectsByStorageStatus(projectsWithinRange, 'archive')
        }
        if (selectedTab === FILTER_TABS.SELECTED) {
            return getProjectsByStatus(projectsWithinRange, 'selected');
        }
        return projectsWithinRange;
    }, [allProjects, selectedTab, visibleDays]);

    const groupedProjects = useMemo(() => {
        if (!filteredProjects || filteredProjects.length === 0) {
            return [];
        }
        const grouped = groupProjectsByMonth(filteredProjects);

        // On initial load (visibleDays === DAY_RANGES.INITIAL), capture the month keys
        if (visibleDays === DAY_RANGES.INITIAL) {
            initialMonthKeysRef.current = new Set(grouped.map(group => group.month));
        }
        return grouped;
    }, [filteredProjects, visibleDays]); // Add visibleDays to dependencies

     const hasMoreProjectsToLoad = useMemo(() => {
        // First, check if there are any projects in total. If not, no need to load more.
        if (allProjects.length === 0) {
            return false;
        }

        const now = new Date();
        const currentVisibleDate = new Date(now.setDate(now.getDate() - visibleDays));

        // Check if there are any projects older than the current visible range
        return allProjects.some(project => {
            const projectDate = new Date(project.createdAt);

            return !isNaN(projectDate) && projectDate < currentVisibleDate;
        });

    }, [allProjects, visibleDays]);


    // --- Event Handlers ---
    const handleNewProjectClick = useCallback(() => {
        dispatch(openModal(MODAL_IDS.CREATE_PROJECT));
    }, [dispatch]);

    const handleTabClick = useCallback((tab) => {
        setSelectedTab(tab);
        setVisibleDays(DAY_RANGES.INITIAL); // Reset visible days when tab changes
        // Clear initialMonthKeysRef when tab changes as content will be re-initialised
        initialMonthKeysRef.current.clear();
    }, []);

    const handleViewTypeClick = useCallback((type) => {
        setViewType(type);
    }, []);

    const handleLoadMore = useCallback(() => {
        setVisibleDays(prevDays => {
            if (prevDays === DAY_RANGES.INITIAL) {
                return DAY_RANGES.LOAD_MORE_1;
            } else if (prevDays === DAY_RANGES.LOAD_MORE_1) {
                return DAY_RANGES.LOAD_MORE_2;
            } else if (prevDays === DAY_RANGES.LOAD_MORE_2) {
                return DAY_RANGES.ALL_TIME;
            }
            return prevDays;
        });
    }, []);

    // --- Render Logic ---
    const renderEmptyState = () => (
        <div className="section recent">
            <h3 className="section-heading">
                {selectedTab === FILTER_TABS.SELECTED
                    ? "No selection completed projects found for this period."
                    : "Create Your First Project"}
            </h3>
            {selectedTab !== FILTER_TABS.SELECTED && (
                <div className="projects-list">
                    <div className="project new" onClick={handleNewProjectClick} role="button" tabIndex={0}>
                        <div className="project-cover"></div>
                        <div className="project-details">
                            <div className="details-top">
                                <h4 className="project-title">Create Project</h4>
                            </div>
                        </div>
                        <div className="project-options"></div>
                    </div>
                </div>
            )}
            {allProjects.length > 0 && filteredProjects.length === 0 && (
                 <p className="empty-state-message">No projects found within the current date range. Try loading more.</p>
            )}
        </div>
    );

    const renderProjectGroups = () => (
        <>
            {groupedProjects.map(({ month, projects: projectsInMonth }, index) => {
                const isNewlyLoaded = visibleDays > DAY_RANGES.INITIAL && !initialMonthKeysRef.current.has(month);
                return (
                    <div
                        key={month}
                        className={`month-group ${isNewlyLoaded ? 'loaded-more' : ''}`} // Add the new class here
                        style={{ '--group-index': index + 1 }}
                    >
                        <h3 className="month-name">{month}</h3>
                        <div className={`projects-list ${viewType}`}>
                            {projectsInMonth.map((project) => (
                                <ProjectCard project={project} key={project.id} type='projects' />
                            ))}
                        </div>
                    </div>
                );
            })}
            {hasMoreProjectsToLoad && (
                <div className="load-more-container">
                    <button className="button secondary" onClick={handleLoadMore}>
                        Load More
                    </button>
                </div>
            )}
        </>
    );

    if (!defaultStudio) {
        return <div>Loading studio information...</div>;
    }

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
                    <div className="page-title">
                        {/* <div className="icon projects-ill"></div> */}
                        <h1 >Projects</h1>
                    </div>
                    <div className="actions">
                        <button className="button primary icon add" onClick={handleNewProjectClick}>
                            New
                        </button>
                    </div>
                </div>

                {allProjects.length > 0 && (
                    <div className="view-control">
                        <div className="filter-controls">
                            <div className="control-wrap">
                                <div className="controls">
                                    <div
                                        className={`control status-control control-live  ${selectedTab === FILTER_TABS.ALL ? 'active' : ''}`}
                                        onClick={() => handleTabClick(FILTER_TABS.ALL)}
                                        role="button" tabIndex={0}
                                    >
                                        <div className="status-signal"></div>
                                        Live
                                    </div>
                                    <div
                                        className={`control status-control control-archive ${selectedTab === FILTER_TABS.ARCHIVED ? 'active' : ''}`}
                                        onClick={() => handleTabClick(FILTER_TABS.ARCHIVED)}
                                        role="button" tabIndex={0}
                                    >
                                        <div className="status-signal"></div>
                                        Archive
                                    </div>
                                </div>
                                <div className="label">Storage</div>
                            </div>
                            <div className="control-wrap">
                                <div className="controls">
                                    <div
                                        className={`control ctrl-all ${selectedTab === FILTER_TABS.ALL ? 'active' : ''}`}
                                        onClick={() => handleTabClick(FILTER_TABS.ALL)}
                                        role="button" tabIndex={0}
                                    >
                                        All
                                    </div>
                                    <div
                                        className={`control ctrl-draft ${selectedTab === FILTER_TABS.SELECTED ? 'active' : ''}`}
                                        onClick={() => handleTabClick(FILTER_TABS.SELECTED)}
                                        role="button" tabIndex={0}
                                    >
                                        Pending
                                    </div>
                                    <div
                                        className={`control ctrl-draft ${selectedTab === FILTER_TABS.ARCHIVED ? 'active' : ''}`}
                                        onClick={() => handleTabClick(FILTER_TABS.ARCHIVED)}
                                        role="button" tabIndex={0}
                                    >
                                        Designing
                                    </div>
                                    <div
                                        className={`control ctrl-draft ${selectedTab === FILTER_TABS.ARCHIVED ? 'active' : ''}`}
                                        onClick={() => handleTabClick(FILTER_TABS.ARCHIVED)}
                                        role="button" tabIndex={0}
                                    >
                                        Completed
                                    </div>
                                </div>
                                <div className="label">Filter</div>
                            </div>
                        </div>

                        <div className="control-wrap view-type-controls">
                            <div className="controls">
                                <div className={`control ctrl-cards ${viewType === VIEW_TYPES.CARDS ? 'active' : ''}`}
                                    onClick={() => handleViewTypeClick(VIEW_TYPES.CARDS)}
                                    role="button" aria-label="Card View" tabIndex={0}
                                >
                                    <div className="icon card-view"></div>
                                </div>
                                <div className={`control ctrl-list ${viewType === VIEW_TYPES.LIST ? 'active' : ''}`}
                                    onClick={() => handleViewTypeClick(VIEW_TYPES.LIST)}
                                    role="button" aria-label="List View" tabIndex={0}
                                >
                                    <div className="icon list-view"></div>
                                </div>
                            </div>
                            <div className="label mini-icons view">View</div>
                        </div>
                    </div>
                )}

                {filteredProjects.length > 0 || allProjects.length === 0 ? renderProjectGroups() : renderEmptyState()}

                <Refresh />
            </main>
        </>
    );
}

export default Projects;