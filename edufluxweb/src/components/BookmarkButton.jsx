import { useState } from 'react';
import { bookmarkApi } from '../services/api/bookmarkApi';

export default function BookmarkButton({
  documentId,
  isBookmarked = false,
  onToggle,
  variant = 'card', // 'card', 'table', 'viewer', 'icon'
  showToast,
  className = '',
}) {
  const [loading, setLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(isBookmarked);

  // Sync state if prop updates
  const activeBookmarked = onToggle ? isBookmarked : bookmarked;

  const handleToggle = async (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (!documentId || loading) return;

    const nextState = !activeBookmarked;
    setLoading(true);

    try {
      if (onToggle) {
        await onToggle(documentId, nextState);
      } else {
        if (nextState) {
          await bookmarkApi.addBookmark(documentId);
          if (showToast) showToast('Saved to bookmarks', 'success');
        } else {
          await bookmarkApi.removeBookmark(documentId);
          if (showToast) showToast('Removed from bookmarks', 'info');
        }
        setBookmarked(nextState);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      if (showToast) {
        showToast(err.message || 'Failed to update bookmark', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'viewer') {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={handleToggle}
        className={`w-full border py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
          activeBookmarked
            ? 'border-primary text-primary bg-primary/10 hover:bg-primary/20 shadow-sm'
            : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5'
        } ${loading ? 'opacity-70 cursor-wait' : ''} ${className}`}
      >
        <span
          className="material-symbols-outlined text-[20px]"
          style={activeBookmarked ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          {loading ? 'sync' : 'bookmark'}
        </span>
        <span>{activeBookmarked ? 'Saved in Bookmarks' : 'Bookmark Document'}</span>
      </button>
    );
  }

  if (variant === 'table') {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={handleToggle}
        title={activeBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        className={`p-2 hover:bg-surface-container rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
          activeBookmarked ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
        } ${loading ? 'opacity-70' : ''} ${className}`}
      >
        <span
          className="material-symbols-outlined text-[18px]"
          style={activeBookmarked ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          {loading ? 'sync' : 'bookmark'}
        </span>
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={handleToggle}
        title={activeBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        className={`p-1.5 rounded-full hover:bg-surface-container cursor-pointer transition-colors ${
          activeBookmarked ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
        } ${loading ? 'opacity-70' : ''} ${className}`}
      >
        <span
          className="material-symbols-outlined text-[20px]"
          style={activeBookmarked ? { fontVariationSettings: "'FILL' 1" } : {}}
        >
          {loading ? 'sync' : 'bookmark'}
        </span>
      </button>
    );
  }

  // Default 'card' variant
  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleToggle}
      title={activeBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full cursor-pointer shadow-sm hover:scale-105 transition-all z-10 ${
        activeBookmarked
          ? 'text-primary shadow-primary/20'
          : 'text-on-surface-variant hover:text-primary'
      } ${loading ? 'opacity-70' : ''} ${className}`}
    >
      <span
        className="material-symbols-outlined text-[20px]"
        style={activeBookmarked ? { fontVariationSettings: "'FILL' 1" } : {}}
      >
        {loading ? 'sync' : 'bookmark'}
      </span>
    </button>
  );
}
