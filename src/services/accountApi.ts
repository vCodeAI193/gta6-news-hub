import { api, apiDownload } from './api'
import type { AuthUser } from '../context/AuthContext'

export const accountApi = {
  updateProfile: (patch: { displayName?: string; email?: string }) =>
    api<{ user: AuthUser }>('/api/auth/me', { method: 'PATCH', body: patch }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api('/api/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } }),
  deleteAccount: () => api('/api/auth/me', { method: 'DELETE' }),
  exportData: () => apiDownload('/api/auth/export', 'gta6hub-meine-daten.json'),
  getSync: () => api<{ data: Record<string, unknown>; updatedAt: string | null }>('/api/me/sync'),
  putSync: (data: Record<string, unknown>) => api('/api/me/sync', { method: 'PUT', body: { data } }),
}
