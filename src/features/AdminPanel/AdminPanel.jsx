import React, { useEffect, useState } from 'react';
import { fetchAllReferalsFromFirestore, fetchUsers, migrateCollectionsByStudio } from '../../firebase/functions/firestore';
import './AdminPanel.scss';
import { useDispatch, useSelector } from 'react-redux';
import { openModal } from '../../app/slices/modalSlice';
import AddReferralModal from '../../admin/Modal/AddReferral';
import ViewDetailsDrawer from '../../admin/Modal/ViewDetailsDrawer';
import { fetchReferrals, generateReferral, selectReferrals } from '../../app/slices/referralsSlice';
import { useNavigate, useParams } from 'react-router';
import { copyToClipboard, getGalleryURL, getOnboardingReferralURL } from '../../utils/urlUtils';
import { fetchStudios } from '../../firebase/functions/studios';
import { migrateStudios } from '../../firebase/functions/subscription';
import { selectDomain, selectUserStudio } from '../../app/slices/authSlice';
import { showAlert } from '../../app/slices/alertSlice';
import AdminControls from './AdminControls'; // Import AdminControls

function AdminPanel() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    // react url page name                 <Route path="/admin/:page" element={<AdminPanel />} />
    const page = useParams().page;

    // Initialize selectedTab based on URL, then localStorage, then default
    const [selectedTab, setSelectedTab] = useState(() => {
        const storedTab = localStorage.getItem('adminPanelLastTab');
        if (page) {
            return page; // URL parameter takes precedence
        } else if (storedTab) {
            return storedTab; // Use stored tab if no URL parameter
        }
        return 'users'; // Default tab if neither URL nor localStorage has a value
    });

    // State for selected role
    const [selectedRole, setSelectedRole] = useState('admin'); // Default role

    // Effect to update URL if initial tab came from localStorage or default
    useEffect(() => {
        if (!page && selectedTab) { // If no page in URL, but we have a selectedTab
            // Only navigate if the current URL path is not already matching the selectedTab
            // This prevents unnecessary navigations and potential infinite loops
            if (window.location.pathname !== `/admin/${selectedTab}`) {
                navigate(`/admin/${selectedTab}`, { replace: true });
            }
        }
    }, [page, selectedTab, navigate]); // Dependencies for this useEffect

    const domain = useSelector(selectDomain);
    const [studios, setStudios] = useState([]);
    const [users, setUsers] = useState([]);
    const [referallsList, setReferallsList] = useState([])
    const [expandedStudioId, setExpandedStudioId] = useState(null); // State for expanded studio row
    const [searchQuery, setSearchQuery] = useState(''); // State for search query
    const [referralSearchQuery, setReferralSearchQuery] = useState(''); // State for referral search query
    const [studioSearchQuery, setStudioSearchQuery] = useState(''); // State for studio search query

    const handleRowClick = (studioId) => {
        setExpandedStudioId(expandedStudioId === studioId ? null : studioId);
    };
    const isTrialActive = (trialEndDateString) => {
    // Split the DD-MM-YYYY string
    const [year, month, day] = trialEndDateString.split('-');
        console.log(trialEndDateString)

    // Create a Date object in YYYY-MM-DD format (Note: Month in JS Date is 0-indexed)
    // We use the greater-than-today logic, so setting the time to end of the day (23:59:59)
    // for the trial end date ensures trials expiring today are still considered active for the whole day.
    const trialDate = new Date(`${year}-${month}-${day}T23:59:59`);
    const today = new Date();
        console.log(trialDate > today)
    // Check if the trial end date is greater than the current date
    return trialDate > today;
};
    useEffect(()=>{
        console.log(domain)
    },[domain])
    useEffect(() => {
        const getStudios = async () => {
            try {
                let serverStudios = await fetchStudios();
                console.log("Server studios:", serverStudios);
                setStudios(serverStudios);
            } catch (error) {
                console.error('Error fetching studios:', error);
            }
        };
        const getUsers = async () => {
            try {
                let serverUsers = await fetchUsers();
                console.log("Server users:", serverUsers);
                setUsers(serverUsers);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        const getReferrals = async () => {
            try {
                let serverreferals = await fetchAllReferalsFromFirestore()
                console.log("Server referrals:", serverreferals);
                setReferallsList(serverreferals);
            } catch (error) {
                console.error('Error fetching referrals:', error);
            }
        };

        getUsers();
        getReferrals();
        getStudios();
    }, []);

    const filteredUsers = users.filter(user =>
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.studio.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredReferrals = referallsList.filter(referral =>
        referral?.name.toLowerCase().includes(referralSearchQuery.toLowerCase()) ||
        referral?.email.toLowerCase().includes(referralSearchQuery.toLowerCase()) ||
        referral?.code[0].toLowerCase().includes(referralSearchQuery.toLowerCase())
    );

    const filteredStudios = studios.filter(studio =>
        studio.name.toLowerCase().includes(studioSearchQuery.toLowerCase()) ||
        studio.domain.toLowerCase().includes(studioSearchQuery.toLowerCase())
    );

    const handleTabChange = (tab) => {
        // update react router url
        if(tab.length>0){
            localStorage.setItem('adminPanelLastTab', tab); // Save to localStorage
            navigate(`/admin/${tab}`);
           setSelectedTab(tab);
        }
    };

    const handleRoleChange = (role) => {
        setSelectedRole(role);
        // You can add logic here to filter data based on the selected role
        console.log('Selected role:', role);
    };

    return (
        <>
        <AddReferralModal/>
        <main className="admin-panel billing-container">
            <h1 className="admin-title">Admin Panel</h1>

            <AdminControls selectedRole={selectedRole} onRoleChange={handleRoleChange} /> {/* New AdminControls component */}

            <div className="admin-dashboard">

                <div className="cards">
                    <div className="group ">

                        <div className="card">
                            <h1 className='count'><span className='icon user'></span>{users.length}</h1>
                            <p>All time</p>
                            <h4 className='cyan'>Total Users</h4>
                        </div>
                        <div className="card">
                            <h1 className='count'><span className='icon studio'></span>{users.length}</h1>
                            <p>All time</p>
                            <h4 className='cyan'>Total Studios</h4>
                        </div>

                        {/* <div className="card">
                            <h1 className='count'><span className='icon studio'></span>{users.length}</h1>
                            <p>Monthly</p>
                            <h4  className='green'>Active Users</h4>
                        </div>

                        <div className="card">
                            <h1 className='count'><span className='icon studio'></span>+{users.length}</h1>
                            <p>This Month</p>
                            <h4 className='green'>New Users</h4>

                        </div> */}
                    </div>

                    <div className="group">
                        <div className="card">
                            <h1 className='count'>64 TB</h1>
                            <p>Firebase</p>
                            <h4 className='purple'>Storage</h4>
                        </div>
                    <div className="card ">
                            <h1 className='count '>2</h1>
                            <p>Referal</p>
                            <h4 className='cyan'>Code</h4>
                        </div>
                        {/* <div className="card ">
                            <h1 className='count '>$123</h1>
                            <p>Cloud</p>
                            <h4 className='orange'>Cost</h4>
                        </div>
                        <div className="card">
                            <h1 className='count'>$345</h1>
                            <p>Subscription</p>
                            <h4 className='green'>Revenue</h4>
                        </div> */}
                    </div>
                    <div className="group">
                        <div className="card">
                            <h1 className='count'><span className='icon ticket'></span>12</h1>
                            <p>Tickets</p>
                            <h4 className='yellow'>Open</h4>
                        </div>
                        <div className="card">
                            <h1 className='count'><span className='icon ticket'></span> 12</h1>
                            <p>Tickets</p>
                            <h4 className='green'>Closed</h4>
                        </div>
                        {/* <div className="card">
                            <h1 className='count'>~2 hrs</h1>
                            <p>Average</p>
                            <h4>Response Time</h4>
                        </div> */}
                    </div>

                </div>

                <div className="admin-actions">

                    

                    
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab-button icon user ${selectedTab === 'users' ? 'active' : ''}`}
                    onClick={() => handleTabChange('users')}
                >
                    Users
                </button>
                <button
                    className={`tab-button icon studio ${selectedTab === 'studios' ? 'active' : ''}`}
                    onClick={() => handleTabChange('studios')}
                >Studios</button>
                <button
                    className={`tab-button icon referal ${selectedTab === 'referal-codes' ? 'active' : ''}`}
                    onClick={() => handleTabChange('referal-codes')}
                >Invitations</button>
                <button
                    className={`tab-button icon ticket ${selectedTab === 'support' ? 'active' : ''}`}
                    onClick={() => handleTabChange('support')}
                >Support</button>
                <button
                    className={`tab-button icon ai ${selectedTab === 'ai-ticket' ? 'active' : ''}`}
                    onClick={() => handleTabChange('ai-ticket')}
                >AI Ticket</button>
                <button
                    className={`tab-button icon history ${selectedTab === 'activity-log' ? 'active' : ''}`}
                    onClick={() => handleTabChange('activity-log')}
                >Activity Logs</button>
                {/* <button
                    className={`tab-button ${selectedTab === 'subscriptions' ? 'active' : ''}`}
                    onClick={() => handleTabChange('subscriptions')}
                >Subscriptions</button> */}
            </div>

            {/* Tab content */}
            { selectedTab === 'users' && (
                <div className="users-tab-window">
                    
                    <div className="list-display">
                        <section className="users-list">
                            <div className="actions">
                                <div className="left-actions">
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        className="search-input"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <div className="pill secondary  icon active-users" onClick={() => console.log('Filter button clicked')}>Active Users</div>
                                    <div className="pill secondary icon leads idle" onClick={() => console.log('Filter button clicked')}>Leads</div>
                                </div>
                                <div className="right-actions">
                                    <div className="button primary">New</div>
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
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="clickable-row" onClick={() => dispatch(openModal('viewDetailsDrawer', user))}>
                                            <td>{user.displayName}</td>
                                            <td>{user.email}</td>
                                            <td>{user.studio.name}</td>
                                            <td>{user.studio.roles[0]}</td>
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
            )}
            { selectedTab === 'studios' && (
                <div className="invoice-history">
                    <section className="studios-list">
                        <div className="actions">
                            <div className="left-actions">
                                <input
                                    type="text"
                                    placeholder="Search studios..."
                                    className="search-input"
                                    value={studioSearchQuery}
                                    onChange={(e) => setStudioSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="right-actions">
                                {/* Add any right-actions here if needed */}
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
                                        <tr className={`clickable-row ${expandedStudioId === studio.id ? 'selected' : ''}`} onClick={() => handleRowClick(studio.id)}>
                                            <td>{studio.name}</td>
                                            <td>/{studio.domain}</td>
                                            <td> <span className='plan-name-label'>{studio.planName} </span>
                                                <span className={`${studio.planName === "Core"? 'free' : (isTrialActive(studio.trialEndDate)?'paid pending':'paid')} paid-status`}>{studio.planName === "Core"? 'Free' :'Paid' }</span>
                                                {isTrialActive(studio.trialEndDate) && studio.planName !== "Core" && <span className={` paid-status trial`}>Trial</span>}
                                                
                                                </td>
                                            <td>{(studio.usage.storage.used*10).toFixed(2)}</td>
                                            <td className="actions">
                                                <span className={`expand-icon ${expandedStudioId === studio.id ? 'expanded' : ''}`}>&#9660;</span>
                                            </td>
                                        </tr>
                                        {expandedStudioId === studio.id && (
                                            <tr className="expanded-row">
                                                <td colSpan="5">
                                                    <div className="expanded-content">
                                                        <button className="button secondary outline" onClick={async (e) => {
                                                            e.stopPropagation(); // Prevent row click from collapsing
                                                            try {
                                                                await migrateCollectionsByStudio(studio.domain);
                                                                console.log('Collections migrated successfully');
                                                                dispatch(showAlert({ type: 'success', message: 'Collections migrated successfully!' }));
                                                            } catch (error) {
                                                                console.error('Error migrating collections:', error.message);
                                                                dispatch(showAlert({ type: 'error', message: `Error migrating collections: ${error.message}` }));
                                                            }
                                                        }}>Migrate Collections</button>
                                                        <button className="button secondary outline" onClick={async (e) => {
                                                            e.stopPropagation(); // Prevent row click from collapsing
                                                            try {
                                                                await migrateStudios(studio.id);
                                                                console.log(`Studio ${studio.name} migrated successfully`);
                                                                dispatch(showAlert({ type: 'success', message: `Studio ${studio.name} migrated successfully!` }));
                                                            } catch (error) {
                                                                console.error(`Error migrating studio ${studio.name}:`, error.message);
                                                                dispatch(showAlert({ type: 'error', message: `Error migrating studio ${studio.name}: ${error.message}` }));
                                                            }
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
            )}
            { selectedTab === 'referal-codes' && (
                <div className="invoice-history">
                    <section className="referal-codes-list">
                        <div className="actions">
                                <div className="left-actions">
                                    <input
                                        type="text"
                                        placeholder="Search referrals..."
                                        className="search-input"
                                        value={referralSearchQuery}
                                        onChange={(e) => setReferralSearchQuery(e.target.value)}
                                    />
                                    <div className="button secondary outline icon campaign" onClick={() => console.log('Filter button clicked')}>Campaingns</div>
                                    <div className="button secondary outline icon leads" onClick={() => console.log('Filter button clicked')}>Leads</div>
                                </div>
                                <div className="right-actions">
                                <div className="button primary  icon referal"
                                    onClick={()=>{dispatch(openModal('addReferral'))}}
                                >New</div>
                                </div>
                            </div>
                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>User name</th>
                                    <th>Email</th>
                                    <th>Medium</th>
                                    <th>Type</th>
                                    <th>Phone</th>
                                    <th>Used</th>
                                    <th>Code</th>
                                    <th>Send Code</th>
                                </tr>
                            </thead>
                                                            <tbody>
                                                            {
                                                                filteredReferrals.map((referral,index)=>{                                        return(
                                            <tr className={`${referral?.status}`} key={index}>
                                                <td>{referral?.id.slice(0,4)}</td>
                                                <td>{referral?.name}</td>
                                                <td>{referral?.email}</td>
                                                <td><span className={ `campainPlatform ${referral?.campainPlatform}`}> </span></td>
                                                <td>{referral?.type}</td>
                                                <td>{referral?.studioContact}</td>
                                                <td>{referral?.used}/{referral?.quota}</td>
                                                <td><span className='button icon copy'
                                                    onClick={() => {
                                                        copyToClipboard(referral?.code[0])
                                                    }}
                                                > {referral?.code[0]}</span></td>
                                                <td><a className="button secondary outline icon open-in-new"
                                                href={`https://wa.me/${referral?.phoneNumber}?text=${encodeURIComponent(getOnboardingReferralURL(referral?.code[0])).trim()}`}
                                                target="_blank"
                                                    onClick={
                                                        () => {
                                                            copyToClipboard(getOnboardingReferralURL(referral?.code[0]))
                                                        }
                                                    }
                                                >Send</a></td>
                                            </tr>
                                        )
                                    })
                                }
                            </tbody>
                        </table>
                    </section>
                </div>
            )}
            { selectedTab === 'ai-ticket' && (
                <div className="invoice-history">
                    <section className="support-list">
                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    <th>Ticket ID</th>
                                    <th>User</th>
                                    <th>Issue</th>
                                    <th>Status</th>
                                    <th>Last Updated</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="clickable-row" onClick={() => dispatch(openModal('viewDetailsDrawer', { id: '#FAI1001', user: 'John Doe', issue: 'Issue with Studio', status: 'Open', lastUpdated: '2023-09-20' }))}>
                                    <td>#FAI1001</td>
                                    <td>John Doe</td>
                                    <td>Issue with Studio</td>
                                    <td>Open</td>
                                    <td>2023-09-20</td>
                                    <td className="actions">
                                        {/* Drawer trigger */}
                                    </td>
                                </tr>
                                <tr className="clickable-row" onClick={() => dispatch(openModal('viewDetailsDrawer', { id: '#FAI1002', user: 'Jane Smith', issue: 'Feature Request', status: 'Closed', lastUpdated: '2023-09-19' }))}>
                                    <td>#FAI1002</td>
                                    <td> Jane Smith</td>
                                    <td>Feature Request</td>
                                    <td>Closed</td>
                                    <td>2023-09-19</td>
                                    <td className="actions">
                                        {/* Drawer trigger */}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </section>
                </div>
            )}
            { selectedTab === 'support' && (
                <div className="invoice-history">
                    <section className="support-list">
                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    <th>Ticket ID</th>
                                    <th>User</th>
                                    <th>Issue</th>
                                    <th>Status</th>
                                    <th>Last Updated</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="clickable-row" onClick={() => dispatch(openModal('viewDetailsDrawer', { id: '#1', user: 'John Doe', issue: 'Issue with Studio', status: 'Open', lastUpdated: '2023-09-20' }))}>
                                    <td>#1</td>
                                    <td>John Doe</td>
                                    <td>Issue with Studio</td>
                                    <td>Open</td>
                                    <td>2023-09-20</td>
                                    <td className="actions">
                                        {/* Drawer trigger */}
                                    </td>
                                </tr>
                                <tr className="clickable-row" onClick={() => dispatch(openModal('viewDetailsDrawer', { id: '#2', user: 'Jane Smith', issue: 'Feature Request', status: 'Closed', lastUpdated: '2023-09-19' }))}>
                                    <td>#2</td>
                                    <td> Jane Smith</td>
                                    <td>Feature Request</td>
                                    <td>Closed</td>
                                    <td>2023-09-19</td>
                                    <td className="actions">
                                        {/* Drawer trigger */}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </section>
                </div>
            )}
            
            <div className="info-bar"></div>

        </main>
        </>
    );
}

export default AdminPanel;
