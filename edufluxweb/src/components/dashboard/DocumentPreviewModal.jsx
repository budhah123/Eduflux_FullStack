import { useState, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import { useViewDocument } from "../../hooks/useViewDocument";
import DocumentPreview from "./DocumentPreview";

const getSafeExtension = (fileType, fileFormat, fileUrl) => {
  if (fileType) return fileType;
  if (fileFormat) return fileFormat;
  if (!fileUrl) return "";
  const parts = fileUrl.split('?')[0].split('/');
  const filename = parts[parts.length - 1];
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex !== -1 ? filename.slice(dotIndex + 1) : "";
};

/**
 * DocumentPreviewModal
 *
 * Renders the document preview inside a modal overlay.
 * Uses PDF.js (via DocumentPreview) for PDFs and Office docs,
 * and standard <img> for image files.
 *
 * Securely routes all file requests through the server-side proxy
 * GET /documents/view/:id to get a temporary local blob URL.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - fileType: string | null   — resolved file extension (e.g. 'pdf', 'docx')
 *  - doc: { _id, title, author, fileFormat, fileUrl, subject, category, downloads } | null
 *  - onDownload: (doc) => void
 *  - onAiChat: (doc) => void  — optional
 */
export default function DocumentPreviewModal({
  isOpen,
  onClose,
  fileType,
  doc,
  onDownload,
  onAiChat,
}) {
  const { showToast } = useToast();
  const { previewDocument } = useViewDocument(showToast);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Securely fetch document blob URL on open
  useEffect(() => {
    if (!isOpen || !doc) {
      setPreviewUrl(null);
      setPreviewHtml(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    // Mock documents get loaded directly
    const isMock =
      doc._id?.startsWith("mock") || ["1", "2", "3"].includes(doc._id);
    if (isMock) {
      // Resolve mock Office docs conversion url if needed
      const ext = getSafeExtension(fileType, doc.fileFormat, doc.fileUrl)
        .toLowerCase()
        .trim();
      const isOfficeType = [
        "doc",
        "docx",
        "xls",
        "xlsx",
        "ppt",
        "pptx",
      ].includes(ext);
      let url = doc.fileUrl;
      if (isOfficeType && url) {
        url = url.replace("/raw/upload/", "/image/upload/") + ".pdf";
      }
      setPreviewUrl(url);
      setPreviewLoading(false);
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewHtml(null);
    setPreviewUrl(null);

    const ext = getSafeExtension(fileType, doc.fileFormat, doc.fileUrl)
      .toLowerCase()
      .trim();

    previewDocument(
      doc._id,
      ext,
      (result) => {
        if (result?.kind === "html") {
          setPreviewHtml(result.html || "");
          setPreviewLoading(false);
          return;
        }

        if (result?.kind === "url") {
          setPreviewUrl(result.url || null);
          setPreviewLoading(false);
          return;
        }

        if (result?.kind === "unsupported") {
          setPreviewError(
            result.message || "Preview not supported for this file type.",
          );
          setPreviewLoading(false);
          return;
        }

        setPreviewError("Preview not supported for this file type.");
        setPreviewLoading(false);
      },
      { autoRevoke: true },
    ); // Modal automatically revokes URL after 60s to save memory
  }, [isOpen, doc, fileType, previewDocument]);

  // Revoke object URL on unmount or when previewUrl changes
  useEffect(() => {
    return () => {
      if (previewUrl && !previewUrl.startsWith("http")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen || !doc) return null;

  // Resolve the extension
  const resolvedExt = getSafeExtension(fileType, doc.fileFormat, doc.fileUrl)
    .toLowerCase()
    .trim();

  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(
    resolvedExt,
  );
  const isPdf = resolvedExt === "pdf";
  const isDocx = resolvedExt === "docx";
  const isOfficeType = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(
    resolvedExt,
  );
  const isText = ["txt", "html"].includes(resolvedExt);
  const canPreview = isImage || isPdf || isOfficeType || isText;

  // Display label (upper-cased for the UI)
  const typeLabel = resolvedExt.toUpperCase();

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-6xl h-[88vh] shadow-2xl flex flex-col overflow-hidden relative border border-outline-variant/60 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-outline-variant/60 px-6 py-4 bg-slate-50 flex-shrink-0">
          <div className="min-w-0">
            <h3
              className="font-headline-sm text-headline-sm font-bold text-text-main truncate max-w-[420px] md:max-w-[600px]"
              title={doc.title}
            >
              {doc.title}
            </h3>
            <p className="text-xs text-text-muted mt-0.5 flex items-center gap-2 flex-wrap">
              {doc.author && <span>By {doc.author}</span>}
              {doc.author && <span>•</span>}
              <span className="uppercase font-semibold text-[10px] text-slate-500">
                {typeLabel || doc.type}
              </span>
              {doc.subject && (
                <>
                  <span>•</span>
                  <span>{doc.subject}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {onDownload && (
              <button
                onClick={() => onDownload(doc)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm shadow-sm hover:bg-primary-container transition-all cursor-pointer font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">
                  download
                </span>
                <span className="hidden sm:inline">Download</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center border border-outline-variant hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-text-main"
              aria-label="Close preview"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Preview Area */}
          <div className="flex-grow bg-slate-100 flex items-center justify-center overflow-hidden relative">
            {previewLoading ? (
              <div className="flex flex-col items-center justify-center text-slate-500 select-none">
                <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
                <span className="text-sm font-medium">
                  Securing document preview stream...
                </span>
              </div>
            ) : previewError ? (
              <div className="max-w-md w-full bg-white border border-outline-variant rounded-2xl p-8 text-center shadow-md select-none mx-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-3xl">
                    error
                  </span>
                </div>
                <h4 className="font-display text-headline-sm text-red-500 font-bold mb-2">
                  Preview Unavailable
                </h4>
                <p className="text-body-sm text-text-muted mb-6">
                  {previewError}
                </p>
                {onDownload && (
                  <button
                    onClick={() => onDownload(doc)}
                    className="w-full py-3 bg-primary text-on-primary rounded-xl font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      download
                    </span>
                    <span>Download instead</span>
                  </button>
                )}
              </div>
            ) : previewHtml && isDocx ? (
              <div className="w-full h-full overflow-y-auto p-6 md:p-8 flex justify-center bg-slate-100">
                <div className="w-full max-w-4xl bg-white rounded-xl border border-outline-variant shadow-md p-8 md:p-10 prose prose-slate max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </div>
              </div>
            ) : previewUrl ? (
              isImage ? (
                <div className="w-full h-full flex items-center justify-center p-4 overflow-auto bg-slate-900">
                  <img
                    src={previewUrl}
                    alt={doc.title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                  />
                </div>
              ) : canPreview ? (
                <DocumentPreview fileUrl={previewUrl} />
              ) : (
                <div className="max-w-md w-full bg-white border border-outline-variant rounded-2xl p-8 text-center shadow-md select-none mx-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-academic-gold/10 text-academic-gold flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-3xl">
                      draft
                    </span>
                  </div>
                  <h4 className="font-display text-headline-sm text-text-main font-bold mb-2">
                    Preview Not Supported
                  </h4>
                  <p className="text-body-sm text-text-muted mb-6">
                    In-browser preview is not available for{" "}
                    <b>{resolvedExt ? `.${resolvedExt}` : "this type of"}</b>{" "}
                    files. Download the file to view it on your device.
                  </p>
                  {onDownload && (
                    <button
                      onClick={() => onDownload(doc)}
                      className="w-full py-3 bg-primary text-on-primary rounded-xl font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        download
                      </span>
                      <span>Download File</span>
                    </button>
                  )}
                </div>
              )
            ) : (
              <div className="max-w-md w-full bg-white border border-outline-variant rounded-2xl p-8 text-center shadow-md select-none mx-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-5">
                  <span className="material-symbols-outlined text-3xl">
                    error
                  </span>
                </div>
                <h4 className="font-display text-headline-sm text-red-500 font-bold mb-2">
                  Preview Unavailable
                </h4>
                <p className="text-body-sm text-text-muted mb-6">
                  We could not secure a preview stream for this document. It may
                  have been deleted, or you might not have authorization.
                </p>
              </div>
            )}
          </div>

          {/* Details Sidebar */}
          <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-outline-variant/60 p-5 overflow-y-auto bg-white flex flex-col gap-5 flex-shrink-0">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Document Info
              </h4>

              {doc.subject && (
                <div>
                  <label className="text-[10px] font-semibold text-text-muted block mb-0.5">
                    Subject
                  </label>
                  <span className="text-body-sm font-semibold text-text-main">
                    {doc.subject}
                  </span>
                </div>
              )}
              {doc.category && (
                <div>
                  <label className="text-[10px] font-semibold text-text-muted block mb-0.5">
                    Category
                  </label>
                  <span className="text-body-sm font-semibold text-text-main">
                    {doc.category}
                  </span>
                </div>
              )}
              {doc.downloads !== undefined && (
                <div>
                  <label className="text-[10px] font-semibold text-text-muted block mb-0.5">
                    Downloads
                  </label>
                  <div className="flex items-center gap-1.5 text-text-main font-semibold text-body-sm">
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      download
                    </span>
                    <span>{doc.downloads} times</span>
                  </div>
                </div>
              )}
            </div>

            {onAiChat && (
              <button
                onClick={() => onAiChat(doc)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-secondary text-white rounded-lg font-label-md text-label-md shadow-sm hover:bg-secondary-container transition-all cursor-pointer font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">
                  chat
                </span>
                <span>AI Chat with this Doc</span>
              </button>
            )}

            {doc.author && (
              <div className="pt-4 border-t border-outline-variant/40 flex items-center gap-3 mt-auto">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                  {doc.author.charAt(0)}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-text-muted block">
                    Uploaded by
                  </span>
                  <span className="text-xs font-bold text-text-main truncate block">
                    {doc.author}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
