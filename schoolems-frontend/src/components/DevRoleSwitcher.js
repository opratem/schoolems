// src/components/DevRoleSwitcher.js
import React from 'react';

function DevRoleSwitcher() {
    const switchRole = (role) => {
        localStorage.setItem('userRole', role); // Must match your dev-only auth mock
        window.location.reload();
    };

    return (
        <div className="dev-role-switcher d-flex gap-2 my-3">
            <button className="btn btn-outline-secondary" onClick={() => switchRole('EMPLOYEE')}>
                Set as Employee
            </button>
            <button className="btn btn-outline-secondary" onClick={() => switchRole('ADMIN')}>
                Set as Admin
            </button>
            <button className="btn btn-outline-danger" onClick={() => localStorage.clear()}>
                Clear Role
            </button>
        </div>
    );
}

export default DevRoleSwitcher;
