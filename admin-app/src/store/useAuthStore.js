import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set, get) => ({
  // Initialise from admin_access_token ONLY — no cross-panel fallback
  user: JSON.parse(localStorage.getItem('admin_user') || 'null'),
  token: localStorage.getItem('admin_access_token') || null,
  isAuthenticated: !!localStorage.getItem('admin_access_token'),
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

      // Save admin keys ONLY — no cross-panel contamination
      localStorage.setItem('admin_access_token', access_token);
      if (refresh_token) {
        localStorage.setItem('admin_refresh_token', refresh_token);
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
    // Remove ONLY admin keys — never touch customer/kitchen keys
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
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
    const token = localStorage.getItem('admin_access_token');

    // No token at all → not authenticated
    if (!token) {
      set({ isAuthenticated: false, user: null, role: null, loading: false });
      return false;
    }

    // Optimistically restore auth from localStorage so the UI doesn't flash
    // the login page. We then verify with the backend silently.
    const storedUser = JSON.parse(localStorage.getItem('admin_user') || 'null');
    if (storedUser) {
      set({
        user: storedUser,
        token,
        isAuthenticated: true,
        role: storedUser?.role?.toLowerCase() || null,
        loading: false,
      });
    }

    // Background verify with /auth/me to refresh user data
    // On any network/server failure we KEEP the locally restored session
    // rather than aggressively logging the admin out.
    try {
      set({ loading: true });
      const response = await api.get('/auth/me');
      const user = response.data;
      const userRole = user?.role?.toLowerCase();

      // Reject non-admin roles even on successful /auth/me
      if (userRole !== 'admin' && userRole !== 'manager' && userRole !== 'super_admin') {
        get().logout();
        return false;
      }

      localStorage.setItem('admin_user', JSON.stringify(user));
      set({
        user,
        token,
        isAuthenticated: true,
        role: userRole,
        loading: false,
      });
      return true;
    } catch (err) {
      // If /auth/me returns 401 the interceptor will try refresh.
      // If refresh also fails it redirects to /login.
      // For any OTHER error (network timeout, 5xx) keep the session alive.
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        // Token genuinely invalid and refresh failed (interceptor already ran)
        get().logout();
        return false;
      }
      // Transient failure — stay authenticated with cached state
      set({ loading: false });
      return true;
    }
  },
}));

