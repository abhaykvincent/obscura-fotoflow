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
import { SalesStatCards } from './components/SalesStatCards'; // Import Sales Stats
import { UsersTab } from './tabs/UsersTab';
import { LeadsTab } from './tabs/LeadsTab';
import { StudiosTab } from './tabs/StudiosTab';
import { ReferralsTab } from './tabs/ReferralsTab';
import { SupportTab } from './tabs/SupportTab';
import { PricingTab } from './tabs/PricingTab'; // Import Pricing Tab
import { SalesOverviewTab } from './tabs/SalesOverviewTab'; // Import Sales Overview

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

// Configuration for tabs by role
const ADMIN_TABS = [
    { id: 'users', icon: 'user', label: 'Users' },
    { id: 'leads', icon: 'leads', label: 'Leads' },
    { id: 'studios', icon: 'studio', label: 'Studios' },
    { id: 'referal-codes', icon: 'referal', label: 'Invitations' },
    { id: 'support', icon: 'ticket', label: 'Support' },
    { id: 'ai-ticket', icon: 'ai', label: 'AI Ticket' },
    { id: 'activity-log', icon: 'history', label: 'Activity Logs' },
];

const SALES_TABS = [
    { id: 'sales-overview', icon: 'history', label: 'Overview' },
    { id: 'leads', icon: 'leads', label: 'Leads' },
    { id: 'pricing', icon: 'studio', label: 'Pricing Plans' },
    { id: 'subscriptions', icon: 'leads', label: 'Subscriptions' },
    { id: 'referal-codes', icon: 'referal', label: 'Invitations' },
    { id: 'trials', icon: 'user', label: 'Active Trials' },
];

function AdminPanel() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { page } = useParams();

    // -- State Management --
    const { users, studios, referrals, leads, loading } = useAdminData();
    const [selectedRole, setSelectedRole] = useState('admin');

    // -- Tab Logic --
    // Priority: URL Param > LocalStorage > Default 'users' (or first tab of role)
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

    // Handle Role Change
    const handleRoleChange = useCallback((role) => {
        setSelectedRole(role);
        
        // Determine default tab for the new role if current tab is invalid
        let newTab = selectedTab;
        const validTabs = role === 'sales' ? SALES_TABS : ADMIN_TABS;
        
        if (!validTabs.find(t => t.id === selectedTab)) {
            newTab = validTabs[0].id;
        }

        setSelectedTab(newTab);
        navigate(`/admin/${newTab}`);
        console.log('Role switched to:', role, 'Tab set to:', newTab);
    }, [selectedTab, navigate]);

    const handleTabChange = useCallback((tab) => {
        if (tab) {
            localStorage.setItem('adminPanelLastTab', tab);
            setSelectedTab(tab);
            navigate(`/admin/${tab}`);
        }
    }, [navigate]);

    // -- Render Helpers --
    const renderTabContent = () => {
        switch (selectedTab) {
            // ADMIN TABS
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
            
            // SALES TABS
            case 'sales-overview':
                return <SalesOverviewTab />;
            case 'pricing':
                return <PricingTab />;
            case 'subscriptions':
                return (
                     <div className="invoice-history">
                        <div className="support-list" style={{ padding: '20px', color: '#fff' }}>
                            Subscriptions Management Coming Soon
                        </div>
                    </div>
                );
            case 'trials':
                 return (
                     <div className="invoice-history">
                        <div className="support-list" style={{ padding: '20px', color: '#fff' }}>
                            Trial Management Coming Soon
                        </div>
                    </div>
                );

            default:
                // Fallback: If tab doesn't match, maybe show first tab of current role or 404
                return <div style={{color:'white', padding:'20px'}}>Select a tab</div>;
        }
    };

    // Determine which tabs to show
    const currentTabs = selectedRole === 'sales' ? SALES_TABS : ADMIN_TABS;

    return (
        <>
            <AddReferralModal />
            <AddUserModal />
            
            <main className="admin-panel billing-container">
                <h1 className="admin-title">Admin Panel</h1>

                <AdminControls selectedRole={selectedRole} onRoleChange={handleRoleChange} />

                <div className="admin-dashboard">
                    {selectedRole === 'sales' ? (
                        <SalesStatCards 
                            revenue="12,500"
                            activeSubs={142}
                            churnRate="2.4%"
                            newTrials={24}
                        />
                    ) : (
                        <StatCards 
                            usersCount={users.length} 
                            studiosCount={studios.length} 
                        />
                    )}
                </div>

                {/* Tab Navigation */}
                <div className="tabs">
                    {currentTabs.map(tab => (
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
