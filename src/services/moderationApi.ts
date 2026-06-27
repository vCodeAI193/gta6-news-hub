import { api } from './api'

export interface PendingComment {
  id: string
  articleId: string
  author: string
  text: string
  status: string
  createdAt: string
}

export interface Report {
  id: string
  target_type: string
  target_id: string
  reason: string
  status: string
  created_at: string
}

export interface ModUser {
  id: string
  email: string
  display_name: string
  role: string
  banned: boolean
  created_at: string
}

export interface AuditEntry {
  id: string
  actor_name: string | null
  action: string
  target_type: string | null
  target_id: string | null
  detail: string | null
  created_at: string
}

export const moderationApi = {
  pendingComments: () => api<{ comments: PendingComment[] }>('/api/moderation/comments').then((r) => r.comments),
  approveComment: (id: string) => api(`/api/comments/${id}/approve`, { method: 'POST' }),
  rejectComment: (id: string) => api(`/api/comments/${id}/reject`, { method: 'POST' }),
  reports: () => api<{ reports: Report[] }>('/api/reports').then((r) => r.reports),
  resolveReport: (id: string) => api(`/api/reports/${id}/resolve`, { method: 'POST' }),
  users: () => api<{ users: ModUser[] }>('/api/moderation/users').then((r) => r.users),
  setBan: (id: string, banned: boolean) => api(`/api/users/${id}/ban`, { method: 'POST', body: { banned } }),
  audit: () => api<{ entries: AuditEntry[] }>('/api/moderation/audit').then((r) => r.entries),
}
