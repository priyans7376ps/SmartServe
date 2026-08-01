import api from './axios';

export const orderApi = {
  getCheckoutSummary: async (payload = {}) => {
    const res = await api.post('/customer/checkout/summary', payload);
    return res.data;
  },

  preparePayment: async (amount, paymentMethod = 'upi') => {
    const res = await api.post('/customer/checkout/payment-placeholder', null, {
      params: { amount, payment_method: paymentMethod },
    });
    return res.data;
  },

  placeOrder: async (orderPayload) => {
    const res = await api.post('/customer/orders', orderPayload);
    return res.data;
  },

  getOrders: async (skip = 0, limit = 20) => {
    const res = await api.get('/customer/orders', { params: { skip, limit } });
    return res.data;
  },

  getOrderHistory: async (skip = 0, limit = 20) => {
    const res = await api.get('/customer/orders/history', { params: { skip, limit } });
    return res.data;
  },

  getOrderDetails: async (orderId) => {
    const res = await api.get(`/customer/orders/${orderId}`);
    return res.data;
  },

  trackOrder: async (orderId) => {
    const res = await api.get(`/customer/orders/${orderId}/track`);
    return res.data;
  },

  cancelOrder: async (orderId, reason = '') => {
    const res = await api.post(`/customer/orders/${orderId}/cancel`, null, {
      params: { reason },
    });
    return res.data;
  },

  repeatOrder: async (orderId) => {
    const res = await api.post(`/customer/orders/${orderId}/repeat`);
    return res.data;
  },
};
