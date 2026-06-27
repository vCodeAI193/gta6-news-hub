import Fuse, { type IFuseOptions } from 'fuse.js'
import type { Article, CategoryId } from '../types'

export type SortKey = 'date' | 'relevance' | 'source'

export interface ArticleFilter {
  /** Freitext-Suche (Fuzzy, wenn gesetzt). */
  query?: string
  /** Eine Kategorie, mehrere Kategorien oder alle. */
  category?: CategoryId | 'all'
  categories?: CategoryId[]
  /** Tag-Filter (UND-Verknüpfung mit der restlichen Filterung). */
  tag?: string
  /** Zeitraum (ISO-Datum, inklusive). */
  from?: string
  to?: string
  /** Sortierung (Default: date). */
  sort?: SortKey
}

const fuseOptions: IFuseOptions<Article> = {
  includeScore: true,
  threshold: 0.4,
  ignoreLocation: true,
  keys: [
    { name: 'title', weight: 3 },
    { name: 'excerpt', weight: 2 },
    { name: 'tags', weight: 2 },
    { name: 'body', weight: 1 },
    { name: 'source', weight: 1 },
    { name: 'author', weight: 1 },
  ],
}

function matchesCategory(article: Article, filter: ArticleFilter): boolean {
  if (filter.categories && filter.categories.length > 0) {
    return filter.categories.includes(article.category)
  }
  if (!filter.category || filter.category === 'all') return true
  return article.category === filter.category
}

function withinDateRange(article: Article, filter: ArticleFilter): boolean {
  if (filter.from && article.date < filter.from) return false
  if (filter.to && article.date > filter.to) return false
  return true
}

function matchesTag(article: Article, filter: ArticleFilter): boolean {
  if (!filter.tag) return true
  return (article.tags ?? []).includes(filter.tag)
}

function sortArticles(list: Article[], sort: SortKey): Article[] {
  if (sort === 'relevance') return list // bereits durch Fuse sortiert
  if (sort === 'source') return [...list].sort((a, b) => a.source.localeCompare(b.source))
  return [...list].sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * Reine, seiteneffektfreie Filterung + Fuzzy-Suche. Vom Feed genutzt und durch
 * Unit-Tests abgedeckt.
 */
export function filterArticles(articles: Article[], filter: ArticleFilter = {}): Article[] {
  const query = (filter.query ?? '').trim()

  // Vorfilter (Kategorie, Tag, Datum) — unabhängig von der Suche.
  const prefiltered = articles.filter(
    (a) => matchesCategory(a, filter) && matchesTag(a, filter) && withinDateRange(a, filter),
  )

  let result = prefiltered
  if (query) {
    const fuse = new Fuse(prefiltered, fuseOptions)
    result = fuse.search(query).map((r) => r.item)
  }

  const sort = filter.sort ?? (query ? 'relevance' : 'date')
  return sortArticles(result, sort)
}

/** Vorschläge bei 0 Treffern: neueste Artikel der gleichen Kategorie/alle. */
export function fallbackSuggestions(
  articles: Article[],
  filter: ArticleFilter,
  limit = 3,
): Article[] {
  const base = filter.category && filter.category !== 'all'
    ? articles.filter((a) => a.category === filter.category)
    : articles
  return [...base].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit)
}

/** Autocomplete-Vorschläge aus Titeln und Tags. */
export function searchSuggestions(articles: Article[], query: string, limit = 6): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const pool = new Set<string>()
  for (const a of articles) {
    if (a.title.toLowerCase().includes(q)) pool.add(a.title)
    for (const tag of a.tags ?? []) if (tag.toLowerCase().includes(q)) pool.add(tag)
  }
  return [...pool].slice(0, limit)
}

/** Formatiert ein ISO-Datum als lesbares deutsches Datum (z. B. "6. Mai 2026"). */
export function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/** Relatives Datum ("vor 3 Tagen") für Kommentare etc. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime()
  const diffSec = Math.round((now.getTime() - then) / 1000)
  const ranges: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [604800, 'day'],
    [2629800, 'week'],
    [31557600, 'month'],
    [Infinity, 'year'],
  ]
  const divisors = [1, 60, 3600, 86400, 604800, 2629800, 31557600]
  const rtf = new Intl.RelativeTimeFormat('de-DE', { numeric: 'auto' })
  for (let i = 0; i < ranges.length; i++) {
    if (Math.abs(diffSec) < ranges[i][0]) {
      return rtf.format(-Math.round(diffSec / divisors[i]), ranges[i][1])
    }
  }
  return formatDate(iso.slice(0, 10))
}
