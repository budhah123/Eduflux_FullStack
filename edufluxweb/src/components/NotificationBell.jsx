import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../services/api/notificationApi';
import { formatRelativeTime } from '../utils/formatTime';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch unread count from backend
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationApi.getUnreadCount();
      if (typeof res?.count === 'number') {
        setUnreadCount(res.count);
      }
    } catch {
      // Quiet fail for background polling
    }
  }, []);

  // Fetch list of notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getNotifications(1, 15);
      if (res?.data && Array.isArray(res.data)) {
        setNotifications(res.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  // Mount effect & polling every 45 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 45000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch notifications list on dropdown open
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Toggle dropdown open/close
  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  // Mark single notification as read
  const handleItemClick = async (notification) => {
    const { _id, isRead, link } = notification;

    if (!isRead) {
      // Update local state immediately
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === _id ? { ...item, isRead: true } : item,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Call API
      try {
        await notificationApi.markAsRead(_id);
      } catch {
        // Silently handle API error if needed
      }
    }

    if (link) {
      setIsOpen(false);
      navigate(link);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0 && notifications.every((n) => n.isRead)) return;

    setMarkingAll(true);
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isRead: true })),
    );
    setUnreadCount(0);

    try {
      await notificationApi.markAllAsRead();
    } catch {
      // Refetch if optimistic update fails
      fetchUnreadCount();
      fetchNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  // Delete notification item
  const handleDelete = async (e, id, isRead) => {
    e.stopPropagation();

    // Optimistic UI update
    setNotifications((prev) => prev.filter((item) => item._id !== id));
    if (!isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await notificationApi.deleteNotification(id);
    } catch {
      // Refetch if failure
      fetchNotifications();
      fetchUnreadCount();
    }
  };

  // Map notification type to Icon name & Color style
  const getIconProps = (type) => {
    switch (type) {
      case 'document_approved':
        return {
          icon: 'task_alt',
          bgClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
        };
      case 'document_rejected':
        return {
          icon: 'cancel',
          bgClass: 'bg-rose-50 text-rose-600 border border-rose-200/60',
        };
      case 'payment_success':
        return {
          icon: 'payments',
          bgClass: 'bg-blue-50 text-blue-600 border border-blue-200/60',
        };
      case 'subscription_expiring':
        return {
          icon: 'schedule',
          bgClass: 'bg-amber-50 text-amber-600 border border-amber-200/60',
        };
      case 'unlock_credit_earned':
        return {
          icon: 'stars',
          bgClass: 'bg-purple-50 text-purple-600 border border-purple-200/60',
        };
      case 'system':
      default:
        return {
          icon: 'info',
          bgClass: 'bg-indigo-50 text-indigo-600 border border-indigo-200/60',
        };
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button Icon */}
      <button
        type="button"
        onClick={toggleDropdown}
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`relative p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-all duration-200 focus:outline-none ${
          isOpen ? 'bg-surface-container-low text-primary' : ''
        }`}
      >
        <span
          className="material-symbols-outlined text-[24px] block"
          style={{
            fontVariationSettings: unreadCount > 0 ? "'FILL' 1" : "'FILL' 0",
          }}
        >
          notifications
        </span>

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[18px] px-1 items-center justify-center rounded-full bg-red-600 border-2 border-white text-[10px] font-bold text-white leading-none shadow-md animate-pulse-soft">
            {unreadCount > 8 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl glass-card shadow-2xl border border-outline-variant/60 overflow-hidden z-50 animate-slide-up">
          {/* Header */}
          <div className="px-4 py-3 border-b border-outline-variant/40 flex items-center justify-between bg-white/80 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <h3 className="font-headline-sm text-base font-bold text-academic-navy">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll || notifications.every((n) => n.isRead)}
              className="text-xs font-semibold text-primary hover:text-primary-container disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-150"
            >
              {markingAll ? 'Marking...' : 'Mark all as read'}
            </button>
          </div>

          {/* List Content Area */}
          <div className="max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-outline-variant/30">
            {loading ? (
              // Loading Skeleton State
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-surface-container-high shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-surface-container-high rounded w-3/4" />
                      <div className="h-3 bg-surface-container-high rounded w-5/6" />
                      <div className="h-2.5 bg-surface-container-high rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              // Empty State
              <div className="px-6 py-10 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center mb-3 text-on-surface-variant/60">
                  <span className="material-symbols-outlined text-2xl">
                    notifications_off
                  </span>
                </div>
                <p className="font-semibold text-sm text-academic-navy mb-1">
                  You're all caught up!
                </p>
                <p className="text-xs text-on-surface-variant">
                  No new notifications right now. Check back later!
                </p>
              </div>
            ) : (
              // Notifications List
              notifications.map((notification) => {
                const { icon, bgClass } = getIconProps(notification.type);
                const isUnread = !notification.isRead;

                return (
                  <div
                    key={notification._id}
                    onClick={() => handleItemClick(notification)}
                    className={`group relative p-3.5 flex gap-3 transition-colors duration-150 cursor-pointer ${
                      isUnread
                        ? 'bg-indigo-50/40 hover:bg-indigo-50/70'
                        : 'hover:bg-surface-container-low/60'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {isUnread && (
                      <span className="absolute top-4 left-2 w-2 h-2 rounded-full bg-primary" />
                    )}

                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bgClass}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {icon}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4
                          className={`text-xs truncate ${
                            isUnread
                              ? 'font-bold text-academic-navy'
                              : 'font-medium text-on-surface'
                          }`}
                        >
                          {notification.title}
                        </h4>
                        <span className="text-[10px] text-on-surface-variant/80 shrink-0">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>

                    {/* Delete button (on hover) */}
                    <button
                      type="button"
                      onClick={(e) =>
                        handleDelete(e, notification._id, notification.isRead)
                      }
                      title="Delete notification"
                      className="absolute right-2 top-3.5 p-1 rounded-md text-on-surface-variant/40 opacity-0 group-hover:opacity-100 hover:text-rose-600 hover:bg-rose-50 transition-all duration-150"
                    >
                      <span className="material-symbols-outlined text-[16px] block">
                        close
                      </span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
