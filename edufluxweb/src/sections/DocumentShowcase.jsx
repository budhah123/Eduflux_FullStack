import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DocumentCard from '../components/DocumentCard';
import { documentApi } from '../services/api/documentApi';

const getCategoryStyle = (category = '') => {
  const cat = category.toLowerCase();
  if (cat.includes('exam') || cat.includes('quiz') || cat.includes('test')) {
    return {
      categoryBg: 'bg-red-50',
      categoryText: 'text-red-700',
      uploaderBg: 'bg-primary',
      icon: 'quiz',
    };
  }
  if (cat.includes('assign') || cat.includes('project')) {
    return {
      categoryBg: 'bg-amber-50',
      categoryText: 'text-amber-700',
      uploaderBg: 'bg-emerald-700',
      icon: 'assignment',
    };
  }
  if (cat.includes('lecture') || cat.includes('manual') || cat.includes('lab')) {
    return {
      categoryBg: 'bg-blue-50',
      categoryText: 'text-blue-700',
      uploaderBg: 'bg-indigo-600',
      icon: 'description',
    };
  }
  return {
    categoryBg: 'bg-violet-50',
    categoryText: 'text-violet-700',
    uploaderBg: 'bg-violet-600',
    icon: 'history_edu',
  };
};

const formatMetric = (num) => {
  if (!num) return '0';
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(num);
};

const defaultDocuments = [
  {
    _id: 'default-1',
    title: 'Data Structures Lab Manual',
    category: 'Lecture Notes',
    uploader: 'Sandip R.',
    downloadCount: 1200,
    views: 4500,
  },
  {
    _id: 'default-2',
    title: 'Final Exam 2023 – Math II',
    category: 'Exam Papers',
    uploader: 'Dr. Sharma',
    downloadCount: 890,
    views: 2100,
  },
  {
    _id: 'default-3',
    title: 'Operating Systems Project',
    category: 'Assignments',
    uploader: 'Preeti K.',
    downloadCount: 450,
    views: 1500,
  },
  {
    _id: 'default-4',
    title: 'Strategic Management Unit 4',
    category: 'Notes',
    uploader: 'Rahul T.',
    downloadCount: 2300,
    views: 6800,
  },
];

export default function DocumentShowcase() {
  const [activeTab, setActiveTab] = useState('All');
  const [documents, setDocuments] = useState(defaultDocuments);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchHomePageDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await documentApi.getHomePageDocuments();
        const docs = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];
        if (isMounted) {
          setDocuments(docs.length > 0 ? docs : defaultDocuments);
        }
      } catch (err) {
        console.warn('Using fallback documents for homepage:', err);
        if (isMounted) {
          setDocuments(defaultDocuments);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHomePageDocuments();

    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamically compute tabs from fetched documents
  const categories = Array.from(
    new Set(documents.map((d) => d.category).filter(Boolean)),
  );
  const tabs = ['All', ...categories];

  const filteredDocs =
    activeTab === 'All'
      ? documents
      : documents.filter((doc) => doc.category === activeTab);

  return (
    <section
      id="showcase"
      className="py-24 px-margin-mobile md:px-margin-desktop scroll-mt-16"
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f5f4ff 100%)',
      }}
    >
      <div className="max-w-container-max mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-label-sm text-label-sm mb-5 select-none">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              folder_open
            </span>
            Student Repository
          </div>
          <h2 className="font-headline-lg text-headline-lg text-text-main mb-8">
            Popular in Your <span className="gradient-text">Department</span>
          </h2>

          {/* Tab filter pills (visible when documents are loaded and tabs exist) */}
          {!loading && tabs.length > 1 && (
            <div className="flex flex-wrap justify-center gap-3 select-none">
              {tabs.map((tab, idx) => (
                <button
                  key={idx}
                  id={`showcase-tab-${tab.toLowerCase().replace(/\s/g, '-')}`}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-full font-label-md text-label-md transition-all duration-200 cursor-pointer ${
                    activeTab === tab
                      ? 'bg-brand-gradient text-white academic-shadow-lg scale-[1.03]'
                      : 'bg-white text-text-main border border-slate-200 hover:border-indigo-300 hover:text-primary'
                  }`}
                >
                  {tab === 'All' ? 'All Featured' : tab}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden academic-shadow animate-pulse flex flex-col h-[320px]"
              >
                <div className="aspect-[4/3] bg-slate-100 w-full" />
                <div className="p-5 flex flex-col flex-1 gap-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between">
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Documents Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredDocs.length > 0 ? (
              filteredDocs.slice(0, 4).map((doc, idx) => {
                const styles = getCategoryStyle(doc.category);
                return (
                  <Link
                    key={doc._id || idx}
                    to={`/documents/${doc._id}/view`}
                    className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-2xl"
                  >
                    <DocumentCard
                      title={doc.title}
                      category={doc.category || 'General'}
                      uploader={doc.uploader || 'Eduflux Member'}
                      uploaderBg={styles.uploaderBg}
                      categoryBg={styles.categoryBg}
                      categoryText={styles.categoryText}
                      icon={styles.icon}
                      downloads={formatMetric(doc.downloadCount)}
                      views={formatMetric(doc.views ?? (doc.downloadCount ? doc.downloadCount * 3 : 0))}
                      image={doc.thumbnailUrl}
                    />
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full py-16 text-center text-text-muted bg-white/60 rounded-2xl border border-slate-100 p-8">
                <span className="material-symbols-outlined text-5xl mb-3 block select-none text-slate-300">
                  folder_open
                </span>
                <p className="font-body-md text-slate-600 mb-2 font-medium">
                  No documents currently featured in this category.
                </p>
                <p className="text-xs text-slate-400 mb-6">
                  Explore all study materials and lecture notes in our student repository.
                </p>
                <Link
                  to="/browse"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3525cd] text-white rounded-full text-xs font-bold hover:shadow-md transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">search</span>
                  Browse All Documents
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Error Fallback */}
        {!loading && error && (
          <div className="text-center py-16 text-text-muted bg-white/80 rounded-2xl border border-slate-200/80 p-8 max-w-md mx-auto">
            <span className="material-symbols-outlined text-4xl text-amber-500 mb-2 block">
              sync_problem
            </span>
            <p className="text-sm font-semibold text-slate-700 mb-4">{error}</p>
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold"
            >
              Browse Student Vault
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
