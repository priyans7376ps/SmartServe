import api from './axios';

export const paymentApi = {
  createRazorpayOrder: async (orderId) => {
    const res = await api.post('/payments/create-order', { order_id: orderId });
    return res.data;
  },

  verifyPayment: async (verifyPayload) => {
    const res = await api.post('/payments/verify', verifyPayload);
    return res.data;
  },

  getInvoice: async (orderId) => {
    const res = await api.get(`/payments/invoice/${orderId}`);
    return res.data;
  },

  retryPayment: async (orderId) => {
    const res = await api.post(`/payments/retry/${orderId}`);
    return res.data;
  },
};

export default paymentApi;
