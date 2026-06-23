import { useState } from 'react'

export default function SettingsPanel({ showToast }) {
  const [activeSubTab, setActiveSubTab] = useState('profile')
  
  // Profile Form States
  const [fullName, setFullName] = useState('Dr. Julian Vane')
  const [institution, setInstitution] = useState('Global Research University')
  const [email, setEmail] = useState('j.vane@gru.edu.global')
  const [bio, setBio] = useState('Senior researcher specializing in architectural neural networks and cross-platform educational resource optimization.')

  // Toggle switch states
  const [twoFactor, setTwoFactor] = useState(true)
  const [resourceUpdates, setResourceUpdates] = useState(true)
  const [directMessages, setDirectMessages] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)

  // Visual Theme Preference
  const [themePref, setThemePref] = useState('light')

  const handleSaveChanges = () => {
    if (showToast) {
      showToast('Settings saved successfully')
    }
  }

  const subTabs = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'security', label: 'Security', icon: 'security' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'appearance', label: 'Appearance', icon: 'palette' },
    { id: 'payment', label: 'Payment Methods', icon: 'payments' }
  ]

  return (
    <div className="max-w-container-max mx-auto px-8 py-8 animate-slide-up">
      <div className="flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 select-none">
          <div>
            <h2 className="font-display text-headline-lg text-text-main font-bold">Account Settings</h2>
            <p className="font-body-md text-body-md text-text-muted mt-1">
              Manage your academic profile, security, and preferences.
            </p>
          </div>
          <button
            onClick={handleSaveChanges}
            className="bg-primary text-on-primary font-label-md text-label-md px-6 py-2.5 rounded-lg hover:bg-primary-container transition-all active:scale-95 duration-150 cursor-pointer shadow-md font-semibold self-stretch sm:self-auto text-center"
          >
            Save Changes
          </button>
        </div>

        {/* Bento Settings Grid */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Vertical Sub-navigation (Bento Column) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 select-none">
            <div className="bg-white border border-outline-variant rounded-2xl p-2 flex flex-col gap-1 shadow-sm h-fit">
              {subTabs.map((tab) => {
                const isActive = activeSubTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-label-md text-label-md transition-all duration-150 text-left cursor-pointer ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Storage Usage Widget */}
            <div className="bg-white border border-outline-variant rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="font-label-sm text-label-sm text-text-muted font-bold">Storage Usage</span>
                <span className="font-label-sm text-label-sm text-primary font-bold">78%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[78%] transition-all duration-500"></div>
              </div>
              <p className="font-label-sm text-label-sm text-text-muted mt-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">info</span>
                You have 2.2GB remaining
              </p>
            </div>
          </div>

          {/* Settings Canvas (Bento Column) */}
          <div className="col-span-12 lg:col-span-9">
            
            {/* 1. Profile Tab */}
            {activeSubTab === 'profile' && (
              <div className="bg-white border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-8">
                
                {/* Header profile details */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-outline-variant/30 select-none text-center sm:text-left">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary-fixed shadow-md">
                      <img
                        alt="Profile Avatar"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIs99qortrBjdSg5pdFUBpuJ545dIIhsaHp99ZGNMBbaiJ8dBsaa7Md-3_JcpJ6x6EP67CIjprWY5TnIE4JFuT2mmYnM_Oe6NKvdBl2hr6YpTWXRW93AqDd5adUmhlOujMhdhPbREgvKCzdrIZGXhyUINnBuAARLD3ntpRf32vkUWaq_d4UUEqPEaS15dt5DviyxgJvI1V_boOaM-Y-Nfu-fHBfB5uivppVITdMfRZiKmC7ydfCB5lzepDih9GBnMHs2zjVJoxWVSU"
                      />
                    </div>
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 bg-white p-2 rounded-full border border-outline-variant shadow-md hover:bg-bg-subtle transition-all cursor-pointer flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-text-main font-bold">Academic Identity</h3>
                    <p className="font-body-sm text-body-sm text-text-muted mt-0.5">
                      Update your public credentials for the Eduflux network.
                    </p>
                    <div className="flex gap-2 mt-4 justify-center sm:justify-start">
                      <span className="bg-primary/5 text-primary px-3 py-1 rounded-full font-label-sm text-label-sm border border-primary/10 font-bold">
                        Verified Researcher
                      </span>
                      <span className="bg-tertiary/5 text-tertiary px-3 py-1 rounded-full font-label-sm text-label-sm border border-tertiary/10 font-bold">
                        PhD Candidate
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-on-surface font-semibold">Full Name</label>
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="border border-outline-variant rounded-lg p-3 font-body-md text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      type="text"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-md text-label-md text-on-surface font-semibold">Institution</label>
                    <input
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="border border-outline-variant rounded-lg p-3 font-body-md text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      type="text"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="font-label-md text-label-md text-on-surface font-semibold">Email Address</label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border border-outline-variant rounded-lg p-3 font-body-md text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      type="email"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="font-label-md text-label-md text-on-surface font-semibold">Biography</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="border border-outline-variant rounded-lg p-3 font-body-md text-body-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                      rows={4}
                    />
                  </div>
                </div>

              </div>
            )}

            {/* 2. Security Tab */}
            {activeSubTab === 'security' && (
              <div className="bg-white border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
                <h3 className="font-headline-sm text-headline-sm text-text-main mb-6 font-bold">Security & Authentication</h3>
                
                <div className="flex flex-col gap-6">
                  {/* Password row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-surface-container-low rounded-2xl border border-outline-variant/30 gap-4">
                    <div className="flex gap-4">
                      <div className="bg-primary-container p-3 rounded-xl text-on-primary-container select-none">
                        <span className="material-symbols-outlined text-2xl">lock</span>
                      </div>
                      <div>
                        <p className="font-label-md text-label-md font-bold text-on-surface">Password</p>
                        <p className="font-body-sm text-body-sm text-text-muted mt-0.5 select-none">Last updated 3 months ago</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => showToast && showToast('Password reset link sent to email')}
                      className="text-primary font-label-md text-label-md font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
                    >
                      Change Password
                    </button>
                  </div>

                  {/* 2FA row */}
                  <div className="flex items-center justify-between p-5 bg-surface-container-low rounded-2xl border border-outline-variant/30">
                    <div className="flex gap-4">
                      <div className="bg-tertiary-container p-3 rounded-xl text-on-tertiary-container select-none">
                        <span className="material-symbols-outlined text-2xl">verified_user</span>
                      </div>
                      <div>
                        <p className="font-label-md text-label-md font-bold text-on-surface">Two-Factor Authentication (2FA)</p>
                        <p className="font-body-sm text-body-sm text-text-muted mt-0.5 select-none">Add an extra layer of security to your account.</p>
                      </div>
                    </div>
                    
                    {/* Toggle Slider */}
                    <button
                      type="button"
                      onClick={() => setTwoFactor(!twoFactor)}
                      className={`w-12 h-6 rounded-full relative transition-all duration-200 cursor-pointer ${
                        twoFactor ? 'bg-primary' : 'bg-surface-container-highest'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                          twoFactor ? 'right-1' : 'left-1'
                        }`}
                      ></div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Notifications Tab */}
            {activeSubTab === 'notifications' && (
              <div className="bg-white border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
                <h3 className="font-headline-sm text-headline-sm text-text-main mb-6 font-bold select-none">Communication Preferences</h3>
                
                <div className="flex flex-col gap-6">
                  {/* Notifications list toggles */}
                  <div className="flex items-center justify-between pb-6 border-b border-outline-variant/30">
                    <div>
                      <p className="font-label-md text-label-md font-bold text-on-surface">Resource Updates</p>
                      <p className="font-body-sm text-body-sm text-text-muted mt-0.5 select-none">
                        Get notified when someone uploads a related research paper.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResourceUpdates(!resourceUpdates)}
                      className={`w-12 h-6 rounded-full relative transition-all duration-200 cursor-pointer ${
                        resourceUpdates ? 'bg-primary' : 'bg-surface-container-highest'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                          resourceUpdates ? 'right-1' : 'left-1'
                        }`}
                      ></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pb-6 border-b border-outline-variant/30">
                    <div>
                      <p className="font-label-md text-label-md font-bold text-on-surface">Direct Messages</p>
                      <p className="font-body-sm text-body-sm text-text-muted mt-0.5 select-none">
                        Push notifications for peer-to-peer discussions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDirectMessages(!directMessages)}
                      className={`w-12 h-6 rounded-full relative transition-all duration-200 cursor-pointer ${
                        directMessages ? 'bg-primary' : 'bg-surface-container-highest'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                          directMessages ? 'right-1' : 'left-1'
                        }`}
                      ></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pb-6 border-b border-outline-variant/30">
                    <div>
                      <p className="font-label-md text-label-md font-bold text-on-surface">Marketing Emails</p>
                      <p className="font-body-sm text-body-sm text-text-muted mt-0.5 select-none">
                        Receive newsletters and product feature announcements.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMarketingEmails(!marketingEmails)}
                      className={`w-12 h-6 rounded-full relative transition-all duration-200 cursor-pointer ${
                        marketingEmails ? 'bg-primary' : 'bg-surface-container-highest'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                          marketingEmails ? 'right-1' : 'left-1'
                        }`}
                      ></div>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* 4. Appearance Tab */}
            {activeSubTab === 'appearance' && (
              <div className="bg-white border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
                <h3 className="font-headline-sm text-headline-sm text-text-main mb-6 font-bold select-none">Visual Interface</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
                  <button
                    onClick={() => setThemePref('light')}
                    className={`bg-bg-subtle rounded-xl p-4 flex flex-col gap-3 text-left cursor-pointer border-2 transition-all ${
                      themePref === 'light' ? 'border-primary' : 'border-outline-variant hover:border-text-muted'
                    }`}
                  >
                    <div className="w-full aspect-video bg-white rounded-lg border border-outline-variant"></div>
                    <span className="font-label-md text-label-md font-bold text-text-main">Light Mode</span>
                  </button>

                  <button
                    onClick={() => setThemePref('dark')}
                    className={`bg-inverse-surface rounded-xl p-4 flex flex-col gap-3 text-left cursor-pointer border-2 transition-all ${
                      themePref === 'dark' ? 'border-primary' : 'border-outline-variant/30 hover:border-white/40'
                    }`}
                  >
                    <div className="w-full aspect-video bg-slate-800 rounded-lg border border-slate-700"></div>
                    <span className="font-label-md text-label-md text-white font-bold">Dark Mode</span>
                  </button>

                  <button
                    onClick={() => setThemePref('system')}
                    className={`bg-surface-container rounded-xl p-4 flex flex-col gap-3 text-left cursor-pointer border-2 transition-all ${
                      themePref === 'system' ? 'border-primary' : 'border-outline-variant hover:border-text-muted'
                    }`}
                  >
                    <div className="w-full aspect-video bg-gradient-to-br from-white to-slate-800 rounded-lg border border-outline-variant"></div>
                    <span className="font-label-md text-label-md font-bold text-text-main">System Match</span>
                  </button>
                </div>

              </div>
            )}

            {/* 5. Payments & Subscription Tab */}
            {activeSubTab === 'payment' && (
              <div className="bg-white border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-8">
                
                <div className="flex justify-between items-center select-none pb-4 border-b border-outline-variant/30">
                  <h3 className="font-headline-sm text-headline-sm text-text-main font-bold">Subscription & Payments</h3>
                  <button
                    type="button"
                    onClick={() => showToast && showToast('Card verification system pending integrations')}
                    className="bg-primary text-on-primary font-label-sm text-label-sm px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer shadow hover:bg-primary-container font-semibold"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add Method
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Saved Credit Cards */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border border-primary/30 bg-primary-container/5 rounded-2xl gap-4">
                    <div className="flex gap-4">
                      <div className="w-12 h-8 bg-slate-800 rounded flex items-center justify-center text-white font-bold text-[10px] select-none shadow-sm">
                        VISA
                      </div>
                      <div>
                        <p className="font-label-md text-label-md font-bold text-on-surface">Visa ending in 4242</p>
                        <p className="font-body-sm text-body-sm text-text-muted mt-0.5 select-none">Expiry 08/26 • Default</p>
                      </div>
                    </div>
                    <div className="flex gap-4 select-none font-bold">
                      <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer bg-transparent border-none">
                        Edit
                      </button>
                      <button className="text-error cursor-pointer bg-transparent border-none">
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Subscription tier info */}
                  <div className="mt-4 select-none">
                    <p className="font-label-md text-label-md font-bold text-on-surface mb-4 uppercase tracking-wider text-xs text-text-muted">
                      Current Plan
                    </p>
                    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <p className="font-headline-sm text-headline-sm text-primary font-bold">Eduflux Research Pro</p>
                        <p className="font-body-sm text-body-sm text-text-muted mt-1 font-medium">
                          $19.00 / month • Renews Oct 12, 2023
                        </p>
                      </div>
                      <button className="border border-outline font-label-md text-label-md px-5 py-2.5 rounded-xl hover:bg-bg-subtle text-text-main font-semibold transition-all cursor-pointer bg-white">
                        Manage Plan
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  )
}
