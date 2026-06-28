import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { SkeletonGrid } from '../components/Skeleton'
import { highlight } from '../lib/highlight'
import { categories as categoryList, categoryMap } from '../data/categories'
import { usePreferences } from '../context/PreferencesContext'
import {
  searchApi,
  type CommentHit,
  type LoreHit,
  type SearchResponse,
} from '../services/searchApi'
import {
  acknowledgeSaved,
  getSavedSearches,
  recordSearch,
  removeSavedSearch,
  saveSearch,
  topSearches,
  type SavedSearch,
} from '../services/savedSearches'

type Tab = 'articles' | 'comments' | 'lore'

const RELIABILITY_LABELS: Record<string, string> = {
  confirmed: '✅ Bestätigt',
  official: '✅ Offiziell',
  rumor: '❓ Gerücht',
  unconfirmed: '❓ Unbestätigt',
}

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const { prefs } = usePreferences()
  const q = params.get('q') ?? ''
  const [input, setInput] = useState(q)
  const [tab, setTab] = useState<Tab>('articles')
  const [category, setCategory] = useState('')
  const [reliability, setReliability] = useState('')
  const [maxMinutes, setMaxMinutes] = useState(0)
  const [personalized, setPersonalized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SearchResponse | null>(null)
  const [comments, setComments] = useState<CommentHit[]>([])
  const [lore, setLore] = useState<LoreHit[]>([])
  const [saved, setSaved] = useState<SavedSearch[]>([])
  const [stats, setStats] = useState(() => topSearches())

  useEffect(() => setInput(q), [q])
  useEffect(() => setSaved(getSavedSearches()), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    const opts = {
      category: category || undefined,
      reliability: reliability || undefined,
      maxMinutes: maxMinutes || undefined,
    }
    Promise.all([
      searchApi.search(q, opts),
      searchApi.searchComments(q),
      Promise.resolve(searchApi.searchLore(q)),
    ]).then(([res, com, lo]) => {
      if (!active) return
      setData(res)
      setComments(com)
      setLore(lo)
      setLoading(false)
    })
    if (q.trim()) {
      recordSearch(q)
      setStats(topSearches())
    }
    return () => {
      active = false
    }
  }, [q, category, reliability, maxMinutes])

  const results = useMemo(() => {
    if (!data) return []
    if (!personalized || !prefs.interests.length) return data.results
    const set = new Set(prefs.interests)
    return [...data.results]
      .map((r, i) => ({ r, i, boost: set.has(r.category) ? 1 : 0 }))
      .sort((a, b) => b.boost - a.boost || a.i - b.i)
      .map((x) => x.r)
  }, [data, personalized, prefs.interests])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setParams(input.trim() ? { q: input.trim() } : {})
  }

  function onSave() {
    setSaved(saveSearch(q, { category, reliability, maxMinutes: maxMinutes || undefined }, data?.total ?? 0))
  }

  return (
    <>
      <Seo title={q ? `Suche: ${q}` : 'Suche'} description="Durchsuche alle GTA-6-News, Kommentare und das Lore-Wiki." path="/suche" />
      <header className="page-head">
        <h1 className="page-head__title">🔎 Suche &amp; Discovery</h1>
        <p className="page-head__desc">
          Operatoren: <code>"exakte phrase"</code>, <code>-ausschluss</code>, <code>a OR b</code>. Synonyme &amp;
          Tippfehler werden automatisch berücksichtigt.
        </p>
      </header>

      <form className="searchpage__form" onSubmit={submit}>
        <input
          type="search"
          className="chat__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='z. B. trailer "vice city" -leak'
          aria-label="Suchbegriff"
        />
        <button type="submit" className="btn">Suchen</button>
        {q && (
          <button type="button" className="btn btn--ghost" onClick={onSave}>
            ☆ Suche speichern
          </button>
        )}
      </form>

      <div className="searchpage__layout">
        <aside className="searchpage__filters">
          <div className="facet">
            <h3 className="facet__title">Kategorie</h3>
            <div className="facet__chips">
              <button type="button" className={`chip${!category ? ' chip--active' : ''}`} onClick={() => setCategory('')}>Alle</button>
              {categoryList.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip${category === c.id ? ' chip--active' : ''}`}
                  onClick={() => setCategory(category === c.id ? '' : c.id)}
                >
                  {c.label}
                  {data?.facets.categories.find((f) => f.value === c.id) && (
                    <span className="chip__count">{data.facets.categories.find((f) => f.value === c.id)?.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="facet">
            <h3 className="facet__title">Verlässlichkeit</h3>
            <select className="facet__select" value={reliability} onChange={(e) => setReliability(e.target.value)} aria-label="Verlässlichkeit">
              <option value="">Alle</option>
              <option value="confirmed">Nur bestätigt</option>
              <option value="official">Nur offiziell</option>
              <option value="rumor">Nur Gerüchte</option>
            </select>
          </div>

          <div className="facet">
            <h3 className="facet__title">Lesezeit</h3>
            <select className="facet__select" value={maxMinutes} onChange={(e) => setMaxMinutes(Number(e.target.value))} aria-label="Maximale Lesezeit">
              <option value={0}>Beliebig</option>
              <option value={2}>Kurz (≤ 2 Min)</option>
              <option value={5}>Mittel (≤ 5 Min)</option>
              <option value={20}>Lang (≤ 20 Min)</option>
            </select>
          </div>

          {prefs.interests.length > 0 && (
            <label className="facet__toggle">
              <input type="checkbox" checked={personalized} onChange={(e) => setPersonalized(e.target.checked)} />
              Auf meine Interessen ranken
            </label>
          )}

          {saved.length > 0 && (
            <div className="facet">
              <h3 className="facet__title">Gespeicherte Suchen</h3>
              <ul className="saved">
                {saved.map((s) => {
                  const isCurrent = s.query === q
                  const delta = isCurrent && data ? data.total - s.baselineCount : 0
                  return (
                    <li key={s.id} className="saved__item">
                      <button
                        type="button"
                        className="linkbtn"
                        onClick={() => {
                          setParams({ q: s.query })
                          if (delta > 0) setSaved(acknowledgeSaved(s.id, data?.total ?? s.baselineCount))
                        }}
                      >
                        {s.query}
                      </button>
                      {delta > 0 && <span className="saved__badge">+{delta} neu</span>}
                      <button type="button" className="saved__remove" aria-label="Entfernen" onClick={() => setSaved(removeSavedSearch(s.id))}>✕</button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {stats.length > 0 && (
            <div className="facet">
              <h3 className="facet__title">Deine häufigsten Suchen</h3>
              <div className="facet__chips">
                {stats.map((s) => (
                  <button key={s.term} type="button" className="chip" onClick={() => setParams({ q: s.term })}>
                    {s.term} <span className="chip__count">{s.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section className="searchpage__results">
          <div className="searchpage__tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'articles'} className={`tab${tab === 'articles' ? ' tab--active' : ''}`} onClick={() => setTab('articles')}>
              Artikel {data ? `(${results.length})` : ''}
            </button>
            <button type="button" role="tab" aria-selected={tab === 'comments'} className={`tab${tab === 'comments' ? ' tab--active' : ''}`} onClick={() => setTab('comments')}>
              Kommentare ({comments.length})
            </button>
            <button type="button" role="tab" aria-selected={tab === 'lore'} className={`tab${tab === 'lore' ? ' tab--active' : ''}`} onClick={() => setTab('lore')}>
              Lore-Wiki ({lore.length})
            </button>
          </div>

          {loading && <SkeletonGrid count={3} />}

          {!loading && tab === 'articles' && (
            results.length ? (
              <ul className="hitlist">
                {results.map((r) => (
                  <li key={r.id} className="hit">
                    <div className="hit__meta">
                      <span className={`card__tag tag--${r.category}`}>{categoryMap[r.category]?.label}</span>
                      {r.reliability && <span className="badge badge--muted">{RELIABILITY_LABELS[r.reliability] ?? r.reliability}</span>}
                      <span className="hit__min">⏱ {r.minutes} Min</span>
                    </div>
                    <Link to={`/news/${r.id}`} className="hit__title">{highlight(r.title, q)}</Link>
                    <p className="hit__snippet">{highlight(r.snippet, q)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty">Keine Artikel gefunden. Versuch ein anderes Stichwort oder entferne Filter.</p>
            )
          )}

          {!loading && tab === 'comments' && (
            comments.length ? (
              <ul className="hitlist">
                {comments.map((c) => (
                  <li key={c.id} className="hit">
                    <div className="hit__meta"><strong>{c.author}</strong></div>
                    <p className="hit__snippet">{highlight(c.snippet, q)}</p>
                    <Link to={`/news/${c.articleId}`} className="hit__title hit__title--small">Zum Artikel →</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty">Keine Kommentar-Treffer.</p>
            )
          )}

          {!loading && tab === 'lore' && (
            lore.length ? (
              <ul className="hitlist">
                {lore.map((l) => (
                  <li key={l.id} className="hit">
                    <div className="hit__meta"><span className="badge badge--muted">{l.type}</span></div>
                    <Link to={`/lore/${l.id}`} className="hit__title">{highlight(l.name, q)}</Link>
                    <p className="hit__snippet">{highlight(l.snippet, q)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty">Keine Wiki-Treffer.</p>
            )
          )}
        </section>
      </div>
    </>
  )
}
