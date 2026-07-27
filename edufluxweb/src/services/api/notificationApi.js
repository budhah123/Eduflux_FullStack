import { apiClient } from './apiClient';

export const notificationApi = {
  // GET /notification?page=1&limit=10
  getNotifications: async (page = 1, limit = 10) => {
    return apiClient.get(`/notification?page=${page}&limit=${limit}`);
  },

  // GET /notification/unread-count
  getUnreadCount: async () => {
    return apiClient.get('/notification/unread-count');
  },

  // PATCH /notification/:id/read
  markAsRead: async (id) => {
    return apiClient.patch(`/notification/${id}/read`);
  },

  // PATCH /notification/read-all
  markAllAsRead: async () => {
    return apiClient.patch('/notification/read-all');
  },

  // DELETE /notification/:id
  deleteNotification: async (id) => {
    return apiClient.delete(`/notification/${id}`);
  },
};
