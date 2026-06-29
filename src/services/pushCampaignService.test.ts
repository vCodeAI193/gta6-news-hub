import { describe, it, expect, vi, beforeEach } from 'vitest'
import { pushCampaignService } from './pushCampaignService'

describe('PushCampaignService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createCampaign', () => {
    it('should create a new campaign', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'campaign-1',
          title: 'Test Campaign',
          status: 'draft',
        }),
      })

      const result = await pushCampaignService.createCampaign({
        title: 'Test Campaign',
        message: 'Test message',
        target: { segment: 'users' },
        schedule: { type: 'immediate' },
        status: 'draft',
        createdBy: 'admin',
      })

      expect(result.id).toBe('campaign-1')
      expect(result.status).toBe('draft')
    })

    it('should throw on creation failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      await expect(
        pushCampaignService.createCampaign({
          title: 'Test',
          message: 'Test',
          target: { segment: 'users' },
          schedule: { type: 'immediate' },
          status: 'draft',
          createdBy: 'admin',
        })
      ).rejects.toThrow('Failed to create campaign')
    })
  })

  describe('getCampaign', () => {
    it('should get campaign by ID', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'campaign-1', title: 'Test' }),
      })

      const campaign = await pushCampaignService.getCampaign('campaign-1')
      expect(campaign?.id).toBe('campaign-1')
    })

    it('should return null on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const campaign = await pushCampaignService.getCampaign('campaign-1')
      expect(campaign).toBeNull()
    })
  })

  describe('listCampaigns', () => {
    it('should list all campaigns', async () => {
      const campaigns = [
        { id: '1', title: 'Campaign 1', status: 'completed' },
        { id: '2', title: 'Campaign 2', status: 'running' },
      ]

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => campaigns,
      })

      const result = await pushCampaignService.listCampaigns()
      expect(result).toHaveLength(2)
    })

    it('should filter by status', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      await pushCampaignService.listCampaigns({ status: 'running' })
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('status=running'))
    })

    it('should return empty array on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const result = await pushCampaignService.listCampaigns()
      expect(result).toEqual([])
    })
  })

  describe('updateCampaign', () => {
    it('should update campaign', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'campaign-1', title: 'Updated' }),
      })

      const result = await pushCampaignService.updateCampaign('campaign-1', { title: 'Updated' })
      expect(result.title).toBe('Updated')
    })
  })

  describe('launchCampaign', () => {
    it('should launch campaign', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'campaign-1', status: 'running' }),
      })

      const result = await pushCampaignService.launchCampaign('campaign-1')
      expect(result.status).toBe('running')
    })
  })

  describe('pauseCampaign', () => {
    it('should pause campaign', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'campaign-1', status: 'paused' }),
      })

      const result = await pushCampaignService.pauseCampaign('campaign-1')
      expect(result.status).toBe('paused')
    })
  })

  describe('cancelCampaign', () => {
    it('should cancel campaign', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'campaign-1', status: 'cancelled' }),
      })

      const result = await pushCampaignService.cancelCampaign('campaign-1')
      expect(result.status).toBe('cancelled')
    })
  })

  describe('getCampaignStats', () => {
    it('should get campaign statistics', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          targetCount: 1000,
          sentCount: 950,
          openCount: 500,
          openRate: 0.526,
        }),
      })

      const stats = await pushCampaignService.getCampaignStats('campaign-1')
      expect(stats?.sentCount).toBe(950)
      expect(stats?.openRate).toBe(0.526)
    })

    it('should return null on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const stats = await pushCampaignService.getCampaignStats('campaign-1')
      expect(stats).toBeNull()
    })
  })

  describe('getCampaignPerformance', () => {
    it('should get campaign performance data', async () => {
      const performance = [
        { timestamp: 1000, opens: 100, clicks: 50, conversions: 10 },
        { timestamp: 2000, opens: 150, clicks: 75, conversions: 15 },
      ]

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => performance,
      })

      const result = await pushCampaignService.getCampaignPerformance('campaign-1')
      expect(result).toHaveLength(2)
      expect(result[0].opens).toBe(100)
    })

    it('should return empty array on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const result = await pushCampaignService.getCampaignPerformance('campaign-1')
      expect(result).toEqual([])
    })
  })

  describe('listSegments', () => {
    it('should list available segments', async () => {
      const segments = [
        { id: 'seg-1', name: 'Active Users', userCount: 5000 },
        { id: 'seg-2', name: 'New Users', userCount: 1000 },
      ]

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => segments,
      })

      const result = await pushCampaignService.listSegments()
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Active Users')
    })

    it('should return empty array on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const result = await pushCampaignService.listSegments()
      expect(result).toEqual([])
    })
  })

  describe('estimateReach', () => {
    it('should estimate campaign reach', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ estimatedUsers: 5000, confidence: 0.95 }),
      })

      const result = await pushCampaignService.estimateReach({ segment: 'users' })
      expect(result.estimatedUsers).toBe(5000)
      expect(result.confidence).toBe(0.95)
    })

    it('should return defaults on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const result = await pushCampaignService.estimateReach({ segment: 'users' })
      expect(result.estimatedUsers).toBe(0)
    })
  })

  describe('sendTestNotification', () => {
    it('should send test notifications', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sent: 2, failed: 0 }),
      })

      const result = await pushCampaignService.sendTestNotification('campaign-1', ['user1', 'user2'])
      expect(result.sent).toBe(2)
      expect(result.failed).toBe(0)
    })

    it('should handle test failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const result = await pushCampaignService.sendTestNotification('campaign-1', ['user1'])
      expect(result.failed).toBe(1)
    })
  })

  describe('cloneCampaign', () => {
    it('should clone campaign', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'campaign-2', title: 'Test Campaign (Copy)', status: 'draft' }),
      })

      const result = await pushCampaignService.cloneCampaign('campaign-1')
      expect(result.id).toBe('campaign-2')
      expect(result.status).toBe('draft')
    })
  })
})
