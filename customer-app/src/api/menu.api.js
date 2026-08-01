import api from './axios';

export const menuApi = {
  getCategories: async (restaurantId = null) => {
    const res = await api.get('/customer/categories', {
      params: { restaurant_id: restaurantId },
    });
    return res.data;
  },

  getMenuItems: async (params = {}) => {
    const res = await api.get('/customer/menu', { params });
    return res.data;
  },

  searchMenu: async (query, page = 1, pageSize = 20) => {
    const res = await api.get('/customer/menu/search', {
      params: { q: query, page, page_size: pageSize },
    });
    return res.data;
  },

  getSpecials: async () => {
    const res = await api.get('/customer/menu/specials');
    return res.data;
  },

  getPopular: async () => {
    const res = await api.get('/customer/menu/popular');
    return res.data;
  },

  getRecommended: async () => {
    const res = await api.get('/customer/menu/recommended');
    return res.data;
  },

  getMenuItemDetails: async (itemId) => {
    const res = await api.get(`/customer/menu/${itemId}`);
    return res.data;
  },
};
