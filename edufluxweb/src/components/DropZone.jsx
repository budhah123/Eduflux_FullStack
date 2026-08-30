import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

export default function DropZone({
  onFilesSelected,
  multiple = true,
  accept = '.pdf,.docx,.pptx,.xlsx,.jpg,.png',
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current && inputRef.current.click()}
      className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
        dragging
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-outline-variant hover:border-primary/60 bg-surface hover:bg-surface-container-low/50'
      }`}
    >
      <UploadCloud className="mx-auto mb-3 w-10 h-10 text-primary" />
      <p className="font-semibold text-base mb-1 text-on-surface">
        Drag & drop files here
      </p>
      <p className="text-sm text-on-surface-variant mb-4">or</p>
      <button
        type="button"
        className="px-5 py-2.5 rounded-full bg-primary text-on-primary font-semibold text-sm shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
      >
        Select Documents to Upload
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files));
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}
