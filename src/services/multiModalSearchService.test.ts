import { describe, it, expect, vi, beforeEach } from 'vitest'
import { multiModalSearchService } from './multiModalSearchService'

global.fetch = vi.fn()

describe('MultiModalSearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('search', () => {
    it('should perform multi-modal search', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
          total: 0,
        }),
      } as Response)

      const result = await multiModalSearchService.search({
        query: 'GTA6',
        modalities: ['text', 'image', 'video'],
      })

      expect(result).toHaveProperty('results')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('executionTime')
    })

    it('should handle search failure gracefully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      const result = await multiModalSearchService.search({
        query: 'test',
        modalities: ['text'],
      })

      expect(result.results).toEqual([])
      expect(result.total).toBe(0)
    })
  })

  describe('searchByImage', () => {
    it('should search by image URL', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
        }),
      } as Response)

      const result = await multiModalSearchService.searchByImage({
        imageUrl: 'https://example.com/image.jpg',
      })

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('searchByVideo', () => {
    it('should search by video', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
        }),
      } as Response)

      const result = await multiModalSearchService.searchByVideo({
        videoUrl: 'https://example.com/video.mp4',
      })

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getSuggestions', () => {
    it('should get search suggestions', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          suggestions: [],
        }),
      } as Response)

      const result = await multiModalSearchService.getSuggestions('gta')
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('getTrendingSearches', () => {
    it('should get trending searches', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      const result = await multiModalSearchService.getTrendingSearches()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('rankResults', () => {
    it('should rank results by relevance', () => {
      const results = [
        { id: '1', type: 'image' as const, title: 'Image', relevance: 0.7, matchedFields: [] },
        { id: '2', type: 'article' as const, title: 'Article', relevance: 0.9, matchedFields: [] },
        { id: '3', type: 'video' as const, title: 'Video', relevance: 0.8, matchedFields: [] },
      ]

      const ranked = multiModalSearchService.rankResults(results)
      expect(ranked[0].relevance).toBeGreaterThanOrEqual(ranked[1].relevance)
    })
  })

  describe('filterResults', () => {
    it('should filter results by date range', () => {
      const results = [
        {
          id: '1',
          type: 'article' as const,
          title: 'Old',
          relevance: 1,
          matchedFields: [],
          metadata: { timestamp: 1000 },
        },
        {
          id: '2',
          type: 'article' as const,
          title: 'New',
          relevance: 1,
          matchedFields: [],
          metadata: { timestamp: 5000 },
        },
      ]

      const filtered = multiModalSearchService.filterResults(results, {
        dateRange: { start: 2000, end: 6000 },
      })

      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe('2')
    })
  })

  describe('getModalityStats', () => {
    it('should calculate modality statistics', () => {
      const results = [
        { id: '1', type: 'article' as const, title: 'A', relevance: 1, matchedFields: [] },
        { id: '2', type: 'video' as const, title: 'V', relevance: 1, matchedFields: [] },
        { id: '3', type: 'image' as const, title: 'I', relevance: 1, matchedFields: [] },
      ]

      const stats = multiModalSearchService.getModalityStats(results)
      expect(stats.article).toBe(1)
      expect(stats.video).toBe(1)
      expect(stats.image).toBe(1)
    })
  })

  describe('getSearchInsights', () => {
    it('should get AI-powered search insights', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          relatedTopics: ['topic1'],
          suggestedModalities: ['text'],
          searchIntent: 'informational',
        }),
      } as Response)

      const result = await multiModalSearchService.getSearchInsights('GTA6')
      expect(result).toHaveProperty('relatedTopics')
      expect(result).toHaveProperty('suggestedModalities')
      expect(result).toHaveProperty('searchIntent')
    })
  })
})
