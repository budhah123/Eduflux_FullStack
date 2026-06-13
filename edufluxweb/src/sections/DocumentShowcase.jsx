import { useState } from 'react'
import DocumentCard from '../components/DocumentCard'

const tabs = ['All', 'Lecture Notes', 'Assignments', 'Exam Papers', 'Notes']

const documents = [
  {
    title: 'Data Structures Lab Manual',
    category: 'Lecture Notes',
    uploader: 'Sandip R.',
    uploaderBg: 'bg-indigo-600',
    categoryBg: 'bg-blue-50',
    categoryText: 'text-blue-700',
    icon: 'description',
    downloads: '1.2k',
    views: '4.5k',
  },
  {
    title: 'Final Exam 2023 – Math II',
    category: 'Exam Papers',
    uploader: 'Dr. Sharma',
    uploaderBg: 'bg-primary',
    categoryBg: 'bg-red-50',
    categoryText: 'text-red-700',
    icon: 'quiz',
    downloads: '890',
    views: '2.1k',
  },
  {
    title: 'Operating Systems Project',
    category: 'Assignments',
    uploader: 'Preeti K.',
    uploaderBg: 'bg-emerald-700',
    categoryBg: 'bg-amber-50',
    categoryText: 'text-amber-700',
    icon: 'assignment',
    downloads: '450',
    views: '1.5k',
  },
  {
    title: 'Strategic Management Unit 4',
    category: 'Notes',
    uploader: 'Rahul T.',
    uploaderBg: 'bg-violet-600',
    categoryBg: 'bg-violet-50',
    categoryText: 'text-violet-700',
    icon: 'history_edu',
    downloads: '2.3k',
    views: '6.8k',
  },
]

export default function DocumentShowcase() {
  const [activeTab, setActiveTab] = useState('All')

  const filteredDocs =
    activeTab === 'All'
      ? documents
      : documents.filter((doc) => doc.category === activeTab)

  return (
    <section
      id="showcase"
      className="py-24 px-margin-mobile md:px-margin-desktop scroll-mt-16"
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f5f4ff 100%)' }}
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
            Popular in Your{' '}
            <span className="gradient-text">Department</span>
          </h2>

          {/* Tab filter pills */}
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
                {tab === 'All' ? 'All Documents' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((doc, idx) => (
              <DocumentCard
                key={idx}
                title={doc.title}
                category={doc.category}
                uploader={doc.uploader}
                uploaderBg={doc.uploaderBg}
                categoryBg={doc.categoryBg}
                categoryText={doc.categoryText}
                icon={doc.icon}
                downloads={doc.downloads}
                views={doc.views}
              />
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-text-muted">
              <span className="material-symbols-outlined text-5xl mb-3 block select-none text-slate-300">
                folder_open
              </span>
              <p className="font-body-md">No documents found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
