import { readJSON, writeJSON, createId } from './storage'

/**
 * Gespeicherte Suchen / Such-Abos (FEATURES-3 #4) und Such-Statistik (#17),
 * lokal über localStorage. „Neue Treffer" werden gegen die aktuelle
 * Trefferzahl zum Speicherzeitpunkt ermittelt (clientseitiges Polling).
 */

const SAVED_KEY = 'search:saved'
const STATS_KEY = 'search:stats'

export interface SavedSearch {
  id: string
  query: string
  options: { category?: string; reliability?: string; maxMinutes?: number }
  /** Trefferzahl zum Zeitpunkt des Speicherns (Basis für „neue Treffer"). */
  baselineCount: number
  createdAt: string
}

export function getSavedSearches(): SavedSearch[] {
  return readJSON<SavedSearch[]>(SAVED_KEY, [])
}

export function saveSearch(query: string, options: SavedSearch['options'], baselineCount: number): SavedSearch[] {
  const q = query.trim()
  if (!q) return getSavedSearches()
  const existing = getSavedSearches().filter((s) => s.query.toLowerCase() !== q.toLowerCase())
  const entry: SavedSearch = {
    id: createId('saved'),
    query: q,
    options,
    baselineCount,
    createdAt: new Date().toISOString(),
  }
  const next = [entry, ...existing].slice(0, 20)
  writeJSON(SAVED_KEY, next)
  return next
}

export function removeSavedSearch(id: string): SavedSearch[] {
  const next = getSavedSearches().filter((s) => s.id !== id)
  writeJSON(SAVED_KEY, next)
  return next
}

/** Aktualisiert die Baseline (z. B. nachdem neue Treffer gesehen wurden). */
export function acknowledgeSaved(id: string, currentCount: number): SavedSearch[] {
  const next = getSavedSearches().map((s) => (s.id === id ? { ...s, baselineCount: currentCount } : s))
  writeJSON(SAVED_KEY, next)
  return next
}

// ------------------------------------------------------------- Such-Statistik

type Stats = Record<string, number>

/** Zählt eine ausgeführte Suche fürs „Deine häufigsten Suchen"-Panel. */
export function recordSearch(term: string): void {
  const t = term.trim().toLowerCase()
  if (!t) return
  const stats = readJSON<Stats>(STATS_KEY, {})
  stats[t] = (stats[t] || 0) + 1
  writeJSON(STATS_KEY, stats)
}

export function topSearches(limit = 6): Array<{ term: string; count: number }> {
  const stats = readJSON<Stats>(STATS_KEY, {})
  return Object.entries(stats)
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}
