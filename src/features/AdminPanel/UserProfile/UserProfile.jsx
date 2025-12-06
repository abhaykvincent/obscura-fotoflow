import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile, selectUserProfile, selectUserProfileLoading, selectUserProfileError } from '../../../app/slices/userProfileSlice';
import { LoadingLight } from '../../../components/Loading/Loading';
import './UserProfile.scss';

function UserProfile() {
    const { userId } = useParams();
    const dispatch = useDispatch();
    const user = useSelector(selectUserProfile);
    const loading = useSelector(selectUserProfileLoading);
    const error = useSelector(selectUserProfileError);

    useEffect(() => {
        if (userId) {
            dispatch(fetchUserProfile(userId));
        }
    }, [dispatch, userId]);

    if (loading) {
        return <LoadingLight />;
    }

    if (error) {
        return <div className="user-profile-page billing-container error-message">Error: {error}</div>;
    }

    if (!user) {
        return <div className="user-profile-page billing-container no-user-found">No user found for ID: {userId}</div>;
    }

    return (
        <main className="user-profile-page billing-container">
            <div className="breadcrumbs">
                <Link className="back" to={`/admin/users`}>
                    Admin Panel
                </Link>
            </div>
            <h1 className="admin-title"> {user.displayName || user.name }</h1>

            <div className="user-details-cards">
                <div className="card">
                    <h2>User Information</h2>
                    <p><strong>Name:</strong> {user.displayName || user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>ID:</strong> {user.id}</p>
                </div>
                <div className="card">
                    <h2>Studio Information</h2>
                    <p><strong>Studio Name:</strong> {user.studio?.name || 'N/A'}</p>
                    <p><strong>Roles:</strong> {user.roles?.join(', ') || 'N/A'}</p>
                </div>
                {/* Add more cards for other details like projects, activity, etc. */}
            </div>

            {/* Example sections for other user-related data */}
            <section className="user-projects">
                <h2>Projects</h2>
                <p>List of user's projects will go here.</p>
            </section>

            <section className="user-activity">
                <h2>Activity Log</h2>
                <p>User activity will be displayed here.</p>
            </section>
        </main>
    );
}

export default UserProfile;
