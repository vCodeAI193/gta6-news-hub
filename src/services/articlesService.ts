import { articles as seedArticles } from '../data/articles'
import type { Article } from '../types'
import { createId, readJSON, writeJSON } from './storage'

/**
 * Mock-„API" für Artikel. Mischt Seed-Inhalte mit nutzergenerierten Artikeln
 * aus dem localStorage-Store (Admin-/CMS-Editor) und simuliert eine asynchrone
 * Datenquelle inkl. kleinem In-Memory-Cache. Die Signaturen sind bewusst so
 * gewählt, dass sich diese Schicht später 1:1 gegen eine echte REST/GraphQL-API
 * austauschen lässt.
 */
const STORE_KEY = 'articles:user'

let cache: { key: string; data: Article[]; at: number } | null = null
const CACHE_TTL = 30_000

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function loadUserArticles(): Article[] {
  return readJSON<Article[]>(STORE_KEY, [])
}

function saveUserArticles(list: Article[]): void {
  writeJSON(STORE_KEY, list)
  cache = null
}

/** Ist der Artikel laut Status/Plan-Datum aktuell sichtbar? */
export function isPublished(article: Article, now = new Date()): boolean {
  if (article.status === 'draft') return false
  if (article.publishAt && new Date(article.publishAt) > now) return false
  return true
}

export function sortByDateDesc(list: Article[]): Article[] {
  return [...list].sort((a, b) => b.date.localeCompare(a.date))
}

/** Alle Artikel (Seeds + User), inkl. Drafts — für den Admin-Bereich. */
export function getAllRaw(): Article[] {
  const user = loadUserArticles()
  const userIds = new Set(user.map((a) => a.id))
  // User-Artikel überschreiben Seeds mit gleicher ID (Bearbeitung).
  const merged = [...user, ...seedArticles.filter((a) => !userIds.has(a.id))]
  return sortByDateDesc(merged)
}

/** Veröffentlichte Artikel — der normale Feed. Async + gecacht. */
export async function getPublished(): Promise<Article[]> {
  const now = Date.now()
  if (cache && cache.key === 'published' && now - cache.at < CACHE_TTL) {
    return delay(cache.data, 0)
  }
  const data = getAllRaw().filter((a) => isPublished(a))
  cache = { key: 'published', data, at: now }
  return delay(data)
}

export async function getById(id: string): Promise<Article | undefined> {
  return delay(getAllRaw().find((a) => a.id === id))
}

/** Verwandte Artikel über gemeinsame Kategorie/Tags (einfacher Score). */
export function getRelated(article: Article, all: Article[], limit = 3): Article[] {
  const tags = new Set(article.tags ?? [])
  return all
    .filter((a) => a.id !== article.id && isPublished(a))
    .map((a) => {
      let score = a.category === article.category ? 2 : 0
      score += (a.tags ?? []).filter((t) => tags.has(t)).length
      return { a, score }
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || y.a.date.localeCompare(x.a.date))
    .slice(0, limit)
    .map((x) => x.a)
}

export interface ArticleInput {
  id?: string
  title: string
  excerpt: string
  body: string
  category: Article['category']
  date: string
  source: string
  sourceUrl?: string
  image: string
  tags?: string[]
  author?: string
  coAuthors?: string[]
  reliability?: Article['reliability']
  status?: Article['status']
  publishAt?: string
}

/** Anlegen/Bearbeiten eines Artikels im User-Store (CMS-Funktion). */
export function upsertArticle(input: ArticleInput): Article {
  const list = loadUserArticles()
  const id = input.id ?? createId('article')
  const article: Article = {
    ...input,
    id,
    status: input.status ?? 'published',
    userCreated: true,
  }
  const idx = list.findIndex((a) => a.id === id)
  if (idx >= 0) list[idx] = article
  else list.unshift(article)
  saveUserArticles(list)
  return article
}

export function deleteArticle(id: string): void {
  saveUserArticles(loadUserArticles().filter((a) => a.id !== id))
}

/** Setzt den User-Store zurück (nur Seeds). */
export function resetUserArticles(): void {
  saveUserArticles([])
}
