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
    <div>
      <h1>Admin Dashboard</h1>
      {isUserAdmin ? (
        <div>Welcome, Admin! Here are your admin controls...</div>
      ) : (
        <div>You don't have permission to view this page.</div>
      )}
    </div>
  );
}

export default AdminDashboard;