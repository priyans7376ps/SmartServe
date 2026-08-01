import api from './axios';

export const kitchenApi = {
  login: async (credentials) => {
    const res = await api.post('/kitchen/auth/login', credentials);
    return res.data;
  },

  logout: async () => {
    const res = await api.post('/kitchen/auth/logout');
    return res.data;
  },

  getStatus: async () => {
    const res = await api.get('/kitchen/status');
    return res.data;
  },

  getOrders: async (params = {}) => {
    const res = await api.get('/kitchen/orders', { params });
    return res.data;
  },

  getOrderDetails: async (orderId) => {
    const res = await api.get(`/kitchen/orders/${orderId}`);
    return res.data;
  },

  acceptOrder: async (orderId, notes = null) => {
    const res = await api.post(`/kitchen/orders/${orderId}/accept`, null, { params: { notes } });
    return res.data;
  },

  rejectOrder: async (orderId, reason = 'Out of stock') => {
    const res = await api.post(`/kitchen/orders/${orderId}/reject`, null, { params: { reason } });
    return res.data;
  },

  markPreparing: async (orderId, notes = null) => {
    const res = await api.post(`/kitchen/orders/${orderId}/preparing`, null, { params: { notes } });
    return res.data;
  },

  markReady: async (orderId, notes = null) => {
    const res = await api.post(`/kitchen/orders/${orderId}/ready`, null, { params: { notes } });
    return res.data;
  },

  markCompleted: async (orderId, notes = null) => {
    const res = await api.post(`/kitchen/orders/${orderId}/completed`, null, { params: { notes } });
    return res.data;
  },

  cancelOrder: async (orderId, reason = 'Cancelled by kitchen') => {
    const res = await api.post(`/kitchen/orders/${orderId}/cancel`, null, { params: { reason } });
    return res.data;
  },
};
