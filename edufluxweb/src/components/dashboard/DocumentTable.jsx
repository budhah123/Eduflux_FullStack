import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookmarkApi } from '../../services/api/bookmarkApi';
import BookmarkButton from '../BookmarkButton';

export default function DocumentTable({
  documents,
  loading,
  searchQuery,
  currentPage,
  totalPages,
  setCurrentPage,
  onEdit,
  onDownload,
  onDelete,
  deletingIds = [],
  showToast,
}) {
  const navigate = useNavigate();
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [docToDelete, setDocToDelete] = useState(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const res = await bookmarkApi.getBookmarks();
        const items = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        const ids = items.map((b) => String(b.documentId || b.document?._id || b.document?.id || b._id || b.id));
        setBookmarkedIds(ids);
      } catch (err) {
        console.error('Error fetching bookmarks in DocumentTable:', err);
      }
    };
    fetchBookmarks();
  }, []);

  const handleToggleBookmark = async (docId, nextState) => {
    const idStr = String(docId);
    try {
      if (nextState) {
        await bookmarkApi.addBookmark(idStr);
        setBookmarkedIds((prev) => [...prev, idStr]);
        if (showToast) showToast('Saved to bookmarks', 'success');
      } else {
        await bookmarkApi.removeBookmark(idStr);
        setBookmarkedIds((prev) => prev.filter((id) => id !== idStr));
        if (showToast) showToast('Removed from bookmarks', 'info');
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      if (showToast) showToast(err.message || 'Failed to update bookmark', 'error');
    }
  };

  const handlePreviewClick = useCallback((doc) => {
    navigate(`/documents/${doc._id}/view`);
  }, [navigate]);

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    const targetId = docToDelete._id;
    await onDelete(targetId);
    setDocToDelete(null);
  };

  const getDocMeta = (doc) => {
    const category = doc.category || '';
    const fileFormat = doc.fileFormat || '';
    
    let extension = fileFormat.toLowerCase();
    if (!extension && doc.fileUrl) {
      const parts = doc.fileUrl.split('?')[0].split('/');
      const filename = parts[parts.length - 1];
      const dotIndex = filename.lastIndexOf('.');
      if (dotIndex !== -1) {
        extension = filename.slice(dotIndex + 1).toLowerCase();
      }
    }
    if (!extension) {
      extension = 'file';
    }
    
    if (category === 'Research Paper' || category === 'Research Papers') {
      return { icon: 'article', color: 'bg-academic-gold/10 text-academic-gold', extLabel: 'DOCX' };
    }
    if (category === 'Study Guide') {
      return { icon: 'history_edu', color: 'bg-academic-red/10 text-academic-red', extLabel: 'PDF' };
    }
    if (extension === 'pdf') {
      return { icon: 'description', color: 'bg-academic-blue/10 text-academic-blue', extLabel: 'PDF' };
    }
    if (extension === 'docx' || extension === 'doc') {
      return { icon: 'article', color: 'bg-academic-gold/10 text-academic-gold', extLabel: 'DOCX' };
    }
    if (extension === 'pptx' || extension === 'ppt') {
      return { icon: 'slideshow', color: 'bg-academic-red/10 text-academic-red', extLabel: 'PPTX' };
    }
    return { icon: 'description', color: 'bg-academic-blue/10 text-academic-blue', extLabel: extension.toUpperCase() };
  };

  const formatFileSize = (bytes) => {
    if (typeof bytes !== 'number' || isNaN(bytes) || bytes <= 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="py-24 text-center select-none text-text-muted flex flex-col items-center justify-center gap-3">
        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="font-label-md text-label-md">Loading documents...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="py-24 text-center select-none text-text-muted">
        <span className="material-symbols-outlined text-5xl text-outline mb-2">folder_open</span>
        <p className="font-headline-sm text-headline-sm text-text-main font-semibold">No Documents Found</p>
        <p className="text-body-sm text-text-muted max-w-sm mx-auto mt-1">
          {searchQuery ? "No results match your search query." : "You haven't uploaded any documents matching this category yet."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant select-none">
              <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant font-bold">Document Name</th>
              <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant font-bold">Category</th>
              <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant font-bold">Upload Date</th>
              <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant font-bold">Downloads</th>
              <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant font-bold">Status</th>
              <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {documents.map((doc) => {
              const meta = getDocMeta(doc);
              const isDeletingThis = deletingIds.includes(doc._id);
              return (
                <tr key={doc._id} className="group hover:bg-surface-bright transition-all duration-150">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center select-none ${meta.color}`}>
                        <span className="material-symbols-outlined">{meta.icon}</span>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => handlePreviewClick(doc)}
                          className="font-label-md text-label-md text-on-surface font-semibold truncate max-w-[250px] text-left cursor-pointer hover:text-primary hover:underline flex items-center gap-1.5"
                          title={`Preview ${doc.title}`}
                        >
                          <span className="truncate">{doc.title}</span>
                        </button>
                        <p className="text-xs text-text-muted select-none">
                          {meta.extLabel} • {formatFileSize(doc.fileSize)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 select-none">
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-[11px] font-bold uppercase tracking-wide">
                      {doc.category || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-text-muted select-none">{formatDate(doc.createdAt)}</td>
                  <td className="px-6 py-4 text-body-sm select-none font-medium">{doc.downloadCount || 0}</td>
                  <td className="px-6 py-4 select-none">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${doc.status === 'published' || doc.status === 'approved' ? 'bg-tertiary' : doc.status === 'rejected' ? 'bg-error' : 'bg-amber-500'}`}></div>
                      <span className={`text-body-sm font-semibold capitalize ${doc.status === 'published' || doc.status === 'approved' ? 'text-tertiary' : doc.status === 'rejected' ? 'text-error' : 'text-amber-600'}`}>
                        {doc.status || 'pending'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right select-none">
                    <div className="flex justify-end gap-1">
                      <BookmarkButton
                        documentId={doc._id}
                        isBookmarked={bookmarkedIds.includes(String(doc._id))}
                        onToggle={(id, state) => handleToggleBookmark(id, state)}
                        variant="table"
                      />
                      <button
                        onClick={() => onEdit(doc)}
                        className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                        title="Edit metadata"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => handlePreviewClick(doc)}
                        className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                        title="Preview document"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      <button
                        onClick={() => onDownload(doc._id, doc.title)}
                        className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                        title="Download document"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                      </button>
                      <button
                        onClick={() => setDocToDelete(doc)}
                        className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-error transition-colors cursor-pointer flex items-center justify-center min-w-[34px] min-h-[34px]"
                        title="Delete permanently"
                        disabled={isDeletingThis}
                      >
                        {isDeletingThis ? (
                          <svg className="animate-spin h-[18px] w-[18px] text-error" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-between bg-surface-container-lowest select-none">
          <p className="text-body-sm text-text-muted">
            Showing {documents.length} documents on this page
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-default cursor-pointer text-text-main"
              disabled={currentPage === 1}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="px-4 py-2 text-body-sm font-semibold text-text-main">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container transition-colors disabled:opacity-50 disabled:cursor-default cursor-pointer text-text-main"
              disabled={currentPage === totalPages}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Dialog */}
      {docToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity p-4 animate-fade-in"
          onClick={() => {
            if (!deletingIds.includes(docToDelete._id)) {
              setDocToDelete(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-error/20 animate-scale-in select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4.5 bg-error/5 border-b border-error/10 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[24px]">delete_forever</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">Delete Document</h3>
                <p className="text-xs text-text-muted">This action is permanent and cannot be undone</p>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-sm text-text-main leading-relaxed">
                Are you sure you want to delete <strong className="text-on-surface font-semibold">"{docToDelete.title}"</strong>?
              </p>
              <p className="text-xs text-text-muted leading-relaxed">
                The document file and its metadata will be permanently removed from your uploads.
              </p>
            </div>

            <div className="px-6 py-4 bg-surface-container-lowest border-t border-outline-variant/40 flex justify-end items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 border border-outline-variant rounded-xl text-sm font-semibold text-text-main hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-50"
                onClick={() => setDocToDelete(null)}
                disabled={deletingIds.includes(docToDelete._id)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-error text-white hover:bg-error/90 font-semibold text-sm rounded-xl transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                disabled={deletingIds.includes(docToDelete._id)}
              >
                {deletingIds.includes(docToDelete._id) ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    <span>Delete Document</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
