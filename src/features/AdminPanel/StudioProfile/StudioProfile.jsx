import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
    fetchStudioProfile, 
    selectStudioProfile, 
    selectStudioProfileLoading, 
    selectStudioProfileError 
} from '../../../app/slices/studioProfileSlice';
import { LoadingLight } from '../../../components/Loading/Loading';
import './StudioProfile.scss';

const TAB_OPTIONS = [
    { id: 'projects', label: 'Projects' },
    { id: 'members', label: 'Team Members' },
    { id: 'billing', label: 'Plan & Billing' },
    { id: 'requests', label: 'Client Requests' },
    { id: 'settings', label: 'Settings & Metadata' },
];

function StudioProfile() {
    const { studioName } = useParams();
    const dispatch = useDispatch();

    const profileData = useSelector(selectStudioProfile);
    const loading = useSelector(selectStudioProfileLoading);
    const error = useSelector(selectStudioProfileError);

    const [activeTab, setActiveTab] = useState('projects');
    const [projectSearchQuery, setProjectSearchQuery] = useState('');
    const [copiedKey, setCopiedKey] = useState(null);

    useEffect(() => {
        if (studioName) {
            dispatch(fetchStudioProfile(studioName));
        }
    }, [dispatch, studioName]);

    const handleCopy = (text, key) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2000);
        });
    };

    const studio = profileData?.studio;
    const stats = profileData?.stats;
    const projects = profileData?.projects || [];
    const members = profileData?.members || [];
    const selectionRequests = profileData?.selectionRequests || [];
    const extensionRequests = profileData?.extensionRequests || [];

    const filteredProjects = useMemo(() => {
        if (!projectSearchQuery) return projects;
        const query = projectSearchQuery.toLowerCase();
        return projects.filter(p => 
            p.name.toLowerCase().includes(query) ||
            p.type.toLowerCase().includes(query) ||
            p.status.toLowerCase().includes(query)
        );
    }, [projects, projectSearchQuery]);

    const isTrialActive = useMemo(() => {
        if (!studio?.trialEndDate) return false;
        const [year, month, day] = studio.trialEndDate.split('-');
        const trialDate = new Date(`${year}-${month}-${day}T23:59:59`);
        return trialDate > new Date();
    }, [studio?.trialEndDate]);

    const formatBytesOrMB = (mb) => {
        if (!mb || mb <= 0) return '0 MB';
        if (mb >= 1024) {
            return `${(mb / 1024).toFixed(2)} GB`;
        }
        return `${Number(mb).toFixed(1)} MB`;
    };

    if (loading) {
        return <LoadingLight />;
    }

    if (error) {
        return (
            <main className="studio-profile-page billing-container error-container">
                <div className="breadcrumbs">
                    <Link className="back-link" to="/admin/studios">
                        &larr; Back to Studios
                    </Link>
                </div>
                <div className="error-card">
                    <h2>Error Loading Studio</h2>
                    <p>{error}</p>
                </div>
            </main>
        );
    }

    if (!profileData || !studio) {
        return (
            <main className="studio-profile-page billing-container no-data-container">
                <div className="breadcrumbs">
                    <Link className="back-link" to="/admin/studios">
                        &larr; Back to Studios
                    </Link>
                </div>
                <div className="empty-state">
                    <h2>Studio Not Found</h2>
                    <p>No studio details found for "{studioName}".</p>
                </div>
            </main>
        );
    }

    const storageUsedMB = stats?.totalStorageUsed || studio.usage?.storage?.used || 0;
    const storageQuotaMB = stats?.storageQuota || studio.usage?.storage?.quota || 0;
    const storagePercentage = storageQuotaMB > 0 ? Math.min(100, (storageUsedMB / storageQuotaMB) * 100) : 0;

    return (
        <main className="studio-profile-page billing-container">
            {/* Breadcrumb Navigation */}
            <div className="breadcrumbs">
                <Link className="back-link" to="/admin/studios">
                    <span className="back-arrow">&larr;</span> Admin Studios
                </Link>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">{studio.name}</span>
            </div>

            {/* Header / Hero Section */}
            <header className="studio-profile-header">
                <div className="studio-header-main">
                    <div className="studio-title-row">
                        <h1 className="studio-name">{studio.name}</h1>
                        <span className="domain-pill">/{studio.domain}</span>
                        <span className={`status-pill ${studio.status || 'active'}`}>
                            {studio.status || 'Active'}
                        </span>
                        <span className="plan-badge">
                            {studio.planName || 'Core'}
                            {isTrialActive && <span className="trial-tag">Trial</span>}
                        </span>
                    </div>

                    <div className="studio-metadata-chips">
                        <div className="meta-chip">
                            <span className="meta-label">Studio ID:</span>
                            <span className="meta-value">{studio.id}</span>
                            <button 
                                className="copy-button"
                                onClick={() => handleCopy(studio.id, 'id')}
                                title="Copy ID"
                            >
                                {copiedKey === 'id' ? '✓' : '⧉'}
                            </button>
                        </div>
                        {studio.ownerId && (
                            <div className="meta-chip">
                                <span className="meta-label">Owner:</span>
                                <span className="meta-value">{studio.ownerId}</span>
                                <button 
                                    className="copy-button" 
                                    onClick={() => handleCopy(studio.ownerId, 'owner')}
                                    title="Copy Owner Email"
                                >
                                    {copiedKey === 'owner' ? '✓' : '⧉'}
                                </button>
                            </div>
                        )}
                        {studio.bucketUrl && (
                            <div className="meta-chip">
                                <span className="meta-label">Bucket:</span>
                                <span className="meta-value">{studio.bucketUrl}</span>
                            </div>
                        )}
                        {studio.createdAt && (
                            <div className="meta-chip">
                                <span className="meta-label">Created:</span>
                                <span className="meta-value">
                                    {new Date(studio.createdAt).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="studio-header-actions">
                    <a 
                        href={`/${studio.domain}/home`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="button primary outline"
                    >
                        Visit Studio &nearr;
                    </a>
                </div>
            </header>

            {/* Quick Stat Cards */}
            <section className="studio-stats-grid">
                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-title">Storage Used</span>
                        <span className="stat-percentage">{storagePercentage.toFixed(1)}%</span>
                    </div>
                    <div className="stat-value">
                        {formatBytesOrMB(storageUsedMB)}
                        {storageQuotaMB > 0 && <span className="stat-sub"> / {formatBytesOrMB(storageQuotaMB)}</span>}
                    </div>
                    {storageQuotaMB > 0 && (
                        <div className="stat-progress-track">
                            <div 
                                className={`stat-progress-fill ${storagePercentage > 85 ? 'danger' : (storagePercentage > 65 ? 'warning' : '')}`} 
                                style={{ width: `${storagePercentage}%` }}
                            />
                        </div>
                    )}
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-title">Projects</span>
                        <span className="stat-tag">{stats?.activeProjects || 0} active</span>
                    </div>
                    <div className="stat-value">{stats?.totalProjects || 0}</div>
                    <div className="stat-footer-metrics">
                        <span>{stats?.completedProjects || 0} completed</span>
                        <span>•</span>
                        <span>{stats?.archivedProjects || 0} archived</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-title">Photos & Media</span>
                    </div>
                    <div className="stat-value">{stats?.totalPhotos?.toLocaleString() || 0}</div>
                    <div className="stat-footer-metrics">
                        <span>Uploaded Assets</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-header">
                        <span className="stat-title">Team Members</span>
                    </div>
                    <div className="stat-value">{stats?.totalMembers || 0}</div>
                    <div className="stat-footer-metrics">
                        <span>Active Users in Studio</span>
                    </div>
                </div>
            </section>

            {/* Dashboard Sub-Tabs Navigation */}
            <div className="studio-tabs-bar">
                {TAB_OPTIONS.map(tab => (
                    <button
                        key={tab.id}
                        className={`studio-tab-item ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                        {tab.id === 'projects' && <span className="tab-count">{projects.length}</span>}
                        {tab.id === 'members' && <span className="tab-count">{members.length}</span>}
                        {tab.id === 'requests' && stats?.pendingRequests > 0 && (
                            <span className="tab-count alert">{stats.pendingRequests}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab 1: Projects List */}
            {activeTab === 'projects' && (
                <section className="tab-content-panel projects-panel">
                    <div className="panel-actions">
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                placeholder="Search studio projects..."
                                className="search-input"
                                value={projectSearchQuery}
                                onChange={(e) => setProjectSearchQuery(e.target.value)}
                            />
                            {projectSearchQuery && (
                                <button className="clear-search-button" onClick={() => setProjectSearchQuery('')}>&times;</button>
                            )}
                        </div>
                        <div className="panel-stats-note">
                            Showing {filteredProjects.length} of {projects.length} projects
                        </div>
                    </div>

                    {filteredProjects.length === 0 ? (
                        <div className="empty-tab-data">
                            <p>No projects found matching the criteria.</p>
                        </div>
                    ) : (
                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    <th>PROJECT NAME</th>
                                    <th>TYPE</th>
                                    <th>STATUS</th>
                                    <th>PHOTOS</th>
                                    <th>STORAGE</th>
                                    <th>GALLERIES</th>
                                    <th>VALIDITY</th>
                                    <th>CREATED</th>
                                    <th>LAST OPENED</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.map(proj => (
                                    <tr key={proj.id}>
                                        <td>
                                            <div className="project-cell-name">
                                                <strong>{proj.name}</strong>
                                                <span className="project-cell-id">{proj.id}</span>
                                            </div>
                                        </td>
                                        <td><span className="tag-type">{proj.type}</span></td>
                                        <td>
                                            <span className={`status-pill small ${proj.status}`}>
                                                {proj.status}
                                            </span>
                                        </td>
                                        <td>{proj.uploadedFilesCount}</td>
                                        <td>{formatBytesOrMB(proj.totalFileSize)}</td>
                                        <td>{proj.collectionsCount || 0}</td>
                                        <td>{proj.projectValidityMonths} mo</td>
                                        <td>
                                            {proj.createdAt ? new Date(proj.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td>
                                            {proj.lastOpened ? new Date(proj.lastOpened).toLocaleDateString() : 'Never'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            )}

            {/* Tab 2: Team Members */}
            {activeTab === 'members' && (
                <section className="tab-content-panel members-panel">
                    {members.length === 0 ? (
                        <div className="empty-tab-data">
                            <p>No associated users found for this studio.</p>
                        </div>
                    ) : (
                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    <th>MEMBER</th>
                                    <th>EMAIL</th>
                                    <th>ROLE</th>
                                    <th>JOINED</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map(member => (
                                    <tr key={member.id}>
                                        <td>
                                            <div className="member-name-cell">
                                                <div className="member-avatar">
                                                    {(member.displayName || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="member-name">{member.displayName}</span>
                                            </div>
                                        </td>
                                        <td>{member.email}</td>
                                        <td>
                                            <span className={`role-badge ${member.role?.toLowerCase() === 'owner' ? 'owner' : ''}`}>
                                                {member.role || 'Member'}
                                            </span>
                                        </td>
                                        <td>
                                            {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td>
                                            <Link 
                                                to={`/admin/user/${member.id}`} 
                                                className="button tertiary small"
                                            >
                                                View User &rarr;
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            )}

            {/* Tab 3: Plan & Billing */}
            {activeTab === 'billing' && (
                <section className="tab-content-panel billing-panel">
                    <div className="cards-grid">
                        <div className="info-card">
                            <h3>Current Plan</h3>
                            <div className="info-row">
                                <span className="info-label">Plan Name:</span>
                                <span className="info-val highlight">{studio.planName || 'Core'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Batch Group:</span>
                                <span className="info-val">{studio.batch || studio.userBatch || 'BP001'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Subscription Status:</span>
                                <span className="info-val capitalize">{studio.billing?.status || studio.status || 'Active'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Active Trial:</span>
                                <span className="info-val">{isTrialActive ? 'Yes' : 'No'}</span>
                            </div>
                            {studio.trialEndDate && (
                                <div className="info-row">
                                    <span className="info-label">Trial End Date:</span>
                                    <span className="info-val">{studio.trialEndDate}</span>
                                </div>
                            )}
                        </div>

                        <div className="info-card">
                            <h3>Quotas & Limits</h3>
                            <div className="info-row">
                                <span className="info-label">Storage Quota:</span>
                                <span className="info-val">{formatBytesOrMB(studio.usage?.storage?.quota)}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Projects Monthly Quota:</span>
                                <span className="info-val">{studio.usage?.projects?.monthlyQuota ?? 'Unlimited'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Projects Monthly Used:</span>
                                <span className="info-val">{studio.usage?.projects?.monthlyUsed || 0}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Galleries Quota:</span>
                                <span className="info-val">{studio.usage?.collections?.quota ?? 'Unlimited'}</span>
                            </div>
                        </div>

                        <div className="info-card">
                            <h3>Payment Gateway Details</h3>
                            <div className="info-row">
                                <span className="info-label">Razorpay Customer ID:</span>
                                <span className="info-val">{studio.billing?.razorpayCustomerId || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Razorpay Subscription ID:</span>
                                <span className="info-val">{studio.billing?.razorpaySubscriptionId || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Current Period End:</span>
                                <span className="info-val">{studio.billing?.currentPeriodEnd || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Subscription ID:</span>
                                <span className="info-val">{studio.subscriptionId || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Tab 4: Client Requests */}
            {activeTab === 'requests' && (
                <section className="tab-content-panel requests-panel">
                    <div className="requests-subsections">
                        <div className="request-section">
                            <h3>Selection Reset Requests ({selectionRequests.length})</h3>
                            {selectionRequests.length === 0 ? (
                                <p className="empty-subtext">No selection reset requests recorded.</p>
                            ) : (
                                <table className="invoice-table">
                                    <thead>
                                        <tr>
                                            <th>PROJECT</th>
                                            <th>STATUS</th>
                                            <th>REQUESTED AT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectionRequests.map(req => (
                                            <tr key={req.id}>
                                                <td>{req.projectName || req.projectId}</td>
                                                <td>
                                                    <span className={`status-pill small ${req.status}`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td>{req.requestedAt ? new Date(req.requestedAt).toLocaleString() : 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="request-section">
                            <h3>Validity Extension Requests ({extensionRequests.length})</h3>
                            {extensionRequests.length === 0 ? (
                                <p className="empty-subtext">No validity extension requests recorded.</p>
                            ) : (
                                <table className="invoice-table">
                                    <thead>
                                        <tr>
                                            <th>PROJECT</th>
                                            <th>STATUS</th>
                                            <th>REQUESTED AT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {extensionRequests.map(req => (
                                            <tr key={req.id}>
                                                <td>{req.projectName || req.projectId}</td>
                                                <td>
                                                    <span className={`status-pill small ${req.status}`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td>{req.requestedAt ? new Date(req.requestedAt).toLocaleString() : 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Tab 5: Settings & Metadata */}
            {activeTab === 'settings' && (
                <section className="tab-content-panel settings-panel">
                    <div className="cards-grid">
                        <div className="info-card">
                            <h3>Studio Settings</h3>
                            <div className="info-row">
                                <span className="info-label">Gallery Tagline:</span>
                                <span className="info-val">{studio.settings?.gallery?.galleryTagline || 'Default Tagline'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Studio Logo:</span>
                                <span className="info-val">{studio.studioLogo ? 'Configured' : 'Not set'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Domain Slug:</span>
                                <span className="info-val highlight">{studio.domain}</span>
                            </div>
                        </div>

                        <div className="info-card">
                            <h3>Storage Infrastructure</h3>
                            <div className="info-row">
                                <span className="info-label">Bucket URL:</span>
                                <span className="info-val">{studio.bucketUrl || 'Default'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">User Batch:</span>
                                <span className="info-val">{studio.userBatch || '1'}</span>
                            </div>
                        </div>

                        <div className="info-card">
                            <h3>Document Metadata</h3>
                            <div className="info-row">
                                <span className="info-label">Created At:</span>
                                <span className="info-val">{studio.metadata?.createdAt || studio.createdAt || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Updated At:</span>
                                <span className="info-val">{studio.metadata?.updatedAt || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Data Schema Version:</span>
                                <span className="info-val">{studio.metadata?.version || '2'}</span>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
}

export default StudioProfile;
