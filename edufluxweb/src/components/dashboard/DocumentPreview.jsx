import { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Import react-pdf styles for text selection and annotations
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Set up the PDF.js worker using unpkg (guarantees exact version match)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function DocumentPreview({ fileUrl }) {
  const [numPages, setNumPages] = useState(null);
  const [activePage, setActivePage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const pageRefs = useRef({});

  // Reset states when URL changes
  useEffect(() => {
    setNumPages(null);
    setActivePage(1);
    setScale(1.0);
    setLoading(true);
    setError(null);
  }, [fileUrl]);

  const onDocumentLoadSuccess = useCallback(({ numPages: loadedNumPages }) => {
    setNumPages(loadedNumPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((err) => {
    console.error('PDF.js load error:', err);
    setError('Failed to load document preview. Please verify it is a valid PDF/document.');
    setLoading(false);
  }, []);

  // Zoom handlers
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.5));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setScale(1.0);

  // Monitor which page is in view using IntersectionObserver
  useEffect(() => {
    if (!numPages) return;

    const observerOptions = {
      root: containerRef.current,
      rootMargin: '-10% 0px -70% 0px', // Trigger when page occupies the top/middle viewport
      threshold: 0.1,
    };

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageNum = parseInt(entry.target.getAttribute('data-page-number'), 10);
          if (pageNum) {
            setActivePage(pageNum);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    // Observe each page element wrapper
    const currentRefs = pageRefs.current;
    Object.keys(currentRefs).forEach((key) => {
      if (currentRefs[key]) {
        observer.observe(currentRefs[key]);
      }
    });

    return () => {
      Object.keys(currentRefs).forEach((key) => {
        if (currentRefs[key]) {
          observer.unobserve(currentRefs[key]);
        }
      });
      observer.disconnect();
    };
  }, [numPages]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 overflow-hidden relative">
      {/* ── Sticky Toolbar (Scribd style) ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 bg-slate-800/90 border-b border-slate-700/60 text-white select-none z-20 sticky top-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px] text-slate-400">menu_book</span>
          <span className="font-label-md text-label-md font-semibold text-slate-200">
            Document Viewer
          </span>
        </div>

        {/* Page counter indicator */}
        {!loading && !error && numPages && (
          <div className="flex items-center gap-2 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-700/40 text-xs text-slate-300 font-medium">
            <span>Page</span>
            <span className="font-bold text-white">{activePage}</span>
            <span className="text-slate-500">/</span>
            <span>{numPages}</span>
          </div>
        )}

        {/* Zoom Controls */}
        {!loading && !error && (
          <div className="flex items-center gap-1.5 bg-slate-950/40 p-1 rounded-lg border border-slate-700/40">
            <button
              onClick={zoomOut}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-[18px]">zoom_out</span>
            </button>
            <span className="text-xs font-semibold px-2 min-w-[50px] text-center text-slate-200">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-[18px]">zoom_in</span>
            </button>
            <div className="h-4 w-[1px] bg-slate-700 mx-1"></div>
            <button
              onClick={resetZoom}
              className="px-2 py-1 text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-all cursor-pointer"
              title="Reset Zoom"
            >
              100%
            </button>
          </div>
        )}
      </div>

      {/* ── Document Canvas Container (Continuous Scroll) ── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto flex flex-col items-center gap-6 p-6 custom-scrollbar scroll-smooth"
      >
        {/* Loading Spinner */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-24 select-none">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
            <span className="text-sm font-medium">Rendering pages in high quality...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl">error</span>
            </div>
            <h4 className="text-white text-lg font-bold mb-2">Preview Error</h4>
            <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
          </div>
        )}

        {/* PDF Document Renderer */}
        {fileUrl && (
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className="flex flex-col items-center gap-6"
          >
            {Array.from(new Array(numPages || 0), (el, index) => {
              const pageNumber = index + 1;
              return (
                <div
                  key={`page_${pageNumber}`}
                  ref={(el) => (pageRefs.current[pageNumber] = el)}
                  data-page-number={pageNumber}
                  className="bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 relative border border-slate-700/30"
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    loading={
                      <div className="flex items-center justify-center text-slate-400 py-12 select-none" style={{ width: 600 * scale, height: 800 * scale }}>
                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2" />
                        <span className="text-xs">Loading Page {pageNumber}...</span>
                      </div>
                    }
                  />
                </div>
              );
            })}
          </Document>
        )}
      </div>
    </div>
  );
}
