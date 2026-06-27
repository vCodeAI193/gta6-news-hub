import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { categories } from '../data/categories'
import { useArticles } from '../hooks/useArticles'
import { useDebounce } from '../hooks/useDebounce'
import { useI18n } from '../i18n/I18nContext'
import { searchSuggestions } from '../lib/filterArticles'
import { pushSearchHistory } from '../services/miscServices'
import { SearchBar } from './SearchBar'
import { ThemeToggle } from './ThemeToggle'
import { NotificationCenter } from './NotificationCenter'
import { AuthMenu } from './AuthMenu'
import { useAuth } from '../context/AuthContext'

export function Header() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const { articles } = useArticles()
  const { hasRole } = useAuth()

  const [q, setQ] = useState(params.get('q') ?? '')
  const [menuOpen, setMenuOpen] = useState(false)
  const debounced = useDebounce(q, 200)

  // URL <- Eingabe (live nur auf der Startseite, sonst per Submit).
  useEffect(() => {
    if (location.pathname !== '/') return
    const sp = new URLSearchParams(window.location.search)
    if ((sp.get('q') ?? '') === debounced) return
    if (debounced) sp.set('q', debounced)
    else sp.delete('q')
    navigate({ pathname: '/', search: sp.toString() }, { replace: true })
  }, [debounced, location.pathname, navigate])

  // Eingabe <- URL (z. B. Browser-Navigation).
  useEffect(() => {
    setQ(params.get('q') ?? '')
  }, [params])

  const suggestions = useMemo(() => searchSuggestions(articles, q), [articles, q])

  const submit = (value: string) => {
    if (value.trim()) pushSearchHistory(value)
    navigate(`/?q=${encodeURIComponent(value)}`)
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <NavLink to="/" className="brand" onClick={closeMenu}>
          <span className="brand__badge" aria-hidden="true">
            VI
          </span>
          <span className="brand__name">
            GTA 6 News Hub
            <span className="brand__sub">Dein Vice-City-Briefing</span>
          </span>
        </NavLink>

        <button
          type="button"
          className="burger icon-btn"
          aria-label="Menü"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          ☰
        </button>

        <nav className={`mainnav${menuOpen ? ' mainnav--open' : ''}`} aria-label="Hauptnavigation">
          <NavLink to="/" end className="mainnav__link" onClick={closeMenu}>
            {t('nav.home')}
          </NavLink>
          {categories.map((c) => (
            <NavLink key={c.id} to={`/kategorie/${c.slug}`} className="mainnav__link" onClick={closeMenu}>
              {c.label}
            </NavLink>
          ))}
          <NavLink to="/bookmarks" className="mainnav__link" onClick={closeMenu}>
            {t('nav.bookmarks')}
          </NavLink>
          <NavLink to="/admin" className="mainnav__link" onClick={closeMenu}>
            {t('nav.admin')}
          </NavLink>
          {hasRole('moderator') && (
            <NavLink to="/moderation" className="mainnav__link" onClick={closeMenu}>
              🛡️ Moderation
            </NavLink>
          )}
        </nav>

        <div className="site-header__search">
          <SearchBar value={q} onChange={setQ} suggestions={suggestions} onSubmit={submit} />
        </div>

        <div className="site-header__tools">
          <AuthMenu />
          <NotificationCenter />
          <ThemeToggle />
          <NavLink to="/settings" className="icon-btn" aria-label={t('nav.settings')} title={t('nav.settings')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H8a1.65 1.65 0 0 0 1-1.51V2a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V8a1.65 1.65 0 0 0 1.51 1H22a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </NavLink>
        </div>
      </div>
    </header>
  )
}
