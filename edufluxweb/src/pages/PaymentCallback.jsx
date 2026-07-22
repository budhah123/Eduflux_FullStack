import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../services/api/apiClient';
import { useToast } from '../context/ToastContext';

export default function PaymentCallback({
  provider = 'khalti',
  isFailure = false,
}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [verifying, setVerifying] = useState(!isFailure);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(
    isFailure ? 'Payment process was canceled or failed.' : '',
  );
  const [subDetails, setSubDetails] = useState(null);

  const returnDocId = sessionStorage.getItem('pending_return_document_id');

  const handleFinishNavigation = () => {
    if (returnDocId) {
      sessionStorage.removeItem('pending_return_document_id');
      navigate(`/documents/${returnDocId}/view`);
    } else {
      navigate('/pricing');
    }
  };

  useEffect(() => {
    if (isFailure) return;

    const executeVerification = async () => {
      try {
        setVerifying(true);
        let pidx = searchParams.get('pidx');
        let transactionUuid =
          searchParams.get('transaction_uuid') ||
          searchParams.get('transactionUuid');
        let totalAmount = parseFloat(
          searchParams.get('amount') ||
            searchParams.get('total_amount') ||
            '499',
        );

        // Handle eSewa base64 encoded 'data' query param if present
        const encodedData = searchParams.get('data');
        if (encodedData) {
          try {
            const normalizedBase64 = encodedData
              .replace(/-/g, '+')
              .replace(/_/g, '/')
              .padEnd(Math.ceil(encodedData.length / 4) * 4, '=');
            const decodedJson = JSON.parse(atob(normalizedBase64));
            if (decodedJson.transaction_uuid) {
              transactionUuid = decodedJson.transaction_uuid;
            }
            if (decodedJson.total_amount) {
              totalAmount = parseFloat(decodedJson.total_amount);
            }
            if (decodedJson.amount && !decodedJson.total_amount) {
              totalAmount = parseFloat(decodedJson.amount);
            }
          } catch (e) {
            console.warn('Failed to parse eSewa data parameter:', e);
          }
        }

        const planType = totalAmount > 1000 ? 'yearly' : 'monthly';

        const payload = {
          provider: provider,
          planType: planType,
          amount: totalAmount,
          ...(pidx ? { pidx } : {}),
          ...(transactionUuid ? { transactionUuid } : {}),
        };

        const res = await apiClient.post('/payment/verify', payload);

        if (res?.success || res?.subscription) {
          setSuccess(true);
          setSubDetails(res.subscription);
          showToast('Payment verified & subscription activated!', 'success');
        } else {
          throw new Error(res?.message || 'Verification unsuccessful.');
        }
      } catch (err) {
        console.error('Payment Verification error:', err);
        setErrorMsg(err.message || 'Failed to verify payment with gateway.');
        setSuccess(false);
        showToast(err.message || 'Payment verification failed.', 'error');
      } finally {
        setVerifying(false);
      }
    };

    executeVerification();
  }, [searchParams, provider, isFailure]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans text-on-surface">
      <div className="bg-white rounded-2xl border border-outline-variant p-8 md:p-12 max-w-md w-full shadow-2xl text-center">
        {verifying ? (
          <div className="space-y-6 py-6">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>
              <h2 className="text-xl font-bold text-text-main">
                Verifying Payment...
              </h2>
              <p className="text-sm text-text-muted mt-2">
                Please wait while we confirm your payment with{' '}
                {provider.toUpperCase()}.
              </p>
            </div>
          </div>
        ) : success ? (
          <div className="space-y-6 py-4">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <span
                className="material-symbols-outlined text-[48px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                Payment Successful
              </span>
              <h2 className="text-2xl font-bold text-text-main">
                Subscription Activated!
              </h2>
              <p className="text-sm text-text-muted mt-2">
                Thank you! Your Eduflux Pro subscription is now active.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Payment Provider:</span>
                <span className="font-bold text-text-main uppercase">
                  {provider}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Plan Status:</span>
                <span className="font-bold text-emerald-600">ACTIVE</span>
              </div>
              {subDetails?.expiryDate && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Valid Until:</span>
                  <span className="font-bold text-text-main">
                    {new Date(subDetails.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleFinishNavigation}
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-label-md text-label-md font-bold shadow-md hover:opacity-90 transition-all cursor-pointer"
            >
              {returnDocId
                ? 'Return to Unlocked Document'
                : 'Continue to Eduflux'}
            </button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-[48px]">
                error
              </span>
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider mb-2">
                Payment Failed
              </span>
              <h2 className="text-2xl font-bold text-text-main">
                Verification Error
              </h2>
              <p className="text-sm text-text-muted mt-2">{errorMsg}</p>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={() => navigate('/pricing')}
                className="w-full py-3 bg-primary text-on-primary rounded-xl font-label-md text-label-md font-bold shadow-md hover:opacity-90 transition-all cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
