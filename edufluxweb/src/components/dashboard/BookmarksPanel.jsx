import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookmarkApi } from '../../services/api/bookmarkApi';
import { documentApi } from '../../services/api/documentApi';
import BookmarkButton from '../BookmarkButton';

function GridDocumentCard({ doc, onPreview, onDownload, onToggleBookmark }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group bg-white rounded-2xl border border-outline-variant shadow-sm hover:shadow-md hover:border-primary transition-all duration-300 overflow-hidden flex flex-col h-full hover:-translate-y-0.5">
      {/* Thumbnail Header */}
      <div className="relative h-40 bg-slate-100 overflow-hidden select-none">
        {!imgError && doc.image ? (
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            alt={doc.title}
            src={doc.image}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 via-purple-50 to-indigo-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-primary/40 group-hover:scale-110 transition-transform duration-300">
              {doc.type === 'PDF' ? 'picture_as_pdf' : 'description'}
            </span>
          </div>
        )}

        {/* Badges Container (Positioned left with max-width to avoid overlapping bookmark button) */}
        <div className="absolute top-3 left-3 right-12 flex flex-wrap items-center gap-1.5 z-10 pointer-events-none">
          <span className="px-2.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded-md uppercase tracking-wider shadow-sm">
            {doc.type}
          </span>
          <span className="px-2.5 py-0.5 bg-white/90 backdrop-blur-md text-on-surface text-[10px] font-bold rounded-md uppercase tracking-wider shadow-sm truncate max-w-[110px]">
            {doc.category}
          </span>
        </div>

        {/* Bookmark Toggle Button */}
        <BookmarkButton
          documentId={doc.id}
          isBookmarked={true}
          onToggle={(id, state) => onToggleBookmark(id, state)}
          variant="card"
        />
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Title with min-h for 2 lines to maintain uniform card heights */}
          <h4
            onClick={() => onPreview(doc)}
            className="font-label-md text-label-md font-bold leading-tight text-text-main mb-2 group-hover:text-primary transition-colors line-clamp-2 cursor-pointer hover:underline min-h-[2.5rem]"
            title={doc.title}
          >
            {doc.title}
          </h4>

          {/* Subject Badge */}
          <div className="flex items-center gap-1.5 mb-3 select-none">
            <span className="px-2 py-0.5 bg-secondary-container/10 text-secondary font-label-sm text-[11px] rounded-md font-medium truncate max-w-full">
              {doc.subject}
            </span>
          </div>
        </div>

        {/* Author Avatar & Stats */}
        <div className="pt-3 border-t border-outline-variant/60 flex items-center justify-between select-none gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {doc.authorAvatar ? (
              <img
                alt={doc.author}
                className="w-6 h-6 rounded-full border border-outline-variant object-cover flex-shrink-0"
                src={doc.authorAvatar}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : null}
            <span className="text-[12px] font-label-sm text-on-surface-variant font-medium truncate">
              {doc.author}
            </span>
          </div>

          <div className="flex items-center gap-1 text-on-surface-variant flex-shrink-0">
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span className="text-[12px] font-label-sm font-semibold">{doc.downloads}</span>
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="p-3.5 bg-surface-container-low flex gap-2 border-t border-outline-variant/30 select-none">
        <button
          onClick={() => onPreview(doc)}
          className="flex-1 py-2 bg-white border border-outline-variant rounded-lg font-label-sm text-label-sm hover:bg-surface-bright hover:border-primary/40 transition-colors cursor-pointer text-text-main shadow-xs font-semibold flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">visibility</span>
          View
        </button>
        <button
          onClick={() => onDownload(doc)}
          className="flex-1 py-2 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm font-semibold shadow-xs hover:bg-primary-container transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          Download
        </button>
      </div>
    </div>
  );
}

export default function BookmarksPanel({ setActiveTab, showToast }) {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid');

  const loadBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await bookmarkApi.getBookmarks();
      const items = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      
      const validBookmarks = items.map((b) => {
        const doc = b.document || b;
        const docId = doc._id || doc.id || b.documentId;
        return {
          bookmarkId: b._id || b.id,
          id: docId,
          _id: docId,
          title: doc.title || 'Untitled Document',
          subject: doc.subject || doc.department || 'General',
          category: doc.category || 'Notes',
          fileFormat: doc.fileFormat || doc.type || 'PDF',
          type: (doc.fileFormat || doc.type || 'PDF').toUpperCase(),
          author: doc.uploader || doc.author || 'Contributor',
          authorAvatar: doc.uploaderAvatar || doc.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          downloads: doc.downloadCount || doc.downloads || 0,
          image: doc.fileUrl || doc.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
          rawDoc: doc,
        };
      }).filter(b => b.id);

      setBookmarks(validBookmarks);
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      if (showToast) {
        showToast('Failed to load bookmarks', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const handleToggleBookmark = async (docId, nextState) => {
    try {
      if (!nextState) {
        await bookmarkApi.removeBookmark(docId);
        setBookmarks((prev) => prev.filter((item) => item.id !== docId));
        if (showToast) showToast('Removed from bookmarks', 'info');
      } else {
        await bookmarkApi.addBookmark(docId);
        if (showToast) showToast('Added to bookmarks', 'success');
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      if (showToast) showToast(err.message || 'Failed to update bookmark', 'error');
    }
  };

  const handlePreviewClick = (doc) => {
    navigate(`/documents/${doc.id}/view`);
  };

  const handleDownload = async (doc) => {
    try {
      if (typeof doc.id === 'number') {
        const link = window.document.createElement('a');
        link.href = doc.image;
        link.setAttribute('download', doc.title);
        link.setAttribute('target', '_blank');
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }
      const res = await documentApi.getDownloadUrl(doc.id);
      if (res && res.url) {
        const link = window.document.createElement('a');
        link.href = res.url;
        link.setAttribute('download', doc.title);
        link.setAttribute('target', '_blank');
        window.document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error('Error downloading document:', err);
    }
  };

  const categories = ['All', ...new Set(bookmarks.map((b) => b.category).filter(Boolean))];

  const filteredBookmarks = bookmarks.filter((doc) => {
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <section className="p-6 md:p-8 max-w-container-max mx-auto w-full select-none animate-slide-up">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-headline-lg text-text-main font-bold mb-1">
            Bookmarked Resources
          </h2>
          <p className="font-body-md text-body-md text-text-muted">
            Quick access to your saved academic papers, notes, and study guides.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-xl self-start sm:self-auto border border-outline-variant/40">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-primary shadow-xs font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Grid view"
          >
            <span className="material-symbols-outlined text-[20px]">grid_view</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-primary shadow-xs font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="List view"
          >
            <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      {bookmarks.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          {/* Category Filter Pills */}
          <div className="flex bg-surface-container p-1 rounded-xl overflow-x-auto max-w-full custom-scrollbar border border-outline-variant/40">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-lg font-label-md text-label-md cursor-pointer transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-white text-primary shadow-xs font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="flex items-center bg-white border border-outline-variant/60 rounded-xl px-3.5 py-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all w-full md:w-72 shadow-xs">
            <span className="material-symbols-outlined text-outline text-[18px] mr-2">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookmarks..."
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-body-sm w-full p-0 text-text-main"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="py-24 text-center text-text-muted flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-outline-variant shadow-xs">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="font-label-md text-label-md">Loading your bookmarked documents...</p>
        </div>
      ) : bookmarks.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-outline-variant rounded-2xl p-12 text-center text-text-muted shadow-xs flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
            <span
              className="material-symbols-outlined text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bookmark
            </span>
          </div>
          <h4 className="font-headline-sm text-headline-sm text-text-main font-bold mb-2">
            No Bookmarks Saved Yet
          </h4>
          <p className="font-body-md text-body-md text-text-muted max-w-md mx-auto mb-6">
            Keep track of key documents, notes, and research by clicking the bookmark icon on any document card.
          </p>
          <button
            onClick={() => {
              if (setActiveTab) setActiveTab('Browse');
              else navigate('/browse-panel');
            }}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-label-md text-label-md font-bold shadow-md hover:bg-primary-container transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            Browse Documents
          </button>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        /* No Search Results */
        <div className="bg-white border border-outline-variant rounded-2xl p-12 text-center text-text-muted shadow-xs">
          <span className="material-symbols-outlined text-5xl text-outline mb-2">search_off</span>
          <h4 className="font-headline-sm text-headline-sm text-text-main font-bold mb-1">
            No Matching Bookmarks
          </h4>
          <p className="text-body-sm text-text-muted max-w-sm mx-auto">
            No saved documents match your current search or category filter.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout: auto-fit uniform card dimensions */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 items-stretch">
          {filteredBookmarks.map((doc) => (
            <GridDocumentCard
              key={doc.id}
              doc={doc}
              onPreview={handlePreviewClick}
              onDownload={handleDownload}
              onToggleBookmark={handleToggleBookmark}
            />
          ))}
        </div>
      ) : (
        /* List Layout */
        <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-xs divide-y divide-outline-variant/30">
          {filteredBookmarks.map((doc) => (
            <div
              key={doc.id}
              className="group p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-surface-bright transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 select-none">
                  <span className="material-symbols-outlined text-2xl">
                    {doc.type === 'PDF' ? 'picture_as_pdf' : 'article'}
                  </span>
                </div>
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handlePreviewClick(doc)}>
                  <h4 className="font-label-md text-label-md font-bold text-text-main group-hover:text-primary transition-colors truncate hover:underline">
                    {doc.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mt-1 select-none">
                    <span>{doc.author}</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 bg-surface-container rounded text-[11px] font-medium">{doc.category}</span>
                    <span>•</span>
                    <span className="uppercase">{doc.type}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      {doc.downloads} downloads
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-between sm:justify-end select-none flex-shrink-0">
                <span className="px-2.5 py-1 bg-secondary-container/10 text-secondary font-label-sm text-[11px] rounded-lg font-bold">
                  {doc.subject}
                </span>
                <BookmarkButton
                  documentId={doc.id}
                  isBookmarked={true}
                  onToggle={(id, state) => handleToggleBookmark(id, state)}
                  variant="icon"
                />
                <button
                  onClick={() => handlePreviewClick(doc)}
                  className="px-3.5 py-2 border border-outline-variant rounded-xl font-label-sm text-label-sm hover:bg-surface-bright transition-colors cursor-pointer text-text-main font-semibold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  View
                </button>
                <button
                  onClick={() => handleDownload(doc)}
                  className="bg-primary text-on-primary px-4 py-2 rounded-xl font-label-sm text-label-sm font-semibold shadow-xs hover:bg-primary-container transition-all cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
