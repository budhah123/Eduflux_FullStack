import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../services/api/apiClient';
import { useToast } from '../context/ToastContext';

export default function PricingUnlock() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const documentId = searchParams.get('documentId');

  // API Data States
  const [subData, setSubData] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({
    approvedUploadCount: 1,
    uploadsUntilNextCredit: 2,
    requiredCount: 3,
  });
  const [documentContext, setDocumentContext] = useState(null);
  const [loading, setLoading] = useState(true);

  // User Selection States
  const [selectedProvider, setSelectedProvider] = useState('khalti'); // 'khalti' | 'esewa'
  const [initiating, setInitiating] = useState(false);

  // Fetch subscription, upload progress, and document context
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);

      // 1. Fetch Subscription Status
      try {
        const sub = await apiClient.get('/subscription/me');
        if (isMounted && sub) {
          setSubData(sub);
        }
      } catch (err) {
        console.warn('Subscription fetch error:', err.message);
      }

      // 2. Fetch Upload Progress
      try {
        const progress = await apiClient.get('/users/me/upload-progress');
        if (isMounted && progress) {
          const approved = progress.approvedUploadCount ?? progress.approvedUploads ?? 1;
          const required = progress.requiredCount ?? 3;
          const untilNext = progress.uploadsUntilNextCredit ?? Math.max(0, required - approved);
          setUploadProgress({
            approvedUploadCount: approved,
            uploadsUntilNextCredit: untilNext,
            requiredCount: required,
          });
        }
      } catch (err) {
        console.warn('Upload progress fetch error (using fallback):', err.message);
      }

      // 3. Fetch Document Context if documentId is provided
      if (documentId) {
        try {
          const doc = await apiClient.get(`/documents/${documentId}`);
          if (isMounted && doc) {
            setDocumentContext(doc);
          }
        } catch (err) {
          console.warn('Document context fetch error:', err.message);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [documentId]);

  // Handle Payment Initiation
  const handleInitiatePayment = async (planType) => {
    const amount = planType === 'yearly' ? 4799 : 499;

    try {
      setInitiating(true);
      showToast(`Initiating ${selectedProvider.toUpperCase()} payment for ${planType} plan...`);

      // Store documentId in sessionStorage if available so PaymentCallback can redirect back
      if (documentId) {
        sessionStorage.setItem('pending_return_document_id', documentId);
      } else {
        sessionStorage.removeItem('pending_return_document_id');
      }

      const payload = {
        provider: selectedProvider,
        planType: planType,
        amount: amount,
      };

      const result = await apiClient.post('/payment/initiate', payload);

      if (selectedProvider === 'khalti') {
        if (result?.payment_url) {
          window.location.href = result.payment_url;
        } else if (result?.pidx && result?.payment_url) {
          window.location.href = result.payment_url;
        } else {
          throw new Error('Khalti payment URL not returned from server.');
        }
      } else if (selectedProvider === 'esewa') {
        if (result?.formUrl && result?.fields) {
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = result.formUrl;
          Object.keys(result.fields).forEach((key) => {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = key;
            hiddenField.value = result.fields[key];
            form.appendChild(hiddenField);
          });
          document.body.appendChild(form);
          form.submit();
        } else {
          throw new Error('eSewa form parameters not returned from server.');
        }
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      showToast(err.message || 'Failed to initiate payment.', 'error');
    } finally {
      setInitiating(false);
    }
  };

  const isSubscribed = subData?.status === 'ACTIVE';
  const progressPercent = Math.min(
    100,
    Math.round((uploadProgress.approvedUploadCount / (uploadProgress.requiredCount || 3)) * 100)
  );

  return (
    <div className="bg-surface text-on-surface min-h-screen overflow-x-hidden relative font-sans">
      {/* TopNavBar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-sm border-b border-outline-variant/20">
        <nav className="flex justify-between items-center px-margin-desktop h-16 w-full max-w-container-max mx-auto">
          <Link to="/" className="font-headline-sm text-headline-sm font-bold text-primary flex items-center gap-2 select-none">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_stories
            </span>
            Eduflux
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md">
              Home
            </Link>
            <Link to="/dashboard" className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md">
              Features
            </Link>
            <Link to="/pricing" className="text-primary font-bold border-b-2 border-primary font-label-md text-label-md py-1">
              Pricing
            </Link>
            <Link to="/dashboard" className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md">
              About
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {isSubscribed ? (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined text-sm">verified</span>
                Pro Active
              </span>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/login')} 
                  className="text-on-surface-variant font-label-md text-label-md px-4 py-2 hover:bg-surface-container-highest rounded-lg transition-all active:scale-95 cursor-pointer"
                >
                  Login
                </button>
                <button 
                  onClick={() => navigate('/register')} 
                  className="bg-primary text-on-primary font-label-md text-label-md px-6 py-2 rounded-lg hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Background Ornaments */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
          <div className="gradient-blob absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full"></div>
          <div className="gradient-blob absolute bottom-40 right-10 w-80 h-80 bg-academic-amber/10 rounded-full"></div>
        </div>

        {/* Active Subscription Alert Banner */}
        {isSubscribed && (
          <div className="mb-10 max-w-3xl mx-auto bg-emerald-50 border-2 border-emerald-300 p-6 rounded-2xl shadow-sm flex items-start gap-4 animate-fade-in">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm shrink-0">
              <span className="material-symbols-outlined text-2xl">workspace_premium</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                Already Subscribed to Eduflux Pro!
              </h3>
              <p className="text-sm text-emerald-800 mt-1">
                Your subscription is currently active ({subData?.planType || 'pro'} plan). You have full unlimited access to all document downloads and AI research tools.
              </p>
              {subData?.expiryDate && (
                <p className="text-xs text-emerald-700 font-semibold mt-2">
                  Renewal Date: {new Date(subData.expiryDate).toLocaleDateString()}
                </p>
              )}
              {documentId && (
                <button
                  onClick={() => navigate(`/documents/${documentId}/view`)}
                  className="mt-4 px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-800 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Return to Document
                </button>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-headline-lg font-headline-lg text-academic-navy">
            {documentId ? 'Choose how to unlock this document' : 'Choose your Eduflux access plan'}
          </h1>
          <p className="text-body-md text-on-surface-variant max-w-2xl mx-auto">
            Get instant access through a premium subscription or contribute to the academic community to earn free unlock credits.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-12 items-start relative">
          
          {/* OPTION A: SUBSCRIBE */}
          <section className="space-y-8 order-1">
            <div className="flex items-center gap-3 mb-6">
              <span className="p-2 bg-academic-navy text-white rounded-lg shadow-sm">
                <span className="material-symbols-outlined">payments</span>
              </span>
              <h2 className="text-headline-md font-headline-md text-academic-navy">Option A: Subscribe</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Monthly Card */}
              <div className="glass-card p-6 rounded-2xl shadow-sm border border-outline-variant hover:border-primary/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="mb-4">
                    <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Monthly</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-headline-md font-bold text-academic-navy">NPR 499</span>
                      <span className="text-label-md text-on-surface-variant">/mo</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-body-sm">
                      <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                      Unlimited access
                    </li>
                    <li className="flex items-center gap-2 text-body-sm">
                      <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                      Priority support
                    </li>
                    <li className="flex items-center gap-2 text-body-sm">
                      <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                      Ad-free experience
                    </li>
                  </ul>
                </div>

                <button
                  disabled={initiating}
                  onClick={() => handleInitiatePayment('monthly')}
                  className="w-full py-3 px-4 bg-academic-navy text-white rounded-xl font-label-md hover:bg-primary transition-colors active:scale-95 cursor-pointer disabled:opacity-50 font-bold"
                >
                  {initiating ? 'Processing...' : 'Subscribe Now'}
                </button>
              </div>

              {/* Yearly Card */}
              <div className="relative glass-card p-6 rounded-2xl shadow-xl border-2 border-academic-amber bg-gradient-to-br from-white to-amber-50/30 flex flex-col justify-between scale-105 transform">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-academic-amber text-academic-navy text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                  Best Value
                </div>

                <div>
                  <div className="mb-4">
                    <div className="flex justify-between items-start">
                      <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">Yearly</span>
                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-md">SAVE 20%</span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-headline-md font-bold text-academic-navy">NPR 4,799</span>
                      <span className="text-label-md text-on-surface-variant">/yr</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-body-sm font-medium">
                      <span className="material-symbols-outlined text-academic-amber text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                      Everything in Monthly
                    </li>
                    <li className="flex items-center gap-2 text-body-sm">
                      <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                      Offline downloads
                    </li>
                    <li className="flex items-center gap-2 text-body-sm">
                      <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                      Early access to features
                    </li>
                  </ul>
                </div>

                <button
                  disabled={initiating}
                  onClick={() => handleInitiatePayment('yearly')}
                  className="w-full py-3 px-4 bg-academic-navy text-white rounded-xl font-label-md hover:bg-primary transition-colors active:scale-95 cursor-pointer disabled:opacity-50 font-bold"
                >
                  {initiating ? 'Processing...' : 'Subscribe Now'}
                </button>
              </div>
            </div>

            {/* Payment Methods Selection */}
            <div className="pt-6 border-t border-outline-variant/30">
              <p className="text-label-md font-label-md text-on-surface-variant mb-4 font-semibold">Secure Payment Via</p>
              <div className="grid grid-cols-2 gap-4">
                
                {/* eSewa Selector */}
                <div
                  onClick={() => setSelectedProvider('esewa')}
                  className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all group ${
                    selectedProvider === 'esewa'
                      ? 'border-primary bg-primary-container/10 shadow-sm'
                      : 'border-outline-variant hover:bg-white hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-bold text-xs">eSewa</span>
                    </div>
                    <span className="font-medium text-body-sm text-on-surface">eSewa Wallet</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedProvider === 'esewa' ? 'bg-primary border-primary' : 'border-outline-variant group-hover:border-primary'
                  }`}>
                    {selectedProvider === 'esewa' && (
                      <span className="material-symbols-outlined text-white text-[12px]">check</span>
                    )}
                  </div>
                </div>

                {/* Khalti Selector */}
                <div
                  onClick={() => setSelectedProvider('khalti')}
                  className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all group ${
                    selectedProvider === 'khalti'
                      ? 'border-primary bg-primary-container/10 shadow-sm'
                      : 'border-outline-variant hover:bg-white hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-xs">Khalti</span>
                    </div>
                    <span className="font-medium text-body-sm text-on-surface">Khalti SDK</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedProvider === 'khalti' ? 'bg-primary border-primary' : 'border-outline-variant group-hover:border-primary'
                  }`}>
                    {selectedProvider === 'khalti' && (
                      <span className="material-symbols-outlined text-white text-[12px]">check</span>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* DIVIDER */}
          <div className="flex lg:flex-col items-center justify-center gap-4 py-8 lg:py-0 order-2">
            <div className="h-px lg:h-32 w-full lg:w-px bg-gradient-to-b from-transparent via-outline-variant to-transparent"></div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full border border-outline-variant bg-white text-on-surface-variant font-bold text-sm shadow-sm shrink-0">
              OR
            </div>
            <div className="h-px lg:h-32 w-full lg:w-px bg-gradient-to-b from-outline-variant via-outline-variant to-transparent"></div>
          </div>

          {/* OPTION B: UPLOAD TO UNLOCK */}
          <section className="space-y-8 order-3 lg:pt-0 pt-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="p-2 bg-academic-amber text-academic-navy rounded-lg shadow-sm">
                <span className="material-symbols-outlined">upload_file</span>
              </span>
              <h2 className="text-headline-md font-headline-md text-academic-navy">Option B: Upload to Unlock</h2>
            </div>

            <div className="glass-card relative p-8 rounded-2xl border-2 border-dashed border-primary/30 overflow-hidden shadow-sm">
              <div className="dotted-pattern absolute inset-0"></div>
              
              <div className="relative z-10 space-y-6">
                <div>
                  <h3 className="text-headline-sm font-headline-sm text-academic-navy mb-2">Unlock for free by contributing</h3>
                  <p className="text-body-md text-on-surface-variant">
                    Help your peers by sharing your study materials, notes, or research papers.
                  </p>
                </div>

                {/* Progress Bar Container */}
                <div className="bg-white/70 p-6 rounded-xl border border-white/80 shadow-sm backdrop-blur-sm">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-label-md font-bold text-academic-navy">
                      {uploadProgress.approvedUploadCount}/{uploadProgress.requiredCount || 3} documents uploaded
                    </span>
                    <span className="text-label-sm text-primary font-bold">{progressPercent}%</span>
                  </div>

                  <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 shadow-[0_0_10px_rgba(53,37,205,0.3)]"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>

                  <p className="mt-4 text-xs text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">info</span>
                    Upload {uploadProgress.uploadsUntilNextCredit} more approved document{uploadProgress.uploadsUntilNextCredit !== 1 ? 's' : ''} to earn 1 unlock credit
                  </p>
                </div>

                <button
                  onClick={() => navigate('/dashboard?tab=My Uploads')}
                  className="w-full py-4 px-6 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 group shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">cloud_upload</span>
                  Upload a Document
                </button>

                <div className="pt-4 grid grid-cols-3 gap-2">
                  <div className="text-center p-3 rounded-lg border border-outline-variant/30 bg-white/40">
                    <span className="material-symbols-outlined text-academic-navy mb-1">verified</span>
                    <p className="text-[10px] font-bold uppercase text-on-surface-variant">Original</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border border-outline-variant/30 bg-white/40">
                    <span className="material-symbols-outlined text-academic-navy mb-1">description</span>
                    <p className="text-[10px] font-bold uppercase text-on-surface-variant">Quality</p>
                  </div>
                  <div className="text-center p-3 rounded-lg border border-outline-variant/30 bg-white/40">
                    <span className="material-symbols-outlined text-academic-navy mb-1">history_edu</span>
                    <p className="text-[10px] font-bold uppercase text-on-surface-variant">Relevant</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Institutional Access Trust Note */}
            <div className="p-6 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-start gap-4 shadow-sm">
              <span className="material-symbols-outlined text-blue-600 mt-1 text-2xl">school</span>
              <p className="text-body-sm text-blue-900 leading-relaxed">
                <strong className="text-academic-navy">Institutional Access:</strong> Students from partner institutions with <code class="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-xs text-blue-950">@cps.edu.np</code> emails always get free access — no subscription or upload needed. Just sign in with your student ID.
              </p>
            </div>
          </section>

        </div>

        {/* Document Preview Context Footer (rendered when user arrives from a locked document) */}
        {documentId && (
          <div className="mt-20 glass-card p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between border border-outline-variant/50 max-w-4xl mx-auto shadow-md gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-16 bg-primary-container/10 border border-primary-container/20 rounded-lg flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">description</span>
              </div>
              <div>
                <h4 className="font-bold text-academic-navy text-base">
                  {documentContext?.title || 'Selected Academic Document'}
                </h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {documentContext?.subject || 'Academic Resource'} • {documentContext?.fileFormat?.toUpperCase() || 'PDF'} • {documentContext?.semester || 'Semester Document'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-on-surface-variant font-medium hidden sm:inline">Currently Locked</span>
              <button
                onClick={() => navigate(`/documents/${documentId}/view`)}
                className="px-4 py-2 border border-outline-variant text-on-surface-variant hover:text-primary rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Back to Preview
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-12 text-center text-on-surface-variant border-t border-outline-variant/20 bg-surface/50">
        <p className="text-label-sm">© 2024 Eduflux EdTech. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-4">
          <a href="#" className="hover:text-primary transition-colors text-label-sm">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors text-label-sm">Terms of Service</a>
          <a href="#" className="hover:text-primary transition-colors text-label-sm">Help Center</a>
        </div>
      </footer>
    </div>
  );
}
