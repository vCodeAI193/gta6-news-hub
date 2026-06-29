import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notificationHistoryService } from './notificationHistoryService'

describe('NotificationHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('archiveNotification', () => {
    it('should archive a notification', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'archive-1',
          notificationId: 'notif-1',
          archived: true,
        }),
      })

      const result = await notificationHistoryService.archiveNotification('notif-1')
      expect(result.archived).toBe(true)
    })

    it('should throw on archive failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      await expect(notificationHistoryService.archiveNotification('notif-1')).rejects.toThrow('Failed to archive')
    })
  })

  describe('getArchivedNotifications', () => {
    it('should get archived notifications', async () => {
      const archived = [
        { id: '1', notificationId: 'notif-1', archived: true },
        { id: '2', notificationId: 'notif-2', archived: true },
      ]

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => archived,
      })

      const result = await notificationHistoryService.getArchivedNotifications('user1')
      expect(result).toHaveLength(2)
      expect(result[0].archived).toBe(true)
    })

    it('should filter by category', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      await notificationHistoryService.getArchivedNotifications('user1', { category: 'alerts' })
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('category=alerts'))
    })

    it('should return empty array on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const result = await notificationHistoryService.getArchivedNotifications('user1')
      expect(result).toEqual([])
    })
  })

  describe('searchNotifications', () => {
    it('should search notification history', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: '1', message: 'Test' }],
      })

      const result = await notificationHistoryService.searchNotifications('user1', 'test')
      expect(result).toHaveLength(1)
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('q=test'))
    })

    it('should handle search with date range', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      await notificationHistoryService.searchNotifications('user1', 'test', {
        fromDate: 1000,
        toDate: 2000,
      })

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('from=1000'))
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('to=2000'))
    })
  })

  describe('getNotificationStats', () => {
    it('should get notification statistics', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          total: 50,
          unread: 5,
          byCategory: { alerts: 20, updates: 30 },
          byType: { info: 30, warning: 20 },
        }),
      })

      const stats = await notificationHistoryService.getNotificationStats('user1')
      expect(stats.total).toBe(50)
      expect(stats.unread).toBe(5)
    })

    it('should return default stats on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const stats = await notificationHistoryService.getNotificationStats('user1')
      expect(stats.total).toBe(0)
    })
  })

  describe('clearOldNotifications', () => {
    it('should clear old notifications', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ deletedCount: 10 }),
      })

      const deleted = await notificationHistoryService.clearOldNotifications('user1', 30)
      expect(deleted).toBe(10)
    })

    it('should use default 30 days', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ deletedCount: 5 }),
      })

      await notificationHistoryService.clearOldNotifications('user1')
      expect(global.fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: expect.stringContaining('30'),
        })
      )
    })
  })

  describe('exportHistory', () => {
    it('should export notification history as JSON', async () => {
      const blob = new Blob(['{}'], { type: 'application/json' })

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        blob: async () => blob,
      })

      const result = await notificationHistoryService.exportHistory('user1', 'json')
      expect(result).toBeInstanceOf(Blob)
    })

    it('should export as CSV', async () => {
      const blob = new Blob(['data'], { type: 'text/csv' })

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        blob: async () => blob,
      })

      const result = await notificationHistoryService.exportHistory('user1', 'csv')
      expect(result).toBeInstanceOf(Blob)
    })
  })

  describe('getNotificationTrends', () => {
    it('should get notification trends', async () => {
      const trends = { '2025-01-01': 5, '2025-01-02': 10 }

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => trends,
      })

      const result = await notificationHistoryService.getNotificationTrends('user1', 30)
      expect(result['2025-01-01']).toBe(5)
    })

    it('should return empty object on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const result = await notificationHistoryService.getNotificationTrends('user1')
      expect(result).toEqual({})
    })
  })

  describe('markOldAsRead', () => {
    it('should mark old notifications as read', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ markedCount: 15 }),
      })

      const marked = await notificationHistoryService.markOldAsRead('user1', 7)
      expect(marked).toBe(15)
    })
  })

  describe('getCategories', () => {
    it('should get notification categories', async () => {
      const categories = [
        { id: 'alerts', name: 'Alerts', count: 20 },
        { id: 'updates', name: 'Updates', count: 30 },
      ]

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => categories,
      })

      const result = await notificationHistoryService.getCategories('user1')
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Alerts')
    })

    it('should return empty array on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const result = await notificationHistoryService.getCategories('user1')
      expect(result).toEqual([])
    })
  })
})
