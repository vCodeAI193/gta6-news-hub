import { storage } from './storage'
import type { Article } from '../types'

export interface LeakEntry {
  id: string
  articleId: string
  headline: string
  source: string
  leakerId?: string
  credibilityScore: number
  status: 'unverified' | 'confirmed' | 'debunked' | 'partially_confirmed'
  addedAt: string
  updatedAt: string
  upvotes: number
  downvotes: number
  tags: string[]
}

const LEAKS_KEY = 'gta6hub_leak_radar'

export function buildLeakIndex(articles: Article[]): LeakEntry[] {
  const stored = storage.get<LeakEntry[]>(LEAKS_KEY) ?? []
  const indexed = new Set(stored.map(l => l.articleId))
  const leakArticles = articles.filter(a =>
    !indexed.has(a.id) &&
    (a.tags?.some(t => ['leak', 'rumor', 'insider'].includes(t.toLowerCase())) ||
     a.category.toLowerCase().includes('leak'))
  )
  const newEntries: LeakEntry[] = leakArticles.map(a => ({
    id: crypto.randomUUID(),
    articleId: a.id,
    headline: a.title,
    source: a.author ?? 'Unbekannt',
    credibilityScore: a.reliability === 'confirmed' ? 90 : a.reliability === 'rumor' ? 40 : 60,
    status: a.reliability === 'confirmed' ? 'confirmed' : 'unverified',
    addedAt: a.date,
    updatedAt: a.date,
    upvotes: 0,
    downvotes: 0,
    tags: a.tags ?? [],
  }))
  if (newEntries.length > 0) {
    const all = [...stored, ...newEntries]
    storage.set(LEAKS_KEY, all)
    return all
  }
  return stored
}

export function getLeaksByStatus(status?: LeakEntry['status']): LeakEntry[] {
  const all = storage.get<LeakEntry[]>(LEAKS_KEY) ?? []
  return status ? all.filter(l => l.status === status) : all
}

export function voteOnLeak(id: string, vote: 'up' | 'down'): void {
  const all = storage.get<LeakEntry[]>(LEAKS_KEY) ?? []
  const leak = all.find(l => l.id === id)
  if (!leak) return
  if (vote === 'up') leak.upvotes++
  else leak.downvotes++
  storage.set(LEAKS_KEY, all)
}

export function updateLeakStatus(id: string, status: LeakEntry['status']): void {
  const all = storage.get<LeakEntry[]>(LEAKS_KEY) ?? []
  const leak = all.find(l => l.id === id)
  if (!leak) return
  leak.status = status
  leak.updatedAt = new Date().toISOString()
  storage.set(LEAKS_KEY, all)
}
