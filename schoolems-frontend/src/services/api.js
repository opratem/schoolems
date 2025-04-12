// services/api.js
import axios from 'axios';
import { getToken } from '../utils/token';

// Create Axios instance
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// Add a request interceptor to inject token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth functions
export const login = async (email, password) => {
  try {
    const response = await api.post('auth/login', { email, password });
    return response.data.token;
  } catch (error) {
    console.error("Login error:", error.response?.data);
    throw error;
  }
};

// Employee functions
export const fetchEmployees = async () => {
  try {
    const response = await api.get('/employees');
    return response.data;
  } catch (error) {
    console.error("Error Fetching Employees:", error);
    throw error;
  }
};

export const fetchEmployee = async (id) => {
  try {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error Fetching Employee:", error);
    throw error;
  }
};

export const saveEmployee = async (employeeData) => {
  try {
    const response = await api.post('/employees', employeeData);
    return response.data;
  } catch (error) {
    console.error("Error Saving Employee:", error);
    throw error;
  }
};

export const updateEmployee = async (id, employeeData) => {
  try {
    const response = await api.put(`/employees/${id}`, employeeData);
    return response.data;
  } catch (error) {
    console.error("Error Updating Employee:", error);
    throw error;
  }
};

export const deleteEmployee = async (id) => {
  try {
    await api.delete(`/employees/${id}`);
  } catch (error) {
    console.error("Error Deleting Employee:", error);
    throw error;
  }
};

export default api;
