import api from './axios';

export const categoryApi = {
  getCategories: async (restaurantId = null) => {
    const res = await api.get('/categories/', { params: { restaurant_id: restaurantId } });
    return res.data;
  },

  createCategory: async (categoryData) => {
    const res = await api.post('/kitchen/categories', categoryData);
    return res.data;
  },

  updateCategory: async (categoryId, categoryData) => {
    const res = await api.patch(`/kitchen/categories/${categoryId}`, categoryData);
    return res.data;
  },

  deleteCategory: async (categoryId) => {
    const res = await api.delete(`/kitchen/categories/${categoryId}`);
    return res.data;
  },
};
