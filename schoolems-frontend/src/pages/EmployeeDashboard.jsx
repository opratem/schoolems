import { useEffect, useState } from 'react';
import { getCurrentUserRole } from '../services/auth';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

function EmployeeDashboard() {
    const [isUserEmployee, setIsUserEmployee] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const role = await getCurrentUserRole();
                setIsUserEmployee(role?.toUpperCase() === 'EMPLOYEE');
            } catch (err) {
                toast.error("Failed to load employee dashboard");
            }
        }) ();
    }, []);

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Employee Dashboard</h1>
            {isUserEmployee ? (
                <>
                    <div className="alert alert-info">
                        Welcome, Employee! You can manage your leave requests.
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                    <Link to= "/leave-requests" className="btn btn-outline-primary">
                       My Leave Requests
                    </Link>
                    <Link to="/leave-requests/new" className="btn btn-success">
                        New Leave Request
                    </Link>
                    </div>
                </>
            ) : (
                <div className="alert alert-danger">
                    You do not have permission to view this page.
                </div>
            )}
        </div>
    );
}

export default EmployeeDashboard;