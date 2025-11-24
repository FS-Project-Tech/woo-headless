"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const noop = (message: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[Toast] ${message}`);
  }
};

const fallbackToastContext: ToastContextType = {
  success: noop,
  error: noop,
  info: noop,
  warning: noop,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, message, type };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const success = useCallback((message: string) => addToast(message, 'success'), [addToast]);
  const error = useCallback((message: string) => addToast(message, 'error'), [addToast]);
  const info = useCallback((message: string) => addToast(message, 'info'), [addToast]);
  const warning = useCallback((message: string) => addToast(message, 'warning'), [addToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ success, error, info, warning }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-9999 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto min-w-[300px] max-w-md px-4 py-3 rounded-lg shadow-lg
              animate-in slide-in-from-top-5 fade-in
              ${
                toast.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : toast.type === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : toast.type === 'warning'
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                  : 'bg-blue-50 border border-blue-200 text-blue-800'
              }
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className={`
                  shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity
                  ${toast.type === 'success' ? 'text-green-600' : toast.type === 'error' ? 'text-red-600' : toast.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'}
                `}
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('useToast used outside ToastProvider. Falling back to console warnings.');
    }
    return fallbackToastContext;
  }
  return context;
}

export default ToastProvider;


