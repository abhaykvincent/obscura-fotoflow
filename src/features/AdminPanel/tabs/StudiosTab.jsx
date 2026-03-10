import React, { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { showAlert } from '../../../app/slices/alertSlice';
import { migrateCollectionsByStudio, migrateProjectsValidityFields } from '../../../firebase/functions/firestore';
import { migrateStudios } from '../../../firebase/functions/subscription';
import { migrateUsersToMultiStudio } from '../../../firebase/functions/user-firestore';

export const StudiosTab = ({ studios }) => {
    const dispatch = useDispatch();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedStudioId, setExpandedStudioId] = useState(null);

    const filteredStudios = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return studios.filter(studio =>
            (studio.name || '').toLowerCase().includes(query) ||
            (studio.domain || '').toLowerCase().includes(query)
        );
    }, [studios, searchQuery]);

    const isTrialActive = (trialEndDateString) => {
        if (!trialEndDateString) return false;
        const [year, month, day] = trialEndDateString.split('-');
        const trialDate = new Date(`${year}-${month}-${day}T23:59:59`);
        return trialDate > new Date();
    };

    const handleMigration = async (action, successMsg, errorMsg) => {
        try {
            const result = await action();
            const message = typeof result === 'number' ? `${successMsg} (${result} users)` : successMsg;
            dispatch(showAlert({ type: 'success', message }));
        } catch (error) {
            console.error(error);
            dispatch(showAlert({ type: 'error', message: `${errorMsg}: ${error.message}` }));
        }
    };

    const handleRowClick = (studioId) => {
        setExpandedStudioId(expandedStudioId === studioId ? null : studioId);
    };

    return (
        <div className="invoice-history">
            <section className="studios-list">
                <div className="actions">
                    <div className="left-actions">
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                placeholder="Search studios..."
                                className="search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button className="clear-search-button" onClick={() => setSearchQuery('')}>&times;</button>
                            )}
                        </div>
                    </div>
                    <div className="right-actions">
                        <button className="button secondary outline disabled" disabled onClick={() => handleMigration(
                            migrateUsersToMultiStudio,
                            'All users migrated to multi-studio!',
                            'Error migrating users'
                        )}>Migrate All Users (Multi-Studio)</button>

                        <button className="button secondary outline" onClick={() => handleMigration(
                            migrateProjectsValidityFields,
                            'All projects migrated!',
                            'Error migrating projects'
                        )}>Migrate Projects (Validity)</button>
                    </div>
                </div>
                <table className="invoice-table">
                    <thead>
                        <tr>
                            <th>STUDIO</th>
                            <th>DOMAIN</th>
                            <th>PLAN</th>
                            <th>SCORE</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudios.map(studio => (
                            <React.Fragment key={studio.id}>
                                <tr 
                                    className={`clickable-row ${expandedStudioId === studio.id ? 'selected' : ''}`} 
                                    onClick={() => handleRowClick(studio.id)}
                                >
                                    <td>{studio.name}</td>
                                    <td>/{studio.domain}</td>
                                    <td>
                                        <span className='plan-name-label'>{studio.planName} </span>
                                        <span className={`${studio.planName === "Core" ? 'free' : (isTrialActive(studio.trialEndDate) ? 'paid pending' : 'paid')} paid-status`}>
                                            {studio.planName === "Core" ? 'Free' : 'Paid'}
                                        </span>
                                        {isTrialActive(studio.trialEndDate) && studio.planName !== "Core" && <span className="paid-status trial">Trial</span>}
                                    </td>
                                    <td>{(studio.usage?.storage?.used * 10 || 0).toFixed(2)}</td>
                                    <td className="actions">
                                        <span className={`expand-icon ${expandedStudioId === studio.id ? 'expanded' : ''}`}>&#9660;</span>
                                    </td>
                                </tr>
                                {expandedStudioId === studio.id && (
                                    <tr className="expanded-row">
                                        <td colSpan="5">
                                            <div className="expanded-content">
                                                <button className="button secondary outline" onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMigration(
                                                        () => migrateCollectionsByStudio(studio.domain),
                                                        'Collections migrated successfully!',
                                                        'Error migrating collections'
                                                    );
                                                }}>Migrate Collections</button>
                                                
                                                <button className="button secondary outline" onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMigration(
                                                        () => migrateStudios(studio.id),
                                                        `Studio ${studio.name} migrated successfully`,
                                                        `Error migrating studio ${studio.name}`
                                                    );
                                                }}>Migrate Studio</button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
};
