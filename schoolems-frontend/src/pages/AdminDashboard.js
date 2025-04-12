import { useEffect, useState } from 'react';
import { isAdmin } from '../services/auth';

function AdminDashboard() {
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      setIsUserAdmin(await isAdmin());
    })();
  }, []);

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Admin Dashboard</h1>
      {isUserAdmin ? (
        <div className="alert alert-success">
        Welcome, Admin! Here are your admin controls...
        </div>
      ) : (
        <div className="alert alert-danger">
        You dont have permission to view this page.
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;