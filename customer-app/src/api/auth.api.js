import api from './axios';

export const authApi = {
  guestLogin: async (sessionId = null, deviceInfo = null) => {
    const res = await api.post('/customer/auth/guest', {
      session_id: sessionId,
      device_info: deviceInfo,
    });
    return res.data;
  },

  signup: async (userData) => {
    const res = await api.post('/customer/auth/signup', userData);
    return res.data;
  },

  login: async (credentials) => {
    const res = await api.post('/customer/auth/login', credentials);
    return res.data;
  },

  refreshToken: async (refreshToken) => {
    const res = await api.post('/customer/auth/refresh', { refresh_token: refreshToken });
    return res.data;
  },

  logout: async () => {
    const res = await api.post('/customer/auth/logout');
    return res.data;
  },

  getStatus: async () => {
    const res = await api.get('/customer/status');
    return res.data;
  },

  forgotPassword: async (email) => {
    const res = await api.post('/customer/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (data) => {
    const res = await api.post('/customer/auth/reset-password', data);
    return res.data;
  },

  verifyEmail: async (token) => {
    const res = await api.post('/customer/auth/verify-email', null, { params: { token } });
    return res.data;
  },
};
