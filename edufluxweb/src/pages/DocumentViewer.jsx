import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { UploadCloud } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { decodeTokenPayload, getAccessToken } from '../utils/auth';
import { documentApi } from '../services/api/documentApi';
import { downloadFile } from '../utils/downloadFile';
import { bookmarkApi } from '../services/api/bookmarkApi';
import BookmarkButton from '../components/BookmarkButton';
import { useViewDocument } from '../hooks/useViewDocument';
import DocumentChatPanel from '../components/DocumentChatPanel';
import mammoth from 'mammoth/mammoth.browser';
import { Document as PdfDocument, Page as PdfPage, pdfjs } from 'react-pdf';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function PageWithObserver({ pageNum, scale, onVisible, pageRef, rootRef }) {
  const ref = useRef(null);
  const [isNear, setIsNear] = useState(pageNum <= 2);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNear(true);
          onVisible(pageNum);
        }
      },
      { root: rootRef.current, rootMargin: '800px 0px', threshold: 0.1 },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [pageNum, onVisible, rootRef]);

  const setPageRef = (element) => {
    ref.current = element;
    if (element) pageRef.current.set(pageNum, element);
    else pageRef.current.delete(pageNum);
  };

  return (
    <div
      ref={setPageRef}
      className="mb-4 bg-white shadow-xl rounded-xl overflow-hidden border border-outline-variant"
    >
      {isNear ? (
        <PdfPage
          pageNumber={pageNum}
          scale={scale}
          renderTextLayer
          renderAnnotationLayer
        />
      ) : (
        <div
          style={{ width: 600 * scale, height: 800 * scale }}
          className="flex items-center justify-center text-text-muted"
        >
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}

const getSafeExtension = (fileFormat, fileUrl) => {
  if (fileFormat) return fileFormat;
  if (!fileUrl) return '';
  const parts = fileUrl.split('?')[0].split('/');
  const filename = parts[parts.length - 1];
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex !== -1 ? filename.slice(dotIndex + 1) : '';
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
  const location = useLocation();
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

  const fetchUploadProgress = async () => {
    if (!getAccessToken()) return null;
    try {
      const res = await documentApi.getUploadProgress();
      if (res) {
        setUploadProgress(res);
      }
      return res;
    } catch (err) {
      console.warn('Error fetching upload progress in DocumentViewer:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchUploadProgress();
  }, [id]);

  useEffect(() => {
    const shouldOpenModal =
      location.state?.openDownloadModal ||
      sessionStorage.getItem('pending_return_open_modal') === 'true';
    const pendingDocId =
      location.state?.documentId ||
      sessionStorage.getItem('pending_return_doc_id');

    if (
      shouldOpenModal &&
      (!pendingDocId || String(pendingDocId) === String(id))
    ) {
      sessionStorage.removeItem('pending_return_open_modal');
      sessionStorage.removeItem('pending_return_doc_id');

      fetchUploadProgress().then((latest) => {
        setShowUnlockPrompt(true);
        if (
          location.state?.justCompletedUploads ||
          (latest && latest.unlockCredits > 0)
        ) {
          showToast(
            '3 uploads completed! Your download credit is ready.',
            'success',
          );
        }
      });
    }
  }, [id, location.state]);

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
  const [totalPages, setTotalPages] = useState(null);
  const [saved, setSaved] = useState(false);
  const [ratingDraft, setRatingDraft] = useState({ stars: 0, comment: '' });
  const [ratings, setRatings] = useState([]);
  const [ratingStats, setRatingStats] = useState({ average: 0, count: 0 });
  const [reportReason, setReportReason] = useState('inappropriate');
  const [reportDetails, setReportDetails] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    let active = true;
    const checkStatus = async () => {
      if (!id) return;
      try {
        const res = await bookmarkApi.checkBookmark(id);
        if (active) {
          setSaved(Boolean(typeof res === 'object' ? res?.isBookmarked : res));
        }
      } catch (err) {
        console.error('Error checking bookmark status:', err);
      }
    };
    checkStatus();
    return () => {
      active = false;
    };
  }, [id]);

  const handleToggleBookmark = async (docId, nextState) => {
    try {
      if (nextState) {
        await bookmarkApi.addBookmark(docId);
        setSaved(true);
        if (showToast) showToast('Saved to bookmarks', 'success');
      } else {
        await bookmarkApi.removeBookmark(docId);
        setSaved(false);
        if (showToast) showToast('Removed from bookmarks', 'info');
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      if (showToast)
        showToast(err.message || 'Failed to update bookmark', 'error');
    }
  };

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
  const pdfPageRefs = useRef(new Map());
  const pdfScrollContainerRef = useRef(null);
  const documentRef = useRef(document);
  documentRef.current = document;

  const previewFileType = getSafeExtension(
    document?.fileFormat,
    previewUrl || document?.fileUrl,
  )
    .toLowerCase()
    .trim();
  const isPdfPreview = Boolean(previewUrl && previewFileType === 'pdf');
  const hasPageCount =
    isPdfPreview && Number.isFinite(totalPages) && totalPages > 0;

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
    setPage(1);
    setTotalPages(null);
    setScale(1.0);
    pdfPageRefs.current.clear();
  }, [id, overrideDoc?._id, overrideDoc?.fileUrl]);

  // Sync user info from token
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      try {
        const payload = decodeTokenPayload(token);
        const name =
          payload?.name ||
          payload?.username ||
          (payload?.email && payload.email.split('@')[0]);
        const role = payload?.role || 'Researcher';
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
        setDocument(null);

        const hasToken = Boolean(getAccessToken());
        const data = hasToken
          ? await documentApi.getDocument(id)
          : await documentApi.getPublicDocument(id);
        setDocument(data);
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(
          err.message || 'Failed to load this document. Please try again.',
        );
        setDocument(null);
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
        const approved = documentRef.current?.approvedUploadCount ?? 1;
        setUploadProgress({
          approvedUploadCount: approved,
          uploadsUntilNextCredit: Math.max(0, 3 - approved),
          requiredCount: 3,
        });
      }
    };

    fetchUploadProgress();
  }, [id, overrideUploadProgress]);

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
    setPage(1);
    setTotalPages(null);
    setPdfLoading(true);
    setPdfError(null);
    pdfPageRefs.current.clear();

    const fileType = getSafeExtension(document.fileFormat, document.fileUrl)
      .toLowerCase()
      .trim();

    if (fileType === 'docx') {
      const fetchAndConvertWord = async () => {
        try {
          const res = await documentApi.getPreviewUrl(id);
          if (res?.url) {
            const response = await fetch(res.url);
            if (!response.ok) {
              throw new Error(`Failed to fetch document file (${response.status} ${response.statusText})`);
            }
            const arrayBuffer = await response.arrayBuffer();
            if (!arrayBuffer || arrayBuffer.byteLength === 0) {
              throw new Error('Document file is empty or could not be loaded.');
            }
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

    let blobObjectUrl = null;

    const safetyTimer = window.setTimeout(() => {
      setPreviewLoading(false);
      setPreviewError('Taking too long to load — please refresh');
    }, 15000);

    previewDocument(
      id,
      fileType,
      (result) => {
        if (result?.kind === 'html') setPreviewHtml(result.html);
        if (result?.kind === 'url') {
          blobObjectUrl = result.url; // track so we can revoke it on cleanup
          setPreviewUrl(result.url);
        }
        if (result?.kind === 'unsupported') setPreviewError(result.message);
        setPreviewLoading(false);
        window.clearTimeout(safetyTimer);
      },
      { autoRevoke: false },
    );

    return () => {
      window.clearTimeout(safetyTimer);
      // Revoke the blob URL to free memory when navigating away or changing doc
      if (blobObjectUrl) URL.revokeObjectURL(blobObjectUrl);
    };
  }, [
    id,
    document?.fileFormat,
    document?.fileUrl,
    isLocked,
    overrideDoc?._id,
    previewDocument,
  ]);

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

    if (documentRef.current) {
      fetchRelated();
    }
  }, [id, Boolean(document)]);

  const fetchRatings = async () => {
    if (!id) return;
    try {
      const res = await documentApi.getDocumentRatings(id, 1, 10);
      setRatings(Array.isArray(res?.data) ? res.data : []);
      setRatingStats({
        average: Number(res?.average || 0),
        count: Number(res?.count || 0),
      });
    } catch (err) {
      console.error('Error loading ratings:', err);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [id]);

  // Sync pdf load state
  useEffect(() => {
    if (previewUrl) {
      setPdfLoading(true);
      setPdfError(null);
    }
  }, [previewUrl]);

  const onPdfLoadSuccess = ({ numPages }) => {
    setPage(1);
    setTotalPages(numPages);
    setPdfLoading(false);
    setPdfError(null);
  };

  const onPdfLoadError = (err) => {
    console.error('PDF.js load error:', err);
    setPdfError(err?.message || 'Failed to render PDF preview');
    setPdfLoading(false);
    setTotalPages(null);
  };

  // Download PDF Handler (Calls GET /documents/:id/download)
  const handleSubmitRating = async () => {
    if (!getAccessToken()) {
      showToast('Please sign in to rate this document.', 'error');
      return;
    }

    try {
      setSubmittingRating(true);
      const payload = {
        documentId: id,
        stars: ratingDraft.stars,
        comment: ratingDraft.comment?.trim() || undefined,
      };

      await documentApi.submitRating(payload);
      await fetchRatings();
      setRatingDraft({ stars: 0, comment: '' });
      showToast('Your rating was saved.', 'success');
    } catch (err) {
      showToast(err.message || 'Unable to save rating', 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!getAccessToken()) {
      showToast('Please sign in to report this document.', 'error');
      return;
    }

    try {
      await documentApi.submitReport({
        documentId: id,
        reason: reportReason,
        details: reportDetails || undefined,
      });
      setReportDetails('');
      setShowReportModal(false);
      showToast('Report submitted for review.', 'success');
    } catch (err) {
      showToast(err.message || 'Unable to submit report', 'error');
    }
  };

  const handleDownload = async () => {
    if (isLocked) {
      await fetchUploadProgress();
      setShowUnlockPrompt(true);
      return;
    }

    try {
      setDownloading(true);
      const res = await documentApi.getDownloadUrl(id);
      if (res && res.url) {
        const fileExtension =
          getSafeExtension(document?.fileFormat, document?.fileUrl) || 'pdf';
        const filename =
          res.filename || document?.originalFileName || `${document?.title || 'document'}.${fileExtension}`;
        await downloadFile(res.url, filename, res.contentType);
        showToast('Download started successfully', 'success');
        setShowUnlockPrompt(false);
        fetchUploadProgress();
      } else {
        throw new Error('Download URL not found.');
      }
    } catch (err) {
      console.error('Download error:', err);
      const status = err?.response?.status ?? err?.status;
      const message =
        err?.response?.data?.message ?? err?.data?.message ?? err?.message;
      const normalizedMessage = String(message || '').toLowerCase();

      if (
        status === 403 &&
        (normalizedMessage.includes('upload') ||
          normalizedMessage.includes('subscribe') ||
          normalizedMessage.includes('credit') ||
          normalizedMessage.includes('subscription'))
      ) {
        await fetchUploadProgress();
        setShowUnlockPrompt(true);
      } else {
        showToast(message || 'Failed to download document', 'error');
      }
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

  const scrollToPage = (pageNum) => {
    const pageElement = pdfPageRefs.current.get(pageNum);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
            Document Failed to Load
          </h3>
          <p className="text-body-sm text-text-muted mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-[500px] bg-surface flex flex-col items-center justify-center p-6 text-text-main">
        <div className="max-w-md w-full bg-white border border-outline-variant rounded-2xl p-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-error mb-3">
            search_off
          </span>
          <h3 className="font-headline-sm font-bold mb-2">
            Document Not Found
          </h3>
          <p className="text-body-sm text-text-muted mb-6">
            This document could not be found or is no longer available.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const docData = document;

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
                  {hasPageCount ? (
                    <span className="text-label-md font-label-md text-on-surface font-medium">
                      Page {page} of {totalPages}
                    </span>
                  ) : isPdfPreview ? (
                    <span className="text-label-md font-label-md text-on-surface font-medium">
                      Loading pages...
                    </span>
                  ) : null}
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
                          {/* Upload to Unlock Shortcut */}
                          <button
                            onClick={() =>
                              navigate('/upload-to-unlock', {
                                state: { returnTo: `/documents/${id}/view` },
                              })
                            }
                            className="w-full py-3 bg-primary/10 text-primary hover:bg-primary/20 font-label-md text-label-md rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 font-bold cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              cloud_upload
                            </span>
                            <span>Upload Document to Unlock (Free)</span>
                          </button>

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
                    ) : previewError ? (
                      <div className="w-full max-w-[800px] rounded-xl border border-outline-variant bg-white p-8 md:p-12 shadow-xl text-center">
                        <span className="material-symbols-outlined text-4xl text-error mb-3">
                          error
                        </span>
                        <p className="font-semibold text-on-surface mb-2">
                          Preview Error
                        </p>
                        <p className="text-sm text-text-muted">
                          {previewError}
                        </p>
                      </div>
                    ) : previewHtml ? (
                      <div className="w-full max-w-[800px] overflow-auto bg-white rounded-xl border border-outline-variant shadow-xl">
                        <div
                          className="origin-top mx-auto prose prose-slate max-w-none p-8 md:p-12"
                          style={{
                            transform: `scale(${scale})`,
                            width: `${100 / scale}%`,
                          }}
                          dangerouslySetInnerHTML={{ __html: previewHtml }}
                        />
                      </div>
                    ) : isPdfPreview && previewUrl ? (
                      <div
                        ref={pdfScrollContainerRef}
                        className="w-full max-w-[900px] mx-auto overflow-y-auto"
                        style={{ maxHeight: '85vh' }}
                      >
                        {pdfLoading && (
                          <div className="flex flex-col items-center gap-3 text-text-muted py-24">
                            <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin mb-2" />
                            <span className="text-sm font-medium">
                              Rendering PDF pages...
                            </span>
                          </div>
                        )}
                        {pdfError && (
                          <div className="w-full max-w-[800px] rounded-xl border border-outline-variant bg-white p-8 md:p-12 shadow-xl text-center mx-auto my-8">
                            <span className="material-symbols-outlined text-4xl text-error mb-3">
                              error
                            </span>
                            <p className="font-semibold text-on-surface mb-2">
                              PDF Render Error
                            </p>
                            <p className="text-sm text-text-muted">
                              {pdfError}
                            </p>
                          </div>
                        )}
                        <PdfDocument
                          file={previewUrl}
                          onLoadSuccess={onPdfLoadSuccess}
                          onLoadError={onPdfLoadError}
                          loading={null}
                        >
                          {Boolean(totalPages) &&
                            Array.from({ length: totalPages }, (_, index) => (
                              <PageWithObserver
                                key={index + 1}
                                pageNum={index + 1}
                                scale={scale}
                                onVisible={setPage}
                                pageRef={pdfPageRefs}
                                rootRef={pdfScrollContainerRef}
                              />
                            ))}
                        </PdfDocument>
                      </div>
                    ) : (
                      <div
                        className="bg-white w-full max-w-[800px] aspect-[1/1.414] shadow-xl p-12 md:p-16 relative group transition-transform hover:scale-[1.002]"
                        style={{ transform: `scale(${scale})` }}
                      >
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
                {hasPageCount && (
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => {
                        const targetPage = Math.max(page - 1, 1);
                        setPage(targetPage);
                        scrollToPage(targetPage);
                      }}
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
                      onClick={() => {
                        const targetPage = Math.min(page + 1, totalPages);
                        setPage(targetPage);
                        scrollToPage(targetPage);
                      }}
                      className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-all text-on-surface disabled:opacity-30 cursor-pointer"
                    >
                      <span className="material-symbols-outlined">
                        chevron_right
                      </span>
                    </button>
                  </div>
                )}

                {hasPageCount && (
                  <div className="h-6 w-px bg-outline-variant"></div>
                )}

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
                  <span
                    onClick={() => {
                      if (docData.unlockedVia === 'institutional') {
                        fetchUploadProgress();
                        setShowUnlockPrompt(true);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold ${
                      docData.unlockedVia === 'institutional'
                        ? 'cursor-pointer hover:bg-emerald-100 transition-colors'
                        : ''
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      verified
                    </span>
                    {docData.unlockedVia === 'institutional'
                      ? 'Free to view (cps.edu.np) · Upload a document to download'
                      : docData.unlockedVia === 'subscription'
                        ? 'Unlocked via Subscription'
                        : 'Unlocked via Upload Credit'}
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

                {/* Bookmark Document Button */}
                <BookmarkButton
                  documentId={id}
                  isBookmarked={saved}
                  onToggle={(docId, nextState) =>
                    handleToggleBookmark(docId, nextState)
                  }
                  variant="viewer"
                />
              </div>

              <div className="mt-6 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-text-main">Ratings</p>
                  <span className="text-xs text-text-muted">
                    {ratingStats.average.toFixed(1)} ★ ({ratingStats.count})
                  </span>
                </div>
                {getAccessToken() ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setRatingDraft((prev) => ({ ...prev, stars: star }))
                          }
                          className={`material-symbols-outlined text-2xl sm:text-3xl transition-transform hover:scale-110 ${ratingDraft.stars >= star ? 'text-academic-gold' : 'text-outline'}`}
                          style={{
                            fontVariationSettings:
                              ratingDraft.stars >= star
                                ? "'FILL' 1"
                                : "'FILL' 0",
                          }}
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          star
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={ratingDraft.comment}
                      onChange={(e) =>
                        setRatingDraft((prev) => ({
                          ...prev,
                          comment: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Share your feedback..."
                      className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <button
                      onClick={handleSubmitRating}
                      disabled={submittingRating || ratingDraft.stars === 0}
                      className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
                    >
                      {submittingRating ? 'Saving...' : 'Submit rating'}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">
                    Sign in to rate this document.
                  </p>
                )}
              </div>

              {/* Report Document */}
              {getAccessToken() && (
                <>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full text-center text-label-sm text-text-muted mt-6 hover:text-academic-red transition-colors flex items-center justify-center gap-1 font-medium text-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      report
                    </span>
                    <span>Report Document</span>
                  </button>
                  {showReportModal && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold">Report document</h3>
                          <button
                            onClick={() => setShowReportModal(false)}
                            className="material-symbols-outlined"
                          >
                            close
                          </button>
                        </div>
                        <label className="block text-sm font-medium mb-2">
                          Reason
                        </label>
                        <select
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="w-full rounded-lg border border-outline-variant px-3 py-2 mb-4"
                        >
                          <option value="inappropriate">Inappropriate</option>
                          <option value="copyright">Copyright</option>
                          <option value="spam">Spam</option>
                          <option value="wrong_category">Wrong category</option>
                          <option value="other">Other</option>
                        </select>
                        <label className="block text-sm font-medium mb-2">
                          Details
                        </label>
                        <textarea
                          value={reportDetails}
                          onChange={(e) => setReportDetails(e.target.value)}
                          rows={4}
                          placeholder="Optional details"
                          className="w-full rounded-lg border border-outline-variant px-3 py-2 mb-4"
                        />
                        <button
                          onClick={handleSubmitReport}
                          className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-bold text-white"
                        >
                          Submit report
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {showUnlockPrompt && (() => {
              const currentCycleUploads =
                uploadProgress?.progressInCurrentCycle ??
                (uploadProgress?.approvedUploadCount
                  ? uploadProgress.approvedUploadCount % 3
                  : 0);
              const hasCredits = (uploadProgress?.unlockCredits > 0);
              const needed =
                uploadProgress?.uploadsUntilNextCredit ??
                Math.max(0, 3 - currentCycleUploads);
              const progressPct = hasCredits
                ? 100
                : Math.min(100, Math.round((currentCycleUploads / 3) * 100));

              return (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                  <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-outline-variant relative text-left">
                    {/* Close button */}
                    <button
                      onClick={() => setShowUnlockPrompt(false)}
                      className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                      aria-label="Close modal"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>

                    {/* Header */}
                    <div className="mb-6 pr-8">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
                        <span className="material-symbols-outlined text-sm">school</span>
                        <span>Techspire Institutional Access (cps.edu.np)</span>
                      </div>
                      <h3 className="text-xl font-bold text-[#1E293B]">
                        Unlock Document Download
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Viewing this academic resource is free with your Techspire student account. To download and save the file, complete 3 document uploads to earn a free download credit, or choose a subscription plan.
                      </p>
                    </div>

                    {/* Upload Document Subscription / Unlock Plan Card (Prominently displayed) */}
                    <div className="rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-indigo-50/70 to-purple-50/50 p-5 mb-5 relative shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base">cloud_upload</span>
                          Upload to Unlock (Free Plan)
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary text-white">
                          {hasCredits
                            ? '1 Credit Ready'
                            : `${currentCycleUploads} / 3 Uploaded`}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-3">
                        <div
                          className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      {hasCredits ? (
                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-4 bg-emerald-100/70 p-3 rounded-xl border border-emerald-200">
                          <span className="text-base">🎉</span>
                          <span>
                            You have <strong>{uploadProgress.unlockCredits}</strong> download credit ready! Click below to download this document immediately.
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 mb-4">
                          💡 Upload <strong>{needed}</strong> more study material or assignment to earn 1 free download credit for this document.
                        </p>
                      )}

                      {/* Action Button */}
                      {hasCredits ? (
                        <button
                          onClick={async () => {
                            await handleDownload();
                          }}
                          disabled={downloading}
                          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                        >
                          <span className="material-symbols-outlined text-lg">download</span>
                          <span>{downloading ? 'Downloading...' : 'Download Document Now'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            sessionStorage.setItem('pending_return_doc_id', id);
                            sessionStorage.setItem('pending_return_open_modal', 'true');
                            navigate('/upload-to-unlock', {
                              state: {
                                returnTo: `/documents/${id}/view`,
                                documentId: id,
                                openDownloadModal: true,
                                uploadsNeeded: needed,
                              },
                            });
                          }}
                          className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-md hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                        >
                          <span className="material-symbols-outlined text-lg">cloud_upload</span>
                          <span>Upload Documents to Unlock (Free)</span>
                        </button>
                      )}
                    </div>

                    {/* Alternative Subscription Option */}
                    <div className="pt-2 border-t border-slate-200 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">Want instant downloads without uploading?</span>
                        <span className="text-xs font-bold text-slate-800">From NPR 499/mo</span>
                      </div>
                      <button
                        onClick={() => {
                          sessionStorage.setItem('pending_return_doc_id', id);
                          navigate(`/pricing?documentId=${id}`);
                        }}
                        className="w-full py-2.5 rounded-xl border border-slate-300 hover:border-primary text-slate-700 hover:text-primary font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">workspace_premium</span>
                        <span>View Subscription Plans (eSewa / Khalti)</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}


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

      <div className="mt-8 max-w-4xl mx-auto rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-outline-variant pb-3">
          <h3 className="text-lg font-semibold text-on-surface">
            Ratings & comments
          </h3>
          <span className="text-sm font-medium text-text-muted">
            {ratingStats.average.toFixed(1)} ★ · {ratingStats.count} reviews
          </span>
        </div>
        <div className="space-y-4">
          {ratings.length === 0 ? (
            <p className="text-sm text-text-muted">
              No ratings yet for this document.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {ratings.map((rating) => {
                const reviewerName =
                  rating.user?.displayName ||
                  rating.user?.firstName ||
                  rating.user?.lastName ||
                  'Anonymous reviewer';

                return (
                  <div
                    key={rating._id || `${rating.userId}-${rating.createdAt}`}
                    className="rounded-xl border border-outline-variant bg-surface-container-low p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            rating.user?.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewerName)}&background=3525cd&color=fff`
                          }
                          alt={reviewerName}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold text-sm text-on-surface">
                            {reviewerName}
                          </p>
                          <p className="text-[11px] text-text-muted">
                            {new Date(rating.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-academic-gold">
                        {[...Array(5)].map((_, index) => (
                          <span
                            key={index}
                            className="material-symbols-outlined text-sm"
                            style={{
                              fontVariationSettings:
                                index < Number(rating.stars)
                                  ? "'FILL' 1"
                                  : "'FILL' 0",
                            }}
                          >
                            star
                          </span>
                        ))}
                      </div>
                    </div>
                    {rating.comment && (
                      <p className="mt-2 text-sm text-text-main">
                        {rating.comment}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* AI Document Chat Panel */}
      <DocumentChatPanel
        documentId={id}
        isLocked={isLocked}
        title={docData?.title}
      />
    </div>
  );
}
