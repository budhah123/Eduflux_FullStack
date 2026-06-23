import { apiClient } from './apiClient';

export const documentApi = {
  // GET /documents/user/my-uploads
  getMyUploads: async (page = 1, limit = 12, status) => {
    let url = `/documents/user/my-uploads?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    return apiClient.get(url);
  },

  // POST /documents/upload (FormData)
  uploadDocument: async (formData) => {
    return apiClient.post('/documents/upload', formData);
  },

  // PATCH /documents/:id
  updateDocument: async (id, data) => {
    return apiClient.patch(`/documents/${id}`, JSON.stringify(data));
  },

  // DELETE /documents/:id
  deleteDocument: async (id) => {
    return apiClient.delete(`/documents/${id}`);
  },

  // GET /documents/:id/download
  getDownloadUrl: async (id) => {
    return apiClient.get(`/documents/${id}/download`);
  },
};
