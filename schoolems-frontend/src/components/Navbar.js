import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import { getToken, removeToken } from '../utils/token';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const { role, loading } = useAuth();
    const token = getToken();

    const handleLogout = () => {
        removeToken();
        navigate('/');
        window.location.reload();
    };

    if (loading) return null;

    return(
        <nav className="navbar">
           <div className="nav-links">

           {/* Always show Home/Login */}
           {!token && (
             <Link to="/">Login</Link>
           )}

           {/* Employee routes */}
           {token && role === 'employee' && (
            <>
                <Link to="/employees">Employees</Link>
                <Link to="/employees/add">Add Employee</Link>
            </>
        )}
            {/* Admin routes */}
            {token && role ==='admin' && (
                <Link to="/admin-dashboard">Admin Dashboard</Link>
            )}

            {/* Logout shown only when logged in */}
            {token && (
                <button onClick={handleLogout} className="admin-action">
                    Logout
                </button>
            )}
        </div>
    </nav>
    );
};

export default Navbar;