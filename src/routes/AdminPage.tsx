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
import { SeoAnalyzer } from '../components/SeoAnalyzer'
import { TocWidget } from '../components/TocWidget'
import { MediaLibrary } from '../components/MediaLibrary'
import { ArticleRevisions, saveRevision } from '../components/ArticleRevisions'
import { ARTICLE_TEMPLATES, generateToc, writingSuggestions, markdownToHtml } from '../lib/cms'

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
  const [showPreview, setShowPreview] = useState(false)
  const [showCmsTools, setShowCmsTools] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])

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
    // Save local revision before upsert
    if (form.id) {
      saveRevision(form.id, form.title, form.body)
    }
    const saved = upsertArticle(form)
    emitWebhook('article.upserted', { id: saved.id, title: saved.title })
    notify(form.id ? 'Artikel aktualisiert' : 'Artikel angelegt', 'success')
    setForm(EMPTY)
    refresh()
  }

  const applyTemplate = (templateId: string) => {
    const tpl = ARTICLE_TEMPLATES.find(t => t.id === templateId)
    if (tpl) {
      set('body', tpl.body)
      setSelectedTemplate(templateId)
    }
  }

  const handleBodyChange = (value: string) => {
    set('body', value)
    if (value.length > 10) {
      setAiSuggestions(writingSuggestions(value))
    }
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
          <textarea value={form.body} onChange={(e) => handleBodyChange(e.target.value)} rows={6} />
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
          <button type="button" className="btn btn--ghost" onClick={() => setShowPreview(p => !p)}>
            {showPreview ? 'Vorschau aus' : 'Vorschau ein'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setShowCmsTools(p => !p)}>
            CMS-Tools
          </button>
        </div>

        {showPreview && form.body && (
          <div className="admin-preview" style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 8, marginTop: '1rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--text-muted)' }}>Live-Vorschau</h3>
            <div className="cms-preview-content" dangerouslySetInnerHTML={{ __html: markdownToHtml(form.body) }} />
          </div>
        )}

        {showCmsTools && (
          <div className="admin-cms-tools" style={{ marginTop: '1rem', display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
            {/* Template selector */}
            <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 8, gridColumn: '1 / -1' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Artikel-Vorlage</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {ARTICLE_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={`chip${selectedTemplate === t.id ? ' chip--active' : ''}`}
                    onClick={() => applyTemplate(t.id)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* SEO analyzer */}
            <SeoAnalyzer title={form.title} body={form.body} tags={form.tags ?? []} />

            {/* TOC widget */}
            <TocWidget entries={generateToc(form.body)} />

            {/* AI Writing suggestions */}
            {aiSuggestions.length > 0 && (
              <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Schreib-Vorschläge</h4>
                <ul style={{ margin: 0, padding: '0 0 0 1.2rem', fontSize: '0.85rem' }}>
                  {aiSuggestions.map((s, i) => (
                    <li key={i} style={{ marginBottom: '0.25rem' }}>
                      <button
                        type="button"
                        className="linkbtn"
                        onClick={() => set('title', s)}
                        style={{ textAlign: 'left' }}
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Media library */}
            <MediaLibrary onInsert={(url) => set('image', url)} />

            {/* Local revisions */}
            {form.id && (
              <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 8, gridColumn: '1 / -1' }}>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Lokale Revisionen</h4>
                <ArticleRevisions
                  articleId={form.id}
                  onRestore={(rev) => {
                    set('title', rev.title)
                    set('body', rev.body)
                    notify('Revision wiederhergestellt', 'success')
                  }}
                />
              </div>
            )}
          </div>
        )}

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
