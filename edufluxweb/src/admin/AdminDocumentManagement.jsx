import React, { useState, useEffect } from 'react';
import { documentApi } from '../services/api/documentApi';
import { useToast } from '../context/ToastContext';

export default function AdminDocumentManagement() {
  const { showToast } = useToast();
  
  // State management
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'queue'
  
  // Pagination & Counts
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalDocs, setTotalDocs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [queueCount, setQueueCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Modals & Forms
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    department: '',
    semester: '',
    tags: '',
    file: null,
  });

  // Active Dropdown Action Menu
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Helper for file styling/icons (matches Stitch system design system)
  const getFileStyle = (format) => {
    const f = format?.toLowerCase();
    if (f === 'pdf') {
      return {
        icon: 'description',
        class: 'bg-[#3A65AA]/10 text-[#3A65AA]'
      };
    } else if (['xlsx', 'xls', 'csv'].includes(f)) {
      return {
        icon: 'article',
        class: 'bg-[#B80000]/10 text-[#B80000]'
      };
    } else if (['docx', 'doc'].includes(f)) {
      return {
        icon: 'article',
        class: 'bg-[#4f46e5]/10 text-[#4f46e5]'
      };
    } else if (['pptx', 'ppt'].includes(f)) {
      return {
        icon: 'slideshow',
        class: 'bg-[#EAA03F]/10 text-[#EAA03F]'
      };
    } else {
      return {
        icon: 'description',
        class: 'bg-slate-500/10 text-slate-500'
      };
    }
  };

  // Helper for size formatting
  const formatBytes = (bytes, decimals = 1) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Data Fetching
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const filters = {
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
        category: filterCategory || undefined,
        semester: filterSemester || undefined,
      };

      if (activeTab === 'queue') {
        filters.status = 'flagged';
      }

      const response = await documentApi.adminGetDocuments(filters);
      if (response) {
        setDocuments(response.data || []);
        setTotalDocs(response.total || 0);
        setTotalPages(response.totalPages || 1);
      }

      // Fetch dynamic badge count for moderation queue and total documents
      const queueRes = await documentApi.adminGetDocuments({ status: 'flagged', limit: 1 });
      setQueueCount(queueRes.total || 0);

      const totalRes = await documentApi.adminGetDocuments({ limit: 1 });
      setTotalCount(totalRes.total || 0);

    } catch (err) {
      showToast(err.message || 'Failed to fetch documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDocuments();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, filterCategory, filterSemester, activeTab, currentPage]);

  // Handle Approve (moderation queue)
  const handleApprove = async (id, title) => {
    try {
      await documentApi.adminChangeStatus(id, 'published');
      showToast(`Approved "${title}" successfully.`);
      fetchDocuments();
    } catch (err) {
      showToast(err.message || 'Failed to approve document', 'error');
    }
  };

  // Handle Reject (moderation queue) - deletes document from repository
  const handleReject = async (id, title) => {
    if (!window.confirm(`Are you sure you want to reject and remove "${title}"?`)) {
      return;
    }
    try {
      await documentApi.adminDeleteDocument(id);
      showToast(`Rejected and removed "${title}" from repository.`);
      fetchDocuments();
    } catch (err) {
      showToast(err.message || 'Failed to reject document', 'error');
    }
  };

  // File Input Handler
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFormData((prev) => ({
        ...prev,
        file: selectedFile,
        title: prev.title || selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name,
      }));
    }
  };

  // Form Reset
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      department: '',
      semester: '',
      tags: '',
      file: null,
    });
    setSelectedDoc(null);
  };

  // Create Upload Handler
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      showToast('Please select a document file to upload', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', formData.file);
      uploadData.append('title', formData.title);
      if (formData.description) uploadData.append('description', formData.description);
      if (formData.category) uploadData.append('category', formData.category);
      if (formData.department) uploadData.append('department', formData.department);
      if (formData.semester) uploadData.append('semester', formData.semester);
      if (formData.tags) uploadData.append('tags', formData.tags);

      await documentApi.adminUploadDocument(uploadData);
      showToast(`Document "${formData.title}" uploaded successfully!`);
      setIsUploadModalOpen(false);
      resetForm();
      fetchDocuments();
    } catch (err) {
      showToast(err.message || 'Failed to upload document', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Details Modal
  const handleOpenEdit = async (doc) => {
    setActiveMenuId(null);
    setDetailLoading(true);
    setIsEditModalOpen(true);
    try {
      const data = await documentApi.adminGetDocument(doc._id);
      if (data) {
        setSelectedDoc(data);
        setFormData({
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          department: data.department || '',
          semester: data.semester || '',
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
          file: null,
        });
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch document details', 'error');
      setIsEditModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Save Edit Handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoc) return;

    setActionLoading(true);
    try {
      const updateData = new FormData();
      updateData.append('title', formData.title);
      updateData.append('description', formData.description || '');
      updateData.append('category', formData.category || '');
      updateData.append('department', formData.department || '');
      updateData.append('semester', formData.semester || '');
      updateData.append('tags', formData.tags || '');
      
      if (formData.file) {
        updateData.append('file', formData.file);
      }

      await documentApi.adminUpdateDocument(selectedDoc._id, updateData);
      showToast('Document metadata updated successfully');
      setIsEditModalOpen(false);
      resetForm();
      fetchDocuments();
    } catch (err) {
      showToast(err.message || 'Failed to update document', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Delete Confirmation
  const handleDeleteClick = (doc) => {
    setActiveMenuId(null);
    setSelectedDoc(doc);
    setIsDeleteModalOpen(true);
  };

  // Confirms Document Deletion
  const handleConfirmDelete = async () => {
    if (!selectedDoc) return;
    setActionLoading(true);
    try {
      await documentApi.adminDeleteDocument(selectedDoc._id);
      showToast(`Document "${selectedDoc.title}" deleted successfully`);
      setIsDeleteModalOpen(false);
      resetForm();
      
      // Handle pagination adjust
      const remainingOnPage = documents.length - 1;
      if (remainingOnPage === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchDocuments();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete document', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 font-sans text-slate-800">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-[#1E293B] mb-1">Document Repository</h3>
          <p className="text-sm text-slate-500">Manage global academic assets and moderation requests.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-semibold text-sm transition-colors ${
                isFilterOpen || filterCategory || filterSemester
                  ? 'border-[#3525cd] bg-[#3525cd]/5 text-[#3525cd]'
                  : 'border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              Filter
            </button>
            
            {/* Filter Dropdown */}
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#c7c4d8]/40 shadow-xl rounded-xl p-4 z-40 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Physics, Notes"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#c7c4d8]/40 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Semester</label>
                  <input
                    type="text"
                    placeholder="e.g. 6th, First Semester"
                    value={filterSemester}
                    onChange={(e) => setFilterSemester(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#c7c4d8]/40 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                  />
                </div>
                {(filterCategory || filterSemester) && (
                  <button 
                    onClick={() => { setFilterCategory(''); setFilterSemester(''); }}
                    className="w-full text-center text-xs font-bold text-[#ba1a1a] hover:underline"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
          <button 
            onClick={() => { resetForm(); setIsUploadModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#3525cd] text-white rounded-lg font-semibold text-sm shadow-sm hover:shadow-md hover:opacity-95 transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Upload Document
          </button>
        </div>
      </div>

      {/* Tabs & Table Section */}
      <div className="bg-white rounded-xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden min-h-[400px] relative">
        <div className="flex border-b border-[#c7c4d8]/30 px-6 justify-between items-center bg-slate-50/50">
          <div className="flex">
            <button
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              className={`py-4 px-6 font-semibold text-sm border-b-2 transition-all ${
                activeTab === 'all'
                  ? 'border-[#3525cd] text-[#3525cd]'
                  : 'border-transparent text-slate-500 hover:text-[#1E293B]'
              }`}
            >
              All Documents
            </button>
            <button
              onClick={() => { setActiveTab('queue'); setCurrentPage(1); }}
              className={`py-4 px-6 font-semibold text-sm border-b-2 transition-all relative flex items-center ${
                activeTab === 'queue'
                  ? 'border-[#3525cd] text-[#3525cd]'
                  : 'border-transparent text-slate-500 hover:text-[#1E293B]'
              }`}
            >
              Moderation Queue
              {queueCount > 0 && (
                <span className="ml-2 bg-[#ba1a1a] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {queueCount}
                </span>
              )}
            </button>
          </div>
          
          {/* Action Bar Search (within layout matching top app bar aesthetics) */}
          <div className="relative flex items-center py-2 max-w-xs w-full mr-4">
            <span className="material-symbols-outlined absolute left-3 text-slate-400 text-sm select-none">search</span>
            <input
              className="pl-9 pr-4 py-1.5 border border-[#c7c4d8]/40 rounded-full text-xs w-full bg-white focus:ring-2 focus:ring-[#3525cd] focus:border-transparent outline-none transition-all"
              placeholder="Search table..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-[#3525cd] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500">Retrieving academic vault...</p>
            </div>
          </div>
        )}

        {/* Content - All Documents */}
        {activeTab === 'all' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[#c7c4d8]/40">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Document Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Uploader</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Downloads</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.length > 0 ? (
                  documents.map((doc) => {
                    const style = getFileStyle(doc.fileFormat);
                    return (
                      <tr key={doc._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 max-w-[280px]">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${style.class}`}>
                              <span className="material-symbols-outlined">{style.icon}</span>
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold text-[#1E293B] truncate" title={doc.title}>{doc.title}</p>
                              <p className="text-xs text-slate-400 truncate">{formatBytes(doc.fileSize)} • {doc.fileFormat?.toUpperCase() || 'DOCUMENT'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#1E293B]">
                          <div className="flex items-center gap-2">
                            <img 
                              src={doc.uploaderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.uploader || 'User')}&background=3525cd&color=fff`} 
                              alt="" 
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="truncate max-w-[120px]">{doc.uploader || 'System User'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600">
                            {doc.category || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-bold">{doc.downloadCount || 0}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            doc.status === 'published'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              doc.status === 'published' ? 'bg-emerald-600' : 'bg-amber-600'
                            }`}></span>
                            {doc.status === 'published' ? 'Published' : doc.status === 'flagged' ? 'Flagged' : doc.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button 
                            onClick={() => setActiveMenuId(activeMenuId === doc._id ? null : doc._id)}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <span className="material-symbols-outlined">more_vert</span>
                          </button>
                          
                          {/* Dropdown Options */}
                          {activeMenuId === doc._id && (
                            <>
                              <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)}></div>
                              <div className="absolute right-6 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-left">
                                <button 
                                  onClick={() => handleOpenEdit(doc)}
                                  className="w-full px-4 py-2 text-xs font-medium hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                                >
                                  <span className="material-symbols-outlined text-[16px]">edit</span>
                                  Edit Metadata
                                </button>
                                <button 
                                  onClick={() => handleDeleteClick(doc)}
                                  className="w-full px-4 py-2 text-xs font-medium hover:bg-slate-50 flex items-center gap-2 text-[#ba1a1a]"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  !loading && (
                    <tr>
                      <td colSpan="7" className="text-center py-20 text-slate-400 text-sm">
                        No documents found in the database matching search filters.
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-6 flex justify-between items-center bg-white border-t border-[#c7c4d8]/20">
                <p className="text-xs font-semibold text-slate-500">
                  Showing {documents.length} of {totalDocs} documents
                </p>
                <div className="flex gap-1">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 border border-[#c7c4d8]/40 rounded hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-xs font-semibold"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold ${
                        currentPage === p 
                          ? 'bg-[#3525cd] text-white' 
                          : 'border border-[#c7c4d8]/40 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 border border-[#c7c4d8]/40 rounded hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-xs font-semibold"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content - Moderation Queue */}
        {activeTab === 'queue' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[#c7c4d8]/40">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Document Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Uploader</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Semester / Department</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.length > 0 ? (
                  documents.map((item) => {
                    const style = getFileStyle(item.fileFormat);
                    return (
                      <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 max-w-[280px]">
                            <div className="w-10 h-10 bg-[#ba1a1a]/10 rounded-lg flex items-center justify-center shrink-0 text-[#ba1a1a]">
                              <span className="material-symbols-outlined">warning</span>
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-bold text-[#1E293B] truncate" title={item.title}>{item.title}</p>
                              <p className="text-xs text-slate-400 truncate">{formatBytes(item.fileSize)} • {item.fileFormat?.toUpperCase() || 'DOCUMENT'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#1E293B]">
                          <div className="flex items-center gap-2">
                            <img 
                              src={item.uploaderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.uploader || 'User')}&background=3525cd&color=fff`} 
                              alt="" 
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="truncate max-w-[120px]">{item.uploader || 'System User'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                          {item.semester || 'N/A'} • {item.department || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApprove(item._id, item.title)}
                              className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 hover:shadow-md transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">check</span>
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(item._id, item.title)}
                              className="px-4 py-1.5 border border-[#ba1a1a] text-[#ba1a1a] rounded-lg text-xs font-bold hover:bg-[#ba1a1a]/5 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  !loading && (
                    <tr>
                      <td colSpan="4" className="text-center py-20 text-slate-400 text-sm">
                        Moderation queue is clean. No flagged items to review.
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dashboard Stats Bento Row (Matches Stitch theme exactly) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-[#c7c4d8]/40 shadow-sm border-l-4 border-[#3525cd]">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Documents</p>
          <h4 className="text-3xl font-bold text-[#1E293B]">{totalCount.toLocaleString()}</h4>
          <p className="text-emerald-600 text-xs font-bold mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            Global assets stored
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-[#c7c4d8]/40 shadow-sm border-l-4 border-[#eaa03f]">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Pending Review</p>
          <h4 className="text-3xl font-bold text-[#1E293B]">{queueCount}</h4>
          <p className="text-[#ba1a1a] text-xs font-bold mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">priority_high</span>
            Needs attention
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#c7c4d8]/40 shadow-sm border-l-4 border-emerald-500">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Unique Uploaders</p>
          <h4 className="text-3xl font-bold text-[#1E293B]">2,410</h4>
          <p className="text-emerald-600 text-xs font-bold mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">group</span>
            Active users
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#c7c4d8]/40 shadow-sm border-l-4 border-[#3a65aa]">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Storage Used</p>
          <h4 className="text-3xl font-bold text-[#1E293B]">84.2 GB</h4>
          <div className="w-full bg-[#edeeef] h-1.5 rounded-full mt-4">
            <div className="bg-[#3a65aa] h-1.5 rounded-full" style={{ width: '65%' }}></div>
          </div>
        </div>
      </div>

      {/* Featured Banner / Promotional Section */}
      <div className="relative w-full h-[300px] rounded-2xl overflow-hidden shadow-md">
        <img
          className="w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCplCi3a5nVxxkqYuRumteXBPiZA7558Jv9GvrzJG-TDEx-212bkJciFRpfn_RA5fBOO14hRyvOloQusKxpuxNesAdkagBQ2wLqEJpfHaPDyIwPylv97nThRhxs-1Qasnx2GDGt_oW7O9viidnp7aqOAAqTiHa2f_UCnt6Fa4JtKW8jiaGB4W5kXcNX7cQVMdtCP-lUgmkNGEh44muNAtQUE0hCo-8ZzOQsxFhKHxnwhcvUy-Y0keo4BUthy60u9mNOrYBNPLFEDSdD"
          alt="Modern Library View"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-8">
          <span className="bg-[#3525cd] px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest w-fit mb-3">
            System Update
          </span>
          <h5 className="text-white text-lg font-bold mb-2">Enhanced AI Plagiarism Detection</h5>
          <p className="text-white/80 text-sm max-w-2xl leading-relaxed">
            Our latest model now supports 40+ academic languages and provides detailed provenance reports for every document in the repository.
          </p>
        </div>
      </div>

      {/* ─── UPLOAD DOCUMENT MODAL ─── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
          <form
            onSubmit={handleUploadSubmit}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#c7c4d8]/40 flex justify-between items-center bg-[#f8f9fa]">
              <h3 className="text-lg font-bold text-[#3525cd] flex items-center gap-2">
                <span className="material-symbols-outlined">upload_file</span>
                Upload New Document
              </h3>
              <button
                type="button"
                className="p-1 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                onClick={() => { setIsUploadModalOpen(false); resetForm(); }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
              
              {/* File Upload Area */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Document File *</label>
                <div className="border-2 border-dashed border-[#c7c4d8] rounded-xl p-6 text-center hover:border-[#3525cd] hover:bg-[#3525cd]/5 transition-all relative">
                  <input
                    type="file"
                    required
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <span className="material-symbols-outlined text-slate-400 text-4xl mb-2">cloud_upload</span>
                  <p className="text-sm font-semibold text-[#1E293B]">
                    {formData.file ? formData.file.name : 'Select or drag document here'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDFs, Word documents, Spreadsheets, images up to 10MB</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Document Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Quantum Physics Notes"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
                <textarea
                  placeholder="Summarize the core topics covered..."
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Physics, Exam Prep"
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Semester</label>
                  <input
                    type="text"
                    placeholder="e.g. Fall 2026, 6th Sem"
                    value={formData.semester}
                    onChange={(e) => setFormData((prev) => ({ ...prev, semester: e.target.value }))}
                    className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={formData.department}
                    onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                    className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tags (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. quantum, physics, pdf"
                    value={formData.tags}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-[#f8f9fa] border-t border-[#c7c4d8]/40 flex justify-end gap-3">
              <button
                type="button"
                className="px-5 py-2 border border-[#c7c4d8]/40 bg-white hover:bg-slate-100 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
                onClick={() => { setIsUploadModalOpen(false); resetForm(); }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#3525cd] text-white hover:shadow-lg active:scale-95 font-semibold text-sm rounded-lg transition-all flex items-center gap-2 cursor-pointer"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  'Upload File'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── DETAIL & EDIT DOCUMENT MODAL ─── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
          <form
            onSubmit={handleEditSubmit}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#c7c4d8]/40 flex justify-between items-center bg-[#f8f9fa]">
              <h3 className="text-lg font-bold text-[#3525cd] flex items-center gap-2">
                <span className="material-symbols-outlined">edit</span>
                Document Information & Metadata
              </h3>
              <button
                type="button"
                className="p-1 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                onClick={() => { setIsEditModalOpen(false); resetForm(); }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar relative">
              {detailLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 border-4 border-[#3525cd] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-500 font-semibold">Reading document details...</p>
                </div>
              ) : (
                <>
                  {/* File Metadata Overview */}
                  {selectedDoc && (
                    <div className="bg-[#f3f4f5] border border-[#c7c4d8]/30 rounded-xl p-4 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">File Details</p>
                        <p className="text-sm font-bold text-slate-700 truncate max-w-xs">{selectedDoc.title}</p>
                        <p className="text-xs text-slate-500">{formatBytes(selectedDoc.fileSize)} • {selectedDoc.fileFormat?.toUpperCase()}</p>
                      </div>
                      <a 
                        href={selectedDoc.fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-[#3a65aa] text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm hover:shadow-md transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        Get File
                      </a>
                    </div>
                  )}

                  {/* Optional File Replacement */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Replace Document File (Optional)</label>
                    <div className="border border-dashed border-[#c7c4d8] rounded-xl p-3 text-center hover:bg-slate-50 transition-colors relative">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <p className="text-xs font-semibold text-slate-600">
                        {formData.file ? `New File Selected: ${formData.file.name}` : 'Click here to replace document file'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Document Title *</label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
                    <textarea
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Category</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Semester</label>
                      <input
                        type="text"
                        value={formData.semester}
                        onChange={(e) => setFormData((prev) => ({ ...prev, semester: e.target.value }))}
                        className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Department</label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                        className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Tags (Comma Separated)</label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                        className="w-full px-4 py-2 border border-[#c7c4d8]/40 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#3525cd]/25 focus:border-[#3525cd]"
                      />
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="border border-red-200 bg-red-50/50 p-4 rounded-xl flex justify-between items-center mt-6">
                    <div>
                      <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Danger Zone</p>
                      <p className="text-[10px] text-slate-500">Irreversibly remove this academic asset from repositories.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setIsEditModalOpen(false); handleDeleteClick(selectedDoc); }}
                      className="px-4 py-1.5 border border-red-500 text-red-500 hover:bg-red-50 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Delete Document
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-[#f8f9fa] border-t border-[#c7c4d8]/40 flex justify-end gap-3">
              <button
                type="button"
                className="px-5 py-2 border border-[#c7c4d8]/40 bg-white hover:bg-slate-100 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
                onClick={() => { setIsEditModalOpen(false); resetForm(); }}
                disabled={actionLoading || detailLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#3525cd] text-white hover:shadow-lg active:scale-95 font-semibold text-sm rounded-lg transition-all flex items-center gap-2 cursor-pointer"
                disabled={actionLoading || detailLoading}
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving Changes...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION DIALOG ─── */}
      {isDeleteModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col border border-red-200">
            <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
              <span className="material-symbols-outlined text-red-500 text-3xl">warning</span>
              <div>
                <h3 className="text-base font-bold text-red-700">Irreversible Deletion</h3>
                <p className="text-[10px] text-slate-500">Irreversible operation in repository</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 leading-relaxed">
                Are you absolutely sure you want to permanently delete <strong className="text-slate-800">"{selectedDoc.title}"</strong>? 
                This will delete the file from cloud storage and remove all database entry indexes.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 font-semibold text-xs rounded-lg transition-colors cursor-pointer text-slate-700"
                onClick={() => { setIsDeleteModalOpen(false); resetForm(); }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 hover:shadow-lg active:scale-95 font-semibold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
