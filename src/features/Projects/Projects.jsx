import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux'

// --- Selectors and Actions ---
import { selectUserStudio } from '../../app/slices/authSlice';
import { selectProjects } from '../../app/slices/projectsSlice';
import { openModal } from '../../app/slices/modalSlice';

// --- Utility Functions ---
import { getProjectsByStatus } from '../../utils/projectFilters'; // Assuming getRecentProjects is not strictly needed if 'all' shows all. Adapt if needed.
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
};

const VIEW_TYPES = {
    CARDS: 'cards',
    LIST: 'list',
};

const MODAL_IDS = {
    CREATE_PROJECT: 'createProject',
};
// --- Helper Functions ---
const sortProjectsByDateDesc = (a, b) => {
    // Prioritize valid dates, treat missing/invalid dates as oldest
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB.getTime() - dateA.getTime();
};

const groupProjectsByMonth = (projects) => {
    const grouped = projects.reduce((groups, project) => {
        // Ensure project has a valid createdAt date for grouping, fallback to current date if needed
        const date = project.createdAt ? new Date(project.createdAt) : new Date();
        // Use UTC methods for consistency if timezone issues arise, otherwise localeString is fine
        const projectMonthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });

        if (!groups[projectMonthYear]) {
            groups[projectMonthYear] = [];
        }
        groups[projectMonthYear].push(project);
        return groups;
    }, {});

    // Sort month keys chronologically (most recent first)
    const sortedMonthKeys = Object.keys(grouped).sort((a, b) => {
        const dateA = new Date(a + " 1, 1970"); // Add day/year for robust parsing
        const dateB = new Date(b + " 1, 1970");
        return dateB.getTime() - dateA.getTime();
    });

    // Return sorted groups with sorted projects within each group
    return sortedMonthKeys.map(month => ({
        month,
        projects: [...grouped[month]].sort(sortProjectsByDateDesc) // Sort projects within the month
    }));
};


// --- Main Component ---
function Projects() {
    const dispatch = useDispatch();
    const defaultStudio = useSelector(selectUserStudio);
    const allProjects = useSelector(selectProjects); // Renamed for clarity

    // --- State ---
    const [selectedTab, setSelectedTab] = useState(FILTER_TABS.ALL);
    const initialViewType = retrieveProjectsViewType() || VIEW_TYPES.CARDS;
    const [viewType, setViewType] = useState(initialViewType);

    // --- Effects ---
    // Update document title when studio info is available/changes
    useEffect(() => {
        if (defaultStudio?.domain) {
            document.title = `${defaultStudio.domain} | Projects`;
        }
    }, [defaultStudio?.domain]);

    // Persist view type preference to local storage
    useEffect(() => {
        storeProjectsViewType(viewType);
    }, [viewType]);

    // --- Memoized Derived Data ---
    // Filter projects based on the selected tab
    const filteredProjects = useMemo(() => {
        if (selectedTab === FILTER_TABS.SELECTED) {
            return getProjectsByStatus(allProjects, 'selected'); // Assuming 'selected' is the status string
        }
        // Add other filters here if needed (e.g., 'recent' based on a time threshold)
        // else if (selectedTab === FILTER_TABS.RECENT) {
        //     return getRecentProjects(allProjects);
        // }
        return allProjects; // Default to all projects
    }, [allProjects, selectedTab]);

    // Group and sort the filtered projects
    const groupedProjects = useMemo(() => {
        if (!filteredProjects || filteredProjects.length === 0) {
            return [];
        }
        return groupProjectsByMonth(filteredProjects);
    }, [filteredProjects]);

    // --- Event Handlers ---
    const handleNewProjectClick = useCallback(() => {
        dispatch(openModal(MODAL_IDS.CREATE_PROJECT));
    }, [dispatch]);

    const handleTabClick = useCallback((tab) => {
        setSelectedTab(tab);
    }, []);

    const handleViewTypeClick = useCallback((type) => {
        setViewType(type);
    }, []);

    // --- Render Logic ---
    const renderEmptyState = () => (
        <div className="section recent"> {/* Consider a more generic class name if needed */}
            <h3 className="section-heading">
                {selectedTab === FILTER_TABS.SELECTED
                    ? "No selection completed projects found."
                    : "Create Your First Project"}
            </h3>
            {/* Show the "Create Project" initiator only if not in a filtered view that implies existence */}
            {selectedTab !== FILTER_TABS.SELECTED && (
                <div className="projects-list"> {/* Use consistent class */}
                    <div className="project new" onClick={handleNewProjectClick} role="button" tabIndex={0}>
                        <div className="project-cover"></div>
                        <div className="project-details">
                            <div className="details-top">
                                <h4 className="project-title">Create Project</h4>
                            </div>
                        </div>
                        <div className="project-options"></div> {/* Keep for layout consistency? */}
                    </div>
                </div>
            )}
        </div>
    );

    const renderProjectGroups = () => groupedProjects.map(({ month, projects: projectsInMonth }, index) => (
        <div key={month} className="month-group" style={{ '--group-index': index + 1 }}> {/* CSS var for potential animation stagger */}
            <h3 className="month-name">{month}</h3>
            <div className={`projects-list ${viewType}`}>
                {projectsInMonth.map((project) => (
                    <ProjectCard project={project} key={project.id} />
                ))}
            </div>
        </div>
    ));

    if (!defaultStudio) {
        return <div>Loading studio information...</div>; // Or some placeholder
    }

    return (
        <>
            {/* Modals */}
            <AddProjectModal /> {/* Assumes AddProjectModal handles its own visibility based on Redux state */}

            {/* App Header (Consider if this belongs in a layout component) */}
            <div className="projects-page-header">
                <div className="search-bar">
                    <SearchInput /> {/* Assuming SearchInput handles its own state/logic */}
                </div>
            </div>

            {/* Main Content */}
            <main className="projects">
                {/* Page Header */}
                <div className="projects-header">
                    <h1>Projects</h1>
                    <div className="actions">
                        <button className="button primary icon add" onClick={handleNewProjectClick}>
                            New
                        </button>
                    </div>
                </div>

                {/* Controls (Only show if there are projects to control) */}
                {allProjects.length > 0 && (
                    <div className="view-control">
                        {/* Filter Controls */}
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
                                    Selected
                                </div>
                                {/* Add more tabs here if needed */}
                            </div>
                            {/* Active indicator logic might need CSS adjustments based on structure */}
                            {/* <div className="active"></div> */}
                            <div className="label">Filter</div>
                        </div>

                        {/* View Controls */}
                        <div className="control-wrap view-type-controls">
                            <div className="controls">
                                <div className={`control ctrl-cards ${viewType === VIEW_TYPES.CARDS ? 'active' : ''}`}
                                    onClick={() => handleViewTypeClick(VIEW_TYPES.CARDS)}
                                    role="button" aria-label="Card View" tabIndex={0}
                                >
                                    <div className="icon card-view"></div> {/* Ensure icons are accessible */}
                                </div>
                                <div className={`control ctrl-list ${viewType === VIEW_TYPES.LIST ? 'active' : ''}`}
                                    onClick={() => handleViewTypeClick(VIEW_TYPES.LIST)}
                                    role="button" aria-label="List View" tabIndex={0}
                                >
                                    <div className="icon list-view"></div> {/* Ensure icons are accessible */}
                                </div>
                            </div>
                            {/* <div className="active"></div> */}
                            <div className="label mini-icons view">View</div>
                        </div>
                    </div>
                )}

                {/* Render Projects List or Empty State */}
                {filteredProjects.length > 0 ? renderProjectGroups() : renderEmptyState()}

                <Refresh /> {/* Assuming Refresh handles its own logic */}
            </main>
        </>
    );
}

export default Projects;