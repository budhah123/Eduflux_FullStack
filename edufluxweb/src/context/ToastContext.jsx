import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type, isExiting: false }])

    // Trigger exit animation before removal
    const exitTimeout = setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
      )
    }, 2700)

    // Remove toast after duration
    const removeTimeout = setTimeout(() => {
      removeToast(id)
    }, 3000)

    return () => {
      clearTimeout(exitTimeout)
      clearTimeout(removeTimeout)
    }
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      
      {/* Toast Notification Container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 md:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`glass-card bg-white/80 dark:bg-surface-container/80 backdrop-blur-md border shadow-lg rounded-2xl p-4 flex gap-3 items-start relative overflow-hidden pointer-events-auto transition-all duration-300 ${
              toast.type === 'error'
                ? 'border-red-500/20 shadow-red-500/5'
                : 'border-emerald-500/20 shadow-emerald-500/5'
            } ${
              toast.isExiting ? 'animate-toast-out' : 'animate-toast-in'
            }`}
          >
            {/* Icon */}
            <span className={`material-symbols-outlined text-2xl select-none mt-0.5 ${
              toast.type === 'error' ? 'text-red-500' : 'text-emerald-500'
            }`}>
              {toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            
            {/* Content */}
            <div className="flex-grow">
              <h4 className="font-label-md text-label-md text-text-main dark:text-on-surface font-semibold">
                {toast.type === 'error' ? 'Error' : 'Success'}
              </h4>
              <p className="text-body-sm text-body-sm text-text-muted dark:text-on-surface-variant mt-0.5">
                {toast.message}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-muted hover:text-text-main dark:text-on-surface-variant dark:hover:text-on-surface transition-colors focus:outline-none cursor-pointer"
              aria-label="Close notification"
            >
              <span className="material-symbols-outlined text-lg select-none">
                close
              </span>
            </button>

            {/* Shrinking Time Progress Bar */}
            <div className={`absolute bottom-0 left-0 h-1 animate-progress-bar w-full ${
              toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
            }`}></div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
