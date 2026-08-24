import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export const StudiosTab = ({ studios }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

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
                    <div className="right-actions"></div>
                </div>
                <table className="invoice-table">
                    <thead>
                        <tr>
                            <th>STUDIO</th>
                            <th>DOMAIN</th>
                            <th>PLAN</th>
                            <th>SCORE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudios.map(studio => (
                            <tr 
                                key={studio.id}
                                className="clickable-row"
                                onClick={() => navigate(`/admin/studio/${studio.domain || studio.id}`)}
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
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
};
