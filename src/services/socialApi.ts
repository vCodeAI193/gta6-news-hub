import { api } from './api'

export interface FollowStatus {
  followers: number
  following: number
  isFollowing: boolean
}

export interface FeedItem {
  id: string
  articleId: string
  authorId: string
  author: string
  text: string
  createdAt: string
}

export interface PredictionQuestion {
  id: string
  question: string
  options: string[]
  counts: Record<string, number>
  mine: string | null
}

export const socialApi = {
  followStatus: (id: string) => api<FollowStatus>(`/api/users/${id}/follow-status`, { auth: true }),
  follow: (id: string) => api<{ following: boolean }>(`/api/users/${id}/follow`, { method: 'POST' }),
  unfollow: (id: string) => api<{ following: boolean }>(`/api/users/${id}/follow`, { method: 'DELETE' }),
  feed: () => api<{ feed: FeedItem[] }>('/api/me/feed').then((r) => r.feed),
  predictions: () => api<{ questions: PredictionQuestion[] }>('/api/predictions', { auth: true }).then((r) => r.questions),
  predict: (qid: string, choice: string) => api(`/api/predictions/${qid}`, { method: 'POST', body: { choice } }),
}
