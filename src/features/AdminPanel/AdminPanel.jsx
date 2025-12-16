import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';

// Styles
import './AdminPanel.scss';

// Components
import AddReferralModal from '../../admin/Modal/AddReferral';
import AddUserModal from '../../admin/Modal/AddUser/AddUser.jsx';
import AdminControls from './AdminControls';
import { StatCards } from './components/StatCards';
import { UsersTab } from './tabs/UsersTab';
import { LeadsTab } from './tabs/LeadsTab';
import { StudiosTab } from './tabs/StudiosTab';
import { ReferralsTab } from './tabs/ReferralsTab';
import { SupportTab } from './tabs/SupportTab';

// Hooks
import { useAdminData } from './hooks/useAdminData';

// Mock Data for Support Tabs
const SUPPORT_TICKETS = [
    { id: '#1', user: 'John Doe', issue: 'Issue with Studio', status: 'Open', lastUpdated: '2023-09-20' },
    { id: '#2', user: 'Jane Smith', issue: 'Feature Request', status: 'Closed', lastUpdated: '2023-09-19' }
];

const AI_TICKETS = [
    { id: '#FAI1001', user: 'John Doe', issue: 'Issue with Studio', status: 'Open', lastUpdated: '2023-09-20' },
    { id: '#FAI1002', user: 'Jane Smith', issue: 'Feature Request', status: 'Closed', lastUpdated: '2023-09-19' }
];

function AdminPanel() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { page } = useParams();

    // -- State Management --
    const { users, studios, referrals, leads, loading } = useAdminData();
    const [selectedRole, setSelectedRole] = useState('admin');

    // -- Tab Logic --
    // Priority: URL Param > LocalStorage > Default 'users'
    const getInitialTab = () => {
        if (page) return page;
        return localStorage.getItem('adminPanelLastTab') || 'users';
    };

    const [selectedTab, setSelectedTab] = useState(getInitialTab);

    // Sync URL with Tab state
    useEffect(() => {
        if (!page && selectedTab) {
            if (window.location.pathname !== `/admin/${selectedTab}`) {
                navigate(`/admin/${selectedTab}`, { replace: true });
            }
        }
    }, [page, selectedTab, navigate]);

    const handleTabChange = useCallback((tab) => {
        if (tab) {
            localStorage.setItem('adminPanelLastTab', tab);
            setSelectedTab(tab);
            navigate(`/admin/${tab}`);
        }
    }, [navigate]);

    const handleRoleChange = useCallback((role) => {
        setSelectedRole(role);
        console.log('Role filtered:', role);
    }, []);

    // -- Render Helpers --
    const renderTabContent = () => {
        switch (selectedTab) {
            case 'users':
                return <UsersTab users={users} leads={leads} />;
            case 'leads':
                return <LeadsTab leads={leads} />; 
            case 'studios':
                return <StudiosTab studios={studios} />;
            case 'referal-codes':
                return <ReferralsTab referrals={referrals} />;
            case 'support':
                return <SupportTab tickets={SUPPORT_TICKETS} />;
            case 'ai-ticket':
                return <SupportTab tickets={AI_TICKETS} />;
            case 'activity-log':
                return (
                    <div className="invoice-history">
                        <div className="support-list" style={{ padding: '20px', color: '#fff' }}>
                            Activity Logs Coming Soon
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <AddReferralModal />
            <AddUserModal />
            
            <main className="admin-panel billing-container">
                <h1 className="admin-title">Admin Panel</h1>

                <AdminControls selectedRole={selectedRole} onRoleChange={handleRoleChange} />

                <div className="admin-dashboard">
                    <StatCards 
                        usersCount={users.length} 
                        studiosCount={studios.length} 
                    />
                </div>

                {/* Tab Navigation */}
                <div className="tabs">
                    {[
                        { id: 'users', icon: 'user', label: 'Users' },
                        { id: 'leads', icon: 'leads', label: 'Leads' },
                        { id: 'studios', icon: 'studio', label: 'Studios' },
                        { id: 'referal-codes', icon: 'referal', label: 'Invitations' },
                        { id: 'support', icon: 'ticket', label: 'Support' },
                        { id: 'ai-ticket', icon: 'ai', label: 'AI Ticket' },
                        { id: 'activity-log', icon: 'history', label: 'Activity Logs' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-button icon ${tab.icon} ${selectedTab === tab.id ? 'active' : ''}`}
                            onClick={() => handleTabChange(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content Area */}
                <div className="tab-content-container">
                    {loading ? (
                        <div style={{ color: 'white', padding: '20px' }}>Loading data...</div>
                    ) : (
                        renderTabContent()
                    )}
                </div>

                <div className="info-bar"></div>
            </main>
        </>
    );
}

export default AdminPanel;