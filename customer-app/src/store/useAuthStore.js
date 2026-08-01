import { create } from 'zustand';
import { authApi } from '../api/auth.api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  accessToken: localStorage.getItem('access_token') || null,
  refreshToken: localStorage.getItem('refresh_token') || null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  error: null,

  setAuth: (user, accessToken, refreshToken) => {
    if (accessToken) localStorage.setItem('access_token', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    if (user) localStorage.setItem('user', JSON.stringify(user));

    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: !!accessToken,
      error: null,
    });
  },

  guestLogin: async (sessionId = null) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.guestLogin(sessionId);
      const { access_token, session_id } = data;
      const guestUser = {
        id: session_id,
        full_name: 'Guest Customer',
        email: `${session_id}@guest.smartserve`,
        role: 'customer',
        is_guest: true,
      };
      get().setAuth(guestUser, access_token, null);
      set({ isLoading: false });
      return guestUser;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Guest session initialization failed.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login({ email, password });
      const { access_token, refresh_token, user } = data;
      get().setAuth(user, access_token, refresh_token);
      set({ isLoading: false });
      return user;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check credentials.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  signup: async (fullName, email, password, phone = null) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.signup({
        full_name: fullName,
        email,
        password,
        phone,
        role: 'customer',
      });
      const { access_token, refresh_token, user } = data;
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
    try {
      authApi.logout();
    } catch (e) {
      // ignore
    }
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

  updateUser: (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
}));
