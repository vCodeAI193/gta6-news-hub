import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { Countdown } from '../components/Countdown'
import { FeaturedCarousel } from '../components/FeaturedCarousel'
import { FilterBar } from '../components/FilterBar'
import { ArticleGrid } from '../components/ArticleGrid'
import { SkeletonGrid } from '../components/Skeleton'
import { Newsletter } from '../components/Newsletter'
import { Poll } from '../components/Poll'
import { useArticles } from '../hooks/useArticles'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useDebounce } from '../hooks/useDebounce'
import { editorialApi } from '../services/editorialApi'
import { usePreferences } from '../context/PreferencesContext'
import { useRealtime } from '../context/RealtimeContext'
import { useI18n } from '../i18n/I18nContext'
import { fallbackSuggestions, filterArticles, type SortKey } from '../lib/filterArticles'
import { polls } from '../services/pollsService'
import type { CategoryId } from '../types'

export function HomePage() {
  const { t } = useI18n()
  const { prefs } = usePreferences()
  const { articles, loading, reload } = useArticles()
  const { subscribe } = useRealtime()
  const [params, setParams] = useSearchParams()
  const [hasNew, setHasNew] = useState(false)

  // Live: neue/aktualisierte Artikel signalisieren (ohne Auto-Reload zu erzwingen).
  useEffect(() => subscribe('article', () => setHasNew(true)), [subscribe])

  // Such-Analytics: abgeschlossene Suchbegriffe (debounced) protokollieren.
  const debouncedQuery = useDebounce(params.get('q') ?? '', 900)
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      const count = filterArticles(articles, { query: debouncedQuery }).length
      editorialApi.logSearch(debouncedQuery, count)
    }
  }, [debouncedQuery, articles])

  const query = params.get('q') ?? ''
  const tag = params.get('tag') ?? undefined
  const cats = (params.get('cat') ?? '').split(',').filter(Boolean) as CategoryId[]
  const sort = (params.get('sort') as SortKey) ?? 'date'
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''

  const filtered = useMemo(
    () =>
      filterArticles(articles, {
        query,
        categories: cats,
        tag,
        from: from || undefined,
        to: to || undefined,
        sort,
      }),
    [articles, query, cats, tag, from, to, sort],
  )

  // Personalisierung: ohne aktive Filter Interessen nach vorne gewichten.
  const results = useMemo(() => {
    const noFilters = !query && cats.length === 0 && !tag && sort === 'date'
    if (!noFilters || prefs.interests.length === 0) return filtered
    return [...filtered].sort((a, b) => {
      const ai = prefs.interests.includes(a.category) ? 0 : 1
      const bi = prefs.interests.includes(b.category) ? 0 : 1
      return ai - bi || b.date.localeCompare(a.date)
    })
  }, [filtered, query, cats, tag, sort, prefs.interests])

  const { visible, sentinelRef, hasMore, loadMore } = useInfiniteScroll(results.length)

  const hasActiveFilter = Boolean(query || cats.length || tag || from || to)
  const featured = articles.filter((a) => a.featured)

  const update = (patch: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      if (value) sp.set(key, value)
      else sp.delete(key)
    }
    setParams(sp, { replace: true })
  }

  const toggleCategory = (cat: CategoryId) => {
    const next = cats.includes(cat) ? cats.filter((c) => c !== cat) : [...cats, cat]
    update({ cat: next.join(',') || undefined })
  }

  return (
    <>
      <Seo path="/" />

      <section className="hero">
        <p className="hero__kicker">Release · 19. November 2026</p>
        <h1 className="hero__title">
          Alles zu <span>Grand Theft Auto VI</span>
        </h1>
        <p className="hero__lead">
          Offizielle News, Trailer, Leaks und Release-Infos rund um GTA 6 — gebündelt an
          einem Ort, sortiert nach Aktualität.
        </p>
        <Countdown />
      </section>

      {!hasActiveFilter && featured.length > 0 && <FeaturedCarousel articles={featured} />}

      <FilterBar
        selected={cats}
        onToggleCategory={toggleCategory}
        onClearCategories={() => update({ cat: undefined })}
        sort={sort}
        onSortChange={(s) => update({ sort: s === 'date' ? undefined : s })}
        from={from}
        to={to}
        onDateChange={({ from: f, to: tt }) => update({ from: f || undefined, to: tt || undefined })}
        activeTag={tag}
        onClearTag={() => update({ tag: undefined })}
      />

      {hasNew && (
        <button
          type="button"
          className="newpill"
          onClick={() => {
            reload()
            setHasNew(false)
          }}
        >
          ↻ Neue News verfügbar — aktualisieren
        </button>
      )}

      <section className="feed" aria-live="polite">
        <div className="feed__meta">
          <h2 className="feed__title">{t('feed.title')}</h2>
          <span className="feed__count">
            {loading ? t('feed.loading') : `${results.length} Artikel`}
          </span>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : results.length === 0 ? (
          <div className="empty">
            <p className="empty__title">{t('feed.empty.title')}</p>
            <p>{t('feed.empty.text')}</p>
            <p className="empty__suggest-label">{t('feed.suggestions')}</p>
            <ul className="empty__suggestions">
              {fallbackSuggestions(articles, { category: cats[0] ?? 'all' }).map((a) => (
                <li key={a.id}>
                  <Link to={`/news/${a.id}`}>{a.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <ArticleGrid articles={results.slice(0, visible)} query={query} />
            {hasMore && (
              <div ref={sentinelRef} className="feed__more">
                <button type="button" className="btn btn--ghost" onClick={loadMore}>
                  {t('feed.loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Newsletter />

      <section className="polls">
        <h2 className="section-title">Community-Umfragen</h2>
        <div className="polls__grid">
          {polls.map((poll) => (
            <Poll key={poll.id} poll={poll} />
          ))}
        </div>
      </section>
    </>
  )
}
