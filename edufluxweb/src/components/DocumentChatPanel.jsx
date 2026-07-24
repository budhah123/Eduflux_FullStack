import { useState, useEffect, useRef } from 'react';
import { documentApi } from '../services/api/documentApi';

/**
 * Reusable AI Chat Panel Component for Eduflux Document Viewer
 * 
 * Props:
 * - documentId: string - Current document ID
 * - isLocked: boolean - Lock state of the document
 * - title?: string - Document title for the header
 * - className?: string - Additional custom classes for layout positioning
 */
export default function DocumentChatPanel({
  documentId,
  isLocked = false,
  title = 'Document',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Reset chat history when documentId changes
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: isLocked
          ? 'This document is locked. Unlock it to ask AI questions about its contents.'
          : `Hello! Ask me any questions about "${title || 'this document'}" and I will analyze it for you.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInput('');
    setIsLoading(false);
  }, [documentId, isLocked, title]);

  // Auto-scroll to bottom of message list on new messages or loading state change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Keep focus on input after sending or opening
  const focusInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  useEffect(() => {
    if (isOpen && !isLocked) {
      focusInput();
    }
  }, [isOpen, isLocked]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();

    const trimmedQuestion = input.trim();
    if (!trimmedQuestion || isLoading || isLocked) return;

    const userMessageId = `user-${Date.now()}`;
    const userMessage = {
      id: userMessageId,
      sender: 'user',
      text: trimmedQuestion,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Optimistic UI Update: add user question immediately & clear input field
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call POST /documents/:id/chat with question
      const res = await documentApi.askDocumentQuestion(documentId, trimmedQuestion);
      
      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res?.answer || 'I could not generate an answer for this document.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('Document Chat Error:', err);
      
      let errorMessage = 'Something went wrong, please try again';
      if (err?.status === 403 || isLocked) {
        errorMessage = 'Unlock this document to use AI chat';
      } else if (err?.message) {
        errorMessage = err.message.includes('403')
          ? 'Unlock this document to use AI chat'
          : err.message;
      }

      const errorAiMessage = {
        id: `error-${Date.now()}`,
        sender: 'ai',
        isError: true,
        text: errorMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, errorAiMessage]);
    } finally {
      setIsLoading(false);
      focusInput();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end ${className}`}>
      {/* Floating Toggle Trigger Button (when closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-[#0F2C59] text-white shadow-xl hover:bg-[#163a75] hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border border-amber-500/30 cursor-pointer"
          title="Open AI Document Chat"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-[#F5A623]">
            <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">
              auto_awesome
            </span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Eduflux AI
            </span>
            <span className="text-sm font-bold leading-tight">Ask Document</span>
          </div>
          {isLocked && (
            <span className="material-symbols-outlined text-sm text-amber-400/80 ml-1">
              lock
            </span>
          )}
        </button>
      )}

      {/* Main Glassmorphic AI Chat Panel (when open) */}
      {isOpen && (
        <div className="w-full sm:w-[400px] h-[540px] max-h-[82vh] flex flex-col rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl overflow-hidden transition-all duration-300 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-[#0F2C59] text-white border-b border-amber-500/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#F5A623] to-amber-300 flex items-center justify-center text-[#0F2C59] font-bold shadow-sm shrink-0">
                <span className="material-symbols-outlined text-xl">
                  smart_toy
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm leading-tight tracking-wide text-white truncate">
                    Eduflux Assistant
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[#F5A623] text-[10px] font-extrabold uppercase tracking-wider">
                    AI
                  </span>
                </div>
                <p className="text-xs text-slate-300 truncate mt-0.5">
                  {isLocked ? 'Locked Document' : title}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close chat"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Access Warning Banner (if locked) */}
          {isLocked && (
            <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-amber-800 text-xs font-medium">
              <span className="material-symbols-outlined text-base text-amber-600 shrink-0">
                lock
              </span>
              <span>Unlock this document to ask questions about it.</span>
            </div>
          )}

          {/* Scrollable Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isUser ? 'items-end' : 'items-start'
                  } space-y-1`}
                >
                  <div className="flex items-end gap-2 max-w-[85%]">
                    {!isUser && (
                      <div className="w-7 h-7 rounded-full bg-[#0F2C59] text-amber-400 flex items-center justify-center text-xs shrink-0 shadow-sm mb-1">
                        <span className="material-symbols-outlined text-sm">
                          auto_awesome
                        </span>
                      </div>
                    )}

                    <div
                      className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#0F2C59] text-white rounded-tr-none shadow-md'
                          : msg.isError
                          ? 'bg-rose-50 text-rose-800 border border-rose-200 rounded-tl-none'
                          : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 px-1 font-medium">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Loading Indicator ("AI is thinking...") */}
            {isLoading && (
              <div className="flex items-end gap-2 max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-[#0F2C59] text-amber-400 flex items-center justify-center text-xs shrink-0 shadow-sm animate-pulse">
                  <span className="material-symbols-outlined text-sm">
                    auto_awesome
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl rounded-tl-none bg-white text-slate-700 border border-slate-200 shadow-sm flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">
                    AI is thinking
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div className="p-3 bg-white border-t border-slate-200">
            {isLocked ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">lock</span>
                  <span>Unlock this document to ask questions about it.</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSend} className="relative flex items-center gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about this document..."
                  disabled={isLoading || isLocked}
                  rows={1}
                  className="w-full py-2.5 pl-3.5 pr-12 text-sm text-slate-800 bg-slate-100/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F2C59]/20 focus:border-[#0F2C59] focus:bg-white resize-none disabled:opacity-50 transition-all placeholder:text-slate-400 max-h-24"
                  style={{ minHeight: '42px' }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || isLocked}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#0F2C59] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#163a75] active:scale-95 transition-all shadow-sm cursor-pointer"
                  title="Send question"
                >
                  <span className="material-symbols-outlined text-lg">
                    send
                  </span>
                </button>
              </form>
            )}
            <div className="mt-1.5 text-center">
              <span className="text-[10px] text-slate-400">
                Press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono">Shift+Enter</kbd> for newline
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
