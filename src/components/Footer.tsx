import { Link } from 'react-router-dom'
import { categories } from '../data/categories'
import { useFlags } from '../context/FlagsContext'

export function Footer() {
  const flags = useFlags()
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <div className="brand brand--footer">
            <span className="brand__badge" aria-hidden="true">
              VI
            </span>
            <strong>GTA 6 News Hub</strong>
          </div>
          <p className="site-footer__tagline">
            Fan-Projekt — nicht mit Rockstar Games oder Take-Two affiliiert.
          </p>
        </div>

        <nav aria-label="Kategorien">
          <h4 className="site-footer__h">Kategorien</h4>
          <ul>
            {categories.map((c) => (
              <li key={c.id}>
                <Link to={`/kategorie/${c.slug}`}>{c.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Hub">
          <h4 className="site-footer__h">Hub</h4>
          <ul>
            <li><Link to="/bookmarks">Lesezeichen</Link></li>
            {flags.community && <li><Link to="/rangliste">Rangliste</Link></li>}
            {flags.community && <li><Link to="/tippspiel">Tippspiel</Link></li>}
            {flags.community && <li><Link to="/einreichen">News einreichen</Link></li>}
            <li><Link to="/settings">Einstellungen</Link></li>
            <li><Link to="/admin">Redaktion</Link></li>
            <li><Link to="/status">Status</Link></li>
            <li><a href="/feed.xml">RSS-Feed</a></li>
          </ul>
        </nav>

        {flags.media && (
          <nav aria-label="Entdecken">
            <h4 className="site-footer__h">Entdecken</h4>
            <ul>
              <li><Link to="/timeline">Timeline</Link></li>
              <li><Link to="/karte">Vice-City-Karte</Link></li>
              <li><Link to="/galerie">Galerie</Link></li>
              <li><Link to="/lore">Lore-Wiki</Link></li>
            </ul>
          </nav>
        )}

        <nav aria-label="Rechtliches">
          <h4 className="site-footer__h">Rechtliches</h4>
          <ul>
            <li><Link to="/about">Über uns</Link></li>
            <li><Link to="/api-docs">API-Doku</Link></li>
            <li><Link to="/datenschutz">Datenschutz</Link></li>
            <li><Link to="/impressum">Impressum</Link></li>
          </ul>
        </nav>
      </div>
      <div className="container site-footer__bottom">
        <span>© {new Date().getFullYear()} GTA 6 News Hub</span>
        <span>Release: 19. November 2026</span>
      </div>
    </footer>
  )
}
