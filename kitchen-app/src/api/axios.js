import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kitchen_access_token') || localStorage.getItem('kitchen_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If request payload is FormData (e.g. image upload), delete Content-Type so browser sets boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('kitchen_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post('/api/v1/kitchen/auth/refresh', { refresh_token: refreshToken });
          const { access_token, refresh_token: newRefresh } = res.data;
          localStorage.setItem('kitchen_access_token', access_token);
          if (newRefresh) localStorage.setItem('kitchen_refresh_token', newRefresh);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('kitchen_access_token');
          localStorage.removeItem('kitchen_refresh_token');
          localStorage.removeItem('kitchen_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
