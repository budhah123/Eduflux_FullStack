import { useEffect } from 'react';
import { useDocuments } from '../../hooks/useDocuments';
import StatsBento from './StatsBento';
import DocumentTable from './DocumentTable';
import UploadModal from './UploadModal';

export default function MyUploadsPanel({ uploadModalOpen, setUploadModalOpen, showToast }) {
  const docsState = useDocuments(showToast);

  // Sync parent modal open state with hook's modal state
  // We can synchronize both so clicking Sidebar's New Upload button opens this Modal!
  useEffect(() => {
    if (uploadModalOpen && !docsState.uploadModalOpen) {
      docsState.setUploadModalOpen(true);
      setUploadModalOpen(false); // consume trigger
    }
  }, [uploadModalOpen, docsState.uploadModalOpen, setUploadModalOpen, docsState]);

  return (
    <section className="p-8 max-w-container-max mx-auto w-full flex-1 animate-slide-up">
      {/* Stats Summary Bento Grid */}
      <StatsBento
        totalContributions={docsState.documents.length}
        totalDownloads={docsState.totalDownloads}
      />

      {/* Filter Tabs & Actions Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        {/* Category filters */}
        <div className="flex bg-surface-container p-1 rounded-xl select-none">
          {['All', 'Notes', 'Papers', 'Thesis'].map((cat) => {
            const isActive = docsState.activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  docsState.setActiveCategory(cat);
                  docsState.setCurrentPage(1);
                }}
                className={`px-5 py-2 rounded-lg font-label-md text-label-md cursor-pointer transition-all ${
                  isActive
                    ? 'bg-white text-primary shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto select-none">
          {/* Local Search input */}
          <div className="flex items-center bg-white border border-outline-variant/60 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all max-w-xs w-full shadow-sm">
            <span className="material-symbols-outlined text-outline text-[18px] mr-2">search</span>
            <input
              type="text"
              value={docsState.searchQuery}
              onChange={(e) => {
                docsState.setSearchQuery(e.target.value);
                docsState.setCurrentPage(1);
              }}
              placeholder="Search uploads..."
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-body-sm w-full p-0 text-text-main"
            />
          </div>

          {/* Upload Button */}
          <button
            onClick={() => docsState.setUploadModalOpen(true)}
            className="flex-shrink-0 bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 shadow-md hover:bg-primary-container transition-all active:scale-95 duration-150 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Upload
          </button>
        </div>
      </div>

      {/* Main Document Listing Frame */}
      <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
        <DocumentTable
          documents={docsState.paginatedDocs}
          loading={docsState.loading}
          searchQuery={docsState.searchQuery}
          currentPage={docsState.currentPage}
          totalPages={docsState.totalPages}
          setCurrentPage={docsState.setCurrentPage}
          onEdit={docsState.startEdit}
          onDownload={docsState.downloadDoc}
          onDelete={docsState.deleteDoc}
          deletingIds={docsState.deletingIds}
          showToast={showToast}
        />
      </div>

      {/* Upload/Edit Modal Form overlay */}
      <UploadModal
        isOpen={docsState.uploadModalOpen}
        setIsOpen={docsState.setUploadModalOpen}
        isEditMode={docsState.isEditMode}
        uploading={docsState.uploading}
        uploadProgress={docsState.uploadProgress}
        handleSubmit={docsState.handleSubmit}
        
        // Field values
        newTitle={docsState.newTitle}
        setNewTitle={docsState.setNewTitle}
        newDescription={docsState.newDescription}
        setNewDescription={docsState.setNewDescription}
        newCategory={docsState.newCategory}
        setNewCategory={docsState.setNewCategory}
        newDepartment={docsState.newDepartment}
        setNewDepartment={docsState.setNewDepartment}
        newSemester={docsState.newSemester}
        setNewSemester={docsState.setNewSemester}
        newTags={docsState.newTags}
        setNewTags={docsState.setNewTags}
        selectedFile={docsState.selectedFile}
        setSelectedFile={docsState.setSelectedFile}
        dragActive={docsState.dragActive}
        setDragActive={docsState.setDragActive}
      />
    </section>
  );
}
