import { useEffect, useState } from 'react';
import { isAdmin } from '../services/auth';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

function AdminDashboard() {
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    (async () => {
        try {
            const result = await isAdmin();
            setIsUserAdmin(result);
            result
                ? toast.success('Welcome Admin 🎉')
                : toast.error('You do not have admin access');
        } catch (err) {
            toast.error("Error verifying admin access");
        }
    })();
  }, []);

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Admin Dashboard</h1>

      {isUserAdmin ? (
        <>
        <div className="alert alert-success">
            Here are your admin controls...
        </div>

        <div className="d-grid gap-2 d-md-block">
         <Link to="/leave-requests" className="btn btn-outline-primary me-2">
             Manage Leave Requests
         </Link>
         <Link to="/employees" className="btn btn-outline-primary">
            Manage Employees
         </Link>
         </div>
        </>
      ) : (
        <div className="alert alert-danger">
            You dont have permission to view this page.
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;