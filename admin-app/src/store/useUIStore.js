import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  darkMode: localStorage.getItem('admin_theme') === 'dark',
  sidebarOpen: true,
  toasts: [],
  notifications: [
    { id: '1', title: 'New Complaint Received', message: 'Table 4 reported slow service.', time: '10m ago', type: 'warning', unread: true },
    { id: '2', title: 'Payment Exception', message: 'Transaction TXN-9982 failed.', time: '25m ago', type: 'error', unread: true },
    { id: '3', title: 'Low Stock Alert', message: 'Truffle Oil stock is running low.', time: '1h ago', type: 'info', unread: false },
    { id: '4', title: 'New Staff Registered', message: 'Kitchen Chef Alex onboarded.', time: '2h ago', type: 'success', unread: false },
  ],

  toggleDarkMode: () => {
    const next = !get().darkMode;
    localStorage.setItem('admin_theme', next ? 'dark' : 'light');
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ darkMode: next });
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  addToast: (message, type = 'info', duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),

  markNotificationAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => (n.id === id ? { ...n, unread: false } : n)),
  })),

  clearNotifications: () => set({ notifications: [] }),
}));
