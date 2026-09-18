import api from './axios';

export const waiterApi = {
  /**
   * Request waiter assistance to a table
   * @param {Object} payload - { table_number, notes, request_type }
   */
  callWaiter: async (payload) => {
    const response = await api.post('/customer/call-waiter', payload);
    return response.data;
  },

  /**
   * Check status of a waiter request
   * @param {string} requestId
   */
  getCallStatus: async (requestId) => {
    const response = await api.get(`/customer/waiter-status/${requestId}`);
    return response.data;
  },
};
