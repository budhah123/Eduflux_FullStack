import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { documentApi } from '../../services/api/documentApi'
import { useToast } from '../../context/ToastContext'


export default function BrowsePanel() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('Most Recent')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('All Subjects')
  const [selectedFileType, setSelectedFileType] = useState('All')
  const [bookmarkedIds, setBookmarkedIds] = useState([1, 4]) // initial bookmarked items
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [dbDocuments, setDbDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setLoading(true)
        const filters = {
          search: searchQuery,
          subject: selectedSubject === 'All Subjects' ? '' : selectedSubject,
          category: selectedCategory === 'All' ? '' : selectedCategory,
        }
        const res = await documentApi.getAllDocuments(filters)
        setDbDocuments(res.data || [])
      } catch (err) {
        console.error('Error fetching public documents:', err)
      } finally {
        setLoading(false)
      }
    }
    
    // Use debounce or fetch on changes
    const timer = setTimeout(() => {
      fetchDocs()
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery, selectedSubject, selectedCategory])

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
    setSelectedFileType('All')
    setSelectedCategory('All')
  }

  const handlePreviewClick = useCallback((doc) => {
    navigate(`/documents/${doc.id}/view`);
  }, [navigate]);

  const handleDownload = async (doc) => {
    try {
      if (typeof doc.id === 'number') {
        const link = window.document.createElement('a')
        link.href = doc.image
        link.setAttribute('download', doc.title)
        link.setAttribute('target', '_blank')
        window.document.body.appendChild(link)
        link.click()
        link.remove()
        return
      }
      
      const res = await documentApi.getDownloadUrl(doc.id)
      if (res && res.url) {
        const link = window.document.createElement('a')
        link.href = res.url
        link.setAttribute('download', doc.title)
        link.setAttribute('target', '_blank')
        window.document.body.appendChild(link)
        link.click()
        link.remove()
      }
    } catch (err) {
      console.error('Error downloading document:', err)
    }
  }

  const MOCK_DOCUMENTS = [
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

  const allDocuments = dbDocuments.map(doc => {
        const ext = doc.fileUrl ? doc.fileUrl.split('.').pop().toUpperCase() : 'PDF';
        const defaultThumbnails = {
          physics: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtXKblxk3qOdK8R27XvBuYP590izZQrYTJvAE87x6w1nep6ReDGjcVdNTCdBsplCCIjKbrMbeNYPvC8vJf9YlUyz7m2bbj9KyEPoMLObHhZ0U36orF-_NjfTEnh1z_JfQBSqGiHEg6QYTJXna0owqoPt_loBzsQnR9nc2u0zSaJiMeOasbcWxE3PyTNR2CznK0DgnEBxNGxfibqWPI2KXd4asAZIKBtQY3MJ1VWIQEg2kTpuWn0OLquITUUcaYtePfRU89wsT75GHT',
          computer: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDq6PrARLljCtATbsHxvy93kXsIBB48nL9cXrzzh6TOXv1eSO5-Yb7ip7VlNjlufptUR0kq3c7WD5SascvuWrKjpQKXU0DZz611xkdfSg-sn03IR9iWYZy7LwAbHq_3S9FrmJad2JdGSOGKbNDVV1_s-e6jdGXTpA74d2c2vOqot1bzkZLyoEQQ3f7M1qJZSI9jUxyotr3T_RfnGoTN4CCqoKgBg0xhxlBkKdWYEYcqzNgV3nbDR9y8vOfMV3WkDFKaHlZfhHfzkMpL',
          business: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDi7u018REexJUUoi7sPCKjVe6qB3xMxvn2-4AQVmZimOuOwrR8t8tHzLrJqvBmm7XdVQ_kR5XlPcEdmg5Z0jIOk8_WyahRRbjvdCwLvXX_48pkjh95w5Udu8JFnFHrbI63oSw0dwbXNPIQ8Qi9lOw7_ZSYdURyKY9ozyeA6PAkSrZuIaXHiQvQ-V5aQkXmgg6uX2XbkOiPwJ4BlqfRsVPWdPOfDoUp5b2jfwcfVqecrKWNNtvYmY2nJIuzbwCgMGJ6MCITdgSaKgJO',
          biology: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCtY2n8gsyuBQxflZDXZntwL-8obvg_f2cy9z6j5yy7roifSZzuhda9Z8LLnEg_JYZV5xMwogOcDsMhJiEP8e8CeZZWwTC2ZIi-Yx81_NblKUG-kxjYQPj8LlUL0kwqlwUoTldpPr18hValShBot5E_zqsuK6e_gBVPB_LmD_dL2iBQanHkS11PVqburL5YXFOoMLoW5YBHHZxKuHDXDdNNvPvBGki6blFkJFVzi0qINuvewfJzA7_h0jeL7UfOM2-pOlUxaJLZ9tK'
        };
        const subjectKey = doc.subject?.toLowerCase() || '';
        let image = defaultThumbnails.physics;
        if (subjectKey.includes('computer') || subjectKey.includes('code') || subjectKey.includes('programming') || subjectKey.includes('algorithm')) {
          image = defaultThumbnails.computer;
        } else if (subjectKey.includes('business') || subjectKey.includes('manage') || subjectKey.includes('market')) {
          image = defaultThumbnails.business;
        } else if (subjectKey.includes('bio') || subjectKey.includes('chem') || subjectKey.includes('nature') || subjectKey.includes('medical') || subjectKey.includes('tardigrade') || subjectKey.includes('enzyme')) {
          image = defaultThumbnails.biology;
        }
        return {
          id: doc._id,
          title: doc.title,
          subject: doc.subject || 'General',
          semester: doc.semester || 'N/A',
          type: ext,
          category: doc.category || 'Notes',
          author: doc.uploader || 'Instructor',
          authorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.uploader || 'User')}&background=3525cd&color=fff`,
          downloads: String(doc.downloadCount || 0),
          image: image,
          fileUrl: doc.fileUrl
        };
      });

  const documents = selectedFileType === 'All'
    ? allDocuments
    : allDocuments.filter(doc => doc.type.toUpperCase() === selectedFileType.toUpperCase());

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

      {/* Category Filter */}
      <div>
        <h3 className="font-label-md text-label-md font-bold mb-4">Category</h3>
        <div className="space-y-3">
          {['All', 'Lecture Notes', 'Past Exams', 'Research Papers', 'Textbook Solutions'].map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="category"
                checked={selectedCategory === cat}
                onChange={() => setSelectedCategory(cat)}
                className="w-5 h-5 rounded-full border-outline-variant text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
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

        {/* Bento Grid layout / List layout */}
        {loading ? (
          <div className="py-24 text-center select-none text-text-muted flex flex-col items-center justify-center gap-3">
            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="font-label-md text-label-md">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-24 text-center select-none text-text-muted">
            <span className="material-symbols-outlined text-5xl text-outline mb-2">folder_open</span>
            <p className="font-headline-sm text-headline-sm text-text-main font-semibold">No Documents Found</p>
            <p className="text-body-sm text-text-muted max-w-sm mx-auto mt-1">
              No results match your search filters or queries. Try adjusting your sidebar selections.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
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
                      <h4
                        onClick={() => handlePreviewClick(doc)}
                        className="font-label-md text-label-md font-bold leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2 cursor-pointer hover:underline flex items-center gap-1.5"
                      >
                        <span className="line-clamp-2">{doc.title}</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5 mb-4 select-none">
                        <span className="px-2 py-0.5 bg-secondary-container/10 text-secondary font-label-sm text-[11px] rounded-md font-medium">
                          {doc.subject}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-outline-variant flex items-center justify-between select-none">
                      <div className="flex items-center gap-2">
                        <img alt={doc.author} className="w-6 h-6 rounded-full border border-outline-variant animate-pulse-soft" src={doc.authorAvatar} />
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
                    <button
                      onClick={() => handlePreviewClick(doc)}
                      className="flex-1 py-2 bg-white border border-outline-variant rounded-lg font-label-sm text-label-sm hover:bg-surface-bright transition-colors cursor-pointer text-text-main shadow-sm flex items-center justify-center gap-1.5"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex-1 py-2 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm shadow-sm hover:shadow hover:bg-primary-container transition-all cursor-pointer"
                    >
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
                    <div className="min-w-0 cursor-pointer" onClick={() => handlePreviewClick(doc)}>
                      <h4 className="font-label-md text-label-md font-bold text-text-main group-hover:text-primary transition-colors truncate hover:underline flex items-center gap-1.5">
                        <span className="truncate">{doc.title}</span>
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
                    <button
                      onClick={() => handleDownload(doc)}
                      className="bg-primary text-on-primary px-4 py-1.5 rounded-lg font-label-sm text-label-sm shadow-sm hover:bg-primary-container transition-all cursor-pointer"
                    >
                      Download
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && documents.length > 0 && (
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
        )}
      </section>

    </div>
  )
}
