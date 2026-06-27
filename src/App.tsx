import { useMemo, useState } from 'react'
import { articlesByDateDesc } from './data/articles'
import { filterArticles } from './lib/filterArticles'
import { ArticleCard } from './components/ArticleCard'
import { ArticleModal } from './components/ArticleModal'
import { CategoryFilter } from './components/CategoryFilter'
import { Countdown } from './components/Countdown'
import { SearchBar } from './components/SearchBar'
import type { Article, CategoryId } from './types'

export default function App() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [selected, setSelected] = useState<Article | null>(null)

  const results = useMemo(
    () => filterArticles(articlesByDateDesc, { query, category }),
    [query, category],
  )

  return (
    <>
      <a className="skip-link" href="#main">
        Zum Inhalt springen
      </a>

      <header className="site-header">
        <div className="container site-header__inner">
          <div className="brand">
            <span className="brand__badge" aria-hidden="true">
              VI
            </span>
            <span>
              GTA 6 News Hub
              <br />
              <span className="brand__sub">Dein Vice-City-Briefing</span>
            </span>
          </div>
          <div className="site-header__search">
            <SearchBar value={query} onChange={setQuery} />
          </div>
        </div>
      </header>

      <main id="main" className="container">
        <section className="hero">
          <p className="hero__kicker">Release · 19. November 2026</p>
          <h1 className="hero__title">
            Alles zu <span>Grand Theft Auto VI</span>
          </h1>
          <p className="hero__lead">
            Offizielle News, Trailer, Leaks und Release-Infos rund um GTA 6 —
            gebündelt an einem Ort, sortiert nach Aktualität.
          </p>
          <Countdown />
        </section>

        <CategoryFilter active={category} onChange={setCategory} />

        <section className="feed" aria-live="polite">
          <div className="feed__meta">
            <h2 className="feed__title">Aktuelle News</h2>
            <span className="feed__count">
              {results.length}{' '}
              {results.length === 1 ? 'Artikel' : 'Artikel'}
            </span>
          </div>

          {results.length === 0 ? (
            <div className="empty">
              <p className="empty__title">Keine Treffer</p>
              <p>
                Für deine Suche wurden keine Artikel gefunden. Passe den
                Suchbegriff oder die Kategorie an.
              </p>
            </div>
          ) : (
            <div className="grid">
              {results.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onOpen={setSelected}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <span>
            © {new Date().getFullYear()} GTA 6 News Hub — Fan-Projekt, nicht mit
            Rockstar Games oder Take-Two affiliiert.
          </span>
          <span>Release: 19. November 2026</span>
        </div>
      </footer>

      {selected && (
        <ArticleModal article={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
