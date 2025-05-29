import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  withCredentials: true, // Include cookies in requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  let token: string | null = null;
  try {
    // Prefer localStorage, fallback to sessionStorage if needed in future
    if (typeof window !== "undefined") {
      token = localStorage.getItem("token") || null;
    }
  } catch (e) {
    // Fail gracefully if storage is unavailable
    console.error("Error accessing localStorage:", e);
    token = null;
  }
  if (token) {
    config.headers = config.headers || {};
    // Prevent double "Bearer " prefix
    if (!String(token).startsWith("Bearer ")) {
      config.headers["Authorization"] = `Bearer ${token}`;
    } else {
      config.headers["Authorization"] = token;
    }
  }
  return config;
});

// Add global response error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error for debugging
    console.error("API Error:", error.response || error.message || error);

    // Handle authentication errors
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.log("Authentication error detected, clearing session");

      // Clear user data and redirect
      localStorage.clear();
      sessionStorage.clear();

      // Optionally store a session expired message for the login page
      localStorage.setItem("sessionExpired", "true");

      // Only redirect if we're not already on the login page to prevent redirect loops
      if (!window.location.pathname.includes('/login')) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
