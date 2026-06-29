/**
 * Notification Service
 * Handles push notifications, subscriptions, and notification preferences
 */

export interface NotificationPreference {
  userId: string
  email: boolean
  push: boolean
  inApp: boolean
  digest: 'daily' | 'weekly' | 'never'
  categories: Record<string, boolean>
  quiet: { start: number; end: number }
}

export interface PushSubscription {
  userId: string
  endpoint: string
  auth: string
  p256dh: string
  createdAt: number
  isActive: boolean
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: string
  action?: { label: string; url: string }
  read: boolean
  createdAt: number
  expiresAt?: number
}

class NotificationService {
  /**
   * Subscribe device to push notifications
   */
  async subscribeToPush(
    userId: string,
    subscription: PushSubscriptionJSON
  ): Promise<PushSubscription> {
    const pushSubscription: PushSubscription = {
      userId,
      endpoint: subscription.endpoint,
      auth: subscription.keys.auth,
      p256dh: subscription.keys.p256dh,
      createdAt: Date.now(),
      isActive: true,
    }

    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pushSubscription),
    })

    if (!response.ok) throw new Error('Failed to subscribe to push notifications')
    return response.json()
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(userId: string, endpoint: string): Promise<void> {
    const response = await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, endpoint }),
    })

    if (!response.ok) throw new Error('Failed to unsubscribe from push notifications')
  }

  /**
   * Get notification preferences for user
   */
  async getPreferences(userId: string): Promise<NotificationPreference> {
    const response = await fetch(`/api/notifications/preferences/${userId}`)
    if (!response.ok) return this.getDefaultPreferences(userId)
    return response.json()
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreference>
  ): Promise<NotificationPreference> {
    const response = await fetch(`/api/notifications/preferences/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    })

    if (!response.ok) throw new Error('Failed to update preferences')
    return response.json()
  }

  /**
   * Send notification to user
   */
  async sendNotification(userId: string, notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...notification }),
    })

    if (!response.ok) throw new Error('Failed to send notification')
    return response.json()
  }

  /**
   * Get user's notifications
   */
  async getNotifications(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number; offset?: number }
  ): Promise<Notification[]> {
    const params = new URLSearchParams()
    if (options?.unreadOnly) params.append('unread', 'true')
    if (options?.limit) params.append('limit', String(options.limit))
    if (options?.offset) params.append('offset', String(options.offset))

    const response = await fetch(`/api/notifications/${userId}?${params}`)
    if (!response.ok) return []
    return response.json()
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    })

    if (!response.ok) throw new Error('Failed to mark notification as read')
    return response.json()
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const response = await fetch(`/api/notifications/${userId}/read-all`, {
      method: 'PUT',
    })

    if (!response.ok) throw new Error('Failed to mark all as read')
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to delete notification')
  }

  /**
   * Check if user can receive notification
   */
  async canReceiveNotification(userId: string, category: string): Promise<boolean> {
    try {
      const prefs = await this.getPreferences(userId)

      if (!prefs.push && !prefs.email && !prefs.inApp) return false
      if (prefs.categories[category] === false) return false

      const now = new Date()
      const hours = now.getHours()
      if (hours >= prefs.quiet.start && hours < prefs.quiet.end) return false

      return true
    } catch {
      return false
    }
  }

  /**
   * Request permission for push notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied'
    if (Notification.permission !== 'default') return Notification.permission

    return Notification.requestPermission()
  }

  /**
   * Show browser notification
   */
  showBrowserNotification(title: string, options?: NotificationOptions): Notification | null {
    if (typeof Notification === 'undefined') return null
    if (Notification.permission !== 'granted') return null

    return new Notification(title, options)
  }

  private getDefaultPreferences(userId: string): NotificationPreference {
    return {
      userId,
      email: true,
      push: true,
      inApp: true,
      digest: 'daily',
      categories: {},
      quiet: { start: 22, end: 8 },
    }
  }
}

export const notificationService = new NotificationService()
