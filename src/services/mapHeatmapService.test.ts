import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mapHeatmapService } from './mapHeatmapService'
import type { HeatmapPoint } from './mapHeatmapService'

global.fetch = vi.fn()

describe('MapHeatmapService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockPoints: HeatmapPoint[] = [
    { lat: 40.7128, lng: -74.006, value: 0.8, label: 'NYC' },
    { lat: 34.0522, lng: -118.2437, value: 0.6, label: 'LA' },
    { lat: 41.8781, lng: -87.6298, value: 0.7, label: 'Chicago' },
  ]

  describe('generateHeatmap', () => {
    it('should generate heatmap from points', () => {
      const result = mapHeatmapService.generateHeatmap(mockPoints)
      expect(result).toHaveProperty('points')
      expect(result).toHaveProperty('clusters')
      expect(result).toHaveProperty('bounds')
    })

    it('should calculate correct bounds', () => {
      const result = mapHeatmapService.generateHeatmap(mockPoints)
      expect(result.bounds.north).toBeGreaterThan(result.bounds.south)
      expect(result.bounds.east).toBeGreaterThan(result.bounds.west)
    })
  })

  describe('clusterPoints', () => {
    it('should cluster nearby points', () => {
      const points: HeatmapPoint[] = [
        { lat: 0, lng: 0, value: 1 },
        { lat: 0.01, lng: 0.01, value: 1 },
        { lat: 10, lng: 10, value: 1 },
      ]

      const clusters = mapHeatmapService.clusterPoints(points, 1)
      expect(clusters.length).toBeLessThanOrEqual(points.length)
    })
  })

  describe('getMetricHeatmap', () => {
    it('should fetch metric heatmap', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          points: [],
        }),
      } as Response)

      const result = await mapHeatmapService.getMetricHeatmap('engagement', {
        start: Date.now() - 86400000,
        end: Date.now(),
      })

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getUserActivityHeatmap', () => {
    it('should fetch user activity heatmap', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          points: [],
        }),
      } as Response)

      const result = await mapHeatmapService.getUserActivityHeatmap('user-1')
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getContentDistributionHeatmap', () => {
    it('should fetch content distribution heatmap', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          points: [],
        }),
      } as Response)

      const result = await mapHeatmapService.getContentDistributionHeatmap()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getEngagementHeatmap', () => {
    it('should fetch engagement heatmap', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          points: [],
        }),
      } as Response)

      const result = await mapHeatmapService.getEngagementHeatmap()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const point1: HeatmapPoint = { lat: 0, lng: 0, value: 1 }
      const point2: HeatmapPoint = { lat: 0, lng: 1, value: 1 }
      const distance = mapHeatmapService.calculateDistance(point1, point2)
      expect(distance).toBeGreaterThan(0)
    })

    it('should return 0 for same point', () => {
      const point: HeatmapPoint = { lat: 40.7128, lng: -74.006, value: 1 }
      const distance = mapHeatmapService.calculateDistance(point, point)
      expect(distance).toBeLessThan(0.001)
    })
  })

  describe('getHeatmapStats', () => {
    it('should calculate statistics', () => {
      const stats = mapHeatmapService.getHeatmapStats(mockPoints)
      expect(stats.totalPoints).toBe(3)
      expect(stats.minValue).toBeLessThanOrEqual(stats.maxValue)
      expect(stats.averageValue).toBeGreaterThan(0)
    })

    it('should handle empty points', () => {
      const stats = mapHeatmapService.getHeatmapStats([])
      expect(stats.totalPoints).toBe(0)
      expect(stats.minValue).toBe(0)
      expect(stats.maxValue).toBe(0)
    })
  })

  describe('getColorForValue', () => {
    it('should return correct color for value', () => {
      const color = mapHeatmapService.getColorForValue(0.5)
      expect(typeof color).toBe('string')
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should clamp values', () => {
      const colorLow = mapHeatmapService.getColorForValue(-1)
      const colorHigh = mapHeatmapService.getColorForValue(2)
      expect(typeof colorLow).toBe('string')
      expect(typeof colorHigh).toBe('string')
    })
  })

  describe('analyzeTrends', () => {
    it('should analyze trend data', () => {
      const historical = [
        [{ lat: 0, lng: 0, value: 0.5 }],
        [{ lat: 0, lng: 0, value: 0.7 }],
      ]

      const trends = mapHeatmapService.analyzeTrends(historical)
      expect(trends).toHaveProperty('growth')
      expect(trends).toHaveProperty('hotspots')
      expect(trends).toHaveProperty('coldspotsBecomingHot')
      expect(trends.growth).toBeGreaterThan(0)
    })

    it('should handle insufficient data', () => {
      const trends = mapHeatmapService.analyzeTrends([])
      expect(trends.growth).toBe(0)
    })
  })
})
