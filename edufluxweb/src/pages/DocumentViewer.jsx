import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { documentApi } from '../services/api/documentApi'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function DocumentViewer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await documentApi.getDocument(id)
        setDocument(data)
      } catch (err) {
        console.error('Error fetching document:', err)
        setError(err.message || 'Failed to load document metadata.')
        showToast('Failed to load document details', 'error')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchDocument()
    }
  }, [id, showToast])

  const handleDownload = async () => {
    try {
      setDownloading(true)
      const res = await documentApi.getDownloadUrl(id)
      if (res && res.url) {
        // Trigger download
        const link = window.document.createElement('a')
        link.href = res.url
        link.setAttribute('download', document?.title || 'document')
        link.setAttribute('target', '_blank')
        window.document.body.appendChild(link)
        link.click()
        link.remove()
        
        // Update downloads count locally
        setDocument(prev => prev ? { ...prev, downloadCount: (prev.downloadCount || 0) + 1 } : null)
        showToast('Download started successfully', 'success')
      } else {
        throw new Error('Download URL not found in response')
      }
    } catch (err) {
      console.error('Error downloading document:', err)
      showToast(err.message || 'Failed to download document', 'error')
    } finally {
      setDownloading(false)
    }
  }

  const handleChatWithDoc = () => {
    // Navigate to dashboard and switch to AI Chat, passing the document context
    sessionStorage.setItem('chat_document_context', JSON.stringify({
      id: document._id,
      title: document.title,
    }))
    navigate('/dashboard?tab=ai-chat')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-text-muted font-label-md text-label-md">Loading document details...</p>
        </div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-outline-variant rounded-2xl p-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-6xl text-error mb-4">
            cloud_off
          </span>
          <h2 className="font-display text-headline-md text-text-main font-bold mb-2">
            Failed to Load Document
          </h2>
          <p className="text-body-sm text-text-muted mb-6">
            {error || 'The document you are looking for could not be found or has been removed.'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-full py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all cursor-pointer"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-white border border-outline-variant text-text-main rounded-lg font-label-md text-label-md hover:bg-surface-bright transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const fileUrl = document.fileUrl || ''
  const extension = fileUrl.split('.').pop()?.toLowerCase() || ''
  
  // Define preview capabilities
  const isPDF = extension === 'pdf'
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension)
  const isText = ['txt', 'html', 'json'].includes(extension)
  
  const canPreviewInline = isPDF || isImage || isText
  const previewUrl = `${BASE_URL}/documents/view/${id}`

  // Style helper based on category
  const getCategoryStyles = (category) => {
    const cat = category?.toLowerCase() || ''
    if (cat.includes('lecture') || cat.includes('note')) {
      return 'bg-academic-blue/10 text-academic-blue border-academic-blue/20'
    } else if (cat.includes('exam') || cat.includes('test')) {
      return 'bg-academic-red/10 text-academic-red border-academic-red/20'
    } else if (cat.includes('paper') || cat.includes('research')) {
      return 'bg-academic-gold/10 text-academic-gold border-academic-gold/20'
    }
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return 'Unknown size'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col">
      {/* Header bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-outline-variant/60 px-6 py-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center border border-outline-variant hover:border-primary hover:text-primary rounded-xl transition-all cursor-pointer bg-white"
            title="Go Back"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          
          <div className="min-w-0">
            <h1 className="font-headline-sm text-headline-sm font-bold text-text-main truncate" title={document.title}>
              {document.title}
            </h1>
            <p className="text-xs text-text-muted mt-0.5 flex items-center gap-2 flex-wrap">
              <span>By {document.uploader || 'Instructor'}</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getCategoryStyles(document.category)}`}>
                {document.category || 'General'}
              </span>
              <span>•</span>
              <span className="uppercase text-[10px] font-bold text-slate-500">{extension}</span>
              <span>•</span>
              <span>{formatSize(document.fileSize)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleChatWithDoc}
            className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-white rounded-lg font-label-sm text-label-sm shadow-sm hover:bg-secondary-container hover:shadow transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span>AI Chat</span>
          </button>
          
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm shadow-sm hover:bg-primary-container hover:shadow transition-all disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {downloading ? 'sync' : 'download'}
            </span>
            <span>{downloading ? 'Downloading...' : 'Download'}</span>
          </button>
        </div>
      </header>

      {/* Main layout */}
      <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-73px)] overflow-hidden">
        {/* Left Side: Document Viewer */}
        <section className="flex-grow bg-slate-900/5 p-6 flex flex-col justify-center items-center overflow-hidden h-full">
          {canPreviewInline ? (
            <div className="w-full h-full bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden relative flex flex-col">
              {/* If it's a PDF */}
              {isPDF && (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-none"
                  title={document.title}
                  loading="lazy"
                />
              )}

              {/* If it's an Image */}
              {isImage && (
                <div className="w-full h-full flex items-center justify-center p-8 bg-slate-950/5 overflow-auto">
                  <img
                    src={previewUrl}
                    alt={document.title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-md hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              )}

              {/* If it's plain text */}
              {isText && (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-none p-4 font-mono text-sm bg-slate-50"
                  title={document.title}
                />
              )}
            </div>
          ) : (
            /* Fallback preview: not supported */
            <div className="max-w-xl w-full bg-white border border-outline-variant rounded-2xl p-10 text-center shadow-md select-none animate-slide-up">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-academic-gold/10 text-academic-gold flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  draft
                </span>
              </div>
              <h3 className="font-display text-headline-sm text-text-main font-bold mb-2">
                Preview Not Supported
              </h3>
              <p className="text-body-sm text-text-muted mb-8 max-w-sm mx-auto">
                Direct in-browser preview is not supported for <b>.{extension}</b> files. You can download the file to view it on your device.
              </p>
              
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-8 text-left flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-slate-400">
                    description
                  </span>
                  <div>
                    <h5 className="font-label-md text-label-md text-text-main truncate max-w-[240px]">
                      {document.title}
                    </h5>
                    <p className="text-xs text-text-muted">
                      {formatSize(document.fileSize)} • {extension.toUpperCase()} File
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg uppercase">
                  {extension}
                </span>
              </div>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full py-3 bg-primary text-on-primary rounded-xl font-label-md text-label-md shadow-sm hover:shadow hover:bg-primary-container transition-all flex items-center justify-center gap-2 cursor-pointer font-semibold"
              >
                <span className="material-symbols-outlined">
                  {downloading ? 'sync' : 'download'}
                </span>
                <span>{downloading ? 'Downloading...' : 'Download File'}</span>
              </button>
            </div>
          )}
        </section>

        {/* Right Side: Document Details Sidebar (Desktop) */}
        <aside className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-outline-variant p-6 overflow-y-auto h-auto lg:h-full select-none flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Document Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-medium text-text-muted block">Subject</label>
                  <span className="font-label-md text-label-md text-text-main font-semibold">
                    {document.subject || 'Not specified'}
                  </span>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-text-muted block">Semester</label>
                  <span className="font-label-md text-label-md text-text-main font-semibold">
                    {document.semester || 'Not specified'}
                  </span>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-text-muted block">Tags</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {document.tags && document.tags.split(',').map((tag, index) => (
                      <span key={index} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                        #{tag.trim()}
                      </span>
                    )) || <span className="text-xs text-text-muted italic">No tags</span>}
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-outline-variant/60" />

            <div>
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Description
              </h3>
              <p className="text-body-sm text-text-muted leading-relaxed">
                {document.description || 'No description provided for this academic resource.'}
              </p>
            </div>

            <hr className="border-outline-variant/60" />

            <div>
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                File Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                  <span className="material-symbols-outlined text-primary text-xl mb-1">
                    visibility
                  </span>
                  <span className="block text-[10px] text-text-muted uppercase">Views</span>
                  <span className="text-headline-sm font-bold text-text-main">
                    {document.viewsCount || 0}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                  <span className="material-symbols-outlined text-secondary text-xl mb-1">
                    download
                  </span>
                  <span className="block text-[10px] text-text-muted uppercase">Downloads</span>
                  <span className="text-headline-sm font-bold text-text-main">
                    {document.downloadCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-outline-variant/60 mt-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase">
                {document.uploader?.charAt(0) || 'U'}
              </div>
              <div>
                <span className="text-xs text-text-muted block">Uploaded by</span>
                <span className="font-label-md text-label-md font-bold text-text-main">
                  {document.uploader || 'System User'}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-text-muted">
              Uploaded on {new Date(document.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </aside>
      </main>
    </div>
  )
}
