import React, { useState } from 'react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('monthly');

  // Registration chart data simulation
  const monthlyData = [
    { label: 'Jan', value: 120, height: 'h-[40%]' },
    { label: 'Feb', value: 180, height: 'h-[60%]' },
    { label: 'Mar', value: 165, height: 'h-[55%]' },
    { label: 'Apr', value: 240, height: 'h-[85%]' },
    { label: 'May', value: 210, height: 'h-[70%]' },
    { label: 'Jun', value: 290, height: 'h-[95%]' },
  ];

  const weeklyData = [
    { label: 'W1', value: 45, height: 'h-[30%]' },
    { label: 'W2', value: 75, height: 'h-[50%]' },
    { label: 'W3', value: 95, height: 'h-[65%]' },
    { label: 'W4', value: 110, height: 'h-[80%]' },
    { label: 'W5', value: 85, height: 'h-[58%]' },
    { label: 'W6', value: 130, height: 'h-[95%]' },
  ];

  const chartData = activeTab === 'monthly' ? monthlyData : weeklyData;

  const stats = [
    {
      title: 'Total Users',
      value: '1,580',
      icon: 'group',
      color: 'text-[#3525cd]',
      badge: '+12% this month',
      badgeColor: 'text-emerald-600',
      badgeIcon: 'trending_up',
    },
    {
      title: 'Techspire',
      value: '980',
      icon: 'school',
      color: 'text-[#3a65aa]',
      badge: 'Verified students',
      badgeColor: 'text-slate-500',
    },
    {
      title: 'Subscribers',
      value: '320',
      icon: 'subscriptions',
      color: 'text-[#712ae2]',
      badge: 'Active pro plans',
      badgeColor: 'text-slate-500',
    },
    {
      title: 'Total Docs',
      value: '4,200',
      icon: 'library_books',
      color: 'text-[#eaa03f]',
      badge: 'Peer-reviewed resources',
      badgeColor: 'text-slate-500',
    },
  ];

  const recentActivity = [
    {
      title: 'Quantum Mechanics Research Paper',
      action: 'uploaded by',
      subject: 'Dr. Sarah K.',
      meta: '12 minutes ago • Research/Physics',
      status: 'Processed',
      statusClass: 'bg-emerald-100 text-emerald-700',
      icon: 'description',
      iconClass: 'bg-[#3525cd]/10 text-[#3525cd]',
      borderClass: 'border-l-4 border-[#3525cd]',
    },
    {
      title: 'New Institutional Partner',
      action: 'added',
      subject: 'Global Tech Academy',
      meta: '2 hours ago • Onboarding',
      status: 'Pending',
      statusClass: 'bg-slate-100 text-slate-700',
      icon: 'person_add',
      iconClass: 'bg-[#712ae2]/10 text-[#712ae2]',
      borderClass: 'border-l-4 border-[#712ae2]',
    },
    {
      title: 'AI Summary Engine',
      action: 'completed analysis for',
      subject: '142 documents',
      meta: '5 hours ago • System Task',
      status: 'Active',
      statusClass: 'bg-blue-100 text-blue-700',
      icon: 'auto_awesome',
      iconClass: 'bg-[#eaa03f]/10 text-[#eaa03f]',
      borderClass: 'border-l-4 border-[#eaa03f]',
    },
  ];

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
              <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
            </div>
            <div className="text-3xl font-bold text-[#1E293B]">{stat.value}</div>
            <div className={`text-xs ${stat.badgeColor} mt-2 flex items-center gap-1 font-medium`}>
              {stat.badgeIcon && (
                <span className="material-symbols-outlined text-[14px]">{stat.badgeIcon}</span>
              )}
              {stat.badge}
            </div>
          </div>
        ))}

          {/* Revenue Bento (Custom Styled) */}
          <div className="bg-[#3525cd] text-white p-6 rounded-xl border-none shadow-sm transition-all hover:-translate-y-[2px] sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-200 text-xs font-semibold uppercase tracking-wider opacity-90">
                Revenue
              </span>
              <span className="material-symbols-outlined text-[#e2dfff]">payments</span>
            </div>
            <div className="text-3xl font-bold">NPR 95,700</div>
            <div className="text-xs text-[#dad7ff] mt-2 opacity-80">Net growth +8.4%</div>
          </div>
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* User Registrations Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white/90 backdrop-blur-md border border-[#c7c4d8]/40 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#1E293B]">User Registrations</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('weekly')}
                className={`text-xs font-medium px-3 py-1.5 rounded-md border border-[#c7c4d8]/40 transition-colors ${
                  activeTab === 'weekly' ? 'bg-[#3525cd] text-white border-transparent' : 'bg-[#edeeef] text-[#1E293B] hover:bg-[#e7e8e9]'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setActiveTab('monthly')}
                className={`text-xs font-medium px-3 py-1.5 rounded-md border border-[#c7c4d8]/40 transition-colors ${
                  activeTab === 'monthly' ? 'bg-[#3525cd] text-white border-transparent' : 'bg-[#edeeef] text-[#1E293B] hover:bg-[#e7e8e9]'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-4 px-2">
            {chartData.map((data, i) => (
              <div key={i} className={`flex-1 bg-[#3525cd]/10 rounded-t-lg relative group ${data.height}`}>
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1E293B] text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  {data.value} Users
                </div>
                <div className="w-full bg-[#3525cd] h-2 absolute top-0 rounded-full"></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
            {chartData.map((data, i) => (
              <span key={i} className="flex-1 text-center">{data.label}</span>
            ))}
          </div>
        </div>

        {/* User Types Donut */}
        <div className="col-span-12 lg:col-span-4 bg-white/90 backdrop-blur-md border border-[#c7c4d8]/40 p-6 rounded-xl shadow-sm flex flex-col items-center justify-center">
          <h3 className="w-full text-left text-lg font-bold text-[#1E293B] mb-6">User Types</h3>
          
          <div className="relative w-48 h-48 rounded-full border-[16px] border-[#edeeef] flex items-center justify-center">
            {/* Donut Segments Simulated by clip paths */}
            <div
              className="absolute inset-0 rounded-full border-[16px] border-[#3525cd]"
              style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 50%)' }}
            ></div>
            <div
              className="absolute inset-0 rounded-full border-[16px] border-[#712ae2]"
              style={{ clipPath: 'polygon(50% 50%, 0% 50%, 0% 0%, 50% 0%)' }}
            ></div>
            <div className="text-center z-10">
              <span className="text-3xl font-extrabold text-[#1E293B]">1.5k</span>
              <span className="block text-xs text-slate-500 font-medium">Active Users</span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-2 w-full">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#3525cd]"></span>
              <span className="text-xs text-[#1E293B] font-medium">Students (62%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#712ae2]"></span>
              <span className="text-xs text-[#1E293B] font-medium">Subscribers (20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#e7e8e9]"></span>
              <span className="text-xs text-[#1E293B] font-medium">Guests (18%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Daily Uploads Bar */}
        <div className="col-span-12 lg:col-span-4 bg-white/90 backdrop-blur-md border border-[#c7c4d8]/40 p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <h3 className="text-lg font-bold text-[#1E293B] mb-6">Daily Uploads</h3>
          <div className="flex items-end h-40 gap-2 mb-4">
            <div className="flex-1 bg-[#3a65aa] rounded-t-sm h-[30%]"></div>
            <div className="flex-1 bg-[#3a65aa] rounded-t-sm h-[45%]"></div>
            <div className="flex-1 bg-[#3a65aa] rounded-t-sm h-[85%]"></div>
            <div className="flex-1 bg-[#3a65aa] rounded-t-sm h-[60%]"></div>
            <div className="flex-1 bg-[#3a65aa] rounded-t-sm h-[40%]"></div>
            <div className="flex-1 bg-[#3a65aa] rounded-t-sm h-[90%]"></div>
            <div className="flex-1 bg-[#3a65aa] rounded-t-sm h-[75%]"></div>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed mt-2">
            System handled <span className="text-[#1E293B] font-bold">245 uploads</span> today with an average processing time of <span className="text-[#1E293B] font-bold">1.2s</span>.
          </p>
        </div>

        {/* Recent Activity Feed */}
        <div className="col-span-12 lg:col-span-8 bg-white/90 backdrop-blur-md border border-[#c7c4d8]/40 p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#1E293B]">Recent Activity</h3>
            <button className="text-[#3525cd] text-xs font-bold hover:underline">
              View All Logs
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, i) => (
              <div
                key={i}
                className={`flex items-center gap-4 p-3 hover:bg-[#f3f4f5] rounded-lg transition-colors ${activity.borderClass}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activity.iconClass}`}>
                  <span className="material-symbols-outlined">{activity.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1E293B] truncate">
                    {activity.title} <span className="text-slate-500 font-normal">{activity.action}</span>{' '}
                    <span className="text-[#3525cd]">{activity.subject}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{activity.meta}</p>
                </div>
                <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase whitespace-nowrap shrink-0 ${activity.statusClass}`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
