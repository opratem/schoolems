import axios from 'axios';
import { getToken, setToken, removeToken } from '../utils/token';
import { toast } from 'react-toastify';

// Create Axios instance
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// Request Interceptor: Inject token
api.interceptors.request.use(config => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

//Global 401 handler
api.interceptors.response.use(
    res => res,
    err=> {
        if (err.response?.status === 401) {
            removeToken();
            toast.error("Session expire. Please login again");

            if(window.location.pathname !== '/login') {
                setTimeout(() => window.location.href= '/login', 1500);
            }
        }
        return Promise.reject(err);
        }
 );

// Auth functions
export const login = async (email, password) => {
  try {
    const { data } = await api.post('auth/login', { email, password });
    const { token, role } = data;
    setToken(token);
    localStorage.setItem('role',role);
    return role;
  } catch (error) {
    throw error;
  }
};

// Employee functions
export const fetchEmployees = async () => {
  try {
    const res = await api.get('/employees');
    return res.data;
  } catch (error) {
    console.error("Error Fetching Employees:", error);
    throw error;
  }
};

export const fetchEmployee = async (id) => {
  try {
    const res = await api.get(`/employees/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error Fetching Employee:", error);
    throw error;
  }
};

export const saveEmployee = async (employeeData) => {
  try {
    const res = await api.post('/employees', employeeData);
    return res.data;
  } catch (error) {
    console.error("Error Saving Employee:", error);
    throw error;
  }
};

export const updateEmployee = async (id, employeeData) => {
  try {
    const res = await api.put(`/employees/${id}`, employeeData);
    return res.data;
  } catch (error) {
    console.error("Error Updating Employee:", error);
    throw error;
  }
};

export const deleteEmployee = async (id) => {
  try {
    const res= await api.delete(`/employees/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error Deleting Employee:", error);
    throw error;
  }
};

//Leave Requests
export const createLeaveRequest = async (data) => {
    const res = await api.post('/leave', data);
    return res.data;
};

export const fetchAllLeaveRequests = async () => {
    const res = await api.get('/leave');
    return res.data;
};

export const fetchMyLeaveRequests = async () => {
    const res = await api.get('leave/my');
    return res.data;
};

//export const submitLeaveRequest = async (form) => {const res= await api.post('/leave', form);return res.data;};

export const updateLeaveStatus = async (id, status) => {
    const res = await api.put(`/leave/${id}/status?status=${status}`);
    return res.data
};

export const deleteLeaveRequest = async(id) => {
    const res = await api.delete(`/leave/${id}`);
    return res.data;
};


export default api;
