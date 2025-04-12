import api from './api';
import { getDevelopmentRole, setToken, removeToken, getToken } from '../utils/token';

export const login = async (credentials) => {
  const res = await api.post('/auth/login', credentials);
  const token = res.data.token;
  setToken(token);
  return token;
};

export const register = async (data) => {
  const res = await api.post('/auth/register', data);
  return res.data;
};

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
};

export const isAdmin= async()  => {
  const role = await getCurrentUserRole();
  return role?.toUpperCase() === 'ADMIN';
}

export const logout = async () => {
    const token = getToken();

  try {
    if (token) {
    await api.post('/auth/logout', null, {
        headers: { Authorization: `Bearer ${token}` },
    });
   }
  } catch (error){
    console.warn('Backend logout failed. Proceeding with frontend cleanup.');
  }
    removeToken();
    // Clear frontend storage
    localStorage.removeItem('role');
    localStorage.removeItem('userRole');

    window.location.href = '/login'; // Redirect to login page
};