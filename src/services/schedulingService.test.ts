import { describe, it, expect, vi, beforeEach } from 'vitest'
import { schedulingService } from './schedulingService'

global.fetch = vi.fn()

describe('SchedulingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('scheduleItem', () => {
    it('should schedule an item', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'scheduled-123',
          type: 'article',
          title: 'Test Article',
          status: 'scheduled',
          scheduledFor: Date.now() + 86400000,
        }),
      } as Response)

      const result = await schedulingService.scheduleItem(
        'article',
        'Test Article',
        Date.now() + 86400000
      )

      expect(result.type).toBe('article')
      expect(result.title).toBe('Test Article')
      expect(result.status).toBe('scheduled')
    })
  })

  describe('getScheduledItems', () => {
    it('should fetch scheduled items', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [],
        }),
      } as Response)

      const result = await schedulingService.getScheduledItems('scheduled')
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return empty on failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      const result = await schedulingService.getScheduledItems()
      expect(result).toEqual([])
    })
  })

  describe('updateScheduledItem', () => {
    it('should update scheduled item', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'scheduled-123',
          status: 'published',
        }),
      } as Response)

      const result = await schedulingService.updateScheduledItem('scheduled-123', {
        status: 'published',
      })

      expect(result.status).toBe('published')
    })
  })

  describe('cancelScheduledItem', () => {
    it('should cancel scheduled item', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response)

      await expect(schedulingService.cancelScheduledItem('scheduled-123')).resolves.not.toThrow()
    })
  })

  describe('createRecurringSchedule', () => {
    it('should create recurring schedule', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'recur-123',
          frequency: 'daily',
          active: true,
        }),
      } as Response)

      const result = await schedulingService.createRecurringSchedule(
        'item-1',
        'daily',
        Date.now(),
        [9],
        'UTC'
      )

      expect(result.frequency).toBe('daily')
      expect(result.active).toBe(true)
    })
  })

  describe('getRecurringSchedules', () => {
    it('should fetch recurring schedules', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          schedules: [],
        }),
      } as Response)

      const result = await schedulingService.getRecurringSchedules()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('pauseRecurringSchedule', () => {
    it('should pause recurring schedule', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response)

      await expect(schedulingService.pauseRecurringSchedule('recur-123')).resolves.not.toThrow()
    })
  })

  describe('resumeRecurringSchedule', () => {
    it('should resume recurring schedule', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response)

      await expect(schedulingService.resumeRecurringSchedule('recur-123')).resolves.not.toThrow()
    })
  })

  describe('checkConflicts', () => {
    it('should check for scheduling conflicts', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [],
          suggestion: Date.now() + 7200000,
        }),
      } as Response)

      const result = await schedulingService.checkConflicts(Date.now() + 3600000)
      expect(result).not.toBeNull()
    })

    it('should return null on failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      const result = await schedulingService.checkConflicts(Date.now() + 3600000)
      expect(result).toBeNull()
    })
  })

  describe('getSchedulingAnalytics', () => {
    it('should get scheduling analytics', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          total: 10,
          published: 8,
          failed: 1,
          pendingCount: 1,
        }),
      } as Response)

      const result = await schedulingService.getSchedulingAnalytics(
        Date.now() - 86400000,
        Date.now()
      )

      expect(result.total).toBe(10)
      expect(result.published).toBe(8)
    })
  })

  describe('getUpcomingSchedules', () => {
    it('should get upcoming schedules', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [],
        }),
      } as Response)

      const result = await schedulingService.getUpcomingSchedules(5)
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('bulkSchedule', () => {
    it('should bulk schedule items', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [],
        }),
      } as Response)

      const result = await schedulingService.bulkSchedule([])
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('calculateNextOccurrence', () => {
    it('should calculate next daily occurrence', () => {
      const now = Date.now()
      const next = schedulingService.calculateNextOccurrence('daily', [9], 'UTC', now)
      expect(next).toBeGreaterThan(now)
    })

    it('should calculate next weekly occurrence', () => {
      const now = Date.now()
      const next = schedulingService.calculateNextOccurrence('weekly', [9], 'UTC', now)
      expect(next).toBeGreaterThan(now)
    })

    it('should calculate next monthly occurrence', () => {
      const now = Date.now()
      const next = schedulingService.calculateNextOccurrence('monthly', [9], 'UTC', now)
      expect(next).toBeGreaterThan(now)
    })
  })
})
