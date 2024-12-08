import React, { useEffect, useState } from 'react';
import { fetchStudios, fetchUsers } from '../../firebase/functions/firestore';
import './AdminPanel.scss';

function AdminPanel() {
    const [studios, setStudios] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedTab, setSelectedTab] = useState('studios'); // State to manage the selected tab

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

        getUsers();
        getStudios();
    }, []);

    const handleTabChange = (tab) => {
        setSelectedTab(tab);
    };

    return (
        <main className="admin-panel">
            <h1 className="admin-title">Admin Panel</h1>
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
                    <div className="button secondary outline" onClick={() => {/* Implement create user logic here */}}>
                        Create User
                    </div>
                    <div className="button secondary outline" onClick={() => {/* Implement create studio logic here */}}>
                        Create Studio
                    </div>
                    <div className="button secondary outline" onClick={() => {/* Implement create studio logic here */}}>
                        Create Referal
                    </div>
                    <div className="button secondary outline" onClick={() => {/* Implement create studio logic here */}}>
                        Create Ticket
                    </div>
                </div>
            </div>

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
                    className={`tab-button icon ticket ${selectedTab === 'support' ? 'active' : ''}`}
                    onClick={() => handleTabChange('support')}
                >Support</button>
                <button
                    className={`tab-button icon referal ${selectedTab === 'referal-codes' ? 'active' : ''}`}
                    onClick={() => handleTabChange('referal-codes')}
                >Referral & Codes</button>
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

            {selectedTab === 'users' && (
                <section className="users-list">
                    <div className="user-card table-header">
                            <p>NAME</p>
                            <p>EMAIL</p>
                            <p>STUDIOS</p>
                            <p>ROLES</p>
                        </div>
                    {users.map(user => (
                        <div key={user.id} className="user-card">
                            <p>{user.displayName}</p>
                            <p>{user.email}</p>
                            <p>{user.studio.name}</p>
                            <p>{user.studio.roles[0]}</p>
                            <button className="button secondary outline">View Details</button>
                        </div>
                    ))}
                </section>
            )}
            {selectedTab === 'studios' && (
                <section className="studios-list">
                    <div className="studio-card table-header">
                        <p>NAME</p>
                        <p>DOMAIN</p>
                        <p>STUDIOS</p>
                        <p>ROLES</p>
                    </div>
                    {studios.map(studio => (
                        <div key={studio.id} className="studio-card">
                            <p>{studio.name}</p>
                            <p>fotoflow.in/{studio.domain}</p>
                            <p>{studio.domain}</p>
                            {/* Add more details and actions here */}
                        </div>
                    ))}
                </section>
            )}
            {
                selectedTab === 'referal-codes' && (
                    <section className="referal-codes-list">
                        <div className="actions">
                            <div className="button primary  icon referal">New</div>
                        </div>
                    <div className="referal-codes-card table-header">
                        <p>ID</p>
                        <p>CAMPAIN</p>
                        <p>MEDIUM</p>
                        <p>USAGE</p>
                        <p>LINK</p>
                        <p>CODE</p>
                    </div>
                        <div className="referal-codes-card">
                            <p>#0001</p>
                            <p>Shutter to Success - A</p>
                            <p>Whatsapp Group</p>
                            <p>1/10</p>                            
                            <p className='button icon open-in-new'>../onboarding&ref=H72HG59</p>

                            <button className="button secondary outline">H72HG59</button>
                        </div>
                        <div className="referal-codes-card">
                            <p>#0002</p>
                            <p>Shutter to Success- B</p>
                            <p>Whatsapp Group</p>
                            <p>1/10</p>
                            <p className='button icon open-in-new'>../onboarding&ref=GT23RE6</p>
                            <button className="button secondary outline">GT23RE6</button>
                        </div>
                        {/* Add more support tickets here */}
                    </section>
                )
            }
            {
                selectedTab === 'ai-ticket' && (
                    <section className="support-list">
                        <div className="support-card">
                            <p>#FAI1001</p>
                            <p>John Doe</p>
                            <p>Issue with Studio</p>
                            <p>Open</p>
                            <p>Last Updated: 2023-09-20</p>
                            <button className="button secondary outline">View Details</button>
                        </div>
                        <div className="support-card">
                            <p>#FAI1002</p>
                            <p> Jane Smith</p>
                            <p>Feature Request</p>
                            <p>Closed</p>
                            <p>Last Updated: 2023-09-19</p>
                            <button className="button secondary outline">View Details</button>
                        </div>
                        {/* Add more support tickets here */}
                    </section>
                )
            }
            {
                selectedTab === 'support' && (
                    <section className="support-list">
                        <div className="support-card">
                            <p>#1</p>
                            <p>John Doe</p>
                            <p>Issue with Studio</p>
                            <p>Open</p>
                            <p>Last Updated: 2023-09-20</p>
                            <button className="button secondary outline">View Details</button>
                        </div>
                        <div className="support-card">
                            <p>#2</p>
                            <p> Jane Smith</p>
                            <p>Feature Request</p>
                            <p>Closed</p>
                            <p>Last Updated: 2023-09-19</p>
                            <button className="button secondary outline">View Details</button>
                        </div>
                        {/* Add more support tickets here */}
                    </section>
                )
            }
            <div className="info-bar"></div>

        </main>
    );
}

export default AdminPanel;
