import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Overview')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  const sidebarItems = [
    { name: 'Overview', icon: 'dashboard' },
    { name: 'Browse Documents', icon: 'folder_open' },
    { name: 'My Uploads', icon: 'cloud_upload' },
    { name: 'AI Chat Assistant', icon: 'auto_awesome' },
    { name: 'Settings', icon: 'settings' }
  ]

  const myDocs = [
    { title: 'CS101_Notes_Final.pdf', size: '2.4 MB', date: '2024-05-15', status: 'Approved' },
    { title: 'Math_II_Past_Papers.zip', size: '15.8 MB', date: '2024-05-12', status: 'Approved' },
    { title: 'Intro_to_AI_Draft.docx', size: '1.1 MB', date: '2024-05-10', status: 'Pending' }
  ]

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-surface-container border-b md:border-b-0 md:border-r border-outline-variant/50 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="h-16 px-6 flex items-center gap-2 border-b border-outline-variant/30 select-none">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_stories
            </span>
            <span className="font-bold font-headline-sm text-text-main dark:text-on-surface">Eduflux Hub</span>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1">
            {sidebarItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
                  activeTab === item.name
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* User profile / Logout */}
        <div className="p-4 border-t border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold">
              S
            </div>
            <div>
              <p className="text-body-sm font-semibold leading-none text-text-main dark:text-on-surface">Student User</p>
              <p className="text-[10px] text-text-muted mt-1">Techspire ID: 2024-09</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-on-surface-variant hover:text-error p-1.5 focus:outline-none cursor-pointer"
            aria-label="Logout"
            title="Logout"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-grow p-6 md:p-8 bg-surface-bright dark:bg-background overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-text-main dark:text-on-surface mb-1">
              {activeTab}
            </h1>
            <p className="font-body-sm text-body-sm text-text-muted dark:text-on-surface-variant">
              Welcome back to your academic repository workspace.
            </p>
          </div>

          <button className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-lg font-label-md text-label-md hover:bg-primary-container transition-all active:scale-95 shadow-sm cursor-pointer select-none">
            <span className="material-symbols-outlined text-lg">cloud_upload</span>
            Upload Document
          </button>
        </header>

        {/* Dynamic Panels */}
        {activeTab === 'Overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 bg-white dark:bg-surface-container rounded-2xl border border-outline-variant/50 academic-shadow">
                <span className="material-symbols-outlined text-primary text-3xl mb-3">folder</span>
                <h4 className="text-text-muted font-label-sm text-label-sm mb-1 uppercase tracking-wider">Total Documents</h4>
                <p className="font-display text-headline-lg text-text-main dark:text-on-surface font-bold">12</p>
              </div>
              <div className="p-6 bg-white dark:bg-surface-container rounded-2xl border border-outline-variant/50 academic-shadow">
                <span className="material-symbols-outlined text-secondary text-3xl mb-3">download</span>
                <h4 className="text-text-muted font-label-sm text-label-sm mb-1 uppercase tracking-wider">My Downloads</h4>
                <p className="font-display text-headline-lg text-text-main dark:text-on-surface font-bold">45</p>
              </div>
              <div className="p-6 bg-white dark:bg-surface-container rounded-2xl border border-outline-variant/50 academic-shadow">
                <span className="material-symbols-outlined text-tertiary text-3xl mb-3">auto_awesome</span>
                <h4 className="text-text-muted font-label-sm text-label-sm mb-1 uppercase tracking-wider">AI Queries Left</h4>
                <p className="font-display text-headline-lg text-text-main dark:text-on-surface font-bold">150</p>
              </div>
            </div>

            {/* Document Collection List */}
            <div className="bg-white dark:bg-surface-container rounded-2xl border border-outline-variant/50 academic-shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center">
                <h3 className="font-headline-sm text-headline-sm text-text-main dark:text-on-surface font-semibold">
                  Recent Uploads
                </h3>
                <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('My Uploads') }} className="text-primary hover:underline text-body-sm font-semibold">
                  View all
                </a>
              </div>
              
              <div className="divide-y divide-outline-variant/30">
                {myDocs.map((doc, idx) => (
                  <div key={idx} className="px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-surface-bright dark:hover:bg-surface-container-high transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-2xl select-none">description</span>
                      <div>
                        <h5 className="font-label-md text-label-md text-text-main dark:text-on-surface font-semibold">{doc.title}</h5>
                        <p className="text-[10px] text-text-muted">{doc.size} • Uploaded {doc.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        doc.status === 'Approved' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {doc.status}
                      </span>
                      <button className="text-on-surface-variant hover:text-primary p-1">
                        <span className="material-symbols-outlined text-lg">more_vert</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'Overview' && (
          <div className="bg-white dark:bg-surface-container rounded-2xl border border-outline-variant/50 academic-shadow p-12 text-center text-text-muted">
            <span className="material-symbols-outlined text-5xl mb-2 text-primary/40 select-none">construction</span>
            <h4 className="font-headline-sm text-headline-sm text-text-main dark:text-on-surface mb-2">Workspace Module Staged</h4>
            <p className="font-body-md text-body-md max-w-md mx-auto">
              The {activeTab} expansion dashboard is fully integrated into the routing architecture and is ready for database and backend API connections.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
