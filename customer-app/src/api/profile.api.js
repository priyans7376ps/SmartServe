import api from './axios';

export const profileApi = {
  getProfile: async () => {
    const res = await api.get('/customer/profile');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.patch('/customer/profile', data);
    return res.data;
  },

  changePassword: async (data) => {
    const res = await api.post('/customer/profile/change-password', data);
    return res.data;
  },

  deleteAccount: async () => {
    const res = await api.delete('/customer/profile');
    return res.data;
  },

  uploadAvatar: async () => {
    const res = await api.post('/customer/profile/image');
    return res.data;
  },
};
