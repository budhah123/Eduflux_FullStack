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
    return apiClient.patch(`/documents/${id}`, data);
  },

  // DELETE /documents/:id
  deleteDocument: async (id) => {
    return apiClient.delete(`/documents/${id}`);
  },

  // GET /documents/:id/download
  getDownloadUrl: async (id) => {
    return apiClient.get(`/documents/${id}/download`);
  },

  // GET /documents/:id/preview-url
  getPreviewUrl: async (id) => {
    return apiClient.get(`/documents/${id}/preview-url`);
  },

  // GET /documents/public/:id
  getPublicDocument: async (id) => {
    return apiClient.get(`/documents/public/${id}`);
  },

  // GET /documents/:id
  getDocument: async (id) => {
    return apiClient.get(`/documents/${id}`);
  },

  // GET /documents/public
  getPublicDocuments: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== ''
      ) {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    return apiClient.get(
      `/documents/public${queryString ? `?${queryString}` : ''}`,
    );
  },

  // GET /documents
  getAllDocuments: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== ''
      ) {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    return apiClient.get(`/documents${queryString ? `?${queryString}` : ''}`);
  },

  // GET /admin/document
  adminGetDocuments: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== ''
      ) {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    return apiClient.get(
      `/admin/document${queryString ? `?${queryString}` : ''}`,
    );
  },

  // GET /admin/document/:id
  adminGetDocument: async (id) => {
    return apiClient.get(`/admin/document/${id}`);
  },

  // POST /admin/document/upload
  adminUploadDocument: async (formData) => {
    return apiClient.post('/admin/document/upload', formData);
  },

  // PATCH /admin/document/:id
  adminUpdateDocument: async (id, formData) => {
    return apiClient.patch(`/admin/document/${id}`, formData);
  },

  // DELETE /admin/document/:id
  adminDeleteDocument: async (id) => {
    return apiClient.delete(`/admin/document/${id}`);
  },

  // PATCH /admin/document/:id/status
  adminChangeStatus: async (id, status) => {
    return apiClient.patch(`/admin/document/${id}/status`, { status });
  },

  // POST /payment/initiate
  initiatePayment: async (data) => {
    return apiClient.post('/payment/initiate', data);
  },

  // GET /users/me/upload-progress
  getUploadProgress: async () => {
    return apiClient.get('/users/me/upload-progress');
  },

  // GET /users/me
  getCurrentUser: async () => {
    return apiClient.get('/users/me');
  },

  // POST /documents/:id/chat
  askDocumentQuestion: async (id, question) => {
    return apiClient.post(`/documents/${id}/chat`, { question });
  },

  // GET /ratings/document/:documentId
  getDocumentRatings: async (documentId, page = 1, limit = 10) => {
    return apiClient.get(
      `/ratings/document/${documentId}?page=${page}&limit=${limit}`,
    );
  },

  // POST /ratings
  submitRating: async (payload) => {
    return apiClient.post('/ratings', payload);
  },

  // DELETE /ratings/:id
  deleteRating: async (id) => {
    return apiClient.delete(`/ratings/${id}`);
  },

  // POST /reports
  submitReport: async (payload) => {
    return apiClient.post('/reports', payload);
  },

  // GET /admin/reports
  adminGetReports: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return apiClient.get(
      `/admin/reports${params.toString() ? `?${params.toString()}` : ''}`,
    );
  },

  // PATCH /admin/reports/:id/status
  adminUpdateReportStatus: async (id, status) => {
    return apiClient.patch(`/admin/reports/${id}/status`, { status });
  },
};
