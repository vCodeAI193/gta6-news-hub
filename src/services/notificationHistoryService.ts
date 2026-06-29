/**
 * Notification History Service
 * Manages notification archiving, retrieval, and search
 */

export interface NotificationArchiveEntry {
  id: string
  userId: string
  notificationId: string
  title: string
  message: string
  category: string
  type: 'info' | 'success' | 'warning' | 'error'
  action?: { label: string; url: string }
  read: boolean
  archived: boolean
  archivedAt: number
  createdAt: number
}

export interface NotificationStats {
  total: number
  unread: number
  byCategory: Record<string, number>
  byType: Record<string, number>
}

class NotificationHistoryService {
  /**
   * Archive notification
   */
  async archiveNotification(notificationId: string): Promise<NotificationArchiveEntry> {
    const response = await fetch(`/api/notifications/${notificationId}/archive`, {
      method: 'POST',
    })

    if (!response.ok) throw new Error('Failed to archive notification')
    return response.json()
  }

  /**
   * Get archived notifications
   */
  async getArchivedNotifications(
    userId: string,
    options?: {
      category?: string
      type?: string
      limit?: number
      offset?: number
      sort?: 'newest' | 'oldest'
    }
  ): Promise<NotificationArchiveEntry[]> {
    const params = new URLSearchParams()
    if (options?.category) params.append('category', options.category)
    if (options?.type) params.append('type', options.type)
    if (options?.limit) params.append('limit', String(options.limit))
    if (options?.offset) params.append('offset', String(options.offset))
    if (options?.sort) params.append('sort', options.sort)

    const response = await fetch(`/api/notifications/${userId}/archived?${params}`)
    if (!response.ok) return []
    return response.json()
  }

  /**
   * Search notification history
   */
  async searchNotifications(
    userId: string,
    query: string,
    options?: {
      category?: string
      fromDate?: number
      toDate?: number
      limit?: number
    }
  ): Promise<NotificationArchiveEntry[]> {
    const params = new URLSearchParams({ q: query })
    if (options?.category) params.append('category', options.category)
    if (options?.fromDate) params.append('from', String(options.fromDate))
    if (options?.toDate) params.append('to', String(options.toDate))
    if (options?.limit) params.append('limit', String(options.limit))

    const response = await fetch(`/api/notifications/${userId}/search?${params}`)
    if (!response.ok) return []
    return response.json()
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: string, dateRange?: { from: number; to: number }): Promise<NotificationStats> {
    const params = new URLSearchParams()
    if (dateRange) {
      params.append('from', String(dateRange.from))
      params.append('to', String(dateRange.to))
    }

    const response = await fetch(`/api/notifications/${userId}/stats?${params}`)
    if (!response.ok) {
      return {
        total: 0,
        unread: 0,
        byCategory: {},
        byType: {},
      }
    }
    return response.json()
  }

  /**
   * Clear old notifications
   */
  async clearOldNotifications(userId: string, olderThanDays: number = 30): Promise<number> {
    const response = await fetch(`/api/notifications/${userId}/clear-old`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: olderThanDays }),
    })

    if (!response.ok) throw new Error('Failed to clear old notifications')
    const result = await response.json()
    return result.deletedCount || 0
  }

  /**
   * Export notification history
   */
  async exportHistory(
    userId: string,
    format: 'json' | 'csv',
    options?: { category?: string; fromDate?: number; toDate?: number }
  ): Promise<Blob> {
    const params = new URLSearchParams({ format })
    if (options?.category) params.append('category', options.category)
    if (options?.fromDate) params.append('from', String(options.fromDate))
    if (options?.toDate) params.append('to', String(options.toDate))

    const response = await fetch(`/api/notifications/${userId}/export?${params}`)
    if (!response.ok) throw new Error('Failed to export history')
    return response.blob()
  }

  /**
   * Get notification trends
   */
  async getNotificationTrends(userId: string, days: number = 30): Promise<Record<string, number>> {
    const response = await fetch(`/api/notifications/${userId}/trends?days=${days}`)
    if (!response.ok) return {}
    return response.json()
  }

  /**
   * Mark old notifications as read
   */
  async markOldAsRead(userId: string, olderThanDays: number = 7): Promise<number> {
    const response = await fetch(`/api/notifications/${userId}/mark-old-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: olderThanDays }),
    })

    if (!response.ok) throw new Error('Failed to mark old as read')
    const result = await response.json()
    return result.markedCount || 0
  }

  /**
   * Get notification categories
   */
  async getCategories(userId: string): Promise<Array<{ id: string; name: string; count: number }>> {
    const response = await fetch(`/api/notifications/${userId}/categories`)
    if (!response.ok) return []
    return response.json()
  }
}

export const notificationHistoryService = new NotificationHistoryService()
