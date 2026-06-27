import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createId } from '../services/storage'

export interface Toast {
  id: string
  message: string
  tone: 'info' | 'success' | 'error'
  /** Bleibt im Benachrichtigungs-Center erhalten. */
  at: string
}

interface ToastContextValue {
  toasts: Toast[]
  /** Persistente Liste fürs Notification-Center. */
  notifications: Toast[]
  notify: (message: string, tone?: Toast['tone']) => void
  dismiss: (id: string) => void
  clearNotifications: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [notifications, setNotifications] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, tone: Toast['tone'] = 'info') => {
      const toast: Toast = { id: createId('t'), message, tone, at: new Date().toISOString() }
      setToasts((prev) => [...prev, toast])
      setNotifications((prev) => [toast, ...prev].slice(0, 30))
      setTimeout(() => dismiss(toast.id), 4000)
    },
    [dismiss],
  )

  const clearNotifications = useCallback(() => setNotifications([]), [])

  const value = useMemo(
    () => ({ toasts, notifications, notify, dismiss, clearNotifications }),
    [toasts, notifications, notify, dismiss, clearNotifications],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
