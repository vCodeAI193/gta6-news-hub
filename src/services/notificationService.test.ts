import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notificationService } from './notificationService'

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('subscribeToPush', () => {
    it('should subscribe to push notifications', async () => {
      const subscription: PushSubscriptionJSON = {
        endpoint: 'https://push.example.com/notify',
        keys: {
          auth: 'auth-key',
          p256dh: 'p256dh-key',
        },
      }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userId: 'user1',
          endpoint: subscription.endpoint,
          isActive: true,
        }),
      })

      const result = await notificationService.subscribeToPush('user1', subscription)
      expect(result.endpoint).toBe(subscription.endpoint)
      expect(result.isActive).toBe(true)
    })

    it('should throw on subscription failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      await expect(
        notificationService.subscribeToPush('user1', {
          endpoint: 'https://push.example.com',
          keys: { auth: 'key', p256dh: 'key' },
        })
      ).rejects.toThrow('Failed to subscribe')
    })
  })

  describe('getPreferences', () => {
    it('should get notification preferences', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userId: 'user1',
          email: true,
          push: true,
          digest: 'daily',
        }),
      })

      const prefs = await notificationService.getPreferences('user1')
      expect(prefs.userId).toBe('user1')
      expect(prefs.email).toBe(true)
    })

    it('should return defaults if preferences not found', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const prefs = await notificationService.getPreferences('user1')
      expect(prefs.userId).toBe('user1')
      expect(prefs.digest).toBe('daily')
    })
  })

  describe('updatePreferences', () => {
    it('should update notification preferences', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userId: 'user1',
          email: false,
          push: true,
        }),
      })

      const result = await notificationService.updatePreferences('user1', { email: false })
      expect(result.email).toBe(false)
    })
  })

  describe('sendNotification', () => {
    it('should send notification to user', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'notif-123',
          userId: 'user1',
          title: 'Hello',
          message: 'Test message',
          type: 'info',
        }),
      })

      const result = await notificationService.sendNotification('user1', {
        userId: 'user1',
        title: 'Hello',
        message: 'Test message',
        type: 'info',
        category: 'test',
        read: false,
      })

      expect(result.id).toBe('notif-123')
      expect(result.title).toBe('Hello')
    })
  })

  describe('getNotifications', () => {
    it('should get user notifications', async () => {
      const notifications = [
        { id: '1', title: 'Notif 1', read: false },
        { id: '2', title: 'Notif 2', read: true },
      ]

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => notifications,
      })

      const result = await notificationService.getNotifications('user1')
      expect(result).toHaveLength(2)
    })

    it('should filter unread notifications', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: '1', read: false }],
      })

      await notificationService.getNotifications('user1', { unreadOnly: true })
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('unread=true'))
    })

    it('should return empty array on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const result = await notificationService.getNotifications('user1')
      expect(result).toEqual([])
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'notif-1', read: true }),
      })

      const result = await notificationService.markAsRead('notif-1')
      expect(result.read).toBe(true)
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: true })

      await expect(notificationService.markAllAsRead('user1')).resolves.not.toThrow()
    })
  })

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: true })

      await expect(notificationService.deleteNotification('notif-1')).resolves.not.toThrow()
    })
  })

  describe('canReceiveNotification', () => {
    it('should check if user can receive notification', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userId: 'user1',
          push: true,
          categories: { test: true },
          quiet: { start: 22, end: 8 },
        }),
      })

      const can = await notificationService.canReceiveNotification('user1', 'test')
      expect(typeof can).toBe('boolean')
    })
  })

  describe('requestPermission', () => {
    it('should request notification permission', async () => {
      global.Notification = {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValueOnce('granted'),
      } as unknown as typeof Notification

      const result = await notificationService.requestPermission()
      expect(result).toBe('granted')
    })
  })
})
