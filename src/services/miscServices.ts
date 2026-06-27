import { createId, readJSON, writeJSON } from './storage'

/* ----------------------------- Newsletter ------------------------------ */
const NEWSLETTER_KEY = 'newsletter'

export function subscribeNewsletter(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return false
  const list = readJSON<string[]>(NEWSLETTER_KEY, [])
  if (!list.includes(normalized)) writeJSON(NEWSLETTER_KEY, [...list, normalized])
  return true
}

export function isNewsletterSubscribed(email: string): boolean {
  return readJSON<string[]>(NEWSLETTER_KEY, []).includes(email.trim().toLowerCase())
}

/* ------------------------------- Reports ------------------------------- */
export interface Report {
  id: string
  articleId: string
  reason: string
  createdAt: string
}
const REPORTS_KEY = 'reports'

export function reportArticle(articleId: string, reason: string): Report {
  const report: Report = {
    id: createId('r'),
    articleId,
    reason: reason.trim(),
    createdAt: new Date().toISOString(),
  }
  writeJSON(REPORTS_KEY, [...readJSON<Report[]>(REPORTS_KEY, []), report])
  return report
}

/* --------------------------- Such-Historie ----------------------------- */
const HISTORY_KEY = 'searchHistory'
const HISTORY_MAX = 8

export function getSearchHistory(): string[] {
  return readJSON<string[]>(HISTORY_KEY, [])
}

export function pushSearchHistory(term: string): string[] {
  const t = term.trim()
  if (!t) return getSearchHistory()
  const next = [t, ...getSearchHistory().filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(
    0,
    HISTORY_MAX,
  )
  writeJSON(HISTORY_KEY, next)
  return next
}

export function clearSearchHistory(): void {
  writeJSON(HISTORY_KEY, [])
}
