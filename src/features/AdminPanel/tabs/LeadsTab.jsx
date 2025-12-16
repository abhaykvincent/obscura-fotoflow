import React, { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { openModal } from '../../../app/slices/modalSlice';

export const LeadsTab = ({ leads }) => {
    const dispatch = useDispatch();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLeads = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return leads.filter(lead =>
            (lead.name || '').toLowerCase().includes(query) ||
            (lead.email || '').toLowerCase().includes(query) ||
            (lead.studio?.name || '').toLowerCase().includes(query)
        );
    }, [leads, searchQuery]);

    return (
        <div className="leads-tab-window">
            <div className="list-display">
                <section className="leads-list">
                    <div className="actions">
                        <div className="left-actions">
                            <div className="search-input-wrapper">
                                <input
                                    type="text"
                                    placeholder="Search leads..."
                                    className="search-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button className="clear-search-button" onClick={() => setSearchQuery('')}>
                                        &times;
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="right-actions">
                            {/* Add any right-actions here if needed */}
                        </div>
                    </div>
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th>NAME</th>
                                <th>EMAIL</th>
                                <th>STUDIOS</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.map(lead => (
                                <tr key={lead.id} className="clickable-row" onClick={() => dispatch(openModal('viewDetailsDrawer', lead))}>
                                    <td>{lead.name}</td>
                                    <td>{lead.email}</td>
                                    <td>{lead.studio ? lead.studio.name : 'N/A'}</td>
                                    <td className="actions">
                                        {/* Drawer trigger */}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </div>
        </div>
    );
};
