import { useRef, useCallback, useReducer } from 'react';
import mammoth from 'mammoth/mammoth.browser';
import { getAccessToken } from '../utils/auth';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const normalizeExtension = (fileFormat = '', fileUrl = '') => {
  const hint = String(fileFormat || '')
    .trim()
    .toLowerCase();
  if (hint) return hint.replace(/^\./, '');

  const urlPath = String(fileUrl || '').split('?')[0];
  const inferred = urlPath.split('.').pop() || '';
  return inferred.toLowerCase().replace(/^\./, '');
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
      if (!docId) return;
      if (loadingIdsRef.current.has(docId)) return; // deduplicate concurrent calls

      loadingIdsRef.current.add(docId);
      forceUpdate(); // let callers repaint spinners

      try {
        const ext = normalizeExtension(fileFormat);

        if (ext === 'docx') {
          const token = getAccessToken();
          const headers = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const previewUrlRes = await fetch(
            `${BASE_URL}/documents/${docId}/preview-url`,
            {
              method: 'GET',
              headers,
            },
          );

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
          if (onReady) onReady({ kind: 'html', html: value });
          return;
        }

        if (ext === 'doc') {
          const message =
            'Preview not supported for .doc files. Please download instead.';
          if (showToast) showToast(message, 'error');
          if (onReady) onReady({ kind: 'unsupported', message });
          return;
        }

        const token = getAccessToken();
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const previewUrlRes = await fetch(
          `${BASE_URL}/documents/${docId}/preview-url`,
          {
            method: 'GET',
            headers,
          },
        );

        if (!previewUrlRes.ok) {
          const msg =
            previewUrlRes.status === 401
              ? 'You are not authorized to view this document.'
              : previewUrlRes.status === 403
                ? 'Unlock this document to view it.'
                : previewUrlRes.status === 404
                  ? 'Document not found.'
                  : `Unable to open document (${previewUrlRes.status}). Please try again.`;
          if (showToast) showToast(msg, 'error');
          if (onReady) onReady({ kind: 'unsupported', message: msg });
          return;
        }

        const { url } = await previewUrlRes.json();
        if (!url) {
          throw new Error('Document preview URL not found.');
        }

        // Fetch the file bytes and create a local blob URL.
        // This avoids handing react-pdf a cross-origin Cloudinary URL directly,
        // which PDF.js's worker would try to fetch and get CORS-blocked.
        // By fetching here first, the browser sees a same-origin blob: URL instead.
        const fileRes = await fetch(url);
        if (!fileRes.ok) {
          throw new Error(
            `Failed to fetch document from storage (${fileRes.status}).`,
          );
        }
        const blob = await fileRes.blob();
        const objectUrl = URL.createObjectURL(blob);

        if (onReady) onReady({ kind: 'url', url: objectUrl });
        return;
      } catch (err) {
        console.error('[useViewDocument] fetch error:', err);
        if (showToast)
          showToast(
            err?.message || 'Unable to open document, please try again.',
            'error',
          );
        if (onReady)
          onReady({
            kind: 'unsupported',
            message:
              err?.message || 'Unable to open document, please try again.',
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
