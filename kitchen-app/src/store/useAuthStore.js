import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('kitchen_user') || 'null'),
  token: localStorage.getItem('kitchen_token') || null,
  isAuthenticated: !!localStorage.getItem('kitchen_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;

      // Verify role is kitchen or admin
      const role = user?.role?.toLowerCase();
      if (role !== 'kitchen' && role !== 'admin') {
        throw new Error('Access denied. Kitchen staff or Admin privileges required.');
      }

      localStorage.setItem('kitchen_token', access_token);
      localStorage.setItem('kitchen_user', JSON.stringify(user));

      set({
        token: access_token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return user;
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Login failed. Invalid credentials.';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem('kitchen_token');
    localStorage.removeItem('kitchen_user');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('kitchen_token');
    if (!token) {
      get().logout();
      return;
    }

    try {
      const response = await api.get('/kitchen/status');
      if (response.data?.user) {
        const user = response.data.user;
        localStorage.setItem('kitchen_user', JSON.stringify(user));
        set({ user, isAuthenticated: true });
      }
    } catch (err) {
      // If endpoint fails, fall back to me endpoint
      try {
        const meRes = await api.get('/auth/me');
        const user = meRes.data;
        const role = user?.role?.toLowerCase();
        if (role === 'kitchen' || role === 'admin') {
          localStorage.setItem('kitchen_user', JSON.stringify(user));
          set({ user, isAuthenticated: true });
        } else {
          get().logout();
        }
      } catch (e) {
        get().logout();
      }
    }
  },

  clearError: () => set({ error: null }),
}));
