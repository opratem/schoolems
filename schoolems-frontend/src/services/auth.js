import { api } from './api'; // Import your axios instance

// Dev Role Switcher (for testing) - Only in development
const getDevelopmentRole = () => {
  if (process.env.NODE_ENV === 'development') {
    return localStorage.getItem('userRole');
  }
  return null;
};

// Fetch REAL role from backend
export async function getCurrentUserRole() {
  const devRole = getDevelopmentRole();
  if (devRole) return devRole;

  try {
    const response = await api.get('/auth/me'); // Using the axios instance
    const userData = response.data;
    localStorage.setItem('role', userData.role);
    return userData.role;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}

export async function isAdmin() {
  const role = await getCurrentUserRole();
  return role === 'ADMIN';
}

export async function logout() {
  try {
    const token = localStorage.getItem('token');

    // Clear frontend storage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userRole');

    // Call backend logout if token exists
    if (token) {
      await api.post('/auth/logout', null, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  } catch (error) {
    console.error('Logout error (proceeding anyway):', error);
    // Continue with frontend cleanup even if backend logout fails
  }
  window.location.href = '/login'; // Redirect to login page
}