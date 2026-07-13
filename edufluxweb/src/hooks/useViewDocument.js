import { useRef, useCallback, useReducer } from "react";
import mammoth from "mammoth/mammoth.browser";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const MIME_TYPES = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  txt: "text/plain",
  html: "text/html",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

const normalizeExtension = (fileFormat = "", fileUrl = "") => {
  const hint = String(fileFormat || "")
    .trim()
    .toLowerCase();
  if (hint) return hint.replace(/^\./, "");

  const urlPath = String(fileUrl || "").split("?")[0];
  const inferred = urlPath.split(".").pop() || "";
  return inferred.toLowerCase().replace(/^\./, "");
};

/**
 * useViewDocument
 *
 * Shared hook for previewing documents in both BrowsePanel and DocumentTable.
 *
 * Uses a Ref (not state) for the in-flight set so the `previewDocument` callback
 * reference stays stable — preventing useEffect dependency loops that caused
 * multiple concurrent fetches.
 *
 * Usage:
 *   const { previewDocument, isLoading } = useViewDocument(showToast);
 *   previewDocument(docId, fileFormat, (result) => {
 *     if (result.kind === 'url') setPreviewUrl(result.url);
 *     if (result.kind === 'html') setPreviewHtml(result.html);
 *   });
 */
export function useViewDocument(showToast) {
  // Use a Ref instead of state so that adding/removing IDs does NOT change
  // the `previewDocument` callback reference — breaks the re-render loop.
  const loadingIdsRef = useRef(new Set());
  // Trigger re-renders only when needed (e.g. to update spinner icons in tables).
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  /** Returns true while the given document is being fetched. */
  const isLoading = useCallback(
    (docId) => loadingIdsRef.current.has(docId),
    [],
  );

  /**
   * Fetch the document blob and call onReady(objectUrl) when ready.
   * @param {string} docId       - Document ID.
   * @param {string} fileFormat  - Extension hint (e.g. 'pdf') for correct MIME.
   * @param {Function} onReady   - Called with the blob object URL on success.
   * @param {object}  options    - { autoRevoke: boolean } defaults to true.
   */
  const previewDocument = useCallback(
    async (docId, fileFormat, onReady, options = {}) => {
      const { autoRevoke = true } = options;
      if (!docId) return;
      if (loadingIdsRef.current.has(docId)) return; // deduplicate concurrent calls

      loadingIdsRef.current.add(docId);
      forceUpdate(); // let callers repaint spinners

      try {
        const ext = normalizeExtension(fileFormat);

        if (ext === "docx") {
          const token = sessionStorage.getItem("accessToken");
          const headers = {};
          if (token) headers["Authorization"] = `Bearer ${token}`;

          const previewUrlRes = await fetch(`${BASE_URL}/documents/${docId}/preview-url`, {
            method: "GET",
            headers,
          });

          if (!previewUrlRes.ok) {
            throw new Error(`Failed to get preview URL for Word document.`);
          }

          const { url } = await previewUrlRes.json();
          if (!url) {
            throw new Error(`Word document preview URL not found.`);
          }

          const fileRes = await fetch(url);
          if (!fileRes.ok) {
            throw new Error(`Failed to fetch Word document from Cloudinary.`);
          }

          const arrayBuffer = await fileRes.arrayBuffer();
          const { value } = await mammoth.convertToHtml({ arrayBuffer });
          if (onReady) onReady({ kind: "html", html: value });
          return;
        }

        if (ext === "doc") {
          const message =
            "Preview not supported for .doc files. Please download instead.";
          if (showToast) showToast(message, "error");
          if (onReady) onReady({ kind: "unsupported", message });
          return;
        }

        const token = sessionStorage.getItem("accessToken");
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(`${BASE_URL}/documents/view/${docId}`, {
          method: "GET",
          headers,
        });

        if (!response.ok) {
          const msg =
            response.status === 401
              ? "You are not authorized to view this document."
              : response.status === 404
                ? "Document not found."
                : `Unable to open document (${response.status}). Please try again.`;
          if (showToast) showToast(msg, "error");
          return;
        }

        const rawBlob = await response.blob();
        const mimeType =
          MIME_TYPES[ext] || rawBlob.type || "application/octet-stream";
        const blob = new Blob([rawBlob], { type: mimeType });
        const objectUrl = URL.createObjectURL(blob);

        console.log(
          "[useViewDocument] blob type:",
          rawBlob.type,
          "→",
          blob.type,
        );
        if (onReady) onReady({ kind: "url", url: objectUrl, mimeType });

        if (autoRevoke) {
          // Revoke after 60 s for modal usage; full-page viewer passes autoRevoke:false
          setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
        }
      } catch (err) {
        console.error("[useViewDocument] fetch error:", err);
        if (showToast)
          showToast(
            err?.message || "Unable to open document, please try again.",
            "error",
          );
        if (onReady)
          onReady({
            kind: "unsupported",
            message:
              err?.message || "Unable to open document, please try again.",
          });
      } finally {
        loadingIdsRef.current.delete(docId);
        forceUpdate();
      }
    },
    [showToast], // ← No loadingIds dependency → stable reference
  );

  return { previewDocument, isLoading };
}
