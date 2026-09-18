import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL + '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Admin Bearer token
// Strict: reads only admin_access_token — no cross-panel fallback
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 & token refresh
// Strict: reads/writes only admin_* keys — no cross-panel contamination
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('admin_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(API_BASE_URL + '/api/v1/auth/refresh', {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: newRefresh } = res.data;
          localStorage.setItem('admin_access_token', access_token);
          if (newRefresh) {
            localStorage.setItem('admin_refresh_token', newRefresh);
          }
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshErr) {
          // Refresh failed — clear admin keys and redirect to login
          localStorage.removeItem('admin_access_token');
          localStorage.removeItem('admin_refresh_token');
          localStorage.removeItem('admin_user');
          window.location.href = '/login';
        }
      } else {
        // No refresh token available — clear admin session
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;


