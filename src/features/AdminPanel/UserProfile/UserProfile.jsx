import React from 'react';
import { useParams, Link } from 'react-router-dom';
import './UserProfile.scss';

function UserProfile() {
    const { userId } = useParams();

    // In a real application, you would fetch user data here using the userId
    // For now, we'll use a placeholder
    const user = {
        id: userId,
        displayName: `User ${userId}`,
        email: `user${userId}@example.com`,
        studioName: `Studio ${userId}`,
        roles: ['admin']
    };

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
                    <p><strong>Name:</strong> {user.displayName}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>ID:</strong> {user.id}</p>
                </div>
                <div className="card">
                    <h2>Studio Information</h2>
                    <p><strong>Studio Name:</strong> {user.studioName}</p>
                    <p><strong>Roles:</strong> {user.roles.join(', ')}</p>
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
