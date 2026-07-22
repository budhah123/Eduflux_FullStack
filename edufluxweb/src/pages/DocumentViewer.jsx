import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { documentApi } from '../services/api/documentApi';
import { useViewDocument } from '../hooks/useViewDocument';
import mammoth from 'mammoth/mammoth.browser';
import { Document as PdfDocument, Page as PdfPage, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const getSafeExtension = (fileFormat, fileUrl) => {
  if (fileFormat) return fileFormat;
  if (!fileUrl) return '';
  const parts = fileUrl.split('?')[0].split('/');
  const filename = parts[parts.length - 1];
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex !== -1 ? filename.slice(dotIndex + 1) : '';
};

const MOCK_DOCS = {
  1: {
    _id: '1',
    title: 'Database Management Systems Notes',
    subject: 'DBMS',
    semester: 'Semester 4',
    fileFormat: 'pdf',
    category: 'Notes',
    uploader: 'Dr. Sarah Jenkins',
    uploaderAvatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA7TNH1CqY7mHSrLlFsFe477pTOhMLTvhp5yFEStihowWKusV968aR5Qy2FmnLHfryHF9gX55EfB-xFDaVHozWAo7GBLKrO1awU3BopGqoA1e9z44ZeQfosBscEIFVaUxyKK6ae4doVVSo6siQpFvKSFGlktOtGfOv_HVZKQ7d9FmaDWmD34rB7Cdg-Pb6i_ASaJaEqi3KpVv_2iEoROQjOtRsDb3dl7QA3RbhNA1KfsiJa2-PCZDpBdw',
    downloadCount: 1200,
    fileSize: 4800000,
    tags: ['Notes', 'Semester 4', 'Computer Science'],
    createdAt: '2026-06-03T14:42:07.589Z',
    fileUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBtXKblxk3qOdK8R27XvBuYP590izZQrYTJvAE87x6w1nep6ReDGjcVdNTCdBsplCCIjKbrMbeNYPvC8vJf9YlUyz7m2bbj9KyEPoMLObHhZ0U36orF-_NjfTEnh1z_JfQBSqGiHEg6QYTJXna0owqoPt_loBzsQnR9nc2u0zSaJiMeOasbcWxE3PyTNR2CznK0DgnEBxNGxfibqWPI2KXd4asAZIKBtQY3MJ1VWIQEg2kTpuWn0OLquITUUcaYtePfRU89wsT75GHT',
    isLocked: false,
    unlockedVia: 'institutional',
  },
  2: {
    _id: '2',
    title:
      'Neural Architecture Search in Large Language Models: A Comprehensive Survey',
    subject: 'Artificial Intelligence',
    semester: 'Graduate',
    fileFormat: 'pdf',
    category: 'Research Paper',
    uploader: 'Dr. Elena Rodriguez',
    uploaderAvatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC8ddiYm73oAe4XEMSraooLoad0QTG-aKe1ifnd-RFyUJFqELcKwAM3qwQyDcgck832u_Mw_47TuZY_Iyi6892EAzUimH2utTMaLQ4xFkiD1Gr-Wq_GmoztfefQXOov5slH6T3ns8wSFIlfRagQSPf9kV8hYq-uyQo1AJhvRAS11pgs-uG_CnrKZZsMnXgVaLhyi8PFXuhf-LgfyqAP6c2b21geulc0l0WAKqarsQZyCgOOLwPLL-fJzw',
    downloadCount: 842,
    fileSize: 3600000,
    tags: ['Research Paper', 'AI', 'LLM'],
    createdAt: '2026-05-12T02:50:52.123Z',
    fileUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDq6PrARLljCtATbsHxvy93kXsIBB48nL9cXrzzh6TOXv1eSO5-Yb7ip7VlNjlufptUR0kq3c7WD5SascvuWrKjpQKXU0DZz611xkdfSg-sn03IR9iWYZy7LwAbHq_3S9FrmJad2JdGSOGKbNDVV1_s-e6jdGXTpA74d2c2vOqot1bzkZLyoEQQ3f7M1qJZSI9jUxyotr3T_RfnGoTN4CCqoKgBg0xhxlBkKdWYEYcqzNgV3nbDR9y8vOfMV3WkDFKaHlZfhHfzkMpL',
    isLocked: true,
  },
};

export default function DocumentViewer({
  documentId: customId,
  forcedState = null,
  overrideDoc = null,
  overrideUploadProgress = null,
  isComparisonMode = false,
}) {
  const routeParams = useParams();
  const id = customId || routeParams.id || '1';
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { previewDocument } = useViewDocument(showToast);

  // Core Document State
  const [document, setDocument] = useState(overrideDoc);
  const [loading, setLoading] = useState(!overrideDoc);
  const [error, setError] = useState(null);

  // Upload Progress & Payment States
  const [uploadProgress, setUploadProgress] = useState(
    overrideUploadProgress || {
      approvedUploadCount: 1,
      uploadsUntilNextCredit: 2,
      requiredCount: 3,
    },
  );
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('khalti');

  // Document Preview States
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(true);

  // UI Interactive States
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(42);
  const [saved, setSaved] = useState(false);

  // react-pdf Load States
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(null);

  // Related documents states
  const [relatedDocs, setRelatedDocs] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(true);

  // Current session user details
  const [currentUser, setCurrentUser] = useState({
    name: 'Academic User',
    role: 'Researcher',
  });

  // Refs
  const previewContainerRef = useRef(null);

  // Determine actual lock state (forcedState > document.isLocked)
  const isLocked =
    forcedState !== null ? forcedState === 'locked' : !!document?.isLocked;

  useEffect(() => {
    setDocument(overrideDoc || null);
    setLoading(!overrideDoc);
    setError(null);
    setPreviewUrl(null);
    setPreviewHtml(null);
    setPreviewError(null);
    setPreviewLoading(true);
    setPdfLoading(true);
    setPdfError(null);
  }, [id, overrideDoc]);

  // Sync user info from token
  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window
            .atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''),
        );
        const payload = JSON.parse(jsonPayload);
        const name =
          payload.name ||
          payload.username ||
          (payload.email && payload.email.split('@')[0]);
        const role = payload.role || 'Researcher';
        setCurrentUser({
          name: name
            ? name.charAt(0).toUpperCase() + name.slice(1)
            : 'Academic User',
          role: role.charAt(0).toUpperCase() + role.slice(1),
        });
      } catch (e) {
        console.error('Failed to parse current user:', e);
      }
    }
  }, []);

  // Fetch document metadata & lock status from GET /documents/:id
  useEffect(() => {
    if (overrideDoc) {
      setDocument(overrideDoc);
      setLoading(false);
      return;
    }

    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fallback to mock doc if given mock ID in development/demo mode
        if (MOCK_DOCS[id]) {
          const docData = MOCK_DOCS[id];
          setDocument(docData);
          setLoading(false);
          return;
        }

        const data = await documentApi.getDocument(id);
        setDocument(data);
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(err.message || 'Failed to load document metadata.');
        if (MOCK_DOCS['1']) {
          setDocument(MOCK_DOCS[id] || MOCK_DOCS['1']);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDocument();
    }
  }, [id, overrideDoc]);

  // Fetch user upload progress from GET /users/me/upload-progress
  useEffect(() => {
    if (overrideUploadProgress) {
      setUploadProgress(overrideUploadProgress);
      return;
    }

    const fetchUploadProgress = async () => {
      try {
        const res = await documentApi.getUploadProgress();
        if (res) {
          const approved = res.approvedUploadCount ?? res.approvedUploads ?? 1;
          const remaining =
            res.uploadsUntilNextCredit ?? Math.max(0, 3 - approved);
          setUploadProgress({
            approvedUploadCount: approved,
            uploadsUntilNextCredit: remaining,
            requiredCount: 3,
          });
        }
      } catch (e) {
        console.warn('Upload progress fetch fallback to document state:', e);
        const approved = document?.approvedUploadCount ?? 1;
        setUploadProgress({
          approvedUploadCount: approved,
          uploadsUntilNextCredit: Math.max(0, 3 - approved),
          requiredCount: 3,
        });
      }
    };

    fetchUploadProgress();
  }, [document, overrideUploadProgress]);

  // Fetch preview document content (Only if unlocked)
  useEffect(() => {
    if (!id || !document || isLocked) {
      setPreviewLoading(false);
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewHtml(null);
    setPreviewUrl(null);

    const fileType = getSafeExtension(document.fileFormat, document.fileUrl)
      .toLowerCase()
      .trim();

    if (fileType === 'docx') {
      const fetchAndConvertWord = async () => {
        try {
          const res = await documentApi.getPreviewUrl(id);
          if (res?.url) {
            const response = await fetch(res.url);
            const arrayBuffer = await response.arrayBuffer();
            const { value } = await mammoth.convertToHtml({ arrayBuffer });
            setPreviewHtml(value || '');
          }
        } catch (err) {
          console.error('Word conversion error:', err);
          setPreviewError(err.message || 'Failed to preview Word document.');
        } finally {
          setPreviewLoading(false);
        }
      };
      fetchAndConvertWord();
      return;
    }

    // Default to url or preview helper
    if (document.fileUrl) {
      setPreviewUrl(document.fileUrl);
      setPreviewLoading(false);
    } else {
      previewDocument(
        id,
        fileType,
        (result) => {
          if (result?.kind === 'html') setPreviewHtml(result.html);
          if (result?.kind === 'url') setPreviewUrl(result.url);
          setPreviewLoading(false);
        },
        { autoRevoke: false },
      );
    }
  }, [id, document, isLocked, overrideDoc, previewDocument]);

  // Fetch related resources
  useEffect(() => {
    const fetchRelated = async () => {
      try {
        setRelatedLoading(true);
        const res = await documentApi.getAllDocuments();
        const docs = res.data || res || [];
        if (Array.isArray(docs)) {
          setRelatedDocs(docs.filter((d) => d._id !== id).slice(0, 2));
        }
      } catch (err) {
        console.error('Error fetching related docs:', err);
      } finally {
        setRelatedLoading(false);
      }
    };

    if (document) {
      fetchRelated();
    }
  }, [id, document]);

  // Sync pdf load state
  useEffect(() => {
    if (previewUrl) {
      setPdfLoading(true);
      setPdfError(null);
    }
  }, [previewUrl]);

  const onPdfLoadSuccess = ({ numPages }) => {
    setTotalPages(numPages);
    setPdfLoading(false);
  };

  const onPdfLoadError = () => {
    setPdfError('Failed to render PDF preview');
    setPdfLoading(false);
  };

  // Download PDF Handler (Calls GET /documents/:id/download)
  const handleDownload = async () => {
    if (isLocked) {
      showToast('Document is locked. Please unlock to download.', 'error');
      return;
    }

    try {
      setDownloading(true);
      if (MOCK_DOCS[id]) {
        const link = window.document.createElement('a');
        link.href = document.fileUrl;
        link.setAttribute('download', `${document.title}.pdf`);
        link.setAttribute('target', '_blank');
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        showToast('Download started successfully', 'success');
        return;
      }

      const res = await documentApi.getDownloadUrl(id);
      if (res && res.url) {
        const link = window.document.createElement('a');
        link.href = res.url;
        link.setAttribute('download', `${document.title}.pdf`);
        link.setAttribute('target', '_blank');
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        showToast('Download started successfully', 'success');
      } else {
        throw new Error('Download URL not found.');
      }
    } catch (err) {
      console.error('Download error:', err);
      showToast(err.message || 'Failed to download document', 'error');
    } finally {
      setDownloading(false);
    }
  };

  // Initiate Payment Handler (Calls POST /payment/initiate)
  const handleInitiatePayment = async (provider = selectedProvider) => {
    try {
      setInitiatingPayment(true);
      const payload = {
        planType: 'monthly',
        provider: provider.toLowerCase(),
        amount: 500,
      };

      const res = await documentApi.initiatePayment(payload);

      if (res?.payment_url) {
        window.location.href = res.payment_url;
      } else if (res?.formUrl && res?.fields) {
        // Build eSewa POST form dynamically
        const form = window.document.createElement('form');
        form.method = 'POST';
        form.action = res.formUrl;
        Object.entries(res.fields).forEach(([key, value]) => {
          const hiddenField = window.document.createElement('input');
          hiddenField.type = 'hidden';
          hiddenField.name = key;
          hiddenField.value = value;
          form.appendChild(hiddenField);
        });
        window.document.body.appendChild(form);
        form.submit();
      } else {
        showToast(
          `Initiating ${provider.toUpperCase()} payment gateway...`,
          'info',
        );
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      showToast(err.message || 'Payment initiation failed.', 'error');
    } finally {
      setInitiatingPayment(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '4.8 MB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 2.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.5));

  const handleToggleFullscreen = () => {
    const element = previewContainerRef.current;
    if (!element) return;
    if (!window.document.fullscreenElement) {
      element
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(console.error);
    } else {
      window.document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(console.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[600px] bg-surface text-text-main flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-body-sm text-text-muted font-medium">
            Loading document viewer...
          </p>
        </div>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="min-h-[500px] bg-surface flex flex-col items-center justify-center p-6 text-text-main">
        <div className="max-w-md w-full bg-white border border-outline-variant rounded-2xl p-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-error mb-3">
            cloud_off
          </span>
          <h3 className="font-headline-sm font-bold mb-2">
            Failed to Load Document
          </h3>
          <p className="text-body-sm text-text-muted mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const docData = document || MOCK_DOCS['1'];

  return (
    <div
      className={`bg-surface text-text-main font-body-md ${isComparisonMode ? '' : 'min-h-screen'}`}
    >
      {/* Top Navigation Bar */}
      {!isComparisonMode && (
        <nav className="bg-surface shadow-sm fixed top-0 left-0 w-full z-50">
          <div className="flex justify-between items-center px-margin-desktop h-16 w-full max-w-container-max mx-auto">
            <div
              onClick={() => navigate('/dashboard')}
              className="font-headline-sm text-headline-sm font-bold text-primary flex items-center gap-2 cursor-pointer"
            >
              <span
                className="material-symbols-outlined text-primary text-[28px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_stories
              </span>
              <span>Eduflux</span>
            </div>

            <div className="hidden md:flex flex-1 max-w-2xl mx-12">
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  search
                </span>
                <input
                  className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 text-body-sm transition-all outline-none"
                  placeholder="Search academic resources..."
                  type="text"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 select-none">
              <button className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-all">
                notifications
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-outline-variant">
                <div className="text-right hidden sm:block">
                  <p className="font-label-md text-label-md font-bold leading-none text-on-surface">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mt-1">
                    {currentUser.role}
                  </p>
                </div>
                <img
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                  src={
                    docData.uploaderAvatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=3525cd&color=fff`
                  }
                  alt={currentUser.name}
                />
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Container */}
      <main
        className={`${isComparisonMode ? 'p-4' : 'pt-24 pb-12 px-margin-desktop max-w-container-max mx-auto'}`}
      >
        {/* Breadcrumb Navigation */}
        {!isComparisonMode && (
          <nav className="flex items-center gap-2 mb-8 text-label-md font-label-md text-text-muted select-none">
            <span
              className="hover:text-primary transition-colors cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              Home
            </span>
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
            <span className="hover:text-primary transition-colors cursor-pointer">
              {docData.category || 'Notes'}
            </span>
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
            <span className="hover:text-primary transition-colors cursor-pointer">
              {docData.subject || 'DBMS'}
            </span>
            <span className="material-symbols-outlined text-sm">
              chevron_right
            </span>
            <span
              className="text-on-surface font-bold truncate max-w-[240px]"
              title={docData.title}
            >
              {docData.title}
            </span>
          </nav>
        )}

        {/* 2-Column Grid Layout matching Stitch specification */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-gutter items-start">
          {/* LEFT COLUMN: PDF / Preview Area */}
          <section className="space-y-4">
            <div
              ref={previewContainerRef}
              className={`bg-white rounded-xl border border-outline-variant overflow-hidden min-h-[750px] flex flex-col relative pdf-shadow transition-all ${
                isFullscreen
                  ? 'fixed inset-0 z-50 w-screen h-screen rounded-none'
                  : ''
              }`}
            >
              {/* Internal PDF Toolbar */}
              <div className="h-12 border-b border-outline-variant flex items-center justify-between px-6 bg-surface-container-low select-none">
                <div className="flex items-center gap-4">
                  <span className="text-label-sm font-label-sm text-text-muted uppercase tracking-wider">
                    PAGE VIEW
                  </span>
                  <div className="h-4 w-px bg-outline-variant"></div>
                  <span className="text-label-md font-label-md text-on-surface font-medium">
                    {page} / {totalPages}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="material-symbols-outlined p-1.5 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant cursor-pointer"
                    title="Print document"
                  >
                    print
                  </button>
                  <button
                    className="material-symbols-outlined p-1.5 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant cursor-pointer"
                    title="Open in new tab"
                  >
                    open_in_new
                  </button>
                </div>
              </div>

              {/* PDF Content Area */}
              <div className="flex-1 bg-surface-dim p-6 md:p-8 overflow-y-auto flex flex-col items-center justify-start relative custom-scrollbar">
                {/* STATE 1: LOCKED PREVIEW DESIGN */}
                {isLocked ? (
                  <div className="w-full flex flex-col items-center justify-center relative min-h-[650px]">
                    {/* Simulated Document Preview with 8px Blur */}
                    <div className="bg-white w-full max-w-[800px] aspect-[1/1.414] shadow-xl p-12 flex flex-col gap-6 document-blur select-none pointer-events-none">
                      <div className="border-b-2 border-primary-container pb-4 mb-4">
                        <h1 className="font-headline-md text-headline-md text-on-surface mb-2">
                          {docData.title}
                        </h1>
                        <p className="text-body-sm text-text-muted">
                          {docData.uploader} • {docData.subject}
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="h-4 w-full bg-surface-container-highest rounded"></div>
                        <div className="h-4 w-full bg-surface-container rounded"></div>
                        <div className="h-4 w-3/4 bg-surface-container rounded"></div>
                        <div className="h-4 w-5/6 bg-surface-container rounded"></div>
                      </div>
                      <div className="h-48 w-full bg-surface-container-low rounded-xl border border-dashed border-outline flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-outline">
                          lock
                        </span>
                      </div>
                      <div className="space-y-4 pt-4">
                        <div className="h-4 w-full bg-surface-container rounded"></div>
                        <div className="h-4 w-full bg-surface-container rounded"></div>
                        <div className="h-4 w-1/2 bg-surface-container rounded"></div>
                      </div>
                    </div>

                    {/* Glassmorphism Lock Card Overlay (Exact Stitch Spec) */}
                    <div className="absolute inset-0 flex items-center justify-center p-6 z-20">
                      <div className="glass-panel max-w-md w-full p-8 md:p-10 rounded-2xl shadow-2xl text-center flex flex-col items-center transition-all duration-300">
                        {/* Lock Icon Badge */}
                        <div className="w-20 h-20 bg-primary-container/15 text-primary rounded-full flex items-center justify-center mb-6 shadow-inner">
                          <span
                            className="material-symbols-outlined text-[40px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            lock
                          </span>
                        </div>

                        {/* Title & Description */}
                        <h2 className="font-headline-md text-headline-md text-text-main mb-3 font-bold">
                          Unlock full document
                        </h2>
                        <p className="font-body-md text-body-md text-text-muted mb-6 px-2 leading-relaxed text-sm">
                          To continue reading this academic resource and access
                          all {totalPages} pages, please upgrade to a researcher
                          account or unlock this specific file.
                        </p>

                        {/* Upload Progress Indicator Widget */}
                        <div className="w-full bg-white/80 border border-outline-variant/60 rounded-xl p-4 mb-6 text-left shadow-sm">
                          <div className="flex items-center justify-between text-xs font-bold mb-2 text-text-main">
                            <span className="flex items-center gap-1.5 text-primary">
                              <span className="material-symbols-outlined text-base">
                                cloud_upload
                              </span>
                              Upload Progress
                            </span>
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {uploadProgress.approvedUploadCount} /{' '}
                              {uploadProgress.requiredCount} Uploaded
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                            <div
                              className="bg-primary h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, (uploadProgress.approvedUploadCount / uploadProgress.requiredCount) * 100)}%`,
                              }}
                            ></div>
                          </div>
                          <p className="text-[11px] text-text-muted font-medium">
                            💡 Upload {uploadProgress.uploadsUntilNextCredit}{' '}
                            more approved document
                            {uploadProgress.uploadsUntilNextCredit !== 1
                              ? 's'
                              : ''}{' '}
                            to unlock for free.
                          </p>
                        </div>

                        {/* Payment Options (Khalti & eSewa) */}
                        <div className="w-full space-y-3">
                          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container-low rounded-xl mb-3">
                            <button
                              onClick={() => setSelectedProvider('khalti')}
                              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                selectedProvider === 'khalti'
                                  ? 'bg-purple-600 text-white shadow-sm'
                                  : 'text-text-muted hover:text-text-main'
                              }`}
                            >
                              Khalti
                            </button>
                            <button
                              onClick={() => setSelectedProvider('esewa')}
                              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                selectedProvider === 'esewa'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'text-text-muted hover:text-text-main'
                              }`}
                            >
                              eSewa
                            </button>
                          </div>

                          {/* CTA Unlock Button */}
                          <button
                            onClick={() =>
                              navigate(`/pricing?documentId=${id}`)
                            }
                            className="w-full py-4 bg-primary text-on-primary font-label-md text-label-md rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:bg-primary-container transition-all active:scale-[0.98] flex items-center justify-center gap-2 font-bold cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              bolt
                            </span>
                            <span>Unlock Options & Pricing</span>
                          </button>

                          <button
                            onClick={() =>
                              navigate(`/pricing?documentId=${id}`)
                            }
                            className="mt-2 text-primary font-label-sm text-label-sm hover:underline cursor-pointer font-semibold"
                          >
                            Compare Subscription & Contribution Plans
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* STATE 2: UNLOCKED FULL ACCESS DESIGN */
                  <div className="w-full flex flex-col items-center justify-center relative">
                    {previewLoading ? (
                      <div className="flex flex-col items-center gap-3 text-text-muted py-24">
                        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mb-2" />
                        <span className="text-sm font-medium">
                          Loading document viewer...
                        </span>
                      </div>
                    ) : previewHtml ? (
                      <div className="w-full max-w-[800px] bg-white rounded-xl border border-outline-variant p-8 md:p-12 shadow-xl">
                        <div
                          className="prose prose-slate max-w-none"
                          dangerouslySetInnerHTML={{ __html: previewHtml }}
                        />
                      </div>
                    ) : (
                      <div className="bg-white w-full max-w-[800px] aspect-[1/1.414] shadow-xl p-12 md:p-16 relative group transition-transform hover:scale-[1.002]">
                        <div className="border-b-2 border-primary-container pb-4 mb-8">
                          <h1 className="font-headline-md text-headline-md text-on-surface mb-2 font-bold">
                            {docData.title}
                          </h1>
                          <p className="text-body-sm text-text-muted">
                            {docData.subject} • Unit 1: Relational Data Models
                          </p>
                        </div>
                        <div className="space-y-6 text-on-surface leading-relaxed">
                          <p className="text-body-md">
                            A database-management system (DBMS) is a collection
                            of interrelated data and a set of programs to access
                            those data. The collection of data, usually referred
                            to as the database, contains information relevant to
                            an enterprise.
                          </p>
                          <div className="bg-bg-subtle p-6 rounded-lg border-l-4 border-primary">
                            <h3 className="font-bold text-primary mb-2">
                              Key Concepts:
                            </h3>
                            <ul class="list-disc pl-5 space-y-1 text-body-sm">
                              <li>Data Independence</li>
                              <li>Efficient Data Access</li>
                              <li>Data Integrity and Security</li>
                              <li>Concurrent Access and Crash Recovery</li>
                            </ul>
                          </div>
                          <div className="w-full h-56 bg-surface-container-low rounded-xl border border-dashed border-outline flex flex-col items-center justify-center p-4">
                            <div className="flex gap-4 items-end mb-4">
                              <div className="w-12 h-16 bg-primary/20 rounded-t border-t-2 border-primary"></div>
                              <div className="w-12 h-24 bg-secondary/20 rounded-t border-t-2 border-secondary"></div>
                              <div className="w-12 h-12 bg-tertiary-fixed-dim/20 rounded-t border-t-2 border-tertiary"></div>
                              <div className="w-12 h-20 bg-academic-gold/20 rounded-t border-t-2 border-academic-gold"></div>
                            </div>
                            <p className="text-label-sm italic text-text-muted">
                              Fig 1.1: 3-Schema Architecture Overview
                            </p>
                          </div>
                          <p className="text-body-md">
                            The primary goal of a DBMS is to provide a way to
                            store and retrieve database information that is both
                            convenient and efficient.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Floating Bottom Control Bar */}
              <div className="h-16 border border-outline-variant glass-blur flex items-center justify-center px-6 gap-6 md:gap-8 absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full shadow-lg w-fit z-30 select-none">
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-all text-on-surface disabled:opacity-30 cursor-pointer"
                  >
                    <span className="material-symbols-outlined">
                      chevron_left
                    </span>
                  </button>
                  <span className="text-label-md font-bold px-2 whitespace-nowrap text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-all text-on-surface disabled:opacity-30 cursor-pointer"
                  >
                    <span className="material-symbols-outlined">
                      chevron_right
                    </span>
                  </button>
                </div>

                <div className="h-6 w-px bg-outline-variant"></div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleZoomOut}
                    className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                  >
                    zoom_out
                  </button>
                  <span
                    onClick={() => setScale(1.0)}
                    className="text-label-md font-medium min-w-[2.8rem] text-center cursor-pointer hover:text-primary text-xs"
                  >
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                  >
                    zoom_in
                  </button>
                </div>

                <div className="h-6 w-px bg-outline-variant"></div>

                <button
                  onClick={handleToggleFullscreen}
                  className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                  title="Fullscreen"
                >
                  {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                </button>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: METADATA & RELATED RESOURCES */}
          <aside className="space-y-6 select-none">
            {/* Document Info Card */}
            <div className="bg-white rounded-xl border border-outline-variant p-6 pdf-shadow flex flex-col">
              {/* Unlocked Status Badge / Unlocked Reason */}
              {!isLocked && docData.unlockedVia && (
                <div className="mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                    <span className="material-symbols-outlined text-sm">
                      verified
                    </span>
                    Unlocked via{' '}
                    {docData.unlockedVia === 'institutional'
                      ? 'Institutional Access'
                      : docData.unlockedVia === 'subscription'
                        ? 'Subscription'
                        : 'Upload Credit'}
                  </span>
                </div>
              )}

              {/* Title */}
              <h2 className="font-headline-sm text-headline-sm text-on-surface mb-6 leading-tight font-bold">
                {docData.title}
              </h2>

              {/* Uploader Info */}
              <div className="flex items-center gap-3 mb-6 p-3 bg-bg-subtle rounded-lg">
                <img
                  className="w-12 h-12 rounded-full object-cover border border-outline-variant"
                  src={
                    docData.uploaderAvatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(docData.uploader || 'User')}&background=3525cd&color=fff`
                  }
                  alt={docData.uploader}
                />
                <div>
                  <p className="text-label-md font-bold text-on-surface leading-tight">
                    {docData.uploader || 'Dr. Sarah Jenkins'}
                  </p>
                  <p className="text-label-sm text-text-muted mt-1 text-xs">
                    Professor of Computer Science
                  </p>
                </div>
              </div>

              {/* Category & Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-label-sm font-bold text-xs">
                  {docData.category || 'Notes'}
                </span>
                <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-label-sm font-bold text-xs">
                  {docData.subject || 'Semester 4'}
                </span>
                {isLocked && (
                  <span className="px-3 py-1 bg-error-container text-on-error-container rounded-full text-label-sm font-bold text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">
                      lock
                    </span>
                    Premium
                  </span>
                )}
              </div>

              {/* Document Statistics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-outline-variant bg-surface-container-lowest">
                  <span className="text-headline-sm font-bold text-on-surface">
                    {docData.downloadCount || '1.2k'}
                  </span>
                  <span className="text-label-sm text-text-muted uppercase tracking-wider text-[10px] font-bold mt-1">
                    Downloads
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-outline-variant bg-surface-container-lowest">
                  <span className="text-headline-sm font-bold text-on-surface">
                    {formatSize(docData.fileSize)}
                  </span>
                  <span className="text-label-sm text-text-muted uppercase tracking-wider text-[10px] font-bold mt-1">
                    File Size
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Download PDF Button */}
                <button
                  disabled={isLocked || downloading}
                  onClick={handleDownload}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                    isLocked
                      ? 'border-2 border-outline-variant text-outline cursor-not-allowed opacity-60 bg-surface-container-low'
                      : 'bg-primary text-on-primary hover:bg-on-primary-fixed-variant active:scale-[0.98] cursor-pointer'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isLocked ? 'lock' : downloading ? 'sync' : 'download'}
                  </span>
                  <span>
                    {isLocked
                      ? 'Download PDF (Locked)'
                      : downloading
                        ? 'Downloading...'
                        : 'Download PDF'}
                  </span>
                </button>

                {/* Save to Library Button */}
                <button
                  onClick={() => {
                    setSaved(!saved);
                    showToast(
                      !saved ? 'Saved to library' : 'Removed from library',
                      'success',
                    );
                  }}
                  className={`w-full border py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    saved
                      ? 'border-emerald-600 text-emerald-600 bg-emerald-50'
                      : 'border-primary text-primary hover:bg-primary/5'
                  }`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: `'FILL' ${saved ? 1 : 0}` }}
                  >
                    bookmark
                  </span>
                  <span>{saved ? 'Saved in Library' : 'Save to Library'}</span>
                </button>
              </div>

              {/* Report Document */}
              <button
                onClick={() =>
                  showToast(
                    'Report submitted for administrative review',
                    'success',
                  )
                }
                className="w-full text-center text-label-sm text-text-muted mt-6 hover:text-academic-red transition-colors flex items-center justify-center gap-1 font-medium text-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  report
                </span>
                <span>Report Document</span>
              </button>
            </div>

            {/* Related Resources Panel */}
            <div className="space-y-4">
              <h3 className="font-headline-sm text-headline-sm text-on-surface px-1 font-bold text-lg">
                Related Resources
              </h3>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-xl border border-outline-variant flex gap-4 hover:border-primary transition-all group cursor-pointer">
                  <div className="w-14 h-18 bg-surface-container-low rounded flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                    <span className="material-symbols-outlined text-3xl">
                      description
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1 text-sm">
                      SQL Query Optimization Guide
                    </h4>
                    <p className="text-label-sm text-text-muted mt-1 text-xs">
                      Lecture Notes • 2.1 MB
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-academic-gold">
                      <span
                        className="material-symbols-outlined text-sm"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span className="text-label-sm font-bold text-xs">
                        4.9
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-outline-variant flex gap-4 hover:border-primary transition-all group cursor-pointer">
                  <div className="w-14 h-18 bg-surface-container-low rounded flex items-center justify-center text-secondary group-hover:scale-105 transition-transform shrink-0">
                    <span className="material-symbols-outlined text-3xl">
                      terminal
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1 text-sm">
                      Relational Algebra Cheatsheet
                    </h4>
                    <p className="text-label-sm text-text-muted mt-1 text-xs">
                      Cheatsheet • 840 KB
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-academic-gold">
                      <span
                        className="material-symbols-outlined text-sm"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span className="text-label-sm font-bold text-xs">
                        4.7
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
