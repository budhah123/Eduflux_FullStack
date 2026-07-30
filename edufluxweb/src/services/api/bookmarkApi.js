import { apiClient } from './apiClient';

export const bookmarkApi = {
  // GET /bookmarks — returns list of bookmarks with full document info
  getBookmarks: async () => {
    return apiClient.get('/bookmarks');
  },

  // POST /bookmarks — body { documentId }, adds a bookmark
  addBookmark: async (documentId) => {
    return apiClient.post('/bookmarks', { documentId: String(documentId) });
  },

  // DELETE /bookmarks/:documentId — removes a bookmark
  removeBookmark: async (documentId) => {
    return apiClient.delete(`/bookmarks/${documentId}`);
  },

  // GET /bookmarks/check/:documentId — returns true/false (or { isBookmarked })
  checkBookmark: async (documentId) => {
    return apiClient.get(`/bookmarks/check/${documentId}`);
  },
};
