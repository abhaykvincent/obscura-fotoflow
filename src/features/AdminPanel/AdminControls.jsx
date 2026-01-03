import React, { useCallback } from 'react';
import './AdminControls.scss';

const ROLES_TABS = {
    ADMIN: 'admin',
    ANALYTICS: 'analytics',
    DEVELOPER: 'developer',
    SALES: 'sales',
    SUPPORT: 'support',
    MARKETING: 'marketing',
    VIEWER: 'viewer',
};

function AdminControls({ selectedRole, onRoleChange }) {
    const handleRoleClick = useCallback((role) => {
        onRoleChange(role);
    }, [onRoleChange]);

    return (
        <div className="admin-controls-header">
            <div className="view-control">
                <div className="filter-controls">
                    <div className="control-wrap">
                        <div className="label">Roles</div>
                        <div className="controls">
                            {Object.values(ROLES_TABS).map((role) => (
                                <div
                                    key={role}
                                    className={`control ctrl-${role} ${selectedRole === role ? 'active' : ''}`}
                                    onClick={() => handleRoleClick(role)}
                                    role="button"
                                    tabIndex={0}
                                >
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminControls;
