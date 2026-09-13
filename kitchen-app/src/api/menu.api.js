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

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'menu_items');
    // Let browser set the multipart/form-data boundary automatically
    const res = await api.post('/media/upload', formData);
    return res.data;
  },
};

export default menuApi;
