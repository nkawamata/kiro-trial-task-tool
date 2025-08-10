import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to set auth token (will be called from components with OIDC context)
export const setAuthToken = (token: string) => {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Function to clear auth token
export const clearAuthToken = () => {
  delete apiClient.defaults.headers.common['Authorization'];
};

// Request interceptor to ensure auth token is always included
apiClient.interceptors.request.use(
  (config) => {
    // If no auth header but we have a default one, use it
    if (!config.headers?.Authorization && apiClient.defaults.headers.common['Authorization']) {
      config.headers = config.headers || {};
      config.headers.Authorization = apiClient.defaults.headers.common['Authorization'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token on unauthorized
      clearAuthToken();
      // The OIDC context will handle redirect to login
    }
    return Promise.reject(error);
  }
);