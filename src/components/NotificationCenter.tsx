import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { isApiEnabled } from '../services/api'
import { accountApi } from '../services/accountApi'
import { timeAgo } from '../lib/filterArticles'

interface ServerNotification {
  id: string
  type: string
  text: string
  link: string | null
  read: boolean
  createdAt: string
}

/** Glocke mit Aktivitäts-Feed: lokale Toasts + Server-Benachrichtigungen (@mentions). */
export function NotificationCenter() {
  const { notifications: localNotifs, clearNotifications } = useToast()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [server, setServer] = useState<ServerNotification[]>([])
  const [unread, setUnread] = useState(0)

  const useServer = isApiEnabled() && !!user

  const load = useCallback(() => {
    if (!useServer) return
    accountApi.notifications().then(
      (res) => {
        setServer(res.notifications)
        setUnread(res.unread)
      },
      () => {},
    )
  }, [useServer])

  // Beim Laden und alle 30s aktualisieren.
  useEffect(() => {
    load()
    if (!useServer) return
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [load, useServer])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && unread > 0) {
      accountApi.markNotificationsRead().then(() => {
        setUnread(0)
        setServer((prev) => prev.map((n) => ({ ...n, read: true })))
      }, () => {})
    }
  }

  const badge = unread + localNotifs.length

  return (
    <div className="notif">
      <button
        type="button"
        className="icon-btn notif__bell"
        aria-label={`Benachrichtigungen (${badge})`}
        aria-expanded={open}
        onClick={toggle}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {badge > 0 && <span className="notif__badge">{badge}</span>}
      </button>
      {open && (
        <div className="notif__panel" role="dialog" aria-label="Benachrichtigungen">
          <div className="notif__head">
            <strong>Benachrichtigungen</strong>
            {localNotifs.length > 0 && (
              <button type="button" className="linkbtn" onClick={clearNotifications}>Leeren</button>
            )}
          </div>
          {server.length === 0 && localNotifs.length === 0 ? (
            <p className="notif__empty">Keine Benachrichtigungen</p>
          ) : (
            <ul className="notif__list">
              {server.map((n) => (
                <li key={n.id} className={`notif__item${n.read ? '' : ' notif__item--info'}`}>
                  {n.link ? <Link to={n.link} onClick={() => setOpen(false)}>{n.text}</Link> : <span>{n.text}</span>}
                  <time dateTime={n.createdAt}>{timeAgo(n.createdAt)}</time>
                </li>
              ))}
              {localNotifs.map((n) => (
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
