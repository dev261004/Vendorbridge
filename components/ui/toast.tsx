'use client'

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

interface Toast {
  id: number
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
}

interface ToastContextValue {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = ++counterRef.current
    setToasts((prev) => [...prev, { ...toast, id }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              min-w-[300px] max-w-sm rounded-lg border px-4 py-3 shadow-lg
              animate-in fade-in slide-in-from-bottom-2
              ${
                toast.variant === 'destructive'
                  ? 'border-red-500/50 bg-red-950/90 text-red-200'
                  : toast.variant === 'success'
                    ? 'border-green-500/50 bg-green-950/90 text-green-200'
                  : 'border-border bg-slate-800 text-white'
              }
            `}
          >
            <p className="text-sm font-medium">{toast.title}</p>
            {toast.description && (
              <p className="text-xs text-slate-400 mt-1">{toast.description}</p>
            )}
            <button
              onClick={() => dismissToast(toast.id)}
              className="absolute right-2 top-2 text-slate-500 hover:text-white"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
