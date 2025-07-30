import React, { useEffect, useState } from 'react';
import {  createDummyProjectsInFirestore, fetchAllReferalsFromFirestore, fetchUsers, migrateCollectionsByStudio } from '../../firebase/functions/firestore';
import './AdminPanel.scss';
import { useDispatch, useSelector } from 'react-redux';
import { openModal } from '../../app/slices/modalSlice';
import AddReferralModal from '../../admin/Modal/AddReferral';
import { fetchReferrals, generateReferral, selectReferrals } from '../../app/slices/referralsSlice';
import { set } from 'date-fns';
import { useNavigate, useParams } from 'react-router';
import { copyToClipboard, getGalleryURL, getOnboardingReferralURL } from '../../utils/urlUtils';
import { fetchStudios } from '../../firebase/functions/studios';
import { migrateStudios } from '../../firebase/functions/subscription';
import { selectDomain, selectUserStudio } from '../../app/slices/authSlice';

function AdminPanel() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    // react url page name                 <Route path="/admin/:page" element={<AdminPanel />} />
    const page = useParams().page;
    const domain = useSelector(selectDomain);
    const [studios, setStudios] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedTab, setSelectedTab] = useState(page); // State to manage the selected tab
    const [referallsList, setReferallsList] = useState([])
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

    const handleTabChange = (tab) => {
        // update react router url
        if(tab.length>0){

            navigate(`/admin/${tab}`);
           setSelectedTab(tab);
        }
    };

    return (
        <>
        <AddReferralModal/>
        <main className="admin-panel billing-container">
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

                    <div className="button secondary outline" onClick={async () => {
                            try {
                                await migrateStudios();
                                console.log('Studios migrated successfully');
                            } catch (error) {
                                console.error('Error migrating Studios:', error.message);
                            }
                        }}>
                        Migrate Studios
                    </div>

                    <div className="button secondary outline" onClick={async () => {
                            try {
                                await createDummyProjectsInFirestore(domain, 20)
                                console.log('Adding dummy projects successfull');
                            } catch (error) {
                                console.error('Error Adding dummy projects:', error.message);
                            }
                        }}>
                        Add Dummy Projects
                    </div>
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

            {/* Tab content */}
            { selectedTab === 'users' && (
                <div className="invoice-history">
                    <section className="users-list">
                        <h2 className="section-title">Users</h2>
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
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.displayName}</td>
                                        <td>{user.email}</td>
                                        <td>{user.studio.name}</td>
                                        <td>{user.studio.roles[0]}</td>
                                        <td className="actions">
                                            <button className="button secondary outline">View Details</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                </div>
            )}
            { selectedTab === 'studios' && (
                <div className="invoice-history">
                    <section className="studios-list">
                        <h2 className="section-title">Studios</h2>
                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    <th>NAME</th>
                                    <th>DOMAIN</th>
                                    <th>STUDIOS</th>
                                    <th>ROLES</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studios.map(studio => (
                                    <tr key={studio.id}>
                                        <td>{studio.name}</td>
                                        <td>fotoflow.in/{studio.domain}</td>
                                        <td>{studio.domain}</td>
                                        <td></td>
                                        <td className="actions">
                                            <button className="button secondary outline" onClick={async () => {
                                                try {
                                                    await migrateCollectionsByStudio(studio.domain);
                                                    console.log('Collections migrated successfully');
                                                } catch (error) {
                                                    console.error('Error migrating collections:', error.message);
                                                }
                                            }}>Migrate Collections</button>
                                        </td>
                                    </tr>
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
                            <div className="button primary  icon referal"
                                onClick={()=>{dispatch(openModal('addReferral'))}}
                            >New</div>
                        </div>
                        <h2 className="section-title">Referral & Codes</h2>
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
                                    referallsList.map((referral,index)=>{
                                        return(
                                            <tr className={`${referral?.status}`} key={index}>
                                                <td>{referral?.id.slice(0,4)}</td>
                                                <td>{referral?.name}</td>
                                                <td>{referral?.email}</td>
                                                <td><span className={ `campainPlatform ${referral?.campainPlatform}`}> </span></td>
                                                <td>{referral?.type}</td>
                                                <td>{referral?.phoneNumber}</td>
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
                        <h2 className="section-title">AI Tickets</h2>
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
                                <tr >
                                    <td>#FAI1001</td>
                                    <td>John Doe</td>
                                    <td>Issue with Studio</td>
                                    <td>Open</td>
                                    <td>2023-09-20</td>
                                    <td className="actions">
                                        <button className="button secondary outline">View Details</button>
                                    </td>
                                </tr>
                                <tr >
                                    <td>#FAI1002</td>
                                    <td> Jane Smith</td>
                                    <td>Feature Request</td>
                                    <td>Closed</td>
                                    <td>2023-09-19</td>
                                    <td className="actions">
                                        <button className="button secondary outline">View Details</button>
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
                        <h2 className="section-title">Support Tickets</h2>
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
                                <tr >
                                    <td>#1</td>
                                    <td>John Doe</td>
                                    <td>Issue with Studio</td>
                                    <td>Open</td>
                                    <td>2023-09-20</td>
                                    <td className="actions">
                                        <button className="button secondary outline">View Details</button>
                                    </td>
                                </tr>
                                <tr >
                                    <td>#2</td>
                                    <td> Jane Smith</td>
                                    <td>Feature Request</td>
                                    <td>Closed</td>
                                    <td>2023-09-19</td>
                                    <td className="actions">
                                        <button className="button secondary outline">View Details</button>
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
