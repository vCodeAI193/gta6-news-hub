import { useMemo, useState } from 'react'
import { Seo } from '../components/Seo'
import { getEventLog, getTopEvents, getNpsAverage, submitNps, getLastUtm } from '../lib/analytics'
import { useArticles } from '../hooks/useArticles'
import { auditArticles } from '../lib/seo'

export function AnalyticsDashboardPage() {
  const { articles } = useArticles()
  const events = getEventLog(50)
  const topEvents = getTopEvents(8)
  const npsAvg = getNpsAverage()
  const utm = getLastUtm()
  const [npsScore, setNpsScore] = useState<number | null>(null)
  const [npsComment, setNpsComment] = useState('')
  const [npsSubmitted, setNpsSubmitted] = useState(false)
  const [tab, setTab] = useState<'events' | 'seo' | 'nps'>('events')

  const seoIssues = useMemo(() => auditArticles(articles), [articles])

  function handleNpsSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (npsScore === null) return
    submitNps(npsScore, npsComment || undefined)
    setNpsSubmitted(true)
  }

  return (
    <>
      <Seo title="Analytics-Dashboard" description="Interne Nutzungsstatistiken." path="/analytics" />
      <header className="page-head">
        <h1 className="page-head__title">📊 Analytics-Dashboard</h1>
        <p className="page-head__desc">Lokale Nutzungsstatistiken (keine externen Dienste ohne Einwilligung).</p>
      </header>

      {Object.keys(utm).length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card__body">
            <h3 className="card__title">Letzter UTM-Kampagnen-Besuch</h3>
            {Object.entries(utm).map(([k, v]) => (
              <div key={k}><strong>{k}:</strong> {v}</div>
            ))}
          </div>
        </div>
      )}

      <div className="searchpage__tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'events'} className={`tab${tab === 'events' ? ' tab--active' : ''}`} onClick={() => setTab('events')}>Events</button>
        <button role="tab" aria-selected={tab === 'seo'} className={`tab${tab === 'seo' ? ' tab--active' : ''}`} onClick={() => setTab('seo')}>SEO-Audit</button>
        <button role="tab" aria-selected={tab === 'nps'} className={`tab${tab === 'nps' ? ' tab--active' : ''}`} onClick={() => setTab('nps')}>NPS-Umfrage</button>
      </div>

      {tab === 'events' && (
        <>
          <h3>Top Events</h3>
          <ul className="hitlist">
            {topEvents.map(e => (
              <li key={e.name} className="hit">
                <div className="hit__meta"><span className="hit__min">{e.count}×</span></div>
                <strong className="hit__title">{e.name}</strong>
              </li>
            ))}
          </ul>
          <h3>Letzte 50 Events</h3>
          <ul className="hitlist">
            {[...events].reverse().map((e, i) => (
              <li key={i} className="hit">
                <div className="hit__meta">
                  <span className="hit__min">{new Date(e.timestamp).toLocaleTimeString('de-DE')}</span>
                  <span className="badge badge--muted">{e.path}</span>
                </div>
                <strong className="hit__title">{e.name}</strong>
                {e.props && <p className="hit__snippet">{JSON.stringify(e.props)}</p>}
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === 'seo' && (
        <>
          <h3>SEO-Probleme ({seoIssues.length} Artikel betroffen)</h3>
          {seoIssues.length === 0 ? (
            <p className="empty">Keine SEO-Probleme gefunden.</p>
          ) : (
            <ul className="hitlist">
              {seoIssues.map(issue => (
                <li key={issue.articleId} className="hit">
                  <strong className="hit__title">{issue.title}</strong>
                  <ul style={{ paddingLeft: '1.25rem', margin: '0.25rem 0', fontSize: '0.875rem' }}>
                    {issue.issues.map((iss, i) => <li key={i} style={{ color: 'var(--error,#e94560)' }}>{iss}</li>)}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === 'nps' && (
        <div className="card" style={{ maxWidth: 480 }}>
          <div className="card__body">
            <h3 className="card__title">Net Promoter Score</h3>
            {npsAvg !== null && (
              <p>Aktueller Durchschnitt: <strong>{npsAvg.toFixed(1)}/10</strong></p>
            )}
            {npsSubmitted ? (
              <p className="empty">Danke für dein Feedback!</p>
            ) : (
              <form onSubmit={handleNpsSubmit}>
                <p>Wie wahrscheinlich würdest du GTA 6 News Hub weiterempfehlen? (0–10)</p>
                <div className="facet__chips" style={{ marginBottom: '1rem' }}>
                  {Array.from({ length: 11 }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`chip${npsScore === i ? ' chip--active' : ''}`}
                      onClick={() => setNpsScore(i)}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <textarea
                  className="chat__input"
                  placeholder="Optionaler Kommentar..."
                  value={npsComment}
                  onChange={e => setNpsComment(e.target.value)}
                  rows={3}
                  style={{ display: 'block', width: '100%', marginBottom: '0.75rem' }}
                />
                <button type="submit" className="btn" disabled={npsScore === null}>Absenden</button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
