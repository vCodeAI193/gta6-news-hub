import { api, apiDownload, isApiEnabled } from './api'
import type { Article } from '../types'

export interface Dashboard {
  totals: { totalViews: number; totalComments: number; totalUsers: number }
  topArticles: Array<{ id: string; title: string; views: number }>
  topSearches: Array<{ term: string; count: number }>
  zeroResults: string[]
}

export interface Revision {
  id: string
  edited_by: string | null
  edited_at: string
}

export interface AbExperiment {
  id: string
  description: string
  variants: Array<{ variant: string; views: number; conversions: number; rate: number }>
}
export interface Cohort {
  week: string
  total: number
  activated: number
  retention: number
}
export interface Trends {
  searchTrends: Array<{ term: string; count: number }>
  tagTrends: Array<{ tag: string; count: number }>
}

export const editorialApi = {
  dashboard: () => api<Dashboard>('/api/analytics/dashboard'),
  abResults: () => api<{ experiments: AbExperiment[] }>('/api/analytics/ab').then((r) => r.experiments),
  cohorts: () => api<{ cohorts: Cohort[] }>('/api/analytics/cohorts').then((r) => r.cohorts),
  trends: () => api<Trends>('/api/analytics/trends'),
  exportCsv: () => apiDownload('/api/analytics/export.csv', 'artikel-report.csv'),
  /** Suchbegriff fürs Analytics protokollieren (nur wenn Backend aktiv). */
  logSearch: (term: string, results: number) => {
    if (!isApiEnabled() || !term.trim()) return
    api('/api/analytics/search', { method: 'POST', body: { term, results }, auth: false }).catch(() => {})
  },
  revisions: (articleId: string) =>
    api<{ revisions: Revision[] }>(`/api/articles/${articleId}/revisions`).then((r) => r.revisions),
  restoreRevision: (articleId: string, revId: string) =>
    api<{ article: Article }>(`/api/articles/${articleId}/revisions/${revId}/restore`, { method: 'POST' }),
  reviewList: () => api<{ review: Article[] }>('/api/moderation/review').then((r) => r.review),
  publish: (id: string) => api(`/api/articles/${id}/publish`, { method: 'POST' }),
}
