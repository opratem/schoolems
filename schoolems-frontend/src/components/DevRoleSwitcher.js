// src/components/DevRoleSwitcher.js
import React from 'react';

function DevRoleSwitcher() {
  const switchRole = (role) => {
    localStorage.setItem('userRole', role); // Match your auth system's role key
    window.location.reload();
  };

  return (
    <div className="dev-role-switcher">
      <button onClick={() => switchRole('EMPLOYEE')}>Set as Employee</button>
      <button onClick={() => switchRole('ADMIN')}>Set as Admin</button>
      <button onClick={() => localStorage.clear()}>Clear Role</button>
    </div>
  );
}

export default DevRoleSwitcher;