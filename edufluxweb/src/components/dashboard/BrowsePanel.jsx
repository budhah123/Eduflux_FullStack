import { useState } from 'react'

export default function BrowsePanel() {
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('Most Recent')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('All Subjects')
  const [selectedSemester, setSelectedSemester] = useState('Fall 2023')
  const [selectedFileType, setSelectedFileType] = useState('All')
  const [bookmarkedIds, setBookmarkedIds] = useState([1, 4]) // initial bookmarked items
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const toggleBookmark = (id) => {
    if (bookmarkedIds.includes(id)) {
      setBookmarkedIds(bookmarkedIds.filter(bId => bId !== id))
    } else {
      setBookmarkedIds([...bookmarkedIds, id])
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedSubject('All Subjects')
    setSelectedSemester('Fall 2023')
    setSelectedFileType('All')
  }

  const documents = [
    {
      id: 1,
      title: 'Advanced Quantum Mechanics: Semester I Summary',
      subject: 'Physics',
      semester: 'Sem 5',
      type: 'PDF',
      category: 'Lecture Notes',
      author: 'Dr. Richard',
      authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLM8i8sfSTe6XM_LlOO5eLFT5UmEuEveU-rKnEKXHm1VgFscQVs9v10FoS0cftEU8zVWmlpA1caAb1DUcHGz7fUeoYF0R2DdJK61oKiVKqE-VOAtqf1JlmDM3gxKv5mTJs387FuTS_tjVnLIXiq4KcuNfXqQKcpksuo52AeetWbcp3jww9aPpSOaj-O1BppXBue-kl5RM99VhFFygTPtOe623USsNzNYanzkmp3kp36DOEOCbFdNSDAEgZhyUyOZm6VxvwjIFbwbVj',
      downloads: '1.2k',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtXKblxk3qOdK8R27XvBuYP590izZQrYTJvAE87x6w1nep6ReDGjcVdNTCdBsplCCIjKbrMbeNYPvC8vJf9YlUyz7m2bbj9KyEPoMLObHhZ0U36orF-_NjfTEnh1z_JfQBSqGiHEg6QYTJXna0owqoPt_loBzsQnR9nc2u0zSaJiMeOasbcWxE3PyTNR2CznK0DgnEBxNGxfibqWPI2KXd4asAZIKBtQY3MJ1VWIQEg2kTpuWn0OLquITUUcaYtePfRU89wsT75GHT'
    },
    {
      id: 2,
      title: 'Intro to Algorithms: Midterm Solutions 2023',
      subject: 'Computer Science',
      semester: 'Sem 3',
      type: 'DOCX',
      category: 'Past Exams',
      author: 'Alan M.',
      authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfuubKD42NCVTdLfNQ5H8RrVa1Tq6_ZAGWTouvOZuv1sahAO5KNwc8onlEVO6m6jq0ZjHAlOc8hWa-gzvq0_rQFYIkVAfbULnap_pFF8wY76XkQ77CCZstHITllDgTYyBtwKmuMYqu2esdVy5R0iAea9t5BhW0CFakGDiW-7OONAua9jMzxsNgBkXlHqRR-gB9DlO5HZ83a_DQPzVsBgYNbeFh7xNHVOlAj3uEoQu4wsPlcf--KjLTmB_yu6OrYSDCCUf6tcR3ZRTe',
      downloads: '842',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDq6PrARLljCtATbsHxvy93kXsIBB48nL9cXrzzh6TOXv1eSO5-Yb7ip7VlNjlufptUR0kq3c7WD5SascvuWrKjpQKXU0DZz611xkdfSg-sn03IR9iWYZy7LwAbHq_3S9FrmJad2JdGSOGKbNDVV1_s-e6jdGXTpA74d2c2vOqot1bzkZLyoEQQ3f7M1qJZSI9jUxyotr3T_RfnGoTN4CCqoKgBg0xhxlBkKdWYEYcqzNgV3nbDR9y8vOfMV3WkDFKaHlZfhHfzkMpL'
    },
    {
      id: 3,
      title: 'Market Analysis: Global Trends in EdTech 2024',
      subject: 'Business',
      semester: 'Graduate',
      type: 'PPT',
      category: 'Research Papers',
      author: 'Sarah V.',
      authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXCxeSeyV7icp8ROkAPnrVrol0JrGvCx_rG0PWV6PlrAqGbDs_A8rMdNwdVjM7xGlTOKV34bPK5swJpEFpsIbPVM2aNDrdB_QQXfm41R66tf0smnjZoGDlpNoP-orpNB_BFoIw2docJMKMQuvnodvWXOY0q6YP0Mqdw8_VPPZ7vQN6rKyiuWDsXxe_lIOtiMVU2nfpTHTQYe-Yt9bIng-08guXs6oxIotqveAI9efMSaj5gF14w11jt41JQEKy_HZokkAXBiVpYtFA',
      downloads: '3.4k',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDi7u018REexJUUoi7sPCKjVe6qB3xMxvn2-4AQVmZimOuOwrR8t8tHzLrJqvBmm7XdVQ_kR5XlPcEdmg5Z0jIOk8_WyahRRbjvdCwLvXX_48pkjh95w5Udu8JFnFHrbI63oSw0dwbXNPIQ8Qi9lOw7_ZSYdURyKY9ozyeA6PAkSrZuIaXHiQvQ-V5aQkXmgg6uX2XbkOiPwJ4BlqfRsVPWdPOfDoUp5b2jfwcfVqecrKWNNtvYmY2nJIuzbwCgMGJ6MCITdgSaKgJO'
    },
    {
      id: 4,
      title: 'Molecular Biology: Enzyme Kinetics Lab Guide',
      subject: 'Biology',
      semester: 'Sem 4',
      type: 'PDF',
      category: 'Lecture Notes',
      author: 'James K.',
      authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNrLQWh0cJmg0Tuu9PSOGajDb8n1qa6L3GaY1cZIfydRHuIzi9oYL19jTa5lHTDcSilLkWZJYLV-W_9ls6XDRMgIwfXUkOhXF_EURjdLEqc9rFyL24GKyV5ikJNnFNTPhq8wRBvpImVcv2cM6r20ikhM8Fj8CX2jbsPjwYy1Xp948W8qQMhq7Whx2XsHU3MC8C1aBRTEmii6ipzrLBtZ4b-AYpY1ILsGhABHaMKAhtxqe0lARdGW0KYUDYsSt0nvfn8xD3HNOd05hk',
      downloads: '2.1k',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCtY2n8gsyuBQxflZDXZntwL-8obvg_f2cy9z6j5yy7roifSZzuhda9Z8LLnEg_JYZV5xMwogOcDsMhJiEP8e8CeZZWwTC2ZIi-Yx81_NblKUG-kxjYQPj8LlUL0kwqlwUoTldpPr18hValShBot5E_zqsuK6e_gBVPB_LmD_dL2iBQanHkS11PVqburL5YXFOoMLoW5YBHHZxKuHDXDdNNvPvBGki6blFkJFVzi0qINuvewfJzA7_h0jeL7UfOM2-pOlUxaJLZ9tK'
    }
  ]

  const FilterContent = () => (
    <div className="space-y-8 select-none p-6 md:p-0">
      {/* Keywords */}
      <div>
        <label className="font-label-md text-label-md text-on-surface-variant mb-2 block">Keywords</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            page_info
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary font-body-sm text-body-sm transition-all outline-none"
            placeholder="Search titles, tags..."
            type="text"
          />
        </div>
      </div>

      {/* Category Checkboxes */}
      <div>
        <h3 className="font-label-md text-label-md font-bold mb-4">Category</h3>
        <div className="space-y-3">
          {['Lecture Notes', 'Past Exams', 'Research Papers', 'Textbook Solutions'].map((cat, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                defaultChecked={i === 0}
                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-0"
              />
              <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary transition-colors">
                {cat}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Subject Selector */}
      <div>
        <label className="font-label-md text-label-md text-on-surface-variant mb-2 block">Subject</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-3 font-body-sm text-body-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none cursor-pointer"
        >
          <option>All Subjects</option>
          <option>Computer Science</option>
          <option>Physics</option>
          <option>Biology</option>
          <option>Business Admin</option>
          <option>Mechanical Engineering</option>
        </select>
      </div>

      {/* Semester Tags */}
      <div>
        <h3 className="font-label-md text-label-md font-bold mb-4">Semester</h3>
        <div className="grid grid-cols-2 gap-2">
          {['Fall 2023', 'Spring 2024', 'Fall 2024', 'Summer 2024'].map((sem, i) => {
            const isSelected = selectedSemester === sem
            return (
              <button
                key={i}
                onClick={() => setSelectedSemester(sem)}
                className={`py-2 px-3 border rounded-lg font-label-sm text-label-sm hover:border-primary hover:text-primary transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary-container text-on-primary-container border-primary font-semibold'
                    : 'border-outline-variant text-on-surface-variant bg-white'
                }`}
              >
                {sem}
              </button>
            )
          })}
        </div>
      </div>

      {/* File Type Chips */}
      <div>
        <h3 className="font-label-md text-label-md font-bold mb-4">File Type</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'PDF', icon: 'description' },
            { label: 'PPT', icon: 'slideshow' },
            { label: 'DOCX', icon: 'article' }
          ].map((ft, i) => {
            const isSelected = selectedFileType === ft.label
            return (
              <span
                key={i}
                onClick={() => setSelectedFileType(isSelected ? 'All' : ft.label)}
                className={`px-3 py-1 rounded-full font-label-sm text-label-sm flex items-center gap-1 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-primary text-white font-semibold'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-outline-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{ft.icon}</span> {ft.label}
              </span>
            )
          })}
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={resetFilters}
        className="w-full py-2.5 text-primary font-label-md text-label-md border border-primary rounded-lg hover:bg-primary/5 transition-colors cursor-pointer bg-white"
      >
        Reset All Filters
      </button>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col md:flex-row relative animate-slide-up">
      {/* Left Filter Sidebar (Desktop) */}
      <aside className="w-72 bg-white border-r border-outline-variant h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar sticky top-16 hidden lg:block p-6">
        <FilterContent />
      </aside>

      {/* Mobile Filters Drawer Overlay */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 lg:hidden" onClick={() => setMobileFiltersOpen(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto custom-scrollbar transition-transform duration-300 ease-out p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-outline-variant">
              <h2 className="font-headline-sm text-headline-sm font-bold text-primary">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 hover:bg-surface-container rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <FilterContent />
          </div>
        </div>
      )}

      {/* Document Grid Area */}
      <section className="flex-grow p-8 bg-surface-bright custom-scrollbar overflow-y-auto h-[calc(100vh-64px)]">
        {/* Result Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 select-none">
          <div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Showing <span className="font-bold text-on-surface">128 documents</span> in {selectedSubject === 'All Subjects' ? 'Computer Science' : selectedSubject}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Grid / List Toggles */}
            <div className="flex bg-surface-container-low rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
                aria-label="Grid view"
              >
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
                aria-label="List view"
              >
                <span className="material-symbols-outlined text-[20px]">list</span>
              </button>
            </div>

            <div className="h-8 w-[1px] bg-outline-variant mx-1"></div>

            {/* Mobile filter button trigger */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-1 bg-white border border-outline-variant px-3 py-1.5 rounded-lg font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface cursor-pointer shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              Filters
            </button>

            {/* Sorting */}
            <div className="flex items-center gap-2 font-label-sm text-label-sm">
              <span className="text-on-surface-variant">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none focus:ring-0 font-bold text-on-surface cursor-pointer py-1 pl-1 pr-6"
              >
                <option>Most Recent</option>
                <option>Most Downloaded</option>
                <option>Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bento Grid layout */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {documents.map((doc) => {
              const isBookmarked = bookmarkedIds.includes(doc.id)
              return (
                <div
                  key={doc.id}
                  className="group bg-white rounded-2xl border border-outline-variant shadow-sm hover:shadow-md hover:border-primary transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-0.5"
                >
                  {/* Thumbnail Card Preview */}
                  <div className="relative h-40 bg-surface-container-low overflow-hidden select-none">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={doc.title}
                      src={doc.image}
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                        {doc.type}
                      </span>
                      <span className="px-2.5 py-0.5 bg-white/90 backdrop-blur-sm text-on-surface text-[10px] font-bold rounded-md uppercase tracking-wider">
                        {doc.category}
                      </span>
                    </div>
                    {/* Bookmark Toggle */}
                    <button
                      onClick={() => toggleBookmark(doc.id)}
                      className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full cursor-pointer shadow-sm hover:scale-105 transition-all ${
                        isBookmarked ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={isBookmarked ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        bookmark
                      </span>
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-label-md text-label-md font-bold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {doc.title}
                      </h4>
                      <div className="flex flex-wrap gap-1.5 mb-4 select-none">
                        <span className="px-2 py-0.5 bg-secondary-container/10 text-secondary font-label-sm text-[11px] rounded-md font-medium">
                          {doc.subject}
                        </span>
                        <span className="px-2 py-0.5 bg-tertiary-container/10 text-tertiary font-label-sm text-[11px] rounded-md font-medium">
                          {doc.semester}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-outline-variant flex items-center justify-between select-none">
                      <div className="flex items-center gap-2">
                        <img alt={doc.author} className="w-6 h-6 rounded-full border border-outline-variant" src={doc.authorAvatar} />
                        <span className="text-[12px] font-label-sm text-on-surface-variant font-medium">{doc.author}</span>
                      </div>
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        <span className="text-[12px] font-label-sm font-semibold">{doc.downloads}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="p-4 bg-surface-container-low flex gap-2 border-t border-outline-variant/30 select-none">
                    <button className="flex-1 py-2 bg-white border border-outline-variant rounded-lg font-label-sm text-label-sm hover:bg-surface-bright transition-colors cursor-pointer text-text-main shadow-sm">
                      Preview
                    </button>
                    <button className="flex-1 py-2 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm shadow-sm hover:shadow hover:bg-primary-container transition-all cursor-pointer">
                      Download
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* List view layout */
          <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-sm divide-y divide-outline-variant/30">
            {documents.map((doc) => {
              const isBookmarked = bookmarkedIds.includes(doc.id)
              return (
                <div
                  key={doc.id}
                  className="group p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-surface-bright transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 select-none">
                      <span className="material-symbols-outlined text-2xl">
                        {doc.type === 'PDF' ? 'picture_as_pdf' : 'article'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-label-md text-label-md font-bold text-text-main group-hover:text-primary transition-colors truncate">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-text-muted mt-1 select-none">
                        {doc.author} • {doc.category} • {doc.type} • {doc.downloads} downloads
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end select-none">
                    <span className="px-2.5 py-0.5 bg-secondary-container/10 text-secondary font-label-sm text-[11px] rounded-md font-bold">
                      {doc.subject}
                    </span>
                    <button
                      onClick={() => toggleBookmark(doc.id)}
                      className={`p-1.5 rounded-full hover:bg-surface-container cursor-pointer transition-colors ${
                        isBookmarked ? 'text-primary' : 'text-on-surface-variant'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={isBookmarked ? { fontVariationSettings: "'FILL' 1" } : {}}
                      >
                        bookmark
                      </span>
                    </button>
                    <button className="bg-primary text-on-primary px-4 py-1.5 rounded-lg font-label-sm text-label-sm shadow-sm hover:bg-primary-container transition-all cursor-pointer">
                      Download
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-12 mb-8 flex items-center justify-center gap-2 select-none">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary transition-all cursor-pointer bg-white">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-on-primary font-bold shadow-md cursor-pointer">
            1
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary transition-all cursor-pointer bg-white">
            2
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary transition-all cursor-pointer bg-white">
            3
          </button>
          <span className="px-2 text-on-surface-variant">...</span>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary transition-all cursor-pointer bg-white">
            12
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary transition-all cursor-pointer bg-white">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </section>
    </div>
  )
}
