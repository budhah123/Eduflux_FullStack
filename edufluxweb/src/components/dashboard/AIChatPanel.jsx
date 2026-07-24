import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentApi } from '../../services/api/documentApi';

const getFileIcon = (fileFormat, fileUrl) => {
  let format = (fileFormat || '').toLowerCase();
  if (!format && fileUrl) {
    const ext = fileUrl.split('?')[0].split('.').pop();
    format = (ext || '').toLowerCase();
  }
  switch (format) {
    case 'pdf':
      return 'description';
    case 'docx':
    case 'doc':
      return 'article';
    case 'txt':
    case 'md':
      return 'text_snippet';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'webp':
      return 'image';
    case 'ppt':
    case 'pptx':
      return 'slideshow';
    default:
      return 'description';
  }
};

const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function AIChatPanel({ showToast }) {
  const navigate = useNavigate();

  // Document list & selection state
  const [recentDocs, setRecentDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Chat conversation state
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Determine lock status
  const isLocked = Boolean(selectedDoc?.isLocked);

  // 1. Fetch Recent Documents on Mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoadingDocs(true);
        let docs = [];
        const res = await documentApi.getMyUploads(1, 20);
        if (res) {
          docs = Array.isArray(res) ? res : res.data || res.documents || [];
        }

        // Fallback to all documents if user uploads are empty
        if (!docs || docs.length === 0) {
          const allRes = await documentApi.getAllDocuments({ limit: 20 });
          if (allRes) {
            docs = Array.isArray(allRes) ? allRes : allRes.data || allRes.documents || [];
          }
        }

        setRecentDocs(docs);

        // Auto-select first document if available
        if (docs && docs.length > 0) {
          setSelectedDocId(docs[0]._id);
          setSelectedDoc(docs[0]);
        }
      } catch (err) {
        console.error('Error fetching recent documents for AI chat:', err);
        if (showToast) showToast('Failed to load recent documents', 'error');
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDocuments();
  }, []);

  // 2. Fetch Selected Document Details & Preview URL when selectedDocId changes
  useEffect(() => {
    if (!selectedDocId) {
      setSelectedDoc(null);
      setPreviewUrl(null);
      setMessages([]);
      return;
    }

    const fetchDocDetails = async () => {
      try {
        setLoadingPreview(true);

        // GET /documents/:id metadata
        const docDetails = await documentApi.getDocument(selectedDocId);
        if (docDetails) {
          setSelectedDoc(docDetails);
        }

        // GET /documents/:id/preview-url
        try {
          const previewRes = await documentApi.getPreviewUrl(selectedDocId);
          if (previewRes?.url) {
            setPreviewUrl(previewRes.url);
          } else if (docDetails?.fileUrl) {
            setPreviewUrl(docDetails.fileUrl);
          } else {
            setPreviewUrl(null);
          }
        } catch (e) {
          console.warn('Preview URL fetch fallback:', e);
          setPreviewUrl(docDetails?.fileUrl || null);
        }

        // Reset & initialize chat history for new document
        const lockedState = Boolean(docDetails?.isLocked);
        setMessages([
          {
            id: 'init-1',
            sender: 'ai',
            text: lockedState
              ? 'This document is currently locked. Unlock this document to ask questions about it.'
              : `Hello! I am ready to analyze "${docDetails?.title || 'this document'}". Ask me any questions about its contents.`,
          },
        ]);
      } catch (err) {
        console.error('Error fetching document details for chat:', err);
        setMessages([
          {
            id: 'init-err',
            sender: 'ai',
            text: 'Error loading document context. Please select another document or try again.',
            isError: true,
          },
        ]);
      } finally {
        setLoadingPreview(false);
      }
    };

    fetchDocDetails();
  }, [selectedDocId]);

  // Scroll chat feed to bottom on new message or typing state change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Handle Document Selection
  const handleSelectDoc = (doc) => {
    if (selectedDocId === doc._id) return;
    setSelectedDocId(doc._id);
    setSelectedDoc(doc);
    setInputValue('');
  };

  // Handle "New Chat" Button
  const handleNewChat = () => {
    setSelectedDocId(null);
    setSelectedDoc(null);
    setPreviewUrl(null);
    setMessages([]);
    setInputValue('');
    if (showToast) showToast('New AI Chat session initialized', 'success');
  };

  // Handle Send Message
  const handleSend = async (textToSend) => {
    const questionText = typeof textToSend === 'string' ? textToSend : inputValue;
    const trimmed = questionText.trim();

    if (!trimmed || isTyping || !selectedDocId || isLocked) return;

    // 1. Add User Message immediately (Optimistic UI)
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // 2. Call POST /documents/:id/chat with question
      const res = await documentApi.askDocumentQuestion(selectedDocId, trimmed);

      const aiAnswer = res?.answer || res?.data?.answer || 'No answer generated.';
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiAnswer,
        },
      ]);
    } catch (err) {
      console.error('AI Chat Question Error:', err);

      let errorMessage = 'Something went wrong, please try again';
      if (err?.status === 403 || isLocked) {
        errorMessage = 'Unlock this document to use AI chat';
      } else if (err?.message) {
        errorMessage = err.message.includes('403')
          ? 'Unlock this document to use AI chat'
          : err.message;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: errorMessage,
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleDownload = async () => {
    if (!selectedDocId || isLocked) return;
    try {
      const downloadRes = await documentApi.getDownloadUrl(selectedDocId);
      const url = downloadRes?.url || downloadRes?.downloadUrl || selectedDoc?.fileUrl;
      if (url) {
        window.open(url, '_blank');
      } else {
        if (showToast) showToast('Download link not available', 'error');
      }
    } catch (err) {
      console.error('Download error:', err);
      if (showToast) showToast('Failed to retrieve download link', 'error');
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden h-[calc(100vh-64px)] select-none">
      {/* Left Panel: Chat History / Recent Documents List */}
      <aside className="w-[280px] bg-white border-r border-outline-variant flex flex-col h-full hidden lg:flex shrink-0">
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-label-md text-label-md py-3 rounded-xl hover:shadow-lg active:scale-95 transition-all duration-150 cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-[20px]">add_comment</span>
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-1">
          <div className="px-3 py-2 text-label-sm font-label-sm text-text-muted uppercase tracking-wider font-bold text-xs">
            Recent Documents
          </div>

          {loadingDocs ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-surface-container-low rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentDocs.length === 0 ? (
            <div className="p-4 text-center text-xs text-text-muted">
              No recent documents found.
            </div>
          ) : (
            recentDocs.map((doc) => {
              const isSelected = selectedDocId === doc._id;
              const iconName = getFileIcon(doc.fileFormat, doc.fileUrl);

              return (
                <button
                  key={doc._id}
                  onClick={() => handleSelectDoc(doc)}
                  className={`w-full text-left group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm border-l-4 border-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] shrink-0">
                    {iconName}
                  </span>
                  <span className="font-label-md text-label-md truncate flex-1 text-sm">
                    {doc.title || doc.originalFileName || 'Untitled Document'}
                  </span>
                  {doc.isLocked && (
                    <span className="material-symbols-outlined text-[16px] text-amber-500 shrink-0">
                      lock
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center gap-3 p-2.5 bg-surface-container-low rounded-xl">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            <div className="flex-1">
              <p className="font-label-sm text-label-sm text-text-main font-bold text-xs">
                Eduflux AI Assistant
              </p>
              <p className="text-[11px] text-text-muted">
                {selectedDoc ? 'Document Loaded' : 'Select a document'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col bg-background relative h-full min-w-0">
        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {!selectedDocId ? (
            /* Empty State: Prompt User to Select a Document */
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto my-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <span
                  className="material-symbols-outlined text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_awesome
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-text-main">
                  Eduflux AI Chat
                </h3>
                <p className="text-sm text-text-muted mt-1.5 leading-relaxed">
                  Select a document from your recent uploads on the left to start asking questions, summarizing contents, or extracting key concepts.
                </p>
              </div>

              {/* Mobile / Inline Document Quick Selector */}
              {recentDocs.length > 0 && (
                <div className="w-full pt-4 space-y-2">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider text-left">
                    Select a Recent Document:
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar text-left">
                    {recentDocs.map((doc) => (
                      <button
                        key={doc._id}
                        onClick={() => handleSelectDoc(doc)}
                        className="flex items-center gap-3 p-3 bg-white border border-outline-variant rounded-xl hover:border-primary transition-all cursor-pointer text-left shadow-sm"
                      >
                        <span className="material-symbols-outlined text-primary text-xl">
                          {getFileIcon(doc.fileFormat, doc.fileUrl)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-text-main truncate">
                            {doc.title || 'Untitled Document'}
                          </p>
                          <p className="text-xs text-text-muted uppercase">
                            {doc.fileFormat || 'PDF'}
                          </p>
                        </div>
                        {doc.isLocked && (
                          <span className="material-symbols-outlined text-sm text-amber-500">
                            lock
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Selected Document Chat Messages */
            <>
              <div className="flex justify-center">
                <span className="bg-surface-container-high text-on-surface-variant px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-outline-variant/30 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-primary">
                    description
                  </span>
                  {selectedDoc?.title || 'Document Active'}
                </span>
              </div>

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 max-w-3xl ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  {msg.sender === 'ai' ? (
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-white select-none shadow-sm">
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        auto_awesome
                      </span>
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center select-none font-bold text-xs shadow-sm">
                      <span className="material-symbols-outlined text-base">
                        person
                      </span>
                    </div>
                  )}

                  <div
                    className={`p-4 shadow-sm text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-text-main text-white rounded-[16px_16px_4px_16px]'
                        : msg.isError
                        ? 'bg-rose-50 text-rose-800 border border-rose-200 rounded-[16px_16px_16px_4px]'
                        : 'bg-[#f3f0ff] text-primary border border-[#e0d7ff] rounded-[16px_16px_16px_4px]'
                    }`}
                  >
                    <p className="font-body-md text-body-md whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator ("AI is thinking...") */}
              {isTyping && (
                <div className="flex gap-4 max-w-2xl items-center">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-white shadow-sm">
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      auto_awesome
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-surface-container-low px-4 py-3 rounded-2xl border border-outline-variant/30 shadow-sm text-xs font-semibold text-text-muted">
                    <span>AI is thinking</span>
                    <div className="flex space-x-1 items-center">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input Bar Area */}
        <div className="p-6 bg-transparent border-t border-outline-variant/10">
          <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-md border border-outline-variant rounded-2xl p-2 shadow-xl">
            {isLocked ? (
              <div className="p-3 text-center text-xs font-bold text-amber-800 bg-amber-50 rounded-xl flex items-center justify-center gap-2 border border-amber-200">
                <span className="material-symbols-outlined text-base">lock</span>
                <span>Unlock this document to use AI chat</span>
              </div>
            ) : !selectedDocId ? (
              <div className="p-3 text-center text-xs font-medium text-text-muted bg-slate-50 rounded-xl">
                Select a document from the left list to start asking questions.
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(inputValue);
                    }
                  }}
                  disabled={isTyping || !selectedDocId || isLocked}
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-3 font-body-md text-body-md max-h-32 custom-scrollbar outline-none disabled:opacity-50 text-sm placeholder:text-text-muted"
                  placeholder={`Ask anything about "${selectedDoc?.title || 'this document'}"...`}
                  rows={1}
                />
                <button
                  type="button"
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim() || isTyping || !selectedDocId || isLocked}
                  className="p-3 bg-primary text-white rounded-xl hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer flex items-center justify-center"
                  title="Send Question"
                >
                  <span className="material-symbols-outlined text-xl">send</span>
                </button>
              </div>
            )}
          </div>
          <p className="text-center font-label-sm text-label-sm text-text-muted mt-3 select-none text-[11px]">
            Eduflux AI processes document content securely. Press <kbd className="px-1 bg-slate-100 border rounded text-[10px]">Enter</kbd> to send.
          </p>
        </div>
      </section>

      {/* Right Panel: Document Preview & Context Metadata */}
      <aside className="w-[320px] bg-white border-l border-outline-variant flex flex-col h-full hidden xl:flex overflow-y-auto custom-scrollbar p-6 justify-between shrink-0">
        {selectedDoc ? (
          <div className="space-y-6">
            {/* Real Cover Preview Image */}
            <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-outline-variant shadow-md bg-surface-container-low flex items-center justify-center group select-none">
              {loadingPreview ? (
                <div className="flex flex-col items-center gap-2 text-text-muted text-xs">
                  <span className="material-symbols-outlined animate-spin text-2xl">
                    sync
                  </span>
                  <span>Loading Preview...</span>
                </div>
              ) : previewUrl && (previewUrl.endsWith('.png') || previewUrl.endsWith('.jpg') || previewUrl.endsWith('.jpeg') || previewUrl.includes('preview')) ? (
                <img
                  alt={selectedDoc.title || 'Document Preview'}
                  className="w-full h-full object-cover"
                  src={previewUrl}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-primary">
                  <span className="material-symbols-outlined text-6xl mb-2">
                    {getFileIcon(selectedDoc.fileFormat, selectedDoc.fileUrl)}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    {selectedDoc.fileFormat || 'DOCUMENT'}
                  </span>
                </div>
              )}

              {/* View Full Document Action Overlay */}
              <div
                onClick={() => navigate(`/documents/${selectedDoc._id}/view`)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 cursor-pointer"
              >
                <span className="material-symbols-outlined text-white text-3xl">
                  open_in_new
                </span>
              </div>
            </div>

            <div className="w-full space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-headline-sm text-[15px] text-text-main truncate font-bold flex-1">
                  {selectedDoc.title || 'Untitled Document'}
                </h3>
                <span className="bg-academic-blue/10 text-academic-blue font-label-sm text-[11px] px-2 py-0.5 rounded uppercase font-bold select-none shrink-0">
                  {selectedDoc.fileFormat || 'PDF'}
                </span>
              </div>

              {/* Document Quick Details */}
              <div className="bg-surface-container-low p-3.5 rounded-xl space-y-2 select-none text-xs text-text-muted">
                <div className="flex justify-between items-center">
                  <span>Category:</span>
                  <span className="font-bold text-text-main">
                    {selectedDoc.category || 'Academic'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>File Size:</span>
                  <span className="font-bold text-text-main">
                    {formatFileSize(selectedDoc.fileSize)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Status:</span>
                  <span
                    className={`font-bold ${
                      isLocked ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {isLocked ? 'Locked' : 'Unlocked'}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 select-none">
                <button
                  onClick={() => navigate(`/documents/${selectedDoc._id}/view`)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#f3f0ff] hover:bg-[#eadeff] text-primary font-label-md text-label-md rounded-xl transition-all cursor-pointer border-none font-bold text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-base">
                      visibility
                    </span>
                    View Full Document
                  </div>
                  <span className="material-symbols-outlined text-base">
                    arrow_forward
                  </span>
                </button>

                <button
                  disabled={isLocked}
                  onClick={handleDownload}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-label-md text-label-md transition-all text-xs font-bold ${
                    isLocked
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-base">
                      {isLocked ? 'lock' : 'download'}
                    </span>
                    {isLocked ? 'Download (Locked)' : 'Download Document'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-muted">
            <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">
              article
            </span>
            <p className="text-xs font-medium">
              No Document Selected
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Choose a document from the left sidebar to view details and preview.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
