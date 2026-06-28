import { useState } from 'react'
import { Seo } from '../components/Seo'
import { getInboxNotifs, markRead, markAllRead, unreadCount } from '../services/notificationsService'
import { NotificationsPrefs } from '../components/NotificationsPrefs'
import type { InboxNotif } from '../services/notificationsService'

export function NotificationsPage() {
  const [notifs, setNotifs] = useState<InboxNotif[]>(getInboxNotifs)
  const [tab, setTab] = useState<'inbox' | 'settings'>('inbox')
  const unread = unreadCount()

  function handleMarkRead(id: string) {
    markRead(id)
    setNotifs(getInboxNotifs())
  }

  function handleMarkAll() {
    markAllRead()
    setNotifs(getInboxNotifs())
  }

  const typeIcon: Record<string, string> = {
    mention: '@', comment: '💬', reaction: '❤️', milestone: '🏁', breaking: '📢'
  }

  return (
    <>
      <Seo title="Benachrichtigungen" description="Dein Benachrichtigungs-Center." path="/benachrichtigungen" />
      <header className="page-head">
        <h1 className="page-head__title">🔔 Benachrichtigungen {unread > 0 && <span className="saved__badge">{unread}</span>}</h1>
      </header>

      <div className="searchpage__tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'inbox'} className={`tab${tab === 'inbox' ? ' tab--active' : ''}`} onClick={() => setTab('inbox')}>
          Posteingang
        </button>
        <button role="tab" aria-selected={tab === 'settings'} className={`tab${tab === 'settings' ? ' tab--active' : ''}`} onClick={() => setTab('settings')}>
          Einstellungen
        </button>
      </div>

      {tab === 'inbox' && (
        <>
          {notifs.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <button className="btn btn--ghost" onClick={handleMarkAll}>Alle als gelesen markieren</button>
            </div>
          )}
          {notifs.length === 0 ? (
            <p className="empty">Keine Benachrichtigungen.</p>
          ) : (
            <ul className="hitlist">
              {[...notifs].reverse().map(n => (
                <li key={n.id} className={`hit${n.readAt ? '' : ' hit--unread'}`}>
                  <div className="hit__meta">
                    <span>{typeIcon[n.type] ?? '🔔'}</span>
                    <span className="hit__min">{new Date(n.createdAt).toLocaleString('de-DE')}</span>
                    {!n.readAt && <span className="saved__badge">neu</span>}
                  </div>
                  <p className="hit__snippet">{n.message}</p>
                  {!n.readAt && (
                    <button className="btn btn--ghost" onClick={() => handleMarkRead(n.id)}>Gelesen</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === 'settings' && <NotificationsPrefs />}
    </>
  )
}
