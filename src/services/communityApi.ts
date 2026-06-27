import { api } from './api'
import type { Article } from '../types'

export interface Badge {
  id: string
  emoji: string
  label: string
}

export interface Profile {
  id: string
  displayName: string
  role: string
  reputation: number
  joinedAt: string
  level: number
  name: string
  next: { name: string; at: number; remaining: number } | null
  badges: Badge[]
  stats: { commentCount: number; submissionsApproved: number }
  recentComments: Array<{ id: string; articleId: string; text: string; createdAt: string }>
}

export interface Leader {
  rank: number
  id: string
  displayName: string
  role: string
  reputation: number
  level: string
}

export interface SubmissionInput {
  title: string
  source: string
  category: string
  excerpt?: string
  body?: string
  sourceUrl?: string
  tags?: string[]
}

export const communityApi = {
  profile: (id: string) => api<{ profile: Profile }>(`/api/users/${id}/profile`).then((r) => r.profile),
  leaderboard: () => api<{ leaders: Leader[] }>('/api/leaderboard').then((r) => r.leaders),
  submit: (input: SubmissionInput) => api<{ ok: true; id: string }>('/api/submissions', { method: 'POST', body: input }),
  submissions: () => api<{ submissions: Article[] }>('/api/moderation/submissions').then((r) => r.submissions),
  approveSubmission: (id: string) => api(`/api/submissions/${id}/approve`, { method: 'POST' }),
  rejectSubmission: (id: string) => api(`/api/submissions/${id}/reject`, { method: 'POST' }),
}
