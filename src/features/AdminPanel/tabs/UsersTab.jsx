import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { openModal } from '../../../app/slices/modalSlice';

export const UsersTab = ({ users, leads }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewType, setViewType] = useState('users'); // 'users' | 'leads'

    const filteredData = useMemo(() => {
        const query = searchQuery.toLowerCase();
        const list = viewType === 'users' ? users : leads;
        
        return list.filter(item => {
            const name = (item.displayName || item.name || '').toLowerCase();
            const email = (item.email || '').toLowerCase();
            const studioName = (item.studio?.name || '').toLowerCase();
            return name.includes(query) || email.includes(query) || studioName.includes(query);
        });
    }, [users, leads, searchQuery, viewType]);

    return (
        <div className="users-tab-window">
            <div className="list-display">
                <section className="users-list">
                    <div className="actions">
                        <div className="left-actions">
                            <div className="search-input-wrapper">
                                <input
                                    type="text"
                                    placeholder={`Search ${viewType}...`}
                                    className="search-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button className="clear-search-button" onClick={() => setSearchQuery('')}>&times;</button>
                                )}
                            </div>
                            <div 
                                className={`pill secondary icon active-users ${viewType === 'users' ? '' : 'idle'}`} 
                                onClick={() => setViewType('users')}
                            >
                                Active Users
                            </div>
                            <div 
                                className={`pill secondary icon leads ${viewType === 'leads' ? '' : 'idle'}`} 
                                onClick={() => setViewType('leads')}
                            >
                                Leads
                            </div>
                        </div>
                        <div className="right-actions">
                            <div className="button primary" onClick={() => dispatch(openModal('addUser'))}>New</div>
                        </div>
                    </div>
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th>NAME</th>
                                <th>EMAIL</th>
                                <th>STUDIOS</th>
                                <th>ROLES</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map(item => (
                                <tr 
                                    key={item.id} 
                                    className="clickable-row" 
                                    onClick={() => navigate(`/admin/user/${item.id}`)}
                                >
                                    <td>{item.displayName || item.name}</td>
                                    <td>{item.email}</td>
                                    <td>{item.studio?.name || 'N/A'}</td>
                                    <td>{viewType === 'users' ? (item.studio?.roles?.[0] || 'N/A') : 'Lead'}</td>
                                    <td className="actions"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </div>
        </div>
    );
};
