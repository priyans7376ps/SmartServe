import api from './axios';

export const dashboardApi = {
  getStats: async (restaurantId = null) => {
    const res = await api.get('/kitchen/dashboard/stats', {
      params: { restaurant_id: restaurantId },
    });
    return res.data;
  },

  getPerformance: async (restaurantId = null) => {
    const res = await api.get('/kitchen/dashboard/performance', {
      params: { restaurant_id: restaurantId },
    });
    return res.data;
  },
};
