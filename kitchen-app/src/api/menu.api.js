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

  /**
   * Upload a menu item image to Cloudinary via the SmartServe backend.
   *
   * SECURITY:
   *   - The file is sent to the SmartServe backend as multipart/form-data.
   *   - The backend (not the frontend) communicates with Cloudinary.
   *   - No Cloudinary API secret is present in this file or any frontend code.
   *
   * @param {File} file - A JPG, PNG, or WEBP File object from <input type="file">.
   * @returns {Promise<{success: boolean, data: {image_url: string, image_public_id: string}}>}
   */
  uploadMenuImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('image', file);
    const res = await api.post('/kitchen/menu/upload-image', formData);
    return res.data;
  },

  // Legacy alias — kept for backward compatibility
  uploadImage: async (file) => {
    return menuApi.uploadMenuImage(file);
  },
};

export default menuApi;
