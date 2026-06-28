import { useRef, useState } from 'react'
import { Seo } from '../components/Seo'
import { categories } from '../data/categories'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../lib/filterArticles'
import { emitWebhook, importMockFeed } from '../services/integrations'
import { api, isApiEnabled } from '../services/api'
import { editorialApi, type Revision } from '../services/editorialApi'
import {
  deleteArticle,
  getAllRaw,
  isPublished,
  upsertArticle,
  type ArticleInput,
} from '../services/articlesService'
import type { Article } from '../types'

const EMPTY: ArticleInput = {
  title: '',
  excerpt: '',
  body: '',
  category: 'official',
  date: new Date().toISOString().slice(0, 10),
  source: '',
  image: 'https://picsum.photos/seed/neu/800/450',
  status: 'published',
}

export function AdminPage() {
  const { notify } = useToast()
  const [list, setList] = useState<Article[]>(() => getAllRaw())
  const [form, setForm] = useState<ArticleInput>(EMPTY)
  const [breaking, setBreaking] = useState('')
  const [revisions, setRevisions] = useState<Revision[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const sendBreaking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!breaking.trim()) return
    try {
      await api('/api/broadcast/breaking', { method: 'POST', body: { message: breaking.trim() } })
      notify('Eilmeldung an alle Leser gesendet 📣', 'success')
      setBreaking('')
    } catch {
      notify('Senden fehlgeschlagen (Backend & Rolle nötig)', 'error')
    }
  }

  const refresh = () => setList(getAllRaw())

  const set = <K extends keyof ArticleInput>(key: K, value: ArticleInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.source.trim()) {
      notify('Titel und Quelle sind Pflicht', 'error')
      return
    }
    const saved = upsertArticle(form)
    emitWebhook('article.upserted', { id: saved.id, title: saved.title })
    notify(form.id ? 'Artikel aktualisiert' : 'Artikel angelegt', 'success')
    setForm(EMPTY)
    refresh()
  }

  const edit = (a: Article) => {
    setForm({
      id: a.id,
      title: a.title,
      excerpt: a.excerpt,
      body: a.body,
      category: a.category,
      date: a.date,
      source: a.source,
      sourceUrl: a.sourceUrl,
      image: a.image,
      tags: a.tags,
      author: a.author,
      reliability: a.reliability,
      status: a.status ?? 'published',
      publishAt: a.publishAt,
    })
    setRevisions([])
    if (isApiEnabled()) editorialApi.revisions(a.id).then(setRevisions, () => setRevisions([]))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const restoreRevision = async (revId: string) => {
    if (!form.id) return
    try {
      await editorialApi.restoreRevision(form.id, revId)
      notify('Version wiederhergestellt', 'success')
      editorialApi.revisions(form.id).then(setRevisions, () => {})
      refresh()
    } catch {
      notify('Wiederherstellen fehlgeschlagen', 'error')
    }
  }

  const remove = (id: string) => {
    deleteArticle(id)
    notify('Artikel gelöscht', 'info')
    refresh()
  }

  // Redaktionskalender: geplante/zu prüfende Beiträge nach Datum gruppiert.
  const calendar = [...list]
    .filter((a) => a.status === 'draft' || a.status === 'review' || (a.publishAt && new Date(a.publishAt) > new Date()))
    .sort((a, b) => (a.publishAt ?? a.date).localeCompare(b.publishAt ?? b.date))

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set('image', String(reader.result))
    reader.readAsDataURL(file)
  }

  const importFeed = () => {
    const drafts = importMockFeed()
    drafts.forEach((d) => upsertArticle({ ...(d as ArticleInput) }))
    notify(`${drafts.length} Artikel aus RSS importiert (als Entwurf)`, 'success')
    refresh()
  }

  return (
    <>
      <Seo title="Redaktion" path="/admin" />
      <header className="page-head">
        <h1 className="page-head__title">Redaktion / CMS</h1>
        <p className="page-head__desc">
          Artikel anlegen, bearbeiten, terminieren und importieren. Speicherung lokal
          (localStorage) — in Produktion gegen eine echte API/CMS austauschbar.
        </p>
      </header>

      {isApiEnabled() && (
        <form className="breaking-form" onSubmit={sendBreaking}>
          <input
            value={breaking}
            onChange={(e) => setBreaking(e.target.value)}
            placeholder="📣 Eilmeldung an alle Leser senden…"
            aria-label="Eilmeldung"
          />
          <button type="submit" className="btn btn--small">Senden</button>
        </form>
      )}

      <form className="admin-form" onSubmit={submit}>
        <div className="admin-form__grid">
          <label>
            Titel*
            <input value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </label>
          <label>
            Quelle*
            <input value={form.source} onChange={(e) => set('source', e.target.value)} required />
          </label>
          <label>
            Kategorie
            <select value={form.category} onChange={(e) => set('category', e.target.value as Article['category'])}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Datum
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </label>
          <label>
            Autor
            <input value={form.author ?? ''} onChange={(e) => set('author', e.target.value)} />
          </label>
          <label>
            Co-Autor:innen (Komma-getrennt)
            <input
              value={(form.coAuthors ?? []).join(', ')}
              onChange={(e) => set('coAuthors', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
            />
          </label>
          <label>
            Quelle-URL
            <input value={form.sourceUrl ?? ''} onChange={(e) => set('sourceUrl', e.target.value)} />
          </label>
          <label>
            Status
            <select value={form.status} onChange={(e) => set('status', e.target.value as Article['status'])}>
              <option value="published">Veröffentlicht</option>
              <option value="draft">Entwurf</option>
              <option value="review">Zur Freigabe (Review)</option>
            </select>
          </label>
          <label>
            Geplant ab (optional)
            <input type="date" value={form.publishAt ?? ''} onChange={(e) => set('publishAt', e.target.value || undefined)} />
          </label>
          <label>
            Tags (Komma-getrennt)
            <input
              value={(form.tags ?? []).join(', ')}
              onChange={(e) => set('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
            />
          </label>
          <label>
            Bild-URL / Upload
            <input value={form.image} onChange={(e) => set('image', e.target.value)} />
            <input ref={fileRef} type="file" accept="image/*" onChange={onImage} />
          </label>
        </div>
        <label>
          Teaser
          <textarea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} rows={2} />
        </label>
        <label>
          Inhalt (Markdown)
          <textarea value={form.body} onChange={(e) => set('body', e.target.value)} rows={6} />
        </label>
        <div className="admin-form__actions">
          <button type="submit" className="btn">
            {form.id ? 'Speichern' : 'Anlegen'}
          </button>
          {form.id && (
            <button type="button" className="btn btn--ghost" onClick={() => setForm(EMPTY)}>
              Abbrechen
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={importFeed}>
            ⤓ RSS importieren
          </button>
        </div>

        {form.id && isApiEnabled() && (
          <div className="revisions">
            <strong>Versionshistorie ({revisions.length})</strong>
            {revisions.length === 0 ? (
              <p className="settings__hint">Noch keine früheren Versionen.</p>
            ) : (
              <ul className="revisions__list">
                {revisions.map((r) => (
                  <li key={r.id}>
                    <span>{formatDate(r.edited_at.slice(0, 10))} · {r.edited_by ?? 'System'}</span>
                    <button type="button" className="linkbtn" onClick={() => restoreRevision(r.id)}>
                      Wiederherstellen
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>

      {calendar.length > 0 && (
        <section className="editorial-calendar">
          <h2 className="section-title">🗓️ Redaktionskalender</h2>
          <ul className="editorial-calendar__list">
            {calendar.map((a) => (
              <li key={a.id} className="editorial-calendar__item">
                <time>{formatDate((a.publishAt ?? a.date).slice(0, 10))}</time>
                <span className={`card__tag tag--${a.category}`}>{a.category}</span>
                <span className="editorial-calendar__title">{a.title}</span>
                <span className="badge badge--muted">
                  {a.status === 'review' ? 'Review' : a.status === 'draft' ? 'Entwurf' : 'Geplant'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="section-title">Alle Artikel ({list.length})</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Titel</th>
            <th>Kategorie</th>
            <th>Datum</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map((a) => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.category}</td>
              <td>{formatDate(a.date)}</td>
              <td>
                {a.status === 'draft' ? (
                  <span className="badge badge--muted">Entwurf</span>
                ) : isPublished(a) ? (
                  <span className="badge badge--ok">Live</span>
                ) : (
                  <span className="badge badge--warn">Geplant</span>
                )}
              </td>
              <td className="admin-table__actions">
                <button type="button" className="linkbtn" onClick={() => edit(a)}>
                  Bearbeiten
                </button>
                {a.userCreated && (
                  <button type="button" className="linkbtn linkbtn--danger" onClick={() => remove(a.id)}>
                    Löschen
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
