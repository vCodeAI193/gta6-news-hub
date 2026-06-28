/**
 * Discovery-Helfer (FEATURES-3 Kategorie 2): Tag-Beziehungen, Themen-Hubs,
 * personalisiertes Ranking, Lesezeit-Buckets, „Überrasch mich" und ein
 * deterministischer Entdeckungs-Stream. Rein funktional und getestet.
 */
import type { Article, CategoryId } from '../types'
import { readingTimeMinutes } from './readingTime'
import { hashSeed } from './coverImage'

export interface TagCount {
  tag: string
  count: number
}

/** Häufigkeit aller Tags (für die Tag-Wolke). */
export function tagCloud(articles: Article[]): TagCount[] {
  const counts = new Map<string, number>()
  for (const a of articles) for (const tag of a.tags ?? []) counts.set(tag, (counts.get(tag) || 0) + 1)
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

/**
 * Verwandte Tags zu einem gegebenen Tag (Ko-Vorkommen in denselben Artikeln).
 * Ohne `tag` wird die globale Tag-Wolke geliefert.
 */
export function relatedTags(articles: Article[], tag?: string, limit = 12): TagCount[] {
  if (!tag) return tagCloud(articles).slice(0, limit)
  const counts = new Map<string, number>()
  for (const a of articles) {
    const tags = a.tags ?? []
    if (!tags.includes(tag)) continue
    for (const other of tags) {
      if (other === tag) continue
      counts.set(other, (counts.get(other) || 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([t, count]) => ({ tag: t, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit)
}

/** Artikel eines Themen-Hubs: Tag-Treffer zuerst, sonst Titel/Excerpt-Treffer. */
export function topicArticles(tag: string, articles: Article[]): Article[] {
  const needle = tag.toLowerCase()
  const tagged = articles.filter((a) => (a.tags ?? []).some((t) => t.toLowerCase() === needle))
  if (tagged.length) return [...tagged].sort((a, b) => b.date.localeCompare(a.date))
  return articles
    .filter((a) => `${a.title} ${a.excerpt}`.toLowerCase().includes(needle))
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** Stabiles Re-Ranking: Artikel aus Interessens-Kategorien nach vorn. */
export function personalizeRank(articles: Article[], interests: CategoryId[]): Article[] {
  if (!interests.length) return articles
  const set = new Set(interests)
  return articles
    .map((a, i) => ({ a, i, boost: set.has(a.category) ? 1 : 0 }))
    .sort((x, y) => y.boost - x.boost || x.i - y.i)
    .map((x) => x.a)
}

export type ReadingBucket = 'kurz' | 'mittel' | 'lang'

/** Lesezeit-Kategorie eines Artikels. */
export function readingBucket(article: Article): ReadingBucket {
  const min = readingTimeMinutes(article.body || '')
  if (min <= 2) return 'kurz'
  if (min <= 5) return 'mittel'
  return 'lang'
}

/** „Überrasch mich": deterministische Auswahl anhand eines Seeds. */
export function pickRandom(articles: Article[], seed: string): Article | null {
  if (!articles.length) return null
  return articles[hashSeed(seed) % articles.length]
}

/**
 * Reverse-Image-/Screenshot-Ähnlichkeit (heuristisch, ohne Bild-Embeddings):
 * gleiche Kategorie + Tag-Überschneidung als Näherung für „ähnliche Bilder".
 */
export function similarImages(article: Article, all: Article[], limit = 6): Article[] {
  const tags = new Set(article.tags ?? [])
  return all
    .filter((a) => a.id !== article.id && (a.gallery?.length || a.image))
    .map((a) => {
      const overlap = (a.tags ?? []).filter((t) => tags.has(t)).length
      const sameCat = a.category === article.category ? 1 : 0
      return { a, score: overlap * 2 + sameCat }
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || y.a.date.localeCompare(x.a.date))
    .slice(0, limit)
    .map((x) => x.a)
}

/**
 * Deterministischer Entdeckungs-Stream: mischt die Artikel anhand eines Seeds
 * (stabil über Reloads) und liefert eine Seite ab `offset`.
 */
export function discoveryStream(articles: Article[], seed: string, offset = 0, size = 6): Article[] {
  const shuffled = [...articles]
    .map((a, i) => ({ a, k: hashSeed(`${seed}:${a.id}:${i}`) }))
    .sort((x, y) => x.k - y.k)
    .map((x) => x.a)
  return shuffled.slice(offset, offset + size)
}
