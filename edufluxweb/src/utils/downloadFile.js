const MIME_TYPES_BY_EXTENSION = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  rtf: 'application/rtf',
  txt: 'text/plain',
};

const EXTENSIONS_BY_MIME = Object.fromEntries(
  Object.entries(MIME_TYPES_BY_EXTENSION).map(([ext, mime]) => [mime, ext]),
);

const sanitizeFilename = (filename) =>
  (filename || 'document').replace(/[\\/:*?"<>|]/g, '_');

/**
 * Ensures the filename has the correct extension for the given MIME type.
 * If the filename already has the right extension, it's returned unchanged.
 * If the extension is missing or wrong, the correct one is appended/replaced.
 */
const ensureCorrectExtension = (filename, contentType) => {
  if (!contentType) return filename;

  const expectedExt = EXTENSIONS_BY_MIME[contentType];
  if (!expectedExt) return filename;

  const lastDot = filename.lastIndexOf('.');
  const currentExt = lastDot !== -1 ? filename.slice(lastDot + 1).toLowerCase() : '';

  // Already has the right extension
  if (currentExt === expectedExt) return filename;

  // Has a different extension — replace it with the correct one
  if (lastDot !== -1) {
    return `${filename.slice(0, lastDot)}.${expectedExt}`;
  }

  // No extension at all — append it
  return `${filename}.${expectedExt}`;
};

/**
 * Downloads a file from a (potentially cross-origin) URL by fetching it as a
 * blob and triggering a local object-URL download. This ensures the `download`
 * attribute on the anchor element is always respected — browsers silently ignore
 * `link.download` for cross-origin URLs (e.g. Cloudinary CDN), which is why
 * .docx files were previously saved without the correct extension.
 *
 * @param {string} url - The file URL to download.
 * @param {string} filename - Desired filename (with extension) for the saved file.
 * @param {string} [contentType] - MIME type; used to verify/fix the extension.
 */
export const downloadFile = async (url, filename, contentType) => {
  if (!url) {
    throw new Error('Download URL not provided');
  }

  const rawFilename = sanitizeFilename(filename);
  const hasSpecificMime =
    contentType && contentType !== 'application/octet-stream';
  const resolvedContentType =
    hasSpecificMime
      ? contentType
      : (MIME_TYPES_BY_EXTENSION[extension] || contentType || 'application/octet-stream');

  // Ensure the saved filename has the extension that matches the actual content type
  const safeFilename = ensureCorrectExtension(rawFilename, resolvedContentType);

  try {
    // Fetch the file as a blob so we can create a same-origin object URL.
    // This makes `link.download` work even for cross-origin CDN URLs.
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    // Use the resolved content type so the blob is typed correctly
    const typedBlob = new Blob([blob], { type: resolvedContentType });
    const objectUrl = URL.createObjectURL(typedBlob);

    const link = window.document.createElement('a');
    link.href = objectUrl;
    link.download = safeFilename;
    window.document.body.appendChild(link);
    link.click();
    link.remove();

    // Release the object URL after a short delay to allow the download to start
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  } catch (fetchError) {
    // Fallback: open the URL directly in a new tab if fetching as blob fails
    // (e.g. CORS policy blocks the fetch). The extension may not be preserved
    // in this path, but the file will still be accessible.
    console.warn('Blob download failed, falling back to direct link:', fetchError.message);

    const link = window.document.createElement('a');
    link.href = url;
    link.download = safeFilename;
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    window.document.body.appendChild(link);
    link.click();
    link.remove();
  }
};