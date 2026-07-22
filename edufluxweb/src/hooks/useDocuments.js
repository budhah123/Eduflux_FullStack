import { useState, useEffect, useCallback } from 'react';
import { documentApi } from '../services/api/documentApi';

export function useDocuments(showToast) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Pagination & Filtering state
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form Field States
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Lecture Notes');
  const [newDepartment, setNewDepartment] = useState('');
  const [newSemester, setNewSemester] = useState('');
  const [newTags, setNewTags] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Edit Mode States
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);

  // Fetch all documents from the backend
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch a large limit (e.g. 1000) so we can do accurate client-side filtering,
      // because the backend findMyUploads ignores search and category filters on the DB level.
      const result = await documentApi.getMyUploads(1, 1000);
      setDocuments(result.data || []);
    } catch (err) {
      if (showToast) {
        showToast(err.message || 'Error loading uploaded documents', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
    const refresh = () => loadDocuments();
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
    };
  }, [loadDocuments]);

  // Clean form
  const resetForm = useCallback(() => {
    setNewTitle('');
    setNewDescription('');
    setNewCategory('Lecture Notes');
    setNewDepartment('');
    setNewSemester('');
    setNewTags('');
    setSelectedFile(null);
    setIsEditMode(false);
    setEditingDocId(null);
    setUploadProgress(0);
  }, []);

  // Sync reset on modal close
  useEffect(() => {
    if (!uploadModalOpen) {
      resetForm();
    }
  }, [uploadModalOpen, resetForm]);

  // Handle upload or edit submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newTitle.trim()) {
      if (showToast) showToast('Please enter a document title', 'error');
      return;
    }

    if (isEditMode) {
      // Update metadata (PATCH)
      setUploading(true);
      try {
        const payload = {
          title: newTitle,
          description: newDescription,
          category: newCategory,
          department: newDepartment,
          semester: newSemester,
          tags: newTags,
        };
        await documentApi.updateDocument(editingDocId, payload);
        if (showToast) showToast('Document metadata updated successfully');
        setUploadModalOpen(false);
        loadDocuments();
        window.dispatchEvent(new Event('eduflux:documents-updated'));
      } catch (err) {
        if (showToast) showToast(err.message, 'error');
      } finally {
        setUploading(false);
      }
    } else {
      // Upload new file (POST)
      if (!selectedFile) {
        if (showToast) showToast('Please select a file to upload', 'error');
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        if (showToast) showToast('File size exceeds 10MB limit', 'error');
        return;
      }

      setUploading(true);
      setUploadProgress(10); // Start progress simulation
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', newTitle);
        formData.append('description', newDescription);
        formData.append('category', newCategory);
        formData.append('department', newDepartment);
        formData.append('semester', newSemester);
        formData.append('tags', newTags);

        // Simulate progress increment since fetch does not natively support onUploadProgress easily
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(interval);
              return 90;
            }
            return prev + 15;
          });
        }, 100);

        await documentApi.uploadDocument(formData);
        clearInterval(interval);
        setUploadProgress(100);

        if (showToast) showToast('Document uploaded successfully');
        setUploadModalOpen(false);
        loadDocuments();
        window.dispatchEvent(new Event('eduflux:documents-updated'));
      } catch (err) {
        if (showToast) showToast(err.message, 'error');
      } finally {
        setUploading(false);
      }
    }
  };

  // Delete a document
  const deleteDoc = async (id) => {
    if (
      !window.confirm(
        'Are you sure you want to permanently delete this document?',
      )
    ) {
      return;
    }

    setDeletingIds((prev) => [...prev, id]);
    try {
      const res = await documentApi.deleteDocument(id);
      if (showToast) {
        showToast(res?.message || 'Document deleted successfully');
      }
      // Remove from the list on success
      setDocuments((prev) => prev.filter((doc) => doc._id !== id));
      window.dispatchEvent(new Event('eduflux:documents-updated'));
    } catch (err) {
      if (showToast) {
        showToast(err.message || 'Error deleting document', 'error');
      }
    } finally {
      setDeletingIds((prev) => prev.filter((dId) => dId !== id));
    }
  };

  // Download a document
  const downloadDoc = async (id, title) => {
    if (showToast) {
      showToast(`Downloading: ${title || 'document'}...`);
    }
    try {
      const result = await documentApi.getDownloadUrl(id);
      if (result && result.url) {
        window.open(result.url, '_blank');
        // Optimistically increment local count
        setDocuments((prev) =>
          prev.map((d) =>
            d._id === id
              ? { ...d, downloadCount: (d.downloadCount || 0) + 1 }
              : d,
          ),
        );
      } else {
        throw new Error('Download URL not provided by the API');
      }
    } catch (err) {
      if (showToast) {
        showToast(err.message || 'Download failed', 'error');
      }
    }
  };

  // Pre-fill form fields for editing
  const startEdit = (doc) => {
    setIsEditMode(true);
    setEditingDocId(doc._id);
    setNewTitle(doc.title || '');
    setNewDescription(doc.description || '');
    setNewCategory(doc.category || 'Lecture Notes');
    setNewDepartment(doc.department || '');
    setNewSemester(doc.semester || '');
    setNewTags(
      Array.isArray(doc.tags)
        ? doc.tags.join(', ')
        : typeof doc.tags === 'string'
          ? doc.tags
          : '',
    );
    setSelectedFile(null);
    setUploadModalOpen(true);
  };

  // Filter logic
  const filteredDocs = Array.isArray(documents)
    ? documents.filter((doc) => {
        const searchVal = searchQuery.toLowerCase().trim();
        const matchesSearch =
          searchVal === '' ||
          (doc.title && doc.title.toLowerCase().includes(searchVal)) ||
          (doc.description &&
            doc.description.toLowerCase().includes(searchVal)) ||
          (doc.department &&
            doc.department.toLowerCase().includes(searchVal)) ||
          (Array.isArray(doc.tags) &&
            doc.tags.some((t) => t.toLowerCase().includes(searchVal)));

        if (!matchesSearch) return false;

        if (activeCategory === 'All') return true;
        if (activeCategory === 'Notes') {
          return (
            doc.category === 'Lecture Notes' || doc.category === 'Study Guide'
          );
        }
        if (activeCategory === 'Papers') {
          return (
            doc.category === 'Research Paper' ||
            doc.category === 'Research Papers'
          );
        }
        if (activeCategory === 'Thesis') {
          return doc.category === 'Thesis';
        }
        return true;
      })
    : [];

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const paginatedDocs = filteredDocs.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage,
  );

  const totalDownloads = Array.isArray(documents)
    ? documents.reduce((acc, doc) => acc + (doc.downloadCount || 0), 0)
    : 0;

  return {
    documents,
    filteredDocs,
    paginatedDocs,
    loading,
    uploading,
    uploadProgress,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    currentPage: activePage,
    setCurrentPage,
    totalPages,
    totalDownloads,

    // Form States & Setters
    newTitle,
    setNewTitle,
    newDescription,
    setNewDescription,
    newCategory,
    setNewCategory,
    newDepartment,
    setNewDepartment,
    newSemester,
    setNewSemester,
    newTags,
    setNewTags,
    selectedFile,
    setSelectedFile,
    dragActive,
    setDragActive,

    // Modal states
    isEditMode,
    uploadModalOpen,
    setUploadModalOpen,

    // Actions
    handleSubmit,
    deleteDoc,
    downloadDoc,
    startEdit,
    resetForm,
    loadDocuments,
    deletingIds,
  };
}
