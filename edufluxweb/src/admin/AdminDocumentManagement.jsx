import React, { useState } from 'react';

export default function AdminDocumentManagement() {
  const [activeTab, setActiveTab] = useState('all');
  const [toastMessage, setToastMessage] = useState('');

  // Initial list of published documents
  const [documents, setDocuments] = useState([
    {
      id: 1,
      name: 'Quantum Physics Notes v2.pdf',
      size: '14.2 MB',
      type: 'PDF Document',
      uploader: 'Dr. Sarah Jenkins',
      category: 'Physics',
      date: 'Oct 24, 2023',
      downloads: 1204,
      status: 'Published',
      icon: 'description',
      iconClass: 'bg-[#3a65aa]/10 text-[#3a65aa]'
    },
    {
      id: 2,
      name: 'Market Analysis 2024.xlsx',
      size: '4.8 MB',
      type: 'Spreadsheet',
      uploader: 'Marcus Thorne',
      category: 'Economics',
      date: 'Oct 22, 2023',
      downloads: 856,
      status: 'Flagged',
      icon: 'article',
      iconClass: 'bg-[#b80000]/10 text-[#b80000]'
    },
    {
      id: 3,
      name: 'Ancient Greek Philosophy.pdf',
      size: '2.1 MB',
      type: 'PDF Document',
      uploader: 'Elena Rodriguez',
      category: 'History',
      date: 'Oct 20, 2023',
      downloads: 432,
      status: 'Published',
      icon: 'history_edu',
      iconClass: 'bg-[#eaa03f]/10 text-[#eaa03f]'
    }
  ]);

  // Initial list of flagged documents in moderation queue
  const [queue, setQueue] = useState([
    {
      id: 101,
      name: 'Restricted Lab Data.pdf',
      size: '8.5 MB',
      uploader: 'Liam Chen',
      reason: 'Potential Copyright Violation',
      icon: 'warning',
      iconClass: 'bg-[#ba1a1a]/10 text-[#ba1a1a]'
    },
    {
      id: 102,
      name: 'AI Ethics Draft Paper.docx',
      size: '1.2 MB',
      uploader: 'Sophia Miller',
      reason: 'Inappropriate Metadata',
      icon: 'warning',
      iconClass: 'bg-[#ba1a1a]/10 text-[#ba1a1a]'
    }
  ]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const handleApprove = (docId, name) => {
    // Remove from queue
    const approvedDoc = queue.find(d => d.id === docId);
    setQueue(queue.filter(d => d.id !== docId));
    
    // Add to main list
    if (approvedDoc) {
      const newDoc = {
        id: documents.length + 1,
        name: approvedDoc.name,
        size: approvedDoc.size,
        type: approvedDoc.name.endsWith('.pdf') ? 'PDF Document' : 'Document',
        uploader: approvedDoc.uploader,
        category: 'Moderated',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        downloads: 0,
        status: 'Published',
        icon: 'description',
        iconClass: 'bg-[#3a65aa]/10 text-[#3a65aa]'
      };
      setDocuments([...documents, newDoc]);
    }
    showToast(`Approved "${name}" successfully.`);
  };

  const handleReject = (docId, name) => {
    setQueue(queue.filter(d => d.id !== docId));
    showToast(`Rejected and removed "${name}" from repository.`);
  };

  const docStats = [
    {
      title: 'Total Documents',
      value: '14,204',
      badge: '+12% this week',
      badgeClass: 'text-emerald-600',
      badgeIcon: 'trending_up',
      borderClass: 'border-l-4 border-[#3525cd]'
    },
    {
      title: 'Pending Review',
      value: `${queue.length + 46}`, // dynamic + initial static offset
      badge: 'Needs attention',
      badgeClass: 'text-[#ba1a1a]',
      badgeIcon: 'priority_high',
      borderClass: 'border-l-4 border-[#eaa03f]'
    },
    {
      title: 'Unique Uploaders',
      value: '2,410',
      badge: 'Active users',
      badgeClass: 'text-emerald-600',
      badgeIcon: 'group',
      borderClass: 'border-l-4 border-emerald-500'
    }
  ];

  return (
    <div className="flex flex-col gap-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-[#1E293B] mb-1">Document Repository</h3>
          <p className="text-sm text-slate-500">Manage global academic assets and moderation requests.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg font-semibold text-sm hover:bg-[#f3f4f5] transition-colors">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            Filter
          </button>
          <button 
            onClick={() => showToast('Bulk Upload panel initialized')}
            className="flex items-center gap-2 px-4 py-2 bg-[#3525cd] text-white rounded-lg font-semibold text-sm shadow-sm hover:shadow-md hover:opacity-95 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Bulk Upload
          </button>
        </div>
      </div>

      {/* Tabs & Table Section */}
      <div className="bg-white rounded-xl border border-[#c7c4d8]/40 shadow-sm overflow-hidden">
        <div className="flex border-b border-[#c7c4d8]/30 px-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-6 font-semibold text-sm border-b-2 transition-all ${
              activeTab === 'all'
                ? 'border-[#3525cd] text-[#3525cd]'
                : 'border-transparent text-slate-500 hover:text-[#1E293B]'
            }`}
          >
            All Documents
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`py-4 px-6 font-semibold text-sm border-b-2 transition-all relative flex items-center ${
              activeTab === 'queue'
                ? 'border-[#3525cd] text-[#3525cd]'
                : 'border-transparent text-slate-500 hover:text-[#1E293B]'
            }`}
          >
            Moderation Queue
            {queue.length > 0 && (
              <span className="ml-2 bg-[#ba1a1a] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {queue.length}
              </span>
            )}
          </button>
        </div>

        {/* Content - All Documents */}
        {activeTab === 'all' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f3f4f5] border-b border-[#c7c4d8]/40">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Document Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Uploader</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Downloads</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c7c4d8]/20">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${doc.iconClass}`}>
                          <span className="material-symbols-outlined">{doc.icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1E293B]">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.size} • {doc.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1E293B]">{doc.uploader}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-[#edeeef] rounded-full text-xs font-semibold text-slate-700">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{doc.date}</td>
                    <td className="px-6 py-4 text-sm text-center font-bold">{doc.downloads.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        doc.status === 'Published'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          doc.status === 'Published' ? 'bg-emerald-600' : 'bg-amber-600'
                        }`}></span>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="p-6 flex justify-between items-center bg-white">
              <p className="text-xs font-semibold text-slate-500">Showing {documents.length} of 1,248 documents</p>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 border border-[#c7c4d8]/40 rounded hover:bg-[#f3f4f5] transition-colors text-xs font-semibold">Prev</button>
                <button className="px-3 py-1.5 bg-[#3525cd] text-white rounded shadow-sm text-xs font-semibold">1</button>
                <button className="px-3 py-1.5 border border-[#c7c4d8]/40 rounded hover:bg-[#f3f4f5] transition-colors text-xs font-semibold">2</button>
                <button className="px-3 py-1.5 border border-[#c7c4d8]/40 rounded hover:bg-[#f3f4f5] transition-colors text-xs font-semibold">3</button>
                <button className="px-3 py-1.5 border border-[#c7c4d8]/40 rounded hover:bg-[#f3f4f5] transition-colors text-xs font-semibold">Next</button>
              </div>
            </div>
          </div>
        )}

        {/* Content - Moderation Queue */}
        {activeTab === 'queue' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f3f4f5] border-b border-[#c7c4d8]/40">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Document Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Uploader</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Flag Reason</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c7c4d8]/20">
                {queue.length > 0 ? (
                  queue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${item.iconClass}`}>
                            <span className="material-symbols-outlined">{item.icon}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1E293B]">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.size}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#1E293B]">{item.uploader}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-[#ba1a1a] font-semibold">{item.reason}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(item.id, item.name)}
                            className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 hover:shadow-md transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(item.id, item.name)}
                            className="px-4 py-1.5 border border-[#ba1a1a] text-[#ba1a1a] rounded-lg text-xs font-bold hover:bg-[#ba1a1a]/5 transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-slate-500 text-sm">
                      Moderation queue is clean. No items to review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dashboard Stats Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {docStats.map((stat, idx) => (
          <div key={idx} className={`bg-white p-6 rounded-xl border border-[#c7c4d8]/40 shadow-sm ${stat.borderClass}`}>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{stat.title}</p>
            <h4 className="text-3xl font-bold text-[#1E293B]">{stat.value}</h4>
            <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${stat.badgeClass}`}>
              <span className="material-symbols-outlined text-[14px]">{stat.badgeIcon}</span>
              {stat.badge}
            </p>
          </div>
        ))}

        {/* Storage Stats (Custom Bento Card) */}
        <div className="bg-white p-6 rounded-xl border border-[#c7c4d8]/40 shadow-sm border-l-4 border-[#3a65aa]">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Storage Used</p>
          <h4 className="text-3xl font-bold text-[#1E293B]">84.2 GB</h4>
          <div className="w-full bg-[#edeeef] h-1.5 rounded-full mt-4">
            <div className="bg-[#3a65aa] h-1.5 rounded-full" style={{ width: '65%' }}></div>
          </div>
        </div>
      </div>

      {/* Featured Banner / Promotional Section */}
      <div className="relative w-full h-[300px] rounded-2xl overflow-hidden shadow-md">
        <img
          className="w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCplCi3a5nVxxkqYuRumteXBPiZA7558Jv9GvrzJG-TDEx-212bkJciFRpfn_RA5fBOO14hRyvOloQusKxpuxNesAdkagBQ2wLqEJpfHaPDyIwPylv97nThRhxs-1Qasnx2GDGt_oW7O9viidnp7aqOAAqTiHa2f_UCnt6Fa4JtKW8jiaGB4W5kXcNX7cQVMdtCP-lUgmkNGEh44muNAtQUE0hCo-8ZzOQsxFhKHxnwhcvUy-Y0keo4BUthy60u9mNOrYBNPLFEDSdD"
          alt="Modern Library View"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-8">
          <span className="bg-[#3525cd] px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest w-fit mb-3">
            System Update
          </span>
          <h5 className="text-white text-lg font-bold mb-2">Enhanced AI Plagiarism Detection</h5>
          <p className="text-white/80 text-sm max-w-2xl leading-relaxed">
            Our latest model now supports 40+ academic languages and provides detailed provenance reports for every document in the repository.
          </p>
        </div>
      </div>

      {/* Success Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-[60] bg-slate-900 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 text-sm font-semibold transition-all transform translate-y-0 opacity-100">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
