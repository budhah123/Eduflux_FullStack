import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: 'dashboard',
    },
    {
      name: 'Users',
      path: '/admin/users',
      icon: 'group',
    },
    {
      name: 'Documents',
      path: '/admin/documents',
      icon: 'description',
    },
  ];

  const externalLinks = [
    {
      name: 'Browse Hub',
      path: '/browse-panel',
      icon: 'search',
    },
    {
      name: 'My Uploads',
      path: '/my-upload',
      icon: 'upload_file',
    },
    {
      name: 'AI Chat',
      path: '/dashboard',
      icon: 'auto_awesome',
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="bg-[#f8f9fa] text-[#1E293B] min-h-screen font-sans">
      {/* Sidebar - Desktop */}
      <aside className="bg-white text-[#1E293B] w-[240px] h-full fixed left-0 top-0 z-40 hidden md:flex flex-col py-6 px-4 border-r border-[#c7c4d8]/40 shadow-sm">
        <div className="mb-10 px-4">
          <span className="text-xl font-bold text-[#3525cd]">Eduflux</span>
          <span className="text-xs block text-slate-500 mt-1 font-medium">Admin Portal</span>
        </div>

        <nav className="flex-1 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 px-4 mb-2 tracking-wider">Management</div>
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3 gap-3 rounded-lg transition-all duration-200 ${isActive(item.path)
                  ? 'bg-[#4f46e5] text-white translate-x-1 font-medium shadow-sm'
                  : 'text-slate-600 hover:bg-[#f3f4f5] hover:text-[#1E293B]'
                }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm">{item.name}</span>
            </Link>
          ))}

          <div className="text-[10px] uppercase font-bold text-slate-400 px-4 mt-6 mb-2 tracking-wider">Student View</div>
          {externalLinks.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="flex items-center px-4 py-3 gap-3 rounded-lg text-slate-600 hover:bg-[#f3f4f5] hover:text-[#1E293B] transition-all text-sm"
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-200 pt-6 px-4">
          <div className="flex items-center gap-3">
            <img
              alt="User Profile Avatar"
              className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-[#4f46e5]/30"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDGYbLamcjsQELAQXoyV_Lx8wbCveR0kRMNb92TDmDh0xS0MYB4uxJAxStfj9pHI3Qtd4vI5TRrBIbjkv9ilftsdINYSZWMvzYoTMnWoYpMKs3fKE51u_snROddEuh_7tHRE62SbKlqabo6NY5svDbW1-wgwnQdYcd5EzI-FSMqjljj0e9zxRWRw-PbzcH3UXr8xd5Ij3lstC-j3hFnyqGmtYIcpY22j7n3r2kPBmATeYEyYnnxqyz_8c81H2z1HjG-WhAScWKfX20"
            />
            <div>
              <p className="text-sm font-bold block text-[#1E293B]">Academic User</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside className={`bg-white text-[#1E293B] w-[240px] h-full fixed left-0 top-0 z-50 flex flex-col py-6 px-4 border-r border-[#c7c4d8]/40 transition-transform duration-300 md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex items-center justify-between mb-10 px-4">
          <div>
            <span className="text-xl font-bold text-[#3525cd]">Eduflux</span>
            <span className="text-xs block text-slate-500 mt-1 font-medium">Admin Portal</span>
          </div>
          <button
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-[#f3f4f5] rounded-full transition-colors"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 px-4 mb-2 tracking-wider">Management</div>
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileSidebarOpen(false)}
              className={`flex items-center px-4 py-3 gap-3 rounded-lg transition-all duration-200 ${isActive(item.path)
                  ? 'bg-[#4f46e5] text-white translate-x-1 font-medium shadow-sm'
                  : 'text-slate-600 hover:bg-[#f3f4f5] hover:text-[#1E293B]'
                }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm">{item.name}</span>
            </Link>
          ))}

          <div className="text-[10px] uppercase font-bold text-slate-400 px-4 mt-6 mb-2 tracking-wider">Student View</div>
          {externalLinks.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="flex items-center px-4 py-3 gap-3 rounded-lg text-slate-600 hover:bg-[#f3f4f5] hover:text-[#1E293B] transition-all text-sm"
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-200 pt-6 px-4">
          <div className="flex items-center gap-3">
            <img
              alt="User Profile Avatar"
              className="w-10 h-10 rounded-full object-cover shadow-sm"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDGYbLamcjsQELAQXoyV_Lx8wbCveR0kRMNb92TDmDh0xS0MYB4uxJAxStfj9pHI3Qtd4vI5TRrBIbjkv9ilftsdINYSZWMvzYoTMnWoYpMKs3fKE51u_snROddEuh_7tHRE62SbKlqabo6NY5svDbW1-wgwnQdYcd5EzI-FSMqjljj0e9zxRWRw-PbzcH3UXr8xd5Ij3lstC-j3hFnyqGmtYIcpY22j7n3r2kPBmATeYEyYnnxqyz_8c81H2z1HjG-WhAScWKfX20"
            />
            <div>
              <p className="text-sm font-bold block text-[#1E293B]">Academic User</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Top Header */}
      <header className="flex justify-between items-center w-full md:w-[calc(100%-240px)] px-6 h-16 md:ml-[240px] fixed top-0 bg-[#f8f9fa] border-b border-[#c7c4d8]/30 z-30 font-sans">
        <div className="flex items-center gap-4">
          <button
            className="p-2 hover:bg-slate-200 rounded-full transition-colors md:hidden"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-lg font-semibold text-[#1E293B]">
            {isActive('/admin/dashboard') && 'Admin Dashboard'}
            {isActive('/admin/users') && 'Admin User Management'}
            {isActive('/admin/documents') && 'Admin Document Management'}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input
              className="pl-10 pr-4 py-2 border border-[#c7c4d8]/40 rounded-full text-sm w-64 bg-[#f3f4f5] focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent outline-none transition-all"
              placeholder="Search resources..."
              type="text"
            />
          </div>
          <button className="hover:bg-slate-200 p-2 rounded-full transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full"></span>
          </button>
          <button className="hover:bg-slate-200 p-2 rounded-full transition-colors">
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>
      </header>

      {/* Page Content area */}
      <main className="md:ml-[240px] pt-24 pb-12 px-6 md:px-8 max-w-[1440px] mx-auto min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
