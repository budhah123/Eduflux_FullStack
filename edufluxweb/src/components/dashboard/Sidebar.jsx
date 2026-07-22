import { useEffect, useState } from 'react';
import { apiClient } from '../../services/api/apiClient';
import { useNavigate } from 'react-router-dom';

export default function Sidebar({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  onNewUploadClick,
}) {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('User');
  const [userRole, setUserRole] = useState('Researcher');
  const [userAvatar, setUserAvatar] = useState(null);

  const decodeTokenProfile = (token) => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      const token = sessionStorage.getItem('accessToken');
      const fallback = decodeTokenProfile(token);

      if (!token || !fallback) return;

      try {
        const profile = await apiClient.get('/users/me');
        if (!mounted) return;
        const firstName =
          profile?.firstName ||
          profile?.fullName?.split(' ')?.[0] ||
          fallback.firstName ||
          fallback.name ||
          fallback.email?.split('@')?.[0];
        setUserName(
          firstName
            ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
            : 'User',
        );
        setUserRole(
          profile?.isInstitutional
            ? 'Techspire Student'
            : fallback.role
              ? `${fallback.role.charAt(0).toUpperCase()}${fallback.role.slice(1)}`
              : 'Researcher',
        );
        setUserAvatar(profile?.avatarUrl || null);
      } catch {
        if (!mounted) return;
        const name =
          fallback.name ||
          fallback.username ||
          (fallback.email && fallback.email.split('@')[0]);
        if (name) setUserName(name.charAt(0).toUpperCase() + name.slice(1));
        if (fallback.role)
          setUserRole(
            fallback.role.charAt(0).toUpperCase() + fallback.role.slice(1),
          );
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const sidebarItems = [
    { name: 'Overview', label: 'Dashboard', icon: 'dashboard' },
    { name: 'Browse', label: 'Browse', icon: 'search' },
    { name: 'My Uploads', label: 'My Uploads', icon: 'upload_file' },
    { name: 'AI Chat', label: 'AI Chat', icon: 'auto_awesome' },
    { name: 'Bookmarks', label: 'Bookmarks', icon: 'bookmark' },
    {
      name: 'Subscription',
      label: 'Subscription',
      icon: 'credit_card',
      route: '/subscription',
    },
    { name: 'Settings', label: 'Settings', icon: 'settings' },
  ];

  const handleLogout = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[240px] bg-white border-r border-outline-variant py-6 px-4 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="mb-10 px-4 flex items-center justify-between">
          <span className="font-headline-sm text-headline-sm font-bold text-primary flex items-center gap-2 select-none">
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_stories
            </span>
            Eduflux
          </span>
          {/* Close button for mobile */}
          <button
            className="md:hidden p-1 text-on-surface-variant hover:bg-surface-container-high rounded-full"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item, idx) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={idx}
                onClick={() => {
                  if (item.route) {
                    navigate(item.route);
                  } else {
                    setActiveTab(item.name);
                  }
                  setMobileOpen(false); // auto close drawer on mobile click
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-label-md text-label-md transition-all duration-200 select-none cursor-pointer text-left ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm translate-x-1'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Panel */}
        <div className="mt-auto border-t border-outline-variant pt-6 px-2">
          {/* New Upload Button */}
          <button
            onClick={() => {
              setMobileOpen(false);
              if (onNewUploadClick) onNewUploadClick();
            }}
            className="w-full bg-primary text-on-primary font-label-md text-label-md py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/20 transition-all active:scale-95 cursor-pointer select-none"
          >
            <span className="material-symbols-outlined" data-icon="add">
              add
            </span>
            New Upload
          </button>

          {/* User Profile */}
          <div className="mt-6 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              {userAvatar ? (
                <img
                  alt="User Profile"
                  className="w-10 h-10 rounded-full border border-outline-variant object-cover"
                  src={userAvatar}
                />
              ) : (
                <div className="w-10 h-10 rounded-full border border-outline-variant bg-primary text-white flex items-center justify-center font-bold">
                  {userName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="max-w-[110px] overflow-hidden">
                <p className="font-label-md text-label-md font-bold text-on-surface truncate leading-tight">
                  {userName}
                </p>
                <p className="text-[10px] text-text-muted truncate mt-0.5">
                  {userRole}
                </p>
              </div>
            </div>

            {/* Logout Shortcut */}
            <button
              onClick={handleLogout}
              className="text-on-surface-variant hover:text-error p-1.5 focus:outline-none cursor-pointer rounded-full hover:bg-surface-container"
              aria-label="Logout"
              title="Logout"
            >
              <span className="material-symbols-outlined text-[20px]">
                logout
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
