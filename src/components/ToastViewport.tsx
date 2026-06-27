import { useToast } from '../context/ToastContext'

/** Zeigt transiente Toasts unten rechts an. */
export function ToastViewport() {
  const { toasts, dismiss } = useToast()
  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tone}`} role="status">
          <span>{toast.message}</span>
          <button
            type="button"
            className="toast__close"
            aria-label="Schließen"
            onClick={() => dismiss(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
