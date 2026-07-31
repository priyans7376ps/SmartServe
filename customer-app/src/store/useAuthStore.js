import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  accessToken: localStorage.getItem('access_token') || null,
  refreshToken: localStorage.getItem('refresh_token') || null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  error: null,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    if (user) localStorage.setItem('user', JSON.stringify(user));

    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      error: null,
    });
  },

  guestLogin: async (tableId = null) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/guest', { table_id: tableId });
      const { access_token, user } = res.data;
      get().setAuth(user, access_token, null);
      set({ isLoading: false });
      return user;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Guest login failed.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user } = res.data;
      get().setAuth(user, access_token, refresh_token);
      set({ isLoading: false });
      return user;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  signup: async (full_name, email, password, phone = null) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/signup', {
        full_name,
        email,
        password,
        phone,
        role: 'customer',
      });
      const { access_token, refresh_token, user } = res.data;
      get().setAuth(user, access_token, refresh_token);
      set({ isLoading: false });
      return user;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Signup failed.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },
}));
