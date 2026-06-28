import { Seo } from '../components/Seo'

export function PresseKitPage() {
  return (
    <>
      <Seo title="Pressekit" description="Presse-Assets und Informationen zu GTA 6 News Hub." path="/presse" />
      <header className="page-head">
        <h1 className="page-head__title">📰 Pressekit</h1>
        <p className="page-head__desc">Assets und Informationen für Medien und Kooperationspartner.</p>
      </header>

      <div className="grid">
        <div className="card">
          <div className="card__body">
            <h3 className="card__title">Über GTA 6 News Hub</h3>
            <p>
              GTA 6 News Hub ist die führende deutschsprachige Fan-Plattform rund um Grand Theft Auto VI.
              Wir aggregieren offizielle Ankündigungen, Trailer-Analysen, bestätigte Leaks und
              Community-Diskussionen an einem Ort.
            </p>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>Gegründet: 2024</li>
              <li>Sprache: Deutsch (DE/EN)</li>
              <li>Technologie: React 18, TypeScript, Vite 5</li>
              <li>Kein Rockstar Games-Affiliate — unabhängiges Fan-Projekt</li>
            </ul>
          </div>
        </div>

        <div className="card">
          <div className="card__body">
            <h3 className="card__title">Logo & Assets</h3>
            <p>Farben des Brandings:</p>
            <div style={{ display: 'flex', gap: '0.75rem', margin: '0.5rem 0' }}>
              {[['#e94560', 'Primär'], ['#1a1a2e', 'Hintergrund'], ['#16213e', 'Oberfläche'], ['#0f3460', 'Akzent']].map(([color, name]) => (
                <div key={color} style={{ textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, background: color, borderRadius: 8, border: '1px solid #444' }} />
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{name}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{color}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Logo-Dateien auf Anfrage verfügbar. Kontakt: presse@gta6newshub.de
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card__body">
            <h3 className="card__title">Kontakt</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>📧 Redaktion: redaktion@gta6newshub.de</li>
              <li>📧 Presse: presse@gta6newshub.de</li>
              <li>📧 Kooperationen: partner@gta6newshub.de</li>
              <li>📧 Technisch: tech@gta6newshub.de</li>
            </ul>
          </div>
        </div>

        <div className="card">
          <div className="card__body">
            <h3 className="card__title">RSS & Feeds</h3>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li><a href="/feed.xml">RSS-Feed (Atom)</a></li>
              <li><a href="/feed.json">JSON Feed</a></li>
              <li><a href="/sitemap.xml">Sitemap XML</a></li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
