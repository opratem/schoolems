import api from './api';
import { getDevelopmentRole, setToken, removeToken, getToken } from '../utils/token';

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  const { token, role } = response.data;
  setToken(token);
  localStorage.setItem('role', role);
  return { token, role };
};

export const register = async (data) => {
 return await api.post('/auth/register', data);
};

export const getCurrentUserRole = async () => {
  try {
    const response = await api.get('/auth/me'); // Using the axios instance
    const role = response.data.role?.toUpperCase();
    localStorage.setItem('role', role);
    return role;
  } catch (error) {
    console.error('Error fetching user role:', error);
    removeToken();
    return null;
  }
};

export const isAdmin= async()  => {
  const role = await getCurrentUserRole();
  return role === 'ADMIN';
};

export const isManager = async () => {
    const role = await getCurrentUserRole();
    return role === 'MANAGER';
};

export const logout = async () => {
  try {
    await api.post('/auth/logout')
  } catch (error) {
    console.warn('Logout failed:', error);
  } finally{
    removeToken();
    localStorage.removeItem('role');
    window.location.href = '/login'; // Redirect to login page
    }
};