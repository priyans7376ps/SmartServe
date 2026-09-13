import api from './axios';

export const extractCategories = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.categories)) return data.categories;
  return [];
};

export const categoryApi = {
  getCategories: async (restaurantId = null) => {
    const params = restaurantId ? { restaurant_id: restaurantId } : {};
    try {
      const res = await api.get('/categories/', { params });
      return extractCategories(res.data);
    } catch (err) {
      const fallbackRes = await api.get('/kitchen/categories', { params });
      return extractCategories(fallbackRes.data);
    }
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
