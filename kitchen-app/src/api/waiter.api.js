import api from './axios';

export const waiterApi = {
  /**
   * Fetch kitchen waiter assistance requests
   * @param {string} status - Filter: 'pending', 'acknowledged', 'resolved', or 'all'
   */
  getWaiterRequests: async (status = 'pending') => {
    const res = await api.get('/kitchen/waiter-requests', {
      params: { status }
    });
    return res.data;
  },

  /**
   * Update status of a waiter request (e.g. 'acknowledged', 'resolved')
   * @param {string} requestId
   * @param {string} status
   */
  updateRequestStatus: async (requestId, status) => {
    const res = await api.patch(`/kitchen/waiter-requests/${requestId}/status`, {
      status
    });
    return res.data;
  }
};
