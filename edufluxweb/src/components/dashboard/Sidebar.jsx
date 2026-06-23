import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen, onNewUploadClick }) {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('Hemraj')
  const [userRole, setUserRole] = useState('Researcher')

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken')
    if (token) {
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
        const payload = JSON.parse(jsonPayload)
        
        // Extract name, username, or email prefix
        const name = payload.name || payload.username || (payload.email && payload.email.split('@')[0])
        if (name) {
          // Capitalize first letter
          setUserName(name.charAt(0).toUpperCase() + name.slice(1))
        }
        if (payload.role) {
          setUserRole(payload.role.charAt(0).toUpperCase() + payload.role.slice(1))
        }
      } catch (e) {
        console.error('Error decoding token:', e)
      }
    }
  }, [])

  const sidebarItems = [
    { name: 'Overview', label: 'Dashboard', icon: 'dashboard' },
    { name: 'Browse', label: 'Browse', icon: 'search' },
    { name: 'My Uploads', label: 'My Uploads', icon: 'upload_file' },
    { name: 'AI Chat', label: 'AI Chat', icon: 'auto_awesome' },
    { name: 'Bookmarks', label: 'Bookmarks', icon: 'bookmark' },
    { name: 'Settings', label: 'Settings', icon: 'settings' }
  ]

  const handleLogout = () => {
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('refreshToken')
    navigate('/login')
  }

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
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
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
            const isActive = activeTab === item.name
            return (
              <button
                key={idx}
                onClick={() => {
                  setActiveTab(item.name)
                  setMobileOpen(false) // auto close drawer on mobile click
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-label-md text-label-md transition-all duration-200 select-none cursor-pointer text-left ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm translate-x-1'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Bottom Panel */}
        <div className="mt-auto border-t border-outline-variant pt-6 px-2">
          {/* New Upload Button */}
          <button
            onClick={() => {
              setMobileOpen(false)
              if (onNewUploadClick) onNewUploadClick()
            }}
            className="w-full bg-primary text-on-primary font-label-md text-label-md py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/20 transition-all active:scale-95 cursor-pointer select-none"
          >
            <span className="material-symbols-outlined" data-icon="add">add</span>
            New Upload
          </button>

          {/* User Profile */}
          <div className="mt-6 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <img
                alt="User Profile"
                className="w-10 h-10 rounded-full border border-outline-variant object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAg-iOEbr03Zq5JHsk5H40AVj8WbvRd4CbvygVs6PQNua0C90Vm8tuN7-Ukr6-VqJIPhwko9O3OM6axjS1wrJb4OUMmyCmY0sW_UfCFVNaLkmIyIh-pp_RaTfpDQBmtfY0n-Fw64d7pcan3O6Lc0Pd6IBDF1aYFgerGPGRbqwGyITwN2t1C7-_yvcPEQpuIA8dBW1yvug4vqQHfT19LrsyIflAQzCHSTjn5TPwn_jVqBH2XrRTC2M0w3-7-JOHDR8v2Qq5uFFgoDcc9"
              />
              <div className="max-w-[110px] overflow-hidden">
                <p className="font-label-md text-label-md font-bold text-on-surface truncate leading-tight">{userName}</p>
                <p className="text-[10px] text-text-muted truncate mt-0.5">{userRole}</p>
              </div>
            </div>

            {/* Logout Shortcut */}
            <button
              onClick={handleLogout}
              className="text-on-surface-variant hover:text-error p-1.5 focus:outline-none cursor-pointer rounded-full hover:bg-surface-container"
              aria-label="Logout"
              title="Logout"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
