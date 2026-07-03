import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { documentApi } from '../services/api/documentApi';
import { useViewDocument } from '../hooks/useViewDocument';


const MOCK_DOCS = {
  "1": {
    _id: "1",
    title: 'Advanced Quantum Mechanics: Semester I Summary',
    subject: 'Physics',
    semester: 'Sem 5',
    fileFormat: 'pdf',
    category: 'Lecture Notes',
    uploader: 'Dr. Richard',
    uploaderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLM8i8sfSTe6XM_LlOO5eLFT5UmEuEveU-rKnEKXHm1VgFscQVs9v10FoS0cftEU8zVWmlpA1caAb1DUcHGz7fUeoYF0R2DdJK61oKiVKqE-VOAtqf1JlmDM3gxKv5mTJs387FuTS_tjVnLIXiq4KcuNfXqQKcpksuo52AeetWbcp3jww9aPpSOaj-O1BppXBue-kl5RM99VhFFygTPtOe623USsNzNYanzkmp3kp36DOEOCbFdNSDAEgZhyUyOZm6VxvwjIFbwbVj',
    downloadCount: 1200,
    fileSize: 4500000,
    tags: ['Quantum', 'Physics', 'Mechanics'],
    createdAt: '2026-06-03T14:42:07.589Z',
    fileUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtXKblxk3qOdK8R27XvBuYP590izZQrYTJvAE87x6w1nep6ReDGjcVdNTCdBsplCCIjKbrMbeNYPvC8vJf9YlUyz7m2bbj9KyEPoMLObHhZ0U36orF-_NjfTEnh1z_JfQBSqGiHEg6QYTJXna0owqoPt_loBzsQnR9nc2u0zSaJiMeOasbcWxE3PyTNR2CznK0DgnEBxNGxfibqWPI2KXd4asAZIKBtQY3MJ1VWIQEg2kTpuWn0OLquITUUcaYtePfRU89wsT75GHT'
  },
  "2": {
    _id: "2",
    title: 'Intro to Algorithms: Midterm Solutions 2023',
    subject: 'Computer Science',
    semester: 'Sem 3',
    fileFormat: 'docx',
    category: 'Past Exams',
    uploader: 'Alan M.',
    uploaderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBfuubKD42NCVTdLfNQ5H8RrVa1Tq6_ZAGWTouvOZuv1sahAO5KNwc8onlEVO6m6jq0ZjHAlOc8hWa-gzvq0_rQFYIkVAfbULnap_pFF8wY76XkQ77CCZstHITllDgTYyBtwKmuMYqu2esdVy5R0iAea9t5BhW0CFakGDiW-7OONAua9jMzxsNgBkXlHqRR-gB9DlO5HZ83a_DQPzVsBgYNbeFh7xNHVOlAj3uEoQu4wsPlcf--KjLTmB_yu6OrYSDCCUf6tcR3ZRTe',
    downloadCount: 842,
    fileSize: 2200000,
    tags: ['Algorithms', 'Midterm', 'CS'],
    createdAt: '2026-05-12T02:50:52.123Z',
    fileUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDq6PrARLljCtATbsHxvy93kXsIBB48nL9cXrzzh6TOXv1eSO5-Yb7ip7VlNjlufptUR0kq3c7WD5SascvuWrKjpQKXU0DZz611xkdfSg-sn03IR9iWYZy7LwAbHq_3S9FrmJad2JdGSOGKbNDVV1_s-e6jdGXTpA74d2c2vOqot1bzkZLyoEQQ3f7M1qJZSI9jUxyotr3T_RfnGoTN4CCqoKgBg0xhxlBkKdWYEYcqzNgV3nbDR9y8vOfMV3WkDFKaHlZfhHfzkMpL'
  },
  "3": {
    _id: "3",
    title: 'Market Analysis: Global Trends in EdTech 2024',
    subject: 'Business',
    semester: 'Graduate',
    fileFormat: 'ppt',
    category: 'Research Papers',
    uploader: 'Sarah V.',
    uploaderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXCxeSeyV7icp8ROkAPnrVrol0JrGvCx_rG0PWV6PlrAqGbDs_A8rMdNwdVjM7xGlTOKV34bPK5swJpEFpsIbPVM2aNDrdB_QQXfm41R66tf0smnjZoGDlpNoP-orpNB_BFoIw2docJMKMQuvnodvWXOY0q6YP0Mqdw8_VPPZ7vQN6rKyiuWDsXxe_lIOtiMVU2nfpTHTQYe-Yt9bIng-08guXs6oxIotqveAI9efMSaj5gF14w11jt41JQEKy_HZokkAXBiVpYtFA',
    downloadCount: 320,
    fileSize: 8400000,
    tags: ['Market', 'EdTech', 'Business'],
    createdAt: '2026-04-12T02:46:11.343Z',
    fileUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtXKblxk3qOdK8R27XvBuYP590izZQrYTJvAE87x6w1nep6ReDGjcVdNTCdBsplCCIjKbrMbeNYPvC8vJf9YlUyz7m2bbj9KyEPoMLObHhZ0U36orF-_NjfTEnh1z_JfQBSqGiHEg6QYTJXna0owqoPt_loBzsQnR9nc2u0zSaJiMeOasbcWxE3PyTNR2CznK0DgnEBxNGxfibqWPI2KXd4asAZIKBtQY3MJ1VWIQEg2kTpuWn0OLquITUUcaYtePfRU89wsT75GHT'
  }
};

export default function DocumentViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { previewDocument } = useViewDocument(showToast);

  // States
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(12); // Simulated total pages
  const [saved, setSaved] = useState(false);

  // Related documents states
  const [relatedDocs, setRelatedDocs] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  // Current session user details
  const [currentUser, setCurrentUser] = useState({ name: 'Academic User', role: 'Researcher' });

  // Refs
  const previewContainerRef = useRef(null);
  // Guard: ensures the blob fetch fires exactly once per document ID.
  // Without this, any state change that causes the effect's deps to update
  // (even transitively) would trigger a second fetch.
  const hasFetchedRef = useRef(false);

  // Decode JWT to set user details in top nav
  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        const name = payload.name || payload.username || (payload.email && payload.email.split('@')[0]);
        const role = payload.role || 'Researcher';
        setCurrentUser({
          name: name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Academic User',
          role: role.charAt(0).toUpperCase() + role.slice(1)
        });
      } catch (e) {
        console.error('Failed to parse current user:', e);
      }
    }
  }, []);

  // Fetch document metadata
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        if (MOCK_DOCS[id]) {
          setDocument(MOCK_DOCS[id]);
          setPreviewUrl(MOCK_DOCS[id].fileUrl);
          setPreviewLoading(false);
          setLoading(false);
          return;
        }

        const data = await documentApi.getDocument(id);
        setDocument(data);
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(err.message || 'Failed to load document metadata.');
        showToast('Failed to load document details', 'error');
      } finally {
        if (!MOCK_DOCS[id]) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchDocument();
    }
  }, [id, showToast]);

  // Fetch authenticated document blob — runs once per page load for real docs.
  // previewDocument is intentionally omitted from deps: with useRef-based loading
  // state the callback is now stable, but we still guard with hasFetchedRef so
  // React Strict Mode's double-invoke doesn't send two network requests.
  useEffect(() => {
    if (!id || !document || MOCK_DOCS[id]) return;  // skip for mocks
    if (hasFetchedRef.current) return;              // already in-flight or done
    hasFetchedRef.current = true;

    setPreviewLoading(true);
    const fileType = (
      document.fileFormat ||
      document.fileUrl?.split('.').pop() ||
      ''
    ).toLowerCase().trim();

    previewDocument(id, fileType, (url) => {
      setPreviewUrl(url);
      setPreviewLoading(false);
    }, { autoRevoke: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, document]); // previewDocument is stable — safe to exclude

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && !previewUrl.startsWith('http')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Fetch dynamic related resources
  useEffect(() => {
    const fetchRelated = async () => {
      try {
        setRelatedLoading(true);
        const res = await documentApi.getAllDocuments();
        const docs = res.data || [];
        let filtered = docs.filter(d => d._id !== id);
        
        if (document) {
          const subject = document.subject?.toLowerCase();
          const category = document.category?.toLowerCase();
          filtered = filtered.filter(d => 
            d.subject?.toLowerCase() === subject || d.category?.toLowerCase() === category
          );
        }
        
        // Populate if empty with other documents
        if (filtered.length === 0) {
          filtered = docs.filter(d => d._id !== id);
        }
        
        setRelatedDocs(filtered.slice(0, 3));
      } catch (err) {
        console.error('Error fetching related documents:', err);
      } finally {
        setRelatedLoading(false);
      }
    };

    if (document) {
      fetchRelated();
    }
  }, [id, document]);

  // Sync fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!window.document.fullscreenElement);
    };
    window.document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Format bytes to human readable file size
  const formatSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Zoom handlers
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setScale(1.0);

  // Fullscreen trigger
  const handleToggleFullscreen = () => {
    const element = previewContainerRef.current;
    if (!element) return;

    if (!window.document.fullscreenElement) {
      element.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Failed to enter fullscreen:', err);
      });
    } else {
      window.document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error('Failed to exit fullscreen:', err);
      });
    }
  };

  // Download handler
  const handleDownload = async () => {
    try {
      setDownloading(true);
      if (MOCK_DOCS[id]) {
        // Trigger mock download
        const link = window.document.createElement('a');
        link.href = document.fileUrl;
        link.setAttribute('download', document.title);
        link.setAttribute('target', '_blank');
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        showToast('Download started successfully (Mock)', 'success');
        return;
      }

      const res = await documentApi.getDownloadUrl(id);
      if (res && res.url) {
        const link = window.document.createElement('a');
        link.href = res.url;
        link.setAttribute('download', document.title);
        link.setAttribute('target', '_blank');
        window.document.body.appendChild(link);
        link.click();
        link.remove();

        // Increment local download count
        setDocument(prev => prev ? { ...prev, downloadCount: (prev.downloadCount || 0) + 1 } : null);
        showToast('Download started successfully', 'success');
      } else {
        throw new Error('Download URL not found in response');
      }
    } catch (err) {
      console.error('Error downloading document:', err);
      showToast(err.message || 'Failed to download document', 'error');
    } finally {
      setDownloading(false);
    }
  };

  // Save to library handler
  const handleSaveToLibrary = () => {
    setSaved(!saved);
    showToast(!saved ? 'Saved to library' : 'Removed from library', 'success');
  };

  // Report handler
  const handleReport = () => {
    showToast('Report submitted for administrative review', 'success');
  };

  // print handler
  const handlePrint = () => {
    const iframe = window.document.getElementById('pdf-iframe');
    if (iframe) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } else {
      window.print();
    }
  };

  // Check file type
  const fileUrl = document?.fileUrl || '';
  const extension = (document?.fileFormat || fileUrl.split('.').pop() || '').toLowerCase();
  const isPDF = extension === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface text-text-main font-body-md">
        {/* Loading Header */}
        <div className="h-16 border-b border-outline-variant bg-white flex items-center justify-between px-8">
          <div className="w-32 h-6 bg-slate-200 rounded animate-pulse"></div>
          <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse"></div>
        </div>
        {/* Loading Content */}
        <main className="pt-8 px-8 max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-gutter">
          <div className="bg-white rounded-xl border border-outline-variant h-[800px] animate-pulse p-8 flex flex-col justify-between">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="flex-1 my-12 bg-slate-100 rounded"></div>
            <div className="h-10 bg-slate-200 rounded w-1/3 mx-auto"></div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-outline-variant p-6 h-[400px] animate-pulse"></div>
            <div className="bg-white rounded-xl border border-outline-variant p-6 h-[200px] animate-pulse"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-text-main">
        <div className="max-w-md w-full bg-white border border-outline-variant rounded-2xl p-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-6xl text-error mb-4">cloud_off</span>
          <h2 className="font-display text-headline-sm font-bold mb-2">Failed to Load Document</h2>
          <p className="text-body-sm text-text-muted mb-6">
            {error || 'The document you are looking for could not be found or has been removed.'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-full py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md shadow-md hover:bg-primary-container transition-all cursor-pointer"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-white border border-outline-variant text-text-main rounded-lg font-label-md text-label-md hover:bg-surface-bright transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-text-main font-body-md min-h-screen">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm fixed top-0 left-0 w-full z-50">
        <div className="flex justify-between items-center px-margin-desktop h-16 w-full max-w-container-max mx-auto">
          {/* Logo */}
          <div 
            onClick={() => navigate('/dashboard')}
            className="font-headline-sm text-headline-sm font-bold text-primary flex items-center gap-2 cursor-pointer hover:opacity-90 select-none"
          >
            <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_stories
            </span>
            <span>Eduflux</span>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-12">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 text-body-sm transition-all outline-none"
                placeholder="Search academic resources..."
                type="text"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/dashboard?tab=Browse&search=${encodeURIComponent(e.target.value)}`);
                  }
                }}
              />
            </div>
          </div>

          {/* Profile details */}
          <div className="flex items-center gap-4 select-none">
            <button 
              onClick={() => navigate('/dashboard?tab=Bookmarks')}
              className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-all cursor-pointer"
            >
              notifications
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-outline-variant">
              <div className="text-right hidden sm:block">
                <p className="font-label-md text-label-md font-bold leading-none text-on-surface">{currentUser.name}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mt-1">{currentUser.role}</p>
              </div>
              <img
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=3525cd&color=fff`}
                alt={currentUser.name}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-24 pb-12 px-margin-desktop max-w-container-max mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 mb-8 text-label-md font-label-md text-text-muted select-none">
          <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/dashboard')}>Home</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/dashboard?tab=Browse')}>
            {document.category || 'Notes'}
          </span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/dashboard?tab=Browse&subject=${encodeURIComponent(document.subject || '')}`)}>
            {document.subject || 'General'}
          </span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-on-surface font-bold truncate max-w-[200px]" title={document.title}>
            {document.title}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-gutter items-start">
          {/* Left Column: Preview Panel */}
          <section className="space-y-4">
            <div 
              ref={previewContainerRef}
              className={`bg-white rounded-xl border border-outline-variant overflow-hidden min-h-[800px] flex flex-col relative pdf-shadow transition-all ${
                isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen rounded-none' : ''
              }`}
            >
              {/* PDF Toolbar */}
              <div className="h-12 border-b border-outline-variant flex items-center justify-between px-6 bg-surface-container-low select-none">
                <div className="flex items-center gap-4">
                  <span className="text-label-sm font-label-sm text-text-muted uppercase">Page View</span>
                  <div className="h-4 w-px bg-outline-variant"></div>
                  <span className="text-label-md font-label-md text-on-surface">
                    {page} / {isImage ? 1 : totalPages}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrint}
                    className="material-symbols-outlined p-1.5 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant cursor-pointer"
                    title="Print document"
                  >
                    print
                  </button>
                  {previewUrl && (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="material-symbols-outlined p-1.5 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant cursor-pointer"
                      title="Open in new tab"
                    >
                      open_in_new
                    </a>
                  )}
                </div>
              </div>

              {/* Preview Content Area */}
              <div className="flex-1 bg-surface-dim p-8 overflow-y-auto flex flex-col items-center justify-center relative custom-scrollbar">
                {previewLoading ? (
                  <div className="flex flex-col items-center gap-4 text-text-muted select-none">
                    <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    <p className="font-label-md text-label-md">Loading document viewer...</p>
                  </div>
                ) : previewUrl ? (
                  isImage ? (
                    <div className="max-w-full max-h-[700px] overflow-auto flex items-center justify-center">
                      <img
                        src={previewUrl}
                        alt={document.title}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-md transition-transform duration-200"
                        style={{ transform: `scale(${scale})` }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center min-h-[680px]">
                      <iframe
                        id="pdf-iframe"
                        src={previewUrl}
                        title={document.title}
                        className="w-full h-full min-h-[680px] border-0 rounded shadow-md transition-transform duration-200"
                        style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
                      />
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center text-text-muted p-8 text-center select-none">
                    <span className="material-symbols-outlined text-5xl mb-3 text-outline">draft</span>
                    <p className="font-bold text-headline-sm">Preview Unavailable</p>
                    <p className="text-body-sm max-w-xs mt-1">This file type cannot be previewed. Please download the file to view its content.</p>
                  </div>
                )}
              </div>

              {/* Floating Bottom controls */}
              <div className="h-16 border border-outline-variant glass-blur flex items-center justify-center px-6 gap-8 absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full shadow-lg w-fit z-30 select-none">
                {/* Page Navigation */}
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1 || isImage}
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-95 text-on-surface disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <span className="text-label-md font-bold px-2 whitespace-nowrap">
                    Page {page} of {isImage ? 1 : totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages || isImage}
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-all active:scale-95 text-on-surface disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>

                <div className="h-6 w-px bg-outline-variant"></div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleZoomOut}
                    className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                    title="Zoom Out"
                  >
                    zoom_out
                  </button>
                  <span 
                    onClick={handleResetZoom}
                    className="text-label-md font-medium min-w-[3rem] text-center cursor-pointer hover:text-primary"
                    title="Reset Zoom"
                  >
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    zoom_in
                  </button>
                </div>

                <div className="h-6 w-px bg-outline-variant"></div>

                {/* Fullscreen Toggle */}
                <button
                  onClick={handleToggleFullscreen}
                  className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                </button>
              </div>
            </div>
          </section>

          {/* Right Column: Metadata Sidebar */}
          <aside className="space-y-6 select-none">
            {/* Info Card */}
            <div className="bg-white rounded-xl border border-outline-variant p-6 pdf-shadow flex flex-col">
              {/* Document Title */}
              <h2 className="font-headline-sm text-headline-sm text-on-surface mb-6 leading-tight font-bold">
                {document.title}
              </h2>

              {/* Uploader Card */}
              <div className="flex items-center gap-3 mb-6 p-3 bg-bg-subtle rounded-lg">
                <img
                  className="w-12 h-12 rounded-full object-cover border border-outline-variant"
                  src={document.uploaderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(document.uploader || 'User')}&background=3525cd&color=fff`}
                  alt={document.uploader || 'Uploader'}
                />
                <div>
                  <p className="text-label-md font-bold text-on-surface leading-tight">
                    {document.uploader || 'System User'}
                  </p>
                  <p className="text-label-sm text-text-muted mt-1">
                    {document.userId ? 'Uploader / Academic' : 'AI Academic Manager'}
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-label-sm font-bold">
                  {document.category || 'Notes'}
                </span>
                {document.subject && (
                  <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-label-sm font-bold">
                    {document.subject}
                  </span>
                )}
                {Array.isArray(document.tags) && document.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-label-sm font-bold">
                    {tag.trim()}
                  </span>
                )) || typeof document.tags === 'string' && document.tags.split(',').map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-label-sm font-bold">
                    {tag.trim()}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-outline-variant bg-surface-container-lowest">
                  <span className="text-headline-sm font-bold text-on-surface">
                    {document.downloadCount || 0}
                  </span>
                  <span className="text-label-sm text-text-muted uppercase tracking-tighter mt-1">
                    Downloads
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-outline-variant bg-surface-container-lowest">
                  <span className="text-headline-sm font-bold text-on-surface text-center truncate w-full">
                    {formatSize(document.fileSize)}
                  </span>
                  <span className="text-label-sm text-text-muted uppercase tracking-tighter mt-1">
                    File Size
                  </span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <button
                  disabled={downloading}
                  onClick={handleDownload}
                  className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all active:scale-[0.98] shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {downloading ? 'sync' : 'download'}
                  </span>
                  <span>{downloading ? 'Downloading...' : 'Download File'}</span>
                </button>
                <button
                  onClick={handleSaveToLibrary}
                  className={`w-full border py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    saved 
                      ? 'border-emerald-600 text-emerald-600 bg-emerald-50' 
                      : 'border-primary text-primary hover:bg-primary/5'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${saved ? 1 : 0}` }}>
                    bookmark
                  </span>
                  <span>{saved ? 'Saved in Library' : 'Save to Library'}</span>
                </button>
              </div>

              {/* Report button */}
              <button
                onClick={handleReport}
                className="w-full text-center text-label-sm text-text-muted mt-6 hover:text-academic-red transition-colors flex items-center justify-center gap-1 font-medium cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">report</span>
                <span>Report Document</span>
              </button>
            </div>

            {/* Related Resources panel */}
            <div className="space-y-4">
              <h3 className="font-headline-sm text-headline-sm text-on-surface px-1 font-bold">
                Related Resources
              </h3>

              {relatedLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-20 bg-slate-200 rounded-xl"></div>
                  <div className="h-20 bg-slate-200 rounded-xl"></div>
                </div>
              ) : relatedDocs.length > 0 ? (
                <div className="space-y-3">
                  {relatedDocs.map((doc) => {
                    const isPdfDoc = (doc.fileFormat || doc.fileUrl?.split('.').pop() || '').toLowerCase() === 'pdf';
                    return (
                      <div
                        key={doc._id}
                        onClick={() => navigate(`/documents/${doc._id}/view`)}
                        className="bg-white p-4 rounded-xl border border-outline-variant flex gap-4 hover:border-primary transition-all group cursor-pointer"
                      >
                        <div className="w-16 h-20 bg-surface-container-low rounded flex items-center justify-center text-primary group-hover:scale-105 transition-transform flex-shrink-0">
                          <span className="material-symbols-outlined text-4xl">
                            {isPdfDoc ? 'description' : 'terminal'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 text-sm leading-snug">
                            {doc.title}
                          </h4>
                          <p className="text-label-sm text-text-muted mt-1 truncate">
                            {doc.category || 'Notes'} • {formatSize(doc.fileSize)}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-academic-gold">
                            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="text-label-sm font-bold">4.8</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-body-sm text-text-muted italic text-center p-4">No related documents found</p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
