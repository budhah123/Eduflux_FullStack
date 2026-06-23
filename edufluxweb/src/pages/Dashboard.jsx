import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import Sidebar from '../components/dashboard/Sidebar'
import Header from '../components/dashboard/Header'
import OverviewPanel from '../components/dashboard/OverviewPanel'
import BrowsePanel from '../components/dashboard/BrowsePanel'
import MyUploadsPanel from '../components/dashboard/MyUploadsPanel'
import AIChatPanel from '../components/dashboard/AIChatPanel'
import SettingsPanel from '../components/dashboard/SettingsPanel'

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState(() => {
    return window.location.pathname === '/my-upload' ? 'My Uploads' : 'Overview';
  })
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken')
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  useEffect(() => {
    if (location.pathname === '/my-upload') {
      setActiveTab('My Uploads')
    } else if (location.pathname === '/dashboard') {
      setActiveTab(prev => prev === 'My Uploads' ? 'Overview' : prev)
    }
  }, [location.pathname])

  const handleTabChange = (tabName) => {
    if (tabName === 'My Uploads') {
      navigate('/my-upload')
    } else {
      if (location.pathname !== '/dashboard') {
        navigate('/dashboard')
      }
      setActiveTab(tabName)
    }
  }

  return (
    <div className="min-h-screen bg-background text-text-main flex overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        onNewUploadClick={() => setUploadModalOpen(true)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col md:ml-[240px] h-screen overflow-hidden">
        {/* Top App Header */}
        <Header
          activeTab={activeTab}
          setMobileOpen={setMobileSidebarOpen}
        />

        {/* Scrollable Work Canvas */}
        <main className="flex-grow overflow-y-auto custom-scrollbar bg-surface-bright pb-10">
          {activeTab === 'Overview' && (
            <OverviewPanel setActiveTab={handleTabChange} />
          )}

          {activeTab === 'Browse' && (
            <BrowsePanel />
          )}

          {activeTab === 'My Uploads' && (
            <MyUploadsPanel
              uploadModalOpen={uploadModalOpen}
              setUploadModalOpen={setUploadModalOpen}
              showToast={showToast}
            />
          )}

          {activeTab === 'AI Chat' && (
            <AIChatPanel showToast={showToast} />
          )}

          {activeTab === 'Bookmarks' && (
            <div className="p-8 max-w-container-max mx-auto w-full select-none animate-slide-up">
              <h2 className="font-display text-headline-lg text-text-main font-bold mb-2">Bookmarked Resources</h2>
              <p className="font-body-md text-body-md text-text-muted mb-8">Quick access to your pinned academic files and notes.</p>
              <div className="bg-white border border-outline-variant rounded-2xl p-12 text-center text-text-muted shadow-sm">
                <span className="material-symbols-outlined text-5xl mb-2 text-primary">bookmark</span>
                <h4 className="font-headline-sm text-headline-sm text-text-main mb-2">Bookmarks Workspace</h4>
                <p className="font-body-md text-body-md max-w-md mx-auto">
                  Your pinned papers and lecture notes will appear here for immediate reference.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'Settings' && (
            <SettingsPanel showToast={showToast} />
          )}
        </main>
      </div>
    </div>
  )
}

