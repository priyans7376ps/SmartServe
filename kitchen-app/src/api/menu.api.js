import api from './axios';

export const menuApi = {
  getMenuItems: async (params = {}) => {
    const res = await api.get('/menu/', { params });
    return res.data;
  },

  createMenuItem: async (itemData) => {
    const res = await api.post('/kitchen/menu', itemData);
    return res.data;
  },

  updateMenuItem: async (itemId, itemData) => {
    const res = await api.patch(`/kitchen/menu/${itemId}`, itemData);
    return res.data;
  },

  deleteMenuItem: async (itemId) => {
    const res = await api.delete(`/kitchen/menu/${itemId}`);
    return res.data;
  },
};
