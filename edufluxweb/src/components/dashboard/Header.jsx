import { useState, useEffect } from 'react';
import { apiClient } from '../../services/api/apiClient';

export default function Header({ activeTab, setMobileOpen, onSearch }) {
  const [userRole, setUserRole] = useState('Student User');

  useEffect(() => {
    let mounted = true;

    const loadRole = async () => {
      try {
        const profile = await apiClient.get('/users/me');
        if (!mounted) return;
        if (profile?.isInstitutional) {
          setUserRole('Free Access — Techspire Student');
        } else {
          setUserRole(
            profile?.fullName
              ? `${profile.fullName.split(' ')[0]}'s Dashboard`
              : 'Academic Workspace',
          );
        }
      } catch {
        if (!mounted) return;
        setUserRole('Academic Workspace');
      }
    };

    loadRole();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="flex justify-between items-center w-full px-6 h-16 bg-surface-bright border-b border-outline-variant sticky top-0 z-30 select-none">
      {/* Search and Menu trigger */}
      <div className="flex items-center gap-4 flex-1">
        {/* Menu toggle for mobile */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-all cursor-pointer"
          aria-label="Open navigation menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-md hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            onChange={(e) => onSearch && onSearch(e.target.value)}
            className="w-full bg-white border border-outline-variant rounded-full py-2 pl-10 pr-4 font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Search resources, papers, or chats..."
            type="text"
          />
        </div>
      </div>

      {/* Right side items */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div className="p-2 hover:bg-surface-container-high rounded-full cursor-pointer relative group transition-all">
          <span className="material-symbols-outlined text-on-surface-variant">
            notifications
          </span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
        </div>

        {/* Help Button */}
        <div className="p-2 hover:bg-surface-container-high rounded-full cursor-pointer transition-all">
          <span className="material-symbols-outlined text-on-surface-variant">
            help
          </span>
        </div>

        <div className="h-8 w-[1px] bg-outline-variant mx-2"></div>

        {/* Workspace Mode Badge */}
        <div className="flex items-center gap-2">
          <span className="font-label-md text-label-md font-bold text-text-main">
            {activeTab === 'Overview' ? userRole : `${activeTab}`}
          </span>
        </div>
      </div>
    </header>
  );
}
