import type { Article, CategoryId } from '../types'

export interface ArticleFilter {
  /** Free-text query matched against title, excerpt, body and source. */
  query?: string
  /** Restrict to a single category, or undefined for all. */
  category?: CategoryId | 'all'
}

/**
 * Pure, side-effect-free filtering used by the feed and covered by unit tests.
 * Results keep the input order (callers pre-sort by date).
 */
export function filterArticles(
  articles: Article[],
  { query = '', category = 'all' }: ArticleFilter,
): Article[] {
  const normalizedQuery = query.trim().toLowerCase()

  return articles.filter((article) => {
    const matchesCategory = category === 'all' || article.category === category

    if (!matchesCategory) return false
    if (!normalizedQuery) return true

    const haystack = [
      article.title,
      article.excerpt,
      article.body,
      article.source,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedQuery)
  })
}

/** Formats an ISO date string into a readable German date (e.g. "6. Mai 2026"). */
export function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
