import { useState } from 'react'
import { useToast } from '../context/ToastContext'
import { timeAgo } from '../lib/filterArticles'

/** Glocke mit Aktivitäts-Feed (persistente Benachrichtigungen). */
export function NotificationCenter() {
  const { notifications, clearNotifications } = useToast()
  const [open, setOpen] = useState(false)

  return (
    <div className="notif">
      <button
        type="button"
        className="icon-btn notif__bell"
        aria-label={`Benachrichtigungen (${notifications.length})`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {notifications.length > 0 && <span className="notif__badge">{notifications.length}</span>}
      </button>
      {open && (
        <div className="notif__panel" role="dialog" aria-label="Benachrichtigungen">
          <div className="notif__head">
            <strong>Benachrichtigungen</strong>
            {notifications.length > 0 && (
              <button type="button" className="linkbtn" onClick={clearNotifications}>
                Leeren
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="notif__empty">Keine Benachrichtigungen</p>
          ) : (
            <ul className="notif__list">
              {notifications.map((n) => (
                <li key={n.id} className={`notif__item notif__item--${n.tone}`}>
                  <span>{n.message}</span>
                  <time dateTime={n.at}>{timeAgo(n.at)}</time>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
