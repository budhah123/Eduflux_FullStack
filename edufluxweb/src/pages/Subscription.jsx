import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/apiClient';
import { useToast } from '../context/ToastContext';

export default function Subscription() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [subData, setSubData] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [selectedProvider, setSelectedProvider] = useState('khalti'); // 'khalti' | 'esewa'
  const [initiating, setInitiating] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: 'Academic User',
    role: 'Researcher',
  });

  // Fetch current subscription details
  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/subscription/me');
      setSubData(data);
    } catch (err) {
      console.warn('Subscription fetch error:', err.message);
      setSubData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
    // Load stored user info if available
    const storedUser =
      localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.name || parsed.fullName || parsed.email) {
          setUserProfile({
            name: parsed.name || parsed.fullName || parsed.email.split('@')[0],
            role: parsed.role || 'Researcher',
          });
        }
      } catch (e) {
        // ignore parse error
      }
    }
  }, []);

  useEffect(() => {
    const refreshSubscription = () => {
      fetchSubscription();
    };

    const handlePageShow = (event) => {
      if (event.persisted) {
        refreshSubscription();
      }
    };

    window.addEventListener('focus', refreshSubscription);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('focus', refreshSubscription);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [fetchSubscription]);

  // Initiate payment workflow
  const handleInitiatePayment = async (overridePlan) => {
    const planType = overridePlan || billingCycle;
    const amount = planType === 'yearly' ? 2870 : 299;

    try {
      setInitiating(true);
      showToast(
        `Initiating ${selectedProvider.toUpperCase()} payment for ${planType} plan...`,
      );

      const payload = {
        provider: selectedProvider,
        planType: planType,
        amount: amount,
      };

      // Call POST /payment/initiate
      const result = await apiClient.post('/payment/initiate', payload);

      if (selectedProvider === 'khalti') {
        if (result?.payment_url) {
          window.location.href = result.payment_url;
        } else if (result?.pidx && result?.payment_url) {
          window.location.href = result.payment_url;
        } else {
          throw new Error('Khalti payment URL not returned from backend.');
        }
      } else if (selectedProvider === 'esewa') {
        if (result?.formUrl && result?.fields) {
          // Create dynamic hidden form to submit eSewa payment
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
          throw new Error(
            'eSewa form submission parameters not returned from backend.',
          );
        }
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      showToast(err.message || 'Failed to initiate payment.', 'error');
    } finally {
      setInitiating(false);
    }
  };

  // Cancel subscription workflow
  const handleCancelSubscription = async () => {
    if (
      !window.confirm(
        'Are you sure you want to cancel your current active subscription?',
      )
    ) {
      return;
    }

    try {
      setCanceling(true);
      await apiClient.delete('/subscription/cancel');
      showToast('Subscription canceled successfully.');
      await fetchSubscription();
    } catch (err) {
      console.error('Cancel error:', err);
      showToast(err.message || 'Failed to cancel subscription.', 'error');
    } finally {
      setCanceling(false);
    }
  };

  const isActive = subData?.status === 'active' || subData?.status === 'ACTIVE';
  const planName =
    subData?.planType === 'yearly'
      ? 'Eduflux Pro (Yearly)'
      : 'Eduflux Pro (Monthly)';
  const formattedExpiry = subData?.expiryDate
    ? new Date(subData.expiryDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'October 14, 2023';

  return (
    <>
      <style>{`
        .custom-shadow {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .glass-effect {
          backdrop-filter: blur(8px);
          background: rgba(255, 255, 255, 0.8);
        }
      `}</style>

      <div className="bg-background min-h-screen text-on-surface font-sans">
        {/* Sidebar Navigation */}
        <aside className="flex flex-col h-full py-6 px-4 fixed left-0 top-0 z-40 bg-white dark:bg-surface-container border-r border-outline-variant dark:border-outline w-[240px]">
          <div className="mb-10 px-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                school
              </span>
              <h1 className="font-headline-sm text-headline-sm font-bold text-primary dark:text-inverse-primary">
                Eduflux
              </h1>
            </Link>
          </div>
          <nav className="flex-1 space-y-2">
            <Link
              className="text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-low flex items-center px-4 py-2 gap-3 transition-all duration-200 rounded-lg"
              to="/dashboard"
            >
              <span className="material-symbols-outlined">dashboard</span>
              <span className="font-label-md text-label-md">Dashboard</span>
            </Link>
            <Link
              className="text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-low flex items-center px-4 py-2 gap-3 transition-all duration-200 rounded-lg"
              to="/browse-panel"
            >
              <span className="material-symbols-outlined">search</span>
              <span className="font-label-md text-label-md">Browse</span>
            </Link>
            <Link
              className="text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-low flex items-center px-4 py-2 gap-3 transition-all duration-200 rounded-lg"
              to="/my-upload"
            >
              <span className="material-symbols-outlined">upload_file</span>
              <span className="font-label-md text-label-md">My Uploads</span>
            </Link>
            <Link
              className="text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-low flex items-center px-4 py-2 gap-3 transition-all duration-200 rounded-lg"
              to="/dashboard"
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              <span className="font-label-md text-label-md">AI Chat</span>
            </Link>
            <Link
              className="text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-low flex items-center px-4 py-2 gap-3 transition-all duration-200 rounded-lg"
              to="/dashboard"
            >
              <span className="material-symbols-outlined">bookmark</span>
              <span className="font-label-md text-label-md">Bookmarks</span>
            </Link>
            <Link
              className="bg-primary-container text-on-primary-container dark:bg-primary dark:text-on-primary rounded-lg flex items-center px-4 py-2 gap-3 translate-x-1 duration-200"
              to="/subscription"
            >
              <span className="material-symbols-outlined">credit_card</span>
              <span className="font-label-md text-label-md">Subscription</span>
            </Link>
          </nav>

          <div className="mt-auto border-t border-outline-variant pt-6 px-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-fixed-dim flex items-center justify-center text-primary font-bold">
                {userProfile.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-label-md text-label-md text-on-surface font-semibold">
                  {userProfile.name}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {userProfile.role}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/my-upload')}
              className="w-full bg-primary text-on-primary py-2 rounded-lg font-label-md text-label-md shadow-md hover:opacity-90 transition-opacity"
            >
              New Upload
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="ml-[240px] min-h-screen">
          {/* Top App Bar */}
          <header className="flex justify-between items-center w-full px-8 h-16 bg-surface-bright dark:bg-surface-dim border-b border-outline-variant z-30 sticky top-0">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">
                menu
              </span>
              <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                Subscription &amp; Payments
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high rounded-full p-2 cursor-pointer transition-all">
                notifications
              </span>
              <span className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-high rounded-full p-2 cursor-pointer transition-all">
                help
              </span>
              <div className="w-8 h-8 rounded-full bg-surface-container overflow-hidden border border-outline-variant flex items-center justify-center font-bold text-xs text-primary bg-primary-fixed-dim">
                {userProfile.name.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </header>

          {/* Content Canvas */}
          <div className="p-8 max-w-[1200px] mx-auto space-y-8">
            {/* Current Plan & Payment Gateway Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Current Plan Hero Card */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-outline-variant p-8 custom-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed opacity-10 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
                        isActive
                          ? 'bg-primary-fixed text-primary'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Current Plan
                    </span>
                    <h3 className="font-headline-md text-headline-md text-text-main font-bold">
                      {isActive ? planName : 'Eduflux Free Tier'}
                    </h3>
                    <p className="text-text-muted mt-1 text-sm">
                      {isActive
                        ? `Next billing date: ${formattedExpiry}`
                        : 'Upgrade to Pro for unlimited AI insights and storage.'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-headline-sm text-headline-sm text-primary font-bold">
                      {isActive
                        ? subData?.planType === 'yearly'
                          ? 'NPR 2,870'
                          : 'NPR 299'
                        : 'NPR 0'}
                      <span className="text-body-sm text-text-muted font-normal">
                        {isActive
                          ? subData?.planType === 'yearly'
                            ? '/yr'
                            : '/mo'
                          : '/mo'}
                      </span>
                    </p>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium inline-block mt-1 ${
                        isActive
                          ? 'text-on-tertiary-fixed-variant bg-tertiary-fixed/30'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {isActive ? 'Active' : 'Free'}
                    </span>
                  </div>
                </div>

                {/* Quota Progress Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
                    <p className="text-xs text-text-muted mb-1">Storage</p>
                    <p className="font-bold text-text-main">
                      {isActive ? '8.4 / 20 GB' : '0.5 / 2 GB'}
                    </p>
                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: isActive ? '42%' : '25%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
                    <p className="text-xs text-text-muted mb-1">AI Queries</p>
                    <p className="font-bold text-text-main">
                      {isActive ? '1,240 / 5,000' : '10 / 50'}
                    </p>
                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-secondary h-full rounded-full"
                        style={{ width: isActive ? '25%' : '20%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
                    <p className="text-xs text-text-muted mb-1">Team Seats</p>
                    <p className="font-bold text-text-main">
                      {isActive ? '3 / 5' : '1 / 1'}
                    </p>
                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-tertiary h-full rounded-full"
                        style={{ width: isActive ? '60%' : '100%' }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => handleInitiatePayment()}
                    disabled={initiating}
                    className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md shadow-sm hover:opacity-90 transition-all flex items-center gap-2 font-medium disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      upgrade
                    </span>
                    {initiating
                      ? 'Processing...'
                      : isActive
                        ? 'Renew / Upgrade Plan'
                        : 'Subscribe Now'}
                  </button>

                  {isActive && (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={canceling}
                      className="px-6 py-2.5 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-label-md text-label-md transition-all font-medium disabled:opacity-50"
                    >
                      {canceling ? 'Canceling...' : 'Cancel Subscription'}
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Method Quick Selector */}
              <div className="bg-white rounded-xl border border-outline-variant p-8 custom-shadow">
                <h4 className="font-headline-sm text-headline-sm mb-2 text-text-main font-bold">
                  Quick Payment
                </h4>
                <p className="text-body-sm text-text-muted mb-6 text-sm">
                  Select a preferred gateway for checkout.
                </p>

                <div className="space-y-4">
                  {/* Khalti Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedProvider('khalti')}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all group text-left ${
                      selectedProvider === 'khalti'
                        ? 'border-[#5C2D91] bg-[#5C2D91]/5'
                        : 'border-outline-variant/50 bg-surface-container-low hover:border-[#5C2D91]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#5C2D91] rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-sm">
                        K
                      </div>
                      <div>
                        <p className="font-bold text-[#5C2D91]">Khalti</p>
                        <p className="text-[11px] text-text-muted">
                          Pay with Khalti Wallet
                        </p>
                      </div>
                    </div>
                    {selectedProvider === 'khalti' ? (
                      <span
                        className="material-symbols-outlined text-[#5C2D91]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-outline-variant"></div>
                    )}
                  </button>

                  {/* eSewa Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedProvider('esewa')}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all group text-left ${
                      selectedProvider === 'esewa'
                        ? 'border-[#60BB46] bg-[#60BB46]/5'
                        : 'border-outline-variant/50 bg-surface-container-low hover:border-[#60BB46]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#60BB46] rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-sm">
                        e
                      </div>
                      <div>
                        <p className="font-bold text-[#60BB46]">eSewa</p>
                        <p className="text-[11px] text-text-muted">
                          Direct digital payment
                        </p>
                      </div>
                    </div>
                    {selectedProvider === 'esewa' ? (
                      <span
                        className="material-symbols-outlined text-[#60BB46]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-outline-variant"></div>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => handleInitiatePayment()}
                  disabled={initiating}
                  className="w-full mt-8 py-3 bg-primary text-on-primary rounded-lg font-label-md text-label-md shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all font-semibold disabled:opacity-50"
                >
                  {initiating
                    ? 'Redirecting...'
                    : `Pay via ${selectedProvider === 'khalti' ? 'Khalti' : 'eSewa'}`}
                </button>
              </div>
            </div>

            {/* Pricing Comparison & Toggle */}
            <div className="space-y-8 pt-4">
              <div className="flex flex-col items-center gap-6">
                <div className="text-center">
                  <h2 className="font-headline-lg text-headline-lg text-text-main font-bold">
                    Choose the Right Plan
                  </h2>
                  <p className="text-body-lg text-text-muted mt-1">
                    Empower your academic journey with advanced AI tools.
                  </p>
                </div>

                {/* Billing Cycle Toggle */}
                <div className="flex items-center gap-2 bg-surface-container p-1 rounded-full border border-outline-variant">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-8 py-2 rounded-full font-label-md text-label-md transition-all duration-300 ${
                      billingCycle === 'monthly'
                        ? 'bg-white text-primary shadow-sm font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-8 py-2 rounded-full font-label-md text-label-md transition-all duration-300 ${
                      billingCycle === 'yearly'
                        ? 'bg-white text-primary shadow-sm font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    Yearly (Save 20%)
                  </button>
                </div>
              </div>

              {/* Plans Table */}
              <div className="overflow-x-auto rounded-xl border border-outline-variant bg-white custom-shadow">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant">
                      <th className="p-6 font-label-md text-label-md text-text-muted uppercase tracking-wider">
                        Features
                      </th>
                      <th className="p-6 font-label-md text-label-md text-text-main text-center">
                        Free Tier
                      </th>
                      <th className="p-6 font-label-md text-label-md text-primary text-center bg-primary/5 font-bold">
                        Pro Plan
                      </th>
                      <th className="p-6 font-label-md text-label-md text-secondary text-center">
                        Institutional
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    <tr>
                      <td className="p-6 text-body-md font-medium">
                        Monthly Price
                      </td>
                      <td className="p-6 text-center text-text-main">NPR 0</td>
                      <td className="p-6 text-center text-primary font-bold bg-primary/5 text-lg">
                        NPR{' '}
                        <span>
                          {billingCycle === 'yearly'
                            ? '2,870 / yr'
                            : '299 / mo'}
                        </span>
                      </td>
                      <td className="p-6 text-center text-text-main font-medium">
                        Contact Sales
                      </td>
                    </tr>
                    <tr>
                      <td className="p-6 text-body-md">
                        AI Insights &amp; Chat
                      </td>
                      <td className="p-6 text-center">
                        <span className="material-symbols-outlined text-outline">
                          close
                        </span>
                      </td>
                      <td className="p-6 text-center bg-primary/5">
                        <span
                          className="material-symbols-outlined text-primary"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <span
                          className="material-symbols-outlined text-secondary"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-6 text-body-md">Cloud Storage</td>
                      <td className="p-6 text-center text-text-muted">2 GB</td>
                      <td className="p-6 text-center bg-primary/5 font-semibold text-primary">
                        20 GB
                      </td>
                      <td className="p-6 text-center text-text-muted">
                        Unlimited
                      </td>
                    </tr>
                    <tr>
                      <td className="p-6 text-body-md">Team Collaboration</td>
                      <td className="p-6 text-center">
                        <span className="material-symbols-outlined text-outline">
                          close
                        </span>
                      </td>
                      <td className="p-6 text-center bg-primary/5 text-text-main">
                        Up to 5 members
                      </td>
                      <td className="p-6 text-center text-text-muted">
                        Custom limit
                      </td>
                    </tr>
                    <tr>
                      <td className="p-6 text-body-md">Advanced Analytics</td>
                      <td className="p-6 text-center">
                        <span className="material-symbols-outlined text-outline">
                          close
                        </span>
                      </td>
                      <td className="p-6 text-center bg-primary/5">
                        <span
                          className="material-symbols-outlined text-primary"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <span
                          className="material-symbols-outlined text-secondary"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-6"></td>
                      <td className="p-6 text-center">
                        <button className="px-6 py-2 border border-outline rounded-lg text-label-md text-text-muted cursor-default">
                          {isActive ? 'Free Tier' : 'Current Plan'}
                        </button>
                      </td>
                      <td className="p-6 text-center bg-primary/5">
                        <button
                          onClick={() => handleInitiatePayment(billingCycle)}
                          disabled={initiating}
                          className="px-6 py-2 bg-primary text-on-primary rounded-lg text-label-md font-bold shadow-md hover:scale-105 transition-transform"
                        >
                          {isActive ? 'Renew Pro' : 'Get Started'}
                        </button>
                      </td>
                      <td className="p-6 text-center">
                        <a
                          href="mailto:support@eduflux.ai"
                          className="inline-block px-6 py-2 border border-secondary text-secondary rounded-lg text-label-md font-bold hover:bg-secondary/5 transition-colors"
                        >
                          Contact Us
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Billing History Section */}
            <div className="space-y-6 pt-4">
              <div className="flex justify-between items-center">
                <h2 className="font-headline-sm text-headline-sm text-text-main font-bold">
                  Billing History
                </h2>
                <button
                  onClick={() => showToast('Statement export generated.')}
                  className="flex items-center gap-2 text-primary font-label-md hover:underline font-semibold"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    download
                  </span>
                  Export Statement
                </button>
              </div>

              <div className="bg-white rounded-xl border border-outline-variant overflow-hidden custom-shadow">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-surface-container-low border-b border-outline-variant">
                        <th className="p-4 font-label-md text-label-md text-text-muted">
                          Invoice ID
                        </th>
                        <th className="p-4 font-label-md text-label-md text-text-muted">
                          Date
                        </th>
                        <th className="p-4 font-label-md text-label-md text-text-muted">
                          Amount
                        </th>
                        <th className="p-4 font-label-md text-label-md text-text-muted">
                          Status
                        </th>
                        <th className="p-4 font-label-md text-label-md text-text-muted text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                      {isActive ? (
                        <tr className="hover:bg-surface-container-lowest transition-colors">
                          <td className="p-4 font-medium text-text-main">
                            INV-2023-0914
                          </td>
                          <td className="p-4 text-text-muted">Sep 14, 2023</td>
                          <td className="p-4 text-text-main">
                            NPR{' '}
                            {subData?.planType === 'yearly'
                              ? '2,870.00'
                              : '299.00'}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              Paid
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => showToast('Invoice downloaded.')}
                              className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-all"
                            >
                              <span className="material-symbols-outlined">
                                receipt_long
                              </span>
                            </button>
                          </td>
                        </tr>
                      ) : null}
                      <tr className="hover:bg-surface-container-lowest transition-colors">
                        <td className="p-4 font-medium text-text-main">
                          INV-2023-0814
                        </td>
                        <td className="p-4 text-text-muted">Aug 14, 2023</td>
                        <td className="p-4 text-text-main">NPR 299.00</td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            Paid
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => showToast('Invoice downloaded.')}
                            className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-all"
                          >
                            <span className="material-symbols-outlined">
                              receipt_long
                            </span>
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-surface-container-lowest transition-colors">
                        <td className="p-4 font-medium text-text-main">
                          INV-2023-0614
                        </td>
                        <td className="p-4 text-text-muted">Jun 14, 2023</td>
                        <td className="p-4 text-text-main">NPR 299.00</td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            Failed
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() =>
                              showToast(
                                'Payment failed due to gateway timeout.',
                                'error',
                              )
                            }
                            className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-all"
                          >
                            <span className="material-symbols-outlined">
                              error
                            </span>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer Meta */}
            <div className="flex justify-center py-8 opacity-40">
              <p className="text-xs font-label-sm">
                Secure transactions powered by PCI-DSS certified gateways. ©
                2023 Eduflux Inc.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
