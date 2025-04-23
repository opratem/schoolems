// src/components/Navbar.js
import React from 'react';
import { Link } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { user, role, loading, logout } = useAuth();

  if (loading) return null;

  return (
    <nav className="navbar d-flex justify-content-between px-4 py-2 bg-light border-bottom">
      <div className="nav-links d-flex gap-3 align-items-center">
        {/* Show role badge */}
        {user && (
          <span className="badge bg-secondary text-uppercase">
            {role}
          </span>
        )}

        {/* Routes */}
        {role === 'EMPLOYEE' && (
          <>
            <Link to="/employees">Employees</Link>
            <Link to="/employees/add">Add Employee</Link>
          </>
        )}
        {role === 'ADMIN' && <Link to="/admin-dashboard">Admin Dashboard</Link>}
        {role === 'MANAGER' && <Link to="/manager-dashboard">Manager Dashboard</Link>}
      </div>

      {/* Auth Buttons */}
      <div>
        {user ? (
          <button onClick={logout} className="btn btn-outline-danger">Logout</button>
        ) : (
          <Link to="/" className="btn btn-outline-primary">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
