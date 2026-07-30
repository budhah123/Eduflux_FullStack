import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { documentApi } from '../../services/api/documentApi'
import { bookmarkApi } from '../../services/api/bookmarkApi'
import BookmarkButton from '../BookmarkButton'
import { useToast } from '../../context/ToastContext'


export default function BrowsePanel() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const sectionRef = useRef(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('Most Recent')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('All Subjects')
  const [selectedFileType, setSelectedFileType] = useState('All')
  const [bookmarkedIds, setBookmarkedIds] = useState([]) // user bookmarked document IDs
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [dbDocuments, setDbDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')
  
  // Pagination State
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setLoading(true)
        let sortByParam = 'createdAt'
        if (sortBy === 'Most Downloaded') sortByParam = 'downloadCount'

        const filters = {
          search: searchQuery,
          subject: selectedSubject === 'All Subjects' ? '' : selectedSubject,
          category: selectedCategory === 'All' ? '' : selectedCategory,
          sortBy: sortByParam,
          sortOrder: 'desc',
          page,
          limit,
        }
        const res = await documentApi.getAllDocuments(filters)

        if (res && typeof res === 'object') {
          const docsArr = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : [])
          setDbDocuments(docsArr)
          const totalVal = typeof res.total === 'number' ? res.total : docsArr.length
          const pagesVal = typeof res.totalPages === 'number' ? res.totalPages : Math.max(1, Math.ceil(totalVal / limit))
          setTotal(totalVal)
          setTotalPages(pagesVal)
        } else {
          setDbDocuments([])
          setTotal(0)
          setTotalPages(1)
        }
      } catch (err) {
        console.error('Error fetching public documents:', err)
        setDbDocuments([])
        setTotal(0)
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    }
    
    // Use debounce or fetch on changes
    const timer = setTimeout(() => {
      fetchDocs()
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery, selectedSubject, selectedCategory, sortBy, page, limit])

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const res = await bookmarkApi.getBookmarks()
        const items = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : [])
        const ids = items.map((b) => String(b.documentId || b.document?._id || b.document?.id || b._id || b.id))
        setBookmarkedIds(ids)
      } catch (err) {
        console.error('Error fetching bookmarks:', err)
      }
    }
    fetchBookmarks()
  }, [])

  const toggleBookmark = async (id) => {
    const idStr = String(id)
    const isBookmarked = bookmarkedIds.includes(idStr)
    try {
      if (isBookmarked) {
        await bookmarkApi.removeBookmark(idStr)
        setBookmarkedIds((prev) => prev.filter((bId) => bId !== idStr))
        if (showToast) showToast('Removed from bookmarks', 'info')
      } else {
        await bookmarkApi.addBookmark(idStr)
        setBookmarkedIds((prev) => [...prev, idStr])
        if (showToast) showToast('Saved to bookmarks', 'success')
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err)
      if (showToast) showToast(err.message || 'Failed to update bookmark', 'error')
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedSubject('All Subjects')
    setSelectedFileType('All')
    setSelectedCategory('All')
    setPage(1)
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage)
      if (sectionRef.current) {
        sectionRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  const getPageNumbers = (current, totalCount) => {
    if (totalCount <= 7) {
      return Array.from({ length: totalCount }, (_, i) => i + 1)
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', totalCount]
    }
    if (current >= totalCount - 3) {
      return [1, '...', totalCount - 4, totalCount - 3, totalCount - 2, totalCount - 1, totalCount]
    }
    return [1, '...', current - 1, current, current + 1, '...', totalCount]
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

  const allDocuments = dbDocuments.length > 0
    ? dbDocuments.map(doc => {
        let ext = (doc.fileFormat || '').toUpperCase();
        if (!ext && doc.fileUrl) {
          const parts = doc.fileUrl.split('?')[0].split('/');
          const filename = parts[parts.length - 1];
          const dotIndex = filename.lastIndexOf('.');
          ext = dotIndex !== -1 ? filename.slice(dotIndex + 1).toUpperCase() : 'PDF';
        }
        if (!ext) ext = 'PDF';

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
          fileUrl: doc.fileUrl,
          fileSize: doc.fileSize
        };
      })
    : MOCK_DOCUMENTS;

  const documents = selectedFileType === 'All'
    ? allDocuments
    : allDocuments.filter(doc => doc.type.toUpperCase() === selectedFileType.toUpperCase());

  const FilterContent = () => {
    const hasActiveFilters = searchQuery || selectedSubject !== 'All Subjects' || selectedCategory !== 'All' || selectedFileType !== 'All'

    return (
      <div className="space-y-6 select-none p-6 md:p-0">
        {/* Filter Section Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/50">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">tune</span>
            Filters
          </h3>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer transition-all"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Keywords Section */}
        <div className="border-b border-outline-variant/40 pb-6">
          <label className="font-label-md text-label-md font-bold text-on-surface mb-2.5 block flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">search</span>
            Keywords
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full pl-9 pr-8 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary font-body-sm text-body-sm transition-all outline-none text-on-surface placeholder:text-on-surface-variant/60 shadow-sm"
              placeholder="Search by title, tag..."
              type="text"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setPage(1)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-on-surface-variant hover:text-on-surface rounded-full transition-colors cursor-pointer"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="border-b border-outline-variant/40 pb-6">
          <label className="font-label-md text-label-md font-bold text-on-surface mb-3 block flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">category</span>
            Category
          </label>
          <div className="space-y-2.5">
            {['All', 'Lecture Notes', 'Past Exams', 'Research Papers', 'Textbook Solutions'].map((cat) => (
              <label key={cat} className="flex items-center gap-3 cursor-pointer group py-0.5">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === cat}
                  onChange={() => {
                    setSelectedCategory(cat)
                    setPage(1)
                  }}
                  className="w-4 h-4 rounded-full border-outline-variant text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer accent-primary"
                />
                <span className={`font-body-sm text-body-sm transition-colors ${selectedCategory === cat ? 'text-primary font-semibold' : 'text-on-surface group-hover:text-primary'}`}>
                  {cat}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Subject Selector */}
        <div className="border-b border-outline-variant/40 pb-6">
          <label className="font-label-md text-label-md font-bold text-on-surface mb-2.5 block flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">menu_book</span>
            Subject
          </label>
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value)
                setPage(1)
              }}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2.5 px-3 font-body-sm text-body-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer text-on-surface appearance-none pr-8 shadow-sm"
            >
              <option>All Subjects</option>
              <option>Computer Science</option>
              <option>Physics</option>
              <option>Biology</option>
              <option>Business Admin</option>
              <option>Mechanical Engineering</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">
              expand_more
            </span>
          </div>
        </div>

        {/* File Type Chips */}
        <div>
          <label className="font-label-md text-label-md font-bold text-on-surface mb-3 block flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">description</span>
            File Type
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'PDF', icon: 'description' },
              { label: 'PPT', icon: 'slideshow' },
              { label: 'DOCX', icon: 'article' }
            ].map((ft, i) => {
              const isSelected = selectedFileType === ft.label
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSelectedFileType(isSelected ? 'All' : ft.label)
                    setPage(1)
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-label-sm text-label-sm flex items-center gap-1.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary text-on-primary font-semibold shadow-sm scale-[1.02]'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-outline-variant/40 hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">{ft.icon}</span> {ft.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={resetFilters}
          className="w-full py-2.5 px-4 text-primary font-label-md text-label-md border border-primary/40 rounded-xl hover:bg-primary/5 hover:border-primary transition-all cursor-pointer bg-white font-semibold shadow-sm flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
          Reset All Filters
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col relative animate-slide-up bg-surface-bright h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar" ref={sectionRef}>
      {/* Sticky Horizontal Filter Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-outline-variant/60 px-6 lg:px-8 py-3.5 shadow-xs select-none">
        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full">
          {/* Keywords Search Input (Flex to fill available space) */}
          <div className="flex-1 min-w-[200px] relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full pl-9 pr-8 py-2 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary font-body-sm text-body-sm transition-all outline-none text-on-surface placeholder:text-on-surface-variant/60 shadow-xs"
              placeholder="Search titles, tags..."
              type="text"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setPage(1)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-on-surface-variant hover:text-on-surface rounded-full transition-colors cursor-pointer"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Category Dropdown (~160px) */}
          <div className="w-[160px] flex-shrink-0 relative">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setPage(1)
              }}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2 px-3 pr-8 font-body-sm text-body-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer text-on-surface appearance-none shadow-xs truncate"
            >
              <option value="All">All categories</option>
              <option value="Lecture Notes">Lecture notes</option>
              <option value="Past Exams">Past exams</option>
              <option value="Research Papers">Research papers</option>
              <option value="Textbook Solutions">Textbook solutions</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Subject Dropdown (~160px) */}
          <div className="w-[160px] flex-shrink-0 relative">
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value)
                setPage(1)
              }}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl py-2 px-3 pr-8 font-body-sm text-body-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none cursor-pointer text-on-surface appearance-none shadow-xs truncate"
            >
              <option value="All Subjects">All Subjects</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Physics">Physics</option>
              <option value="Biology">Biology</option>
              <option value="Business Admin">Business Admin</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Right-aligned: Sort by & View Toggle */}
          <div className="flex items-center gap-3 ml-auto flex-shrink-0">
            <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
              <span className="text-on-surface-variant whitespace-nowrap">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  setPage(1)
                }}
                className="bg-transparent border-none focus:ring-0 font-bold text-on-surface cursor-pointer py-1 pl-1 pr-5 text-body-sm outline-none"
              >
                <option>Most Recent</option>
                <option>Most Downloaded</option>
                <option>Highest Rated</option>
              </select>
            </div>

            <div className="flex bg-surface-container-low rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
                aria-label="Grid view"
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-white shadow-xs text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
                aria-label="List view"
              >
                <span className="material-symbols-outlined text-[18px]">list</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Document Grid Content */}
      <div className="px-6 lg:px-8 pt-6 pb-12 flex-1 flex flex-col">
        {/* Result Count Bar */}
        <div className="mb-6 select-none">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Showing <span className="font-bold text-on-surface">{total} {total === 1 ? 'document' : 'documents'}</span>{selectedSubject !== 'All Subjects' ? ` in ${selectedSubject}` : ''}
          </p>
        </div>

        {/* Document Cards Grid / List */}
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
              No results match your search filters or queries. Try adjusting your filter selections.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {documents.map((doc) => {
              const docId = String(doc.id || doc._id)
              const isBookmarked = bookmarkedIds.includes(docId)
              return (
                <div
                  key={doc.id || doc._id}
                  className="group bg-white rounded-2xl border border-outline-variant shadow-sm hover:shadow-md hover:border-primary transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-0.5"
                >
                  {/* Thumbnail Card Preview */}
                  <div className="relative h-36 bg-surface-container-low overflow-hidden select-none">
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
                    <BookmarkButton
                      documentId={doc.id || doc._id}
                      isBookmarked={isBookmarked}
                      onToggle={(id) => toggleBookmark(id)}
                      variant="card"
                    />
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

                    <div className="pt-3 border-t border-outline-variant flex items-center justify-between select-none">
                      <div className="flex items-center gap-2">
                        <img alt={doc.author} className="w-6 h-6 rounded-full border border-outline-variant animate-pulse-soft" src={doc.authorAvatar} />
                        <span className="text-[12px] font-label-sm text-on-surface-variant font-medium truncate max-w-[110px]">{doc.author}</span>
                      </div>
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        <span className="text-[12px] font-label-sm font-semibold">{doc.downloads}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="p-3.5 bg-surface-container-low flex gap-2 border-t border-outline-variant/30 select-none">
                    <button
                      onClick={() => handlePreviewClick(doc)}
                      className="flex-1 py-2 bg-white border border-outline-variant rounded-lg font-label-sm text-label-sm hover:bg-surface-bright transition-colors cursor-pointer text-text-main shadow-sm flex items-center justify-center gap-1.5"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex-1 py-2 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm shadow-sm hover:shadow hover:bg-primary-container transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
              const docId = String(doc.id || doc._id)
              const isBookmarked = bookmarkedIds.includes(docId)
              return (
                <div
                  key={doc.id || doc._id}
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
                    <BookmarkButton
                      documentId={doc.id || doc._id}
                      isBookmarked={isBookmarked}
                      onToggle={(id) => toggleBookmark(id)}
                      variant="icon"
                    />
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
        {!loading && documents.length > 0 && totalPages > 1 && (
          <div className="mt-12 mb-8 flex items-center justify-center gap-2 select-none">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary transition-all cursor-pointer bg-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-outline-variant disabled:hover:text-on-surface-variant"
              aria-label="Previous Page"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>

            {getPageNumbers(page, totalPages).map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-2 text-on-surface-variant font-medium">
                    ...
                  </span>
                )
              }
              const isCurrent = p === page
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  disabled={loading}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary bg-white'
                  }`}
                >
                  {p}
                </button>
              )
            })}

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:border-primary text-on-surface-variant hover:text-primary transition-all cursor-pointer bg-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-outline-variant disabled:hover:text-on-surface-variant"
              aria-label="Next Page"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
