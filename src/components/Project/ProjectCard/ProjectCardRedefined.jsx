import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import './ProjectCardRedefined.scss';
import { useSelector } from 'react-redux';
import { selectUserStudio } from '../../../app/slices/authSlice';
import { getThumbnailUrl } from '../../../utils/urlUtils';
import { convertMegabytes } from '../../../utils/stringUtils';
import ProjectExpiration from '../../ProjectExpiration/ProjectExpiration';

function ProjectCardRedefined({ project, type }) {
    const defaultStudio = useSelector(selectUserStudio);

    const statusColor = useMemo(() => {
        if (project.storage?.status === 'archive') return 'grey';
        if (project.status === 'expired') return 'red';
        if (project.status === 'selected') return 'yellow';
        return 'green';
    }, [project]);

    return (
        <Link className={`project-card-refined 
        ${project.id} 
        ${project.type ? project.type : ''} 
        ${project.status ? project.status : ''}
        ${project.storage?.status === 'archive' ? 'archive' : ''}
        ${type ? type : ''} 
        `}
            to={`/${defaultStudio.domain}/project/${project.id}`} key={project.id}
        >
            <div className="card-image-wrapper">
                <div className="card-image"
                    style={{
                        backgroundImage: project.projectCover ? `url(${getThumbnailUrl(project.projectCover).replace(/\(/g, '%28').replace(/\)/g, '%29')})` : '',
                    }}
                />
                <div className="card-overlay">
                    <div className="overlay-details">
                        <span>{convertMegabytes(project.totalFileSize)}</span>
                        <span className="dot"></span>
                        <span>{project.collections.length} Folders</span>
                    </div>
                </div>
                {project.type && <div className="category-tag">{project.type}</div>}
            </div>

            <div className="card-info">
                <div className="info-main">
                    <div className="title-row">
                        <h4 className="project-title">{project.name}</h4>
                        <div className={`status-indicator ${statusColor}`}></div>
                    </div>
                    <ProjectExpiration
                        createdAt={project.createdAt}
                        status={project.status}
                        projectValidityMonths={project.projectValidityMonths}
                        fileRetentionYears={project.fileRetentionYears}
                        archiveThreshold={project.storage?.archiveThreshold}
                        expiryDate={project.storage?.expiryDate}
                    />
                </div>

                <div className="info-footer">
                    <div className="tags-row">
                        {project?.events?.[0]?.date && (
                            <span className="date-tag">
                                {new Date(project.events[0].date).toLocaleString('default', {
                                    day: 'numeric',
                                    month: 'short',
                                })}
                            </span>
                        )}
                        {project?.budgets?.amount && <span className="budget-tag">₹{project.budgets.amount}</span>}
                    </div>
                    <div className={`lr-badge ${project.status === "selected" ? 'active' : ''}`}>Lr</div>
                </div>
            </div>
        </Link>
    );
}

export default ProjectCardRedefined;
