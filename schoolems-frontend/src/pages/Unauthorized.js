import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
    return (
        <div className="container text-center mt-5" style= {{ padding: "2rem"}}>
            <h1 className="text-danger">403 - Unauthorized</h1>
            <p>You do not have permission to view this page.</p>
            <Link to="/" className="btn btn-outline-primary mt-3">
                Go Back to Login
            </Link>
        </div>
    );
};

export default Unauthorized;