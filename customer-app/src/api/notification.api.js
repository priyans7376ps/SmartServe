import api from './axios';

export const notificationApi = {
  getNotifications: async (unreadOnly = false) => {
    const res = await api.get('/customer/notifications', { params: { unread_only: unreadOnly } });
    return res.data;
  },

  markAsRead: async (notificationId) => {
    const res = await api.patch(`/customer/notifications/${notificationId}/read`);
    return res.data;
  },

  deleteNotification: async (notificationId) => {
    const res = await api.delete(`/customer/notifications/${notificationId}`);
    return res.data;
  },
};
