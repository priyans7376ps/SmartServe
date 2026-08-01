import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('admin_user') || 'null'),
  token: localStorage.getItem('admin_access_token') || null,
  isAuthenticated: !!(localStorage.getItem('admin_access_token') || localStorage.getItem('access_token')),
  role: JSON.parse(localStorage.getItem('admin_user') || '{}')?.role || null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user } = response.data;
      
      // Verify admin/manager role
      const userRole = user?.role?.toLowerCase();
      if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'super_admin') {
        throw new Error('Access denied. Administrator or Manager credentials required.');
      }

      localStorage.setItem('admin_access_token', access_token);
      localStorage.setItem('access_token', access_token);
      if (refresh_token) {
        localStorage.setItem('admin_refresh_token', refresh_token);
        localStorage.setItem('refresh_token', refresh_token);
      }
      localStorage.setItem('admin_user', JSON.stringify(user));

      set({
        user,
        token: access_token,
        isAuthenticated: true,
        role: userRole,
        loading: false,
        error: null,
      });

      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Login failed. Please check credentials.';
      set({ loading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  logout: () => {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      role: null,
      loading: false,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('admin_access_token') || localStorage.getItem('access_token');
    if (!token) {
      set({ isAuthenticated: false, user: null, role: null });
      return false;
    }
    try {
      const response = await api.get('/auth/me');
      const user = response.data;
      localStorage.setItem('admin_user', JSON.stringify(user));
      set({
        user,
        isAuthenticated: true,
        role: user?.role?.toLowerCase(),
      });
      return true;
    } catch (err) {
      get().logout();
      return false;
    }
  },
}));
