import { useState } from 'react'
import DocumentCard from '../components/DocumentCard'

export default function DocumentShowcase() {
  const [activeTab, setActiveTab] = useState('All')

  const tabs = ['All', 'Lecture Notes', 'Assignments', 'Exam Papers', 'Notes']

  const documents = [
    {
      title: 'Data Structures Lab Manual',
      category: 'Lecture Notes',
      uploader: 'Sandip R.',
      uploaderBg: 'bg-secondary',
      categoryBg: 'bg-academic-blue/10 dark:bg-academic-blue/20',
      categoryText: 'text-academic-blue dark:text-blue-400',
      icon: 'description',
      downloads: '1.2k',
      views: '4.5k'
    },
    {
      title: 'Final Exam 2023 - Math II',
      category: 'Exam Papers',
      uploader: 'Dr. Sharma',
      uploaderBg: 'bg-primary',
      categoryBg: 'bg-academic-red/10 dark:bg-academic-red/20',
      categoryText: 'text-academic-red dark:text-red-400',
      icon: 'quiz',
      downloads: '890',
      views: '2.1k'
    },
    {
      title: 'Operating Systems Project',
      category: 'Assignments',
      uploader: 'Preeti K.',
      uploaderBg: 'bg-tertiary',
      categoryBg: 'bg-academic-gold/10 dark:bg-academic-gold/20',
      categoryText: 'text-academic-gold dark:text-amber-500',
      icon: 'assignment',
      downloads: '450',
      views: '1.5k'
    },
    {
      title: 'Strategic Management Unit 4',
      category: 'Notes',
      uploader: 'Rahul T.',
      uploaderBg: 'bg-outline-variant',
      categoryBg: 'bg-secondary/10 dark:bg-secondary/20',
      categoryText: 'text-secondary dark:text-purple-400',
      icon: 'history_edu',
      downloads: '2.3k',
      views: '6.8k'
    }
  ]

  const filteredDocs = activeTab === 'All' 
    ? documents 
    : documents.filter(doc => doc.category === activeTab)

  return (
    <section id="showcase" className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto scroll-mt-16">
      <div className="text-center mb-16">
        <h2 className="font-headline-lg text-headline-lg text-text-main dark:text-on-surface mb-8">
          Popular in Your Department
        </h2>
        
        {/* Tabs Filter */}
        <div className="flex flex-wrap justify-center gap-3 select-none">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full font-label-md text-label-md transition-all duration-200 cursor-pointer ${
                activeTab === tab 
                  ? 'bg-primary text-on-primary academic-shadow' 
                  : 'bg-white dark:bg-surface-container border border-outline-variant/50 text-text-main dark:text-on-surface hover:border-primary'
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
          <div className="col-span-full py-16 text-center text-text-muted dark:text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-2 select-none">folder_open</span>
            <p className="font-body-md">No documents found in this category.</p>
          </div>
        )}
      </div>
    </section>
  )
}
