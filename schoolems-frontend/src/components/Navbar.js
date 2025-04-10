// src/components/Navbar.js
import { Link, useLocation } from "react-router-dom";
import { getCurrentUserRole, logout } from "../services/auth";
import { useEffect, useState } from 'react';

function Navbar() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    (async () => {
      setRole(await getCurrentUserRole());
    })();
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <nav className="navbar">
      <div className="nav-links">
        <Link to="/employees">Employees</Link>
        {role === 'ADMIN' && <Link to="/employees/new">Add Employee</Link>}
      </div>
      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>
    </nav>
  );
}

export default Navbar;