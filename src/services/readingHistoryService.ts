import { readJSON, writeJSON } from './storage'

export interface HistoryEntry {
  articleId: string
  readAt: number
  progress: number
}

const HISTORY_KEY = 'readingHistory'
const POSITION_KEY = 'readingPositions'

export function getHistory(): HistoryEntry[] {
  return readJSON<HistoryEntry[]>(HISTORY_KEY, [])
}

export function recordRead(articleId: string, progress = 100): void {
  const history = getHistory().filter((e) => e.articleId !== articleId)
  history.unshift({ articleId, readAt: Date.now(), progress })
  // Keep last 500 entries
  writeJSON(HISTORY_KEY, history.slice(0, 500))
}

export function clearHistory(): void {
  writeJSON(HISTORY_KEY, [])
}

export function getLastPosition(articleId: string): number {
  const positions = readJSON<Record<string, number>>(POSITION_KEY, {})
  return positions[articleId] ?? 0
}

export function savePosition(articleId: string, progress: number): void {
  const positions = readJSON<Record<string, number>>(POSITION_KEY, {})
  positions[articleId] = progress
  writeJSON(POSITION_KEY, positions)
}
