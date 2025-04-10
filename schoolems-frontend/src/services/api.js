import axios from "axios";

const API_URL = "http://localhost:8080/api";

// Create an axios instance with base URL
export const api = axios.create({
  baseURL: API_URL
});

// Add JWT token to requests using instance
api.interceptors.request.use((config) => {
  config.headers['Content-Type'] = 'application/json';
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized errors (e.g., redirect to login)
      window.location.href = '/login';
    }
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