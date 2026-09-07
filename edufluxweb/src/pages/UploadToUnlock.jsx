import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/apiClient';
import { documentApi } from '../services/api/documentApi';
import { useToast } from '../context/ToastContext';
import DropZone from '../components/DropZone';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { CheckCircle, XCircle, Loader2, ArrowLeft, FileText, Sparkles } from 'lucide-react';

export default function UploadToUnlock() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const targetDocId =
    location.state?.documentId ||
    sessionStorage.getItem('pending_return_doc_id') ||
    (location.state?.returnTo?.includes('/documents/')
      ? location.state.returnTo.split('/')[2]
      : null);

  const returnTo =
    location.state?.returnTo ||
    (targetDocId ? `/documents/${targetDocId}/view` : '/dashboard');

  const [progress, setProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]); // persists across multiple uploads in this session
  const [uploading, setUploading] = useState(false);
  const [sessionSuccessCount, setSessionSuccessCount] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      setLoadingProgress(true);
      const res = await apiClient.get('/users/me/upload-progress');
      setProgress(res);
      return res;
    } catch (err) {
      console.warn('Failed to load upload progress:', err);
      return null;
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleReturnToDocument = (options = {}) => {
    if (targetDocId) {
      sessionStorage.setItem('pending_return_doc_id', targetDocId);
      sessionStorage.setItem('pending_return_open_modal', 'true');
    }
    navigate(returnTo, {
      state: {
        documentId: targetDocId,
        openDownloadModal: true,
        justCompletedUploads: options.completed || sessionSuccessCount >= 3,
        downloadReady: options.ready || Boolean(progress?.unlockCredits > 0),
      },
    });
  };

  const handleFilesSelected = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    let newlySucceeded = 0;
    for (const file of files) {
      const entryId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      setUploadedFiles((prev) => [
        ...prev,
        { id: entryId, name: file.name, size: file.size, status: 'uploading' },
      ]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append(
          'title',
          file.name.replace(/\.[^/.]+$/, '') || 'Uploaded Document',
        );
        formData.append('category', 'Study Material');

        await documentApi.uploadDocument(formData);
        newlySucceeded++;

        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === entryId ? { ...f, status: 'success' } : f)),
        );
        if (showToast) showToast(`"${file.name}" uploaded successfully!`, 'success');
      } catch (err) {
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === entryId ? { ...f, status: 'failed' } : f)),
        );
        if (showToast) showToast(err.message || `Failed to upload "${file.name}"`, 'error');
      }
    }

    setUploading(false);

    const latest = await fetchProgress();
    const updatedSessionSuccess = sessionSuccessCount + newlySucceeded;
    setSessionSuccessCount(updatedSessionSuccess);

    const uploadsNeeded = location.state?.uploadsNeeded || 3;
    const completedThree =
      updatedSessionSuccess >= 3 ||
      updatedSessionSuccess >= uploadsNeeded ||
      (latest?.unlockCredits > 0 && updatedSessionSuccess > 0);

    // If 3 uploads completed, automatically return to the exact same document & modal
    if (completedThree && targetDocId && !isRedirecting) {
      setIsRedirecting(true);
      sessionStorage.setItem('pending_return_doc_id', targetDocId);
      sessionStorage.setItem('pending_return_open_modal', 'true');
      if (showToast) {
        showToast('3 document uploads completed! Returning to your document download...', 'success');
      }

      setTimeout(() => {
        navigate(returnTo, {
          state: {
            documentId: targetDocId,
            openDownloadModal: true,
            justCompletedUploads: true,
            downloadReady: true,
          },
          replace: true,
        });
      }, 1800);
    }
  };

  const currentInCycle = progress?.progressInCurrentCycle ?? 0;
  const progressPercent = Math.min(100, Math.round((currentInCycle / 3) * 100));

  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 w-full animate-fade-in">
        {/* Navigation Return Button */}
        <button
          onClick={() => handleReturnToDocument()}
          className="inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Document</span>
        </button>

        {/* Auto Redirect Banner */}
        {isRedirecting && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-between text-emerald-900 shadow-md animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-bold text-sm">3 Document Uploads Completed!</p>
                <p className="text-xs text-emerald-700">
                  Returning to your document download modal...
                </p>
              </div>
            </div>
            <button
              onClick={() => handleReturnToDocument({ completed: true, ready: true })}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-colors"
            >
              Return Now
            </button>
          </div>
        )}

        {/* Title Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Contribution Program</span>
          </div>
          <h1 className="text-3xl font-bold font-headline-lg text-on-surface mb-2">
            Upload Documents to Earn a Free Unlock
          </h1>
          <p className="text-base text-on-surface-variant leading-relaxed">
            Upload 3 study materials or assignments to earn 1 free unlock credit —
            use it to unlock and download any premium academic document on EduFlux.
          </p>
        </div>

        {/* Progress Box Card */}
        <div className="bg-surface-container rounded-3xl p-6 sm:p-8 mb-8 border border-outline-variant shadow-sm backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-base text-on-surface">Upload Progress</span>
            <span className="text-primary font-bold text-base">
              {currentInCycle} / 3 Uploaded
            </span>
          </div>

          <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-700 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {progress?.unlockCredits > 0 ? (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-emerald-800 font-medium animate-slide-up">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎉</span>
                <span>
                  You have <strong>{progress.unlockCredits}</strong> free unlock credit
                  {progress.unlockCredits > 1 ? 's' : ''} available!
                </span>
              </div>
              <button
                onClick={() => handleReturnToDocument({ completed: true, ready: true })}
                className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md hover:shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
              >
                Unlock Document
              </button>
            </div>
          ) : (

            <p className="mt-2 text-sm text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-primary">info</span>
              Upload {progress?.uploadsUntilNextCredit ?? 3} more document
              {(progress?.uploadsUntilNextCredit ?? 3) !== 1 ? 's' : ''} to earn your free unlock credit.
            </p>
          )}
        </div>

        {/* Dropzone Upload Container */}
        <div className="mb-8">
          <DropZone
            onFilesSelected={handleFilesSelected}
            multiple={true}
            accept=".pdf,.docx,.pptx,.xlsx,.jpg,.png"
          />
          {uploading && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-primary font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading files, please wait...</span>
            </div>
          )}
        </div>

        {/* Session Uploads List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-8 space-y-3">
            <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>Your Uploads This Session ({uploadedFiles.length})</span>
            </h3>
            <div className="space-y-2">
              {uploadedFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-outline-variant shadow-sm transition-all hover:border-primary/40"
                >
                  <div className="flex items-center gap-3 overflow-hidden mr-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-sm text-on-surface truncate">
                        {f.name}
                      </p>
                      {f.size && (
                        <p className="text-xs text-text-muted">
                          {(f.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {f.status === 'uploading' && (
                      <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading...</span>
                      </span>
                    )}
                    {f.status === 'success' && (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle className="w-4 h-4" />
                        <span>Uploaded</span>
                      </span>
                    )}
                    {f.status === 'failed' && (
                      <span className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                        <XCircle className="w-4 h-4" />
                        <span>Failed</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
