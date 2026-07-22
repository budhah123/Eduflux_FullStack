import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../../services/api/apiClient';

export default function OverviewPanel({ setActiveTab }) {
  const [userName, setUserName] = useState('User');
  const [greeting, setGreeting] = useState('Good morning');
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({
    approvedUploadCount: 0,
    unlockCredits: 0,
    uploadsUntilNextCredit: 3,
  });
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (value) => {
    if (!value) return 'Recently';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'Recently'
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const daysRemaining = useMemo(() => {
    if (!subscription?.expiryDate) return null;
    const diff = new Date(subscription.expiryDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [subscription]);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [me, sub, progress, uploads] = await Promise.all([
          apiClient.get('/users/me'),
          apiClient.get('/subscription/me').catch(() => null),
          apiClient.get('/users/me/upload-progress').catch(() => null),
          apiClient
            .get('/documents/user/my-uploads?page=1&limit=6')
            .catch(() => null),
        ]);

        if (!mounted) return;

        setProfile(me);
        const firstName =
          me?.firstName ||
          me?.fullName?.split(' ')?.[0] ||
          me?.email?.split('@')?.[0] ||
          'User';
        setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1));
        setSubscription(sub);
        setUploadProgress(
          progress || {
            approvedUploadCount: 0,
            unlockCredits: 0,
            uploadsUntilNextCredit: 3,
          },
        );
        setRecentDocs(uploads?.data || []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();

    const refreshOnFocus = () => loadDashboard();
    const refreshOnDataChange = () => loadDashboard();

    window.addEventListener('focus', refreshOnFocus);
    window.addEventListener('pageshow', refreshOnFocus);
    window.addEventListener('eduflux:dashboard-refresh', refreshOnDataChange);

    return () => {
      mounted = false;
      window.removeEventListener('focus', refreshOnFocus);
      window.removeEventListener('pageshow', refreshOnFocus);
      window.removeEventListener(
        'eduflux:dashboard-refresh',
        refreshOnDataChange,
      );
    };

    // 2. Set dynamic greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  const totalDownloads = Array.isArray(recentDocs)
    ? recentDocs.reduce((acc, doc) => acc + (doc.downloadCount || 0), 0)
    : 0;

  const stats = [
    {
      label: 'Documents Uploaded',
      value: recentDocs.length.toString(),
      icon: 'description',
      color: 'text-primary bg-primary/10',
    },
    {
      label: 'Downloads',
      value: totalDownloads.toString(),
      icon: 'download',
      color: 'text-academic-blue bg-academic-blue/10',
    },
    {
      label: 'Unlock Credits',
      value: String(uploadProgress.unlockCredits ?? 0),
      icon: 'workspace_premium',
      color: 'text-academic-gold bg-academic-gold/10',
    },
    {
      label: 'Subscription Status',
      value:
        subscription?.status === 'active' || subscription?.status === 'ACTIVE'
          ? `${subscription.planType || 'Pro'}`
          : 'No active subscription',
      icon: 'verified',
      color: 'text-tertiary bg-tertiary/10',
    },
  ];

  return (
    <div className="p-8 max-w-container-max mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up">
      {/* Left Column (Main Stats and Docs) */}
      <div className="lg:col-span-8 space-y-8">
        {/* Welcome Banner */}
        <section className="relative overflow-hidden rounded-3xl p-8 bg-primary-container text-on-primary-container shadow-md">
          <div className="relative z-10">
            <h1 className="font-headline-lg text-headline-lg mb-2">
              {greeting}, {userName}! 👋
            </h1>
            <p className="font-body-md text-body-md opacity-90 max-w-md">
              {profile?.isInstitutional
                ? 'Free Access — Techspire Student'
                : subscription?.status === 'active' ||
                    subscription?.status === 'ACTIVE'
                  ? `Your ${subscription.planType || 'pro'} plan is active${daysRemaining !== null ? ` with ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining.` : '.'}`
                  : 'Upgrade to Pro for unlimited AI insights and storage.'}
            </p>
          </div>
          {/* Decorative Elements */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute right-10 top-5 opacity-20 hidden md:block">
            <span
              className="material-symbols-outlined text-[120px]"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              school
            </span>
          </div>
        </section>

        {/* Stats Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-all duration-200 select-none"
            >
              <div className="flex justify-between items-start mb-4">
                <span
                  className={`material-symbols-outlined p-2 rounded-lg ${stat.color}`}
                >
                  {stat.icon}
                </span>
              </div>
              <p className="font-label-sm text-label-sm text-text-muted mb-1">
                {stat.label}
              </p>
              <p className="font-headline-sm text-headline-sm font-bold">
                {stat.value}
              </p>
            </div>
          ))}
        </section>

        {/* Recent Documents */}
        <section className="space-y-6">
          <div className="flex justify-between items-center select-none">
            <h2 className="font-headline-sm text-headline-sm text-text-main font-semibold">
              Recent Documents
            </h2>
            <button
              onClick={() => setActiveTab('Browse')}
              className="text-primary hover:underline font-label-md text-label-md cursor-pointer bg-transparent border-none"
            >
              View all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentDocs.length > 0 ? (
              recentDocs.map((doc, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveTab('My Uploads')}
                  className="group bg-white p-5 rounded-2xl border border-outline-variant hover:border-primary transition-all duration-200 shadow-sm cursor-pointer hover:-translate-y-0.5"
                >
                  <div className="flex justify-between items-start mb-4 select-none">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${doc.tagBg}`}
                    >
                      {doc.status || 'Uploaded'}
                    </span>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                      more_vert
                    </span>
                  </div>
                  <h3 className="font-label-md text-label-md font-bold mb-4 line-clamp-2 text-text-main group-hover:text-primary transition-colors min-h-[40px]">
                    {doc.title}
                  </h3>
                  <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30 select-none">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-academic-blue">
                        description
                      </span>
                      <span className="font-label-sm text-label-sm text-text-muted">
                        {doc.subject || 'General'}
                      </span>
                    </div>
                    <span className="text-[10px] text-text-muted">
                      {formatDate(doc.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white rounded-2xl border border-outline-variant p-8 text-text-muted text-center">
                No uploads yet. Your recent documents will appear here.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Right Column (Shortcuts and Panels) */}
      <div className="lg:col-span-4 space-y-8">
        {/* AI Chat Shortcut Promo Card */}
        <section
          onClick={() => setActiveTab('AI Chat')}
          className="group relative bg-gradient-to-br from-secondary to-primary p-6 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                <span
                  className="material-symbols-outlined text-white text-[28px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_awesome
                </span>
              </div>
              <h2 className="font-headline-sm text-headline-sm text-white leading-tight font-bold">
                Chat with any document using AI
              </h2>
              <p className="font-body-sm text-body-sm text-white/80 mt-2">
                Upload a file and get instant summaries, answers, and data
                extraction.
              </p>
            </div>
            <button className="bg-white text-primary font-bold py-3 px-6 rounded-xl self-start flex items-center gap-2 group-hover:gap-4 transition-all duration-200 shadow-sm cursor-pointer select-none">
              Start Chatting
              <span
                className="material-symbols-outlined"
                style={{ verticalAlign: 'middle' }}
              >
                arrow_forward
              </span>
            </button>
          </div>
          {/* Background Vector Graphic decoration */}
          <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-all duration-500">
            <span
              className="material-symbols-outlined text-[200px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bolt
            </span>
          </div>
        </section>

        {/* Notifications Panel */}
        <section className="bg-white rounded-3xl border border-outline-variant flex flex-col overflow-hidden shadow-sm">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-bright select-none">
            <h2 className="font-label-md text-label-md font-bold text-on-surface">
              Notifications
            </h2>
            <span className="bg-primary text-on-primary text-[10px] px-2.5 py-0.5 rounded-full font-bold">
              3 New
            </span>
          </div>

          <div className="p-2 space-y-1 max-h-[350px] overflow-y-auto custom-scrollbar">
            {/* Notification 1 */}
            <div className="p-4 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer border-l-4 border-primary">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-primary text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_awesome
                  </span>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm font-bold text-on-surface">
                    AI Synthesis Complete
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Your summary of "Quantum Computing Intro" is ready.
                  </p>
                  <p className="text-[10px] text-primary mt-2 font-semibold">
                    5 mins ago
                  </p>
                </div>
              </div>
            </div>

            {/* Notification 2 */}
            <div className="p-4 rounded-2xl hover:bg-surface-container-low transition-colors cursor-pointer border-l-4 border-transparent">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex-shrink-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    group
                  </span>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm font-bold text-on-surface">
                    New Shared Resource
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Dr. Sarah shared "Lab Results - May" with your group.
                  </p>
                  <p className="text-[10px] text-text-muted mt-2">1 hour ago</p>
                </div>
              </div>
            </div>

            {/* Notification 3 */}
            <div className="p-4 rounded-2xl hover:bg-surface-container-low transition-colors cursor-pointer border-l-4 border-transparent">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-academic-gold/10 flex-shrink-0 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-academic-gold text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm font-bold text-on-surface">
                    Course Verified
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    Your certificate for "Advanced AI Ethics" has been issued.
                  </p>
                  <p className="text-[10px] text-text-muted mt-2">
                    3 hours ago
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-outline-variant bg-surface-bright text-center select-none">
            <button className="font-label-sm text-label-sm text-text-muted hover:text-primary transition-colors cursor-pointer bg-transparent border-none">
              Mark all as read
            </button>
          </div>
        </section>

        {/* Active Downloads Progress Bar Card */}
        <section className="bg-white p-6 rounded-3xl border border-outline-variant shadow-sm select-none">
          <h2 className="font-label-md text-label-md font-bold mb-6 text-on-surface">
            Active Downloads
          </h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-label-sm text-label-sm font-medium text-text-main">
                  Research_Paper_v2.pdf
                </span>
                <span className="text-[10px] text-primary font-bold">75%</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[75%] rounded-full transition-all duration-500"></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-label-sm text-label-sm font-medium text-text-main">
                  Dataset_X_Final.csv
                </span>
                <span className="text-[10px] text-primary font-bold">32%</span>
              </div>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[32%] rounded-full transition-all duration-500"></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
