import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isApiEnabled } from '../services/api'
import {
  editorialApi,
  type AbExperiment,
  type Cohort,
  type Dashboard,
  type Trends,
} from '../services/editorialApi'

export function DashboardPage() {
  const { user, loading, hasRole } = useAuth()
  const { notify } = useToast()
  const [data, setData] = useState<Dashboard | null>(null)
  const [ab, setAb] = useState<AbExperiment[]>([])
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [trends, setTrends] = useState<Trends | null>(null)

  useEffect(() => {
    if (user && hasRole('author')) {
      editorialApi.dashboard().then(setData, () => notify('Dashboard nicht ladbar', 'error'))
      editorialApi.abResults().then(setAb, () => {})
      editorialApi.cohorts().then(setCohorts, () => {})
      editorialApi.trends().then(setTrends, () => {})
    }
  }, [user, hasRole, notify])

  if (loading) return null
  if (!isApiEnabled() || !user || !hasRole('author')) return <Navigate to="/" replace />

  return (
    <>
      <Seo title="Redaktions-Dashboard" path="/dashboard" />
      <header className="page-head">
        <h1 className="page-head__title">📊 Redaktions-Dashboard</h1>
        <p className="page-head__desc">Aufrufe, Top-Artikel und Such-Insights.</p>
      </header>

      {!data ? (
        <p className="comments__empty">Lade…</p>
      ) : (
        <>
          <div className="status-grid">
            <div className="status-card"><div><strong>{data.totals.totalViews}</strong><p>Aufrufe gesamt</p></div></div>
            <div className="status-card"><div><strong>{data.totals.totalComments}</strong><p>Kommentare</p></div></div>
            <div className="status-card"><div><strong>{data.totals.totalUsers}</strong><p>Mitglieder</p></div></div>
            <div className="status-card">
              <div>
                <button type="button" className="btn btn--small" onClick={() => editorialApi.exportCsv()}>
                  ⤓ CSV-Report
                </button>
              </div>
            </div>
          </div>

          <section>
            <h2 className="section-title">Top-Artikel nach Aufrufen</h2>
            {data.topArticles.length === 0 ? (
              <p className="comments__empty">Noch keine Aufrufe.</p>
            ) : (
              <ol className="leaderboard">
                {data.topArticles.map((a, i) => (
                  <li key={a.id}>
                    <span className="leaderboard__rank">#{i + 1}</span>
                    <Link to={`/news/${a.id}`} className="leaderboard__name">{a.title}</Link>
                    <span className="leaderboard__count">{a.views} Aufrufe</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="dash-cols">
            <div>
              <h2 className="section-title">Top-Suchbegriffe</h2>
              {data.topSearches.length === 0 ? (
                <p className="comments__empty">Noch keine Suchen.</p>
              ) : (
                <ul className="taglist">
                  {data.topSearches.map((s) => (
                    <li key={s.term}><span className="tag-chip">{s.term} · {s.count}</span></li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h2 className="section-title">Suchen ohne Treffer</h2>
              {data.zeroResults.length === 0 ? (
                <p className="comments__empty">Keine.</p>
              ) : (
                <ul className="taglist">
                  {data.zeroResults.map((t) => (
                    <li key={t}><span className="tag-chip">{t}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {trends && (trends.searchTrends.length > 0 || trends.tagTrends.length > 0) && (
            <section className="dash-cols">
              <div>
                <h2 className="section-title">📈 Trend-Suchen (7 Tage)</h2>
                {trends.searchTrends.length === 0 ? (
                  <p className="comments__empty">Keine.</p>
                ) : (
                  <ul className="taglist">
                    {trends.searchTrends.map((s) => (
                      <li key={s.term}><span className="tag-chip">{s.term} · {s.count}</span></li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h2 className="section-title">🏷️ Trend-Tags</h2>
                <ul className="taglist">
                  {trends.tagTrends.map((t) => (
                    <li key={t.tag}><span className="tag-chip">#{t.tag} · {t.count}</span></li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {ab.length > 0 && (
            <section>
              <h2 className="section-title">🧪 A/B-Tests</h2>
              {ab.map((exp) => (
                <div key={exp.id} className="abtest">
                  <p className="abtest__desc">{exp.description}</p>
                  <table className="admin-table">
                    <thead><tr><th>Variante</th><th>Ansichten</th><th>Conversions</th><th>Rate</th></tr></thead>
                    <tbody>
                      {exp.variants.map((v) => (
                        <tr key={v.variant}>
                          <td>{v.variant}</td><td>{v.views}</td><td>{v.conversions}</td><td><strong>{v.rate}%</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </section>
          )}

          {cohorts.length > 0 && (
            <section>
              <h2 className="section-title">👥 Kohorten (Registrierungswoche)</h2>
              <table className="admin-table">
                <thead><tr><th>Woche</th><th>Neu</th><th>Aktiviert</th><th>Retention</th></tr></thead>
                <tbody>
                  {cohorts.map((c) => (
                    <tr key={c.week}>
                      <td>{c.week}</td><td>{c.total}</td><td>{c.activated}</td><td><strong>{c.retention}%</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </>
  )
}
