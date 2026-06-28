import { api, isApiEnabled } from './api'
import { fetchArticles } from './articlesRepo'
import { lexicalScore, makeSnippet, parseQuery, matchesQuery } from '../lib/searchQuery'
import { readingTimeMinutes } from '../lib/readingTime'
import { getRelated } from '../services/articlesService'
import { loreEntries } from '../data/lore'
import type { Article, CategoryId, Reliability } from '../types'

/**
 * Such-Client (FEATURES-3 Kategorie 2). Mit Backend laufen Volltextsuche,
 * Kommentar-Suche und „ähnliche Artikel" serverseitig (inkl. Facetten); ohne
 * Backend übernimmt die lokale Query-Engine (`lib/searchQuery`).
 */

export interface SearchHit {
  id: string
  title: string
  category: CategoryId
  reliability: Reliability | null
  date: string
  minutes: number
  snippet: string
  score: number
}
export interface FacetValue {
  value: string
  count: number
}
export interface SearchFacets {
  categories: FacetValue[]
  sources: FacetValue[]
  tags: FacetValue[]
  reliability: FacetValue[]
}
export interface SearchResponse {
  results: SearchHit[]
  total: number
  facets: SearchFacets
}
export interface SearchOptions {
  category?: string
  reliability?: string
  maxMinutes?: number
}
export interface CommentHit {
  id: string
  articleId: string
  author: string
  snippet: string
  createdAt: string
}
export interface LoreHit {
  id: string
  name: string
  type: string
  snippet: string
}

function facetsLocal(articles: Article[]): SearchFacets {
  const bump = (m: Map<string, number>, k?: string) => k && m.set(k, (m.get(k) || 0) + 1)
  const cat = new Map<string, number>()
  const src = new Map<string, number>()
  const tags = new Map<string, number>()
  const rel = new Map<string, number>()
  for (const a of articles) {
    bump(cat, a.category)
    bump(src, a.source)
    bump(rel, a.reliability)
    for (const t of a.tags ?? []) bump(tags, t)
  }
  const arr = (m: Map<string, number>, limit: number) =>
    [...m.entries()].map(([value, count]) => ({ value, count })).sort((x, y) => y.count - x.count).slice(0, limit)
  return { categories: arr(cat, 10), sources: arr(src, 10), tags: arr(tags, 20), reliability: arr(rel, 5) }
}

function searchLocal(articles: Article[], q: string, opts: SearchOptions): SearchResponse {
  const parsed = parseQuery(q)
  const hasQuery = parsed.alternatives.some((a) => a.words.length || a.phrases.length) || parsed.exclude.length > 0
  let pool = articles
  if (opts.category && opts.category !== 'all') pool = pool.filter((a) => a.category === opts.category)
  if (opts.reliability) pool = pool.filter((a) => a.reliability === opts.reliability)
  if (opts.maxMinutes) pool = pool.filter((a) => readingTimeMinutes(a.body || '') <= (opts.maxMinutes as number))
  const matched = hasQuery
    ? pool.filter((a) =>
        matchesQuery(`${a.title} ${a.excerpt} ${a.body} ${(a.tags ?? []).join(' ')} ${a.source}`, parsed),
      )
    : pool
  const results: SearchHit[] = matched
    .map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category,
      reliability: a.reliability ?? null,
      date: a.date,
      minutes: readingTimeMinutes(a.body || ''),
      snippet: makeSnippet(a.body || a.excerpt || '', q),
      score: hasQuery ? lexicalScore({ title: a.title, body: `${a.excerpt} ${a.body}`, tags: a.tags }, q) : 0,
    }))
    .sort((x, y) => y.score - x.score || y.date.localeCompare(x.date))
  return { results, total: results.length, facets: facetsLocal(matched) }
}

export const searchApi = {
  async search(q: string, opts: SearchOptions = {}): Promise<SearchResponse> {
    if (isApiEnabled()) {
      try {
        const params = new URLSearchParams()
        if (q) params.set('q', q)
        if (opts.category) params.set('category', opts.category)
        if (opts.reliability) params.set('reliability', opts.reliability)
        if (opts.maxMinutes) params.set('maxMinutes', String(opts.maxMinutes))
        return await api<SearchResponse>(`/api/search?${params.toString()}`, { auth: false })
      } catch {
        /* Fallback unten */
      }
    }
    return searchLocal(await fetchArticles(), q, opts)
  },

  async searchComments(q: string): Promise<CommentHit[]> {
    if (!q.trim() || !isApiEnabled()) return []
    try {
      const res = await api<{ results: CommentHit[] }>(
        `/api/search/comments?q=${encodeURIComponent(q)}`,
        { auth: false },
      )
      return res.results
    } catch {
      return []
    }
  },

  /** Lore-Wiki-Suche (#9) — rein lokal über die Wiki-Daten. */
  searchLore(q: string): LoreHit[] {
    if (!q.trim()) return []
    const parsed = parseQuery(q)
    return loreEntries
      .filter((e) => matchesQuery(`${e.name} ${e.summary} ${e.body} ${(e.tags ?? []).join(' ')}`, parsed))
      .map((e) => ({
        id: e.id,
        name: e.name,
        type: e.type,
        snippet: makeSnippet(e.body || e.summary, q),
      }))
  },

  async similar(id: string): Promise<Array<{ id: string; title: string; score?: number }>> {
    if (isApiEnabled()) {
      try {
        const res = await api<{ similar: Array<{ id: string; title: string; score: number }> }>(
          `/api/articles/${id}/similar`,
          { auth: false },
        )
        return res.similar
      } catch {
        /* Fallback unten */
      }
    }
    const all = await fetchArticles()
    const target = all.find((a) => a.id === id)
    if (!target) return []
    return getRelated(target, all).map((a) => ({ id: a.id, title: a.title }))
  },
}
