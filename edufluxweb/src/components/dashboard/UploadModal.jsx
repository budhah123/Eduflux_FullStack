import { useRef } from 'react';

export default function UploadModal({
  isOpen,
  setIsOpen,
  isEditMode,
  uploading,
  uploadProgress,
  handleSubmit,
  
  // Field States & Setters
  newTitle,
  setNewTitle,
  newDescription,
  setNewDescription,
  newCategory,
  setNewCategory,
  newDepartment,
  setNewDepartment,
  newSemester,
  setNewSemester,
  newTags,
  setNewTags,
  selectedFile,
  setSelectedFile,
  dragActive,
  setDragActive,
}) {
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!newTitle) {
        setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!newTitle) {
        setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm transition-opacity duration-300" 
        onClick={() => !uploading && setIsOpen(false)}
      ></div>
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 glass-card z-10 border border-outline-variant/60">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant flex justify-between items-center select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">
                {isEditMode ? 'edit_document' : 'cloud_upload'}
              </span>
            </div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-text-main">
              {isEditMode ? 'Update Academic Resource Metadata' : 'Upload Academic Resource'}
            </h2>
          </div>
          <button 
            type="button"
            className="p-2 hover:bg-surface-container rounded-full transition-all cursor-pointer text-on-surface-variant hover:text-text-main disabled:opacity-50" 
            onClick={() => setIsOpen(false)}
            disabled={uploading}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Scrollable form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-6">
          
          {/* File selection / Info Area */}
          {isEditMode ? (
            <div className="p-4 border border-outline-variant/60 bg-surface-container-low rounded-2xl flex items-center gap-3 select-none">
              <span className="material-symbols-outlined text-primary text-2xl">info</span>
              <div>
                <p className="font-label-md text-label-md font-semibold text-text-main">Editing Metadata Only</p>
                <p className="text-body-sm text-text-muted">The uploaded file itself cannot be modified. To replace the file, please upload a new document.</p>
              </div>
            </div>
          ) : (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`border-2 border-dashed rounded-2xl p-8 text-center bg-surface-container-lowest transition-colors cursor-pointer group flex flex-col items-center select-none ${
                dragActive ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.rtf,.txt,.odt,.ods,.odp,image/*"
                disabled={uploading}
              />
              
              <span className={`material-symbols-outlined text-[48px] mb-4 transition-colors ${
                dragActive ? 'text-primary' : 'text-outline group-hover:text-primary'
              }`}>
                upload_file
              </span>
              
              {selectedFile ? (
                <div>
                  <p className="font-label-md text-label-md text-primary font-bold">{selectedFile.name}</p>
                  <p className="text-xs text-text-muted mt-1">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <p className="font-label-md text-label-md text-on-surface mb-1 font-semibold">Drag and drop your file here</p>
                  <p className="text-body-sm text-text-muted mb-4">PDF, Word, Powerpoint, Excel, Text, OpenDocument or Image up to 10MB</p>
                  <button
                    type="button"
                    className="bg-primary-fixed text-on-primary-fixed px-6 py-2 rounded-lg font-label-md text-label-md hover:bg-primary hover:text-on-primary font-semibold transition-all cursor-pointer"
                  >
                    Browse Files
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Progress bar loader for upload */}
          {uploading && !isEditMode && (
            <div className="space-y-2 select-none">
              <div className="flex justify-between font-label-sm text-label-sm text-text-muted">
                <span>Uploading file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-full">
              <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Title *</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-primary bg-surface-container-low transition-all p-2.5 border text-body-md text-text-main"
                placeholder="e.g. Introduction to Quantum Physics Notes"
                type="text"
                required
                disabled={uploading}
              />
            </div>
            
            <div className="col-span-full">
              <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Description</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows="3"
                className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-primary bg-surface-container-low transition-all p-2.5 border text-body-md text-text-main resize-none"
                placeholder="Describe the content of this document..."
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-primary bg-surface-container-low transition-all p-2.5 border cursor-pointer text-body-md text-text-main"
                disabled={uploading}
              >
                <option value="Lecture Notes">Lecture Notes</option>
                <option value="Research Paper">Research Paper</option>
                <option value="Study Guide">Study Guide</option>
                <option value="Thesis">Thesis</option>
                <option value="Exam Prep">Exam Prep</option>
              </select>
            </div>
            
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Department / Subject</label>
              <input
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-primary bg-surface-container-low transition-all p-2.5 border text-body-md text-text-main"
                placeholder="e.g. Computer Science"
                type="text"
                disabled={uploading}
              />
            </div>
            
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Semester</label>
              <input
                value={newSemester}
                onChange={(e) => setNewSemester(e.target.value)}
                className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-primary bg-surface-container-low transition-all p-2.5 border text-body-md text-text-main"
                placeholder="e.g. Semester 5"
                type="text"
                disabled={uploading}
              />
            </div>
            
            <div>
              <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Tags (comma separated)</label>
              <input
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                className="w-full rounded-lg border-outline-variant focus:border-primary focus:ring-primary bg-surface-container-low transition-all p-2.5 border text-body-md text-text-main"
                placeholder="quantum, physics, assignment"
                type="text"
                disabled={uploading}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-outline-variant select-none">
            <button
              type="button"
              disabled={uploading}
              className="px-6 py-2.5 rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer bg-transparent border-none disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="bg-primary text-on-primary px-8 py-2.5 rounded-lg font-label-md text-label-md shadow-md hover:bg-primary-container transition-all flex items-center gap-2 cursor-pointer font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{isEditMode ? 'Saving...' : 'Uploading...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    {isEditMode ? 'save' : 'publish'}
                  </span>
                  <span>{isEditMode ? 'Save Changes' : 'Publish Now'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
