import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isApiEnabled } from '../services/api'
import {
  moderationApi,
  type AuditEntry,
  type ModUser,
  type PendingComment,
  type Report,
} from '../services/moderationApi'
import { communityApi } from '../services/communityApi'
import type { Article } from '../types'
import { timeAgo } from '../lib/filterArticles'

type Tab = 'submissions' | 'comments' | 'reports' | 'users' | 'audit'

export function ModerationPage() {
  const { user, loading } = useAuth()
  const { notify } = useToast()
  const [tab, setTab] = useState<Tab>('submissions')
  const [submissions, setSubmissions] = useState<Article[]>([])
  const [comments, setComments] = useState<PendingComment[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [users, setUsers] = useState<ModUser[]>([])
  const [audit, setAudit] = useState<AuditEntry[]>([])

  const reload = useCallback(async () => {
    try {
      const [s, c, r, u, a] = await Promise.all([
        communityApi.submissions(),
        moderationApi.pendingComments(),
        moderationApi.reports(),
        moderationApi.users(),
        moderationApi.audit(),
      ])
      setSubmissions(s)
      setComments(c)
      setReports(r)
      setUsers(u)
      setAudit(a)
    } catch {
      notify('Moderationsdaten konnten nicht geladen werden', 'error')
    }
  }, [notify])

  useEffect(() => {
    if (user && ['moderator', 'admin'].includes(user.role)) void reload()
  }, [user, reload])

  if (loading) return null
  if (!isApiEnabled() || !user || !['moderator', 'admin'].includes(user.role)) {
    return <Navigate to="/" replace />
  }

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn()
      notify(msg, 'success')
      await reload()
    } catch {
      notify('Aktion fehlgeschlagen', 'error')
    }
  }

  const tabs: Array<[Tab, string, number]> = [
    ['submissions', 'Einreichungen', submissions.length],
    ['comments', 'Kommentare', comments.length],
    ['reports', 'Meldungen', reports.length],
    ['users', 'Nutzer', users.length],
    ['audit', 'Audit-Log', audit.length],
  ]

  return (
    <>
      <Seo title="Moderation" path="/moderation" />
      <header className="page-head">
        <h1 className="page-head__title">🛡️ Moderation</h1>
        <p className="page-head__desc">Kommentare prüfen, Meldungen bearbeiten, Nutzer verwalten.</p>
      </header>

      <div className="tabs" role="tablist">
        {tabs.map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`tab${tab === id ? ' tab--active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label} {count > 0 && <span className="badge badge--warn">{count}</span>}
          </button>
        ))}
      </div>

      {tab === 'submissions' && (
        <ModList
          items={submissions}
          empty="Keine offenen Einreichungen."
          render={(s) => (
            <li key={s.id} className="modrow">
              <div>
                <span className={`card__tag tag--${s.category}`}>{s.category}</span> <strong>{s.title}</strong>
                <p className="modrow__text">{s.excerpt || s.body?.slice(0, 120)} — Quelle: {s.source}</p>
              </div>
              <div className="modrow__actions">
                <button className="btn btn--small" onClick={() => act(() => communityApi.approveSubmission(s.id), 'Veröffentlicht')}>Veröffentlichen</button>
                <button className="btn btn--small btn--ghost btn--danger" onClick={() => act(() => communityApi.rejectSubmission(s.id), 'Abgelehnt')}>Ablehnen</button>
              </div>
            </li>
          )}
        />
      )}

      {tab === 'comments' && (
        <ModList
          items={comments}
          empty="Keine Kommentare zur Prüfung."
          render={(c) => (
            <li key={c.id} className="modrow">
              <div>
                <strong>{c.author}</strong> · <time>{timeAgo(c.createdAt)}</time>
                <p className="modrow__text">{c.text}</p>
              </div>
              <div className="modrow__actions">
                <button className="btn btn--small" onClick={() => act(() => moderationApi.approveComment(c.id), 'Freigegeben')}>Freigeben</button>
                <button className="btn btn--small btn--ghost btn--danger" onClick={() => act(() => moderationApi.rejectComment(c.id), 'Abgelehnt')}>Ablehnen</button>
              </div>
            </li>
          )}
        />
      )}

      {tab === 'reports' && (
        <ModList
          items={reports}
          empty="Keine offenen Meldungen."
          render={(r) => (
            <li key={r.id} className="modrow">
              <div>
                <span className="badge badge--muted">{r.target_type}</span> {r.target_id}
                <p className="modrow__text">{r.reason}</p>
              </div>
              <div className="modrow__actions">
                <button className="btn btn--small" onClick={() => act(() => moderationApi.resolveReport(r.id), 'Erledigt')}>Erledigen</button>
              </div>
            </li>
          )}
        />
      )}

      {tab === 'users' && (
        <ModList
          items={users}
          empty="Keine Nutzer."
          render={(u) => (
            <li key={u.id} className="modrow">
              <div>
                <strong>{u.display_name}</strong> <span className="authmenu__role">{u.role}</span>
                <p className="modrow__text">{u.email} {u.banned && <span className="badge badge--warn">gesperrt</span>}</p>
              </div>
              {u.role !== 'admin' && (
                <div className="modrow__actions">
                  <button
                    className={`btn btn--small${u.banned ? '' : ' btn--ghost btn--danger'}`}
                    onClick={() => act(() => moderationApi.setBan(u.id, !u.banned), u.banned ? 'Entsperrt' : 'Gesperrt')}
                  >
                    {u.banned ? 'Entsperren' : 'Sperren'}
                  </button>
                </div>
              )}
            </li>
          )}
        />
      )}

      {tab === 'audit' && (
        <ModList
          items={audit}
          empty="Noch keine Einträge."
          render={(e) => (
            <li key={e.id} className="modrow modrow--audit">
              <span><code>{e.action}</code> {e.detail && `· ${e.detail}`}</span>
              <span className="modrow__meta">{e.actor_name ?? 'System'} · {timeAgo(e.created_at)}</span>
            </li>
          )}
        />
      )}
    </>
  )
}

function ModList<T>({ items, empty, render }: { items: T[]; empty: string; render: (item: T) => React.ReactNode }) {
  if (items.length === 0) return <p className="comments__empty">{empty}</p>
  return <ul className="modlist">{items.map(render)}</ul>
}
