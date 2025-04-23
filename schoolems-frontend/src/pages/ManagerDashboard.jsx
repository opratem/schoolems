import { useEffect, useState } from 'react';
import { isManager } from '../services/auth';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

function ManagerDashboard() {
    const [isUserManager, setIsUserManager] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const result = await isManager();
                setIsUserManager(result);
                if (result) {
                    toast.success("Welcome Manager!");
                }
            } catch (err) {
                toast.error("Failed to determine manager access");
            }
        })();
    },[]);

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Manager Dashboard</h1>
            {isUserManager ? (
                <>
                    <div className="alert alert-info">
                        Welcome, Manager! You can view and approve leave requests.
                    </div>
                     <Link to="/leave-requests" className="btn btn-outline-primary mt-3">
                         View & Approve Leave Requests
                     </Link>
                </>
            ) : (
                <div className="alert alert-danger">
                    You do not have permission to view this Page.
                </div>
            )}
           </div>
        );
 }

export default ManagerDashboard;