import React, { useEffect, useState } from 'react';
import { documentApi } from '../services/api/documentApi';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await documentApi.adminGetDashboardStats();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to load admin dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const kpi = dashboardData?.kpi || {
    totalUsers: 0,
    institutionalUsers: 0,
    subscribers: 0,
    totalDocs: 0,
    revenue: 'NPR 0',
  };

  const monthlyData = dashboardData?.charts?.monthlyData || [
    { label: 'Jan', value: 0, height: '15%' },
    { label: 'Feb', value: 0, height: '15%' },
    { label: 'Mar', value: 0, height: '15%' },
    { label: 'Apr', value: 0, height: '15%' },
    { label: 'May', value: 0, height: '15%' },
    { label: 'Jun', value: 0, height: '15%' },
  ];

  const weeklyData = dashboardData?.charts?.weeklyData || [
    { label: 'W1', value: 0, height: '15%' },
    { label: 'W2', value: 0, height: '15%' },
    { label: 'W3', value: 0, height: '15%' },
    { label: 'W4', value: 0, height: '15%' },
    { label: 'W5', value: 0, height: '15%' },
    { label: 'W6', value: 0, height: '15%' },
  ];

  const chartData = activeTab === 'monthly' ? monthlyData : weeklyData;

  const stats = [
    {
      title: 'Total Users',
      value: kpi.totalUsers.toLocaleString(),
      icon: 'group',
      color: 'text-[#3525cd]',
      badge: 'Active community',
      badgeColor: 'text-emerald-600',
      badgeIcon: 'trending_up',
    },
    {
      title: 'Institutional',
      value: kpi.institutionalUsers.toLocaleString(),
      icon: 'school',
      color: 'text-[#3a65aa]',
      badge: 'Verified students',
      badgeColor: 'text-slate-500',
    },
    {
      title: 'Subscribers',
      value: kpi.subscribers.toLocaleString(),
      icon: 'subscriptions',
      color: 'text-[#712ae2]',
      badge: 'Active pro plans',
      badgeColor: 'text-slate-500',
    },
    {
      title: 'Total Docs',
      value: kpi.totalDocs.toLocaleString(),
      icon: 'library_books',
      color: 'text-[#eaa03f]',
      badge: 'Academic assets',
      badgeColor: 'text-slate-500',
    },
  ];

  const userTypes = dashboardData?.userTypes || {
    total: kpi.totalUsers,
    studentPercent: 70,
    subscriberPercent: 20,
    guestPercent: 10,
    studentsCount: 0,
    subscribersCount: 0,
    guestsCount: 0,
  };

  const dailyUploads = dashboardData?.dailyUploads?.bars || [
    { label: 'Mon', value: 0, height: '20%' },
    { label: 'Tue', value: 0, height: '20%' },
    { label: 'Wed', value: 0, height: '20%' },
    { label: 'Thu', value: 0, height: '20%' },
    { label: 'Fri', value: 0, height: '20%' },
    { label: 'Sat', value: 0, height: '20%' },
    { label: 'Sun', value: 0, height: '20%' },
  ];

  const dailyUploadsSummary = {
    todayCount: dashboardData?.dailyUploads?.todayCount ?? 0,
    avgProcessingTime: dashboardData?.dailyUploads?.avgProcessingTime || '1.2s',
  };

  const recentActivity = (dashboardData?.recentActivity || []).slice(0, 5);

  return (
    <div className="flex flex-col gap-8 font-sans">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white/90 backdrop-blur-md border border-[#c7c4d8]/40 p-6 rounded-xl shadow-sm transition-all hover:-translate-y-[2px]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                {stat.title}
              </span>
              <span className={`material-symbols-outlined ${stat.color}`}>
                {stat.icon}
              </span>
            </div>
            <div className="text-3xl font-bold text-[#1E293B]">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-slate-200 rounded animate-pulse" />
              ) : (
                stat.value
              )}
            </div>
            <div
              className={`text-xs ${stat.badgeColor} mt-2 flex items-center gap-1 font-medium`}
            >
              {stat.badgeIcon && (
                <span className="material-symbols-outlined text-[14px]">
                  {stat.badgeIcon}
                </span>
              )}
              {stat.badge}
            </div>
          </div>
        ))}

        {/* Revenue Bento */}
        <div className="bg-[#3525cd] text-white p-6 rounded-xl border-none shadow-sm transition-all hover:-translate-y-[2px] sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-200 text-xs font-semibold uppercase tracking-wider opacity-90">
              Revenue
            </span>
            <span className="material-symbols-outlined text-[#e2dfff]">
              payments
            </span>
          </div>
          <div className="text-3xl font-bold">
            {loading ? (
              <span className="inline-block w-24 h-8 bg-white/30 rounded animate-pulse" />
            ) : (
              kpi.revenue
            )}
          </div>
          <div className="text-xs text-[#dad7ff] mt-2 opacity-80">
            Subscription receipts
          </div>
        </div>
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* User Registrations Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white/90 backdrop-blur-md border border-[#c7c4d8]/40 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-[#1E293B]">
                User Registrations
              </h3>
              <p className="text-xs text-slate-500">Live platform onboarding velocity</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('weekly')}
                className={`text-xs font-medium px-3 py-1.5 rounded-md border border-[#c7c4d8]/40 transition-colors ${
                  activeTab === 'weekly'
                    ? 'bg-[#3525cd] text-white border-transparent'
                    : 'bg-[#edeeef] text-[#1E293B] hover:bg-[#e7e8e9]'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setActiveTab('monthly')}
                className={`text-xs font-medium px-3 py-1.5 rounded-md border border-[#c7c4d8]/40 transition-colors ${
                  activeTab === 'monthly'
                    ? 'bg-[#3525cd] text-white border-transparent'
                    : 'bg-[#edeeef] text-[#1E293B] hover:bg-[#e7e8e9]'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 px-2">
            {chartData.map((data, i) => (
              <div
                key={i}
                className="flex-1 bg-[#3525cd]/10 rounded-t-lg relative group transition-all duration-300"
                style={{ height: data.height }}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1E293B] text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-md">
                  {data.value} Users
                </div>
                <div className="w-full bg-[#3525cd] h-2 absolute top-0 rounded-full"></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
            {chartData.map((data, i) => (
              <span key={i} className="flex-1 text-center">
                {data.label}
              </span>
            ))}
          </div>
        </div>

        {/* User Types Donut */}
        <div className="col-span-12 lg:col-span-4 bg-white/90 backdrop-blur-md border border-[#c7c4d8]/40 p-6 rounded-xl shadow-sm flex flex-col items-center justify-center">
          <h3 className="w-full text-left text-lg font-bold text-[#1E293B] mb-6">
            User Types
          </h3>

          <div
            className="relative w-48 h-48 rounded-full flex items-center justify-center shadow-inner"
            style={{
              background: `conic-gradient(#3525cd 0% ${userTypes.studentPercent}%, #712ae2 ${userTypes.studentPercent}% ${userTypes.studentPercent + userTypes.subscriberPercent}%, #e7e8e9 ${userTypes.studentPercent + userTypes.subscriberPercent}% 100%)`,
            }}
          >
            {/* Donut center cutout */}
            <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-sm z-10">
              <span className="text-3xl font-extrabold text-[#1E293B]">
                {loading ? '...' : kpi.totalUsers}
              </span>
              <span className="block text-xs text-slate-500 font-medium">
                Active Users
              </span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-2 w-full">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#3525cd]"></span>
              <span className="text-xs text-[#1E293B] font-medium">
                Students ({userTypes.studentPercent}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#712ae2]"></span>
              <span className="text-xs text-[#1E293B] font-medium">
                Subscribers ({userTypes.subscriberPercent}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#e7e8e9]"></span>
              <span className="text-xs text-[#1E293B] font-medium">
                Faculty/Other ({userTypes.guestPercent}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Daily Uploads Bar */}
        <div className="col-span-12 lg:col-span-4 bg-white/90 backdrop-blur-md border border-[#c7c4d8]/40 p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#1E293B] mb-1">
              Daily Uploads
            </h3>
            <p className="text-xs text-slate-500 mb-6">Activity over the last 7 days</p>
          </div>
          <div className="flex items-end h-40 gap-2 mb-4">
            {dailyUploads.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div
                  className="w-full bg-[#3a65aa] rounded-t-sm transition-all duration-300 relative group hover:bg-[#2c4e85]"
                  style={{ height: d.height }}
                >
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#1E293B] text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {d.value} docs
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                  {d.label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-500 leading-relaxed mt-2">
            System processed{' '}
            <span className="text-[#1E293B] font-bold">
              {dailyUploadsSummary.todayCount} uploads
            </span>{' '}
            today with an average processing time of{' '}
            <span className="text-[#1E293B] font-bold">
              {dailyUploadsSummary.avgProcessingTime}
            </span>
            .
          </p>
        </div>

        {/* Recent Activity Feed */}
        <div className="col-span-12 lg:col-span-8 bg-white/90 backdrop-blur-md border border-[#c7c4d8]/40 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-[#1E293B]">
                Recent Activity
              </h3>
              <p className="text-xs text-slate-500">Live system audit events</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-[#3525cd]/10 text-[#3525cd] rounded-full">
              Live Logs
            </span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3 py-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No recent activity recorded yet.
              </div>
            ) : (
              recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 p-3 hover:bg-[#f3f4f5] rounded-lg transition-colors ${activity.borderClass}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activity.iconClass}`}
                  >
                    <span className="material-symbols-outlined">
                      {activity.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1E293B] truncate">
                      {activity.title}{' '}
                      <span className="text-slate-500 font-normal">
                        {activity.action}
                      </span>{' '}
                      <span className="text-[#3525cd]">{activity.subject}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activity.meta}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-[10px] font-bold rounded uppercase whitespace-nowrap shrink-0 ${activity.statusClass}`}
                  >
                    {activity.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
