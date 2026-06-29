import { describe, it, expect, vi, beforeEach } from 'vitest'
import { seoAnalysisService } from './seoAnalysisService'

global.fetch = vi.fn()

describe('SEOAnalysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockData = {
    title: 'GTA6 News Hub - Latest Grand Theft Auto 6 Updates',
    metaDescription: 'Stay updated with the latest GTA6 news, releases, and community updates.',
    content: 'Grand Theft Auto 6 is coming. This is the most anticipated game of the year.',
    headings: ['h1', 'h2', 'h3'],
    keywords: ['GTA6', 'Grand Theft Auto'],
  }

  describe('analyzeSEO', () => {
    it('should analyze SEO metrics', () => {
      const result = seoAnalysisService.analyzeSEO(mockData)
      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('metaDescription')
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
    })
  })

  describe('analyzeKeywords', () => {
    it('should analyze keyword density', () => {
      const analysis = seoAnalysisService.analyzeKeywords(mockData.content, ['Grand Theft', 'GTA6'])
      expect(Array.isArray(analysis)).toBe(true)
      expect(analysis.length).toBeGreaterThan(0)
    })

    it('should sort by density', () => {
      const analysis = seoAnalysisService.analyzeKeywords(
        'test test test other other final',
        ['test', 'other', 'final']
      )
      expect(analysis[0].keyword).toBe('test')
      expect(analysis[0].density).toBeGreaterThan(analysis[1].density)
    })
  })

  describe('generateMetaDescription', () => {
    it('should generate appropriate meta description', () => {
      const description = seoAnalysisService.generateMetaDescription(
        'GTA6',
        mockData.content,
        160
      )
      expect(description.length).toBeLessThanOrEqual(160)
    })

    it('should truncate long descriptions', () => {
      const longContent = 'a'.repeat(200)
      const description = seoAnalysisService.generateMetaDescription('Title', longContent, 50)
      expect(description.length).toBeLessThanOrEqual(53) // 50 + '...'
    })
  })

  describe('findLinkOpportunities', () => {
    it('should find link opportunities', () => {
      const opportunities = seoAnalysisService.findLinkOpportunities(mockData.content, ['Grand Theft', 'game'])
      expect(Array.isArray(opportunities)).toBe(true)
    })
  })

  describe('analyzeHeaderStructure', () => {
    it('should validate header structure', () => {
      const result = seoAnalysisService.analyzeHeaderStructure(['h1', 'h2', 'h2', 'h3'])
      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('suggestions')
    })

    it('should detect missing H1', () => {
      const result = seoAnalysisService.analyzeHeaderStructure(['h2', 'h3'])
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('H1'))).toBe(true)
    })

    it('should detect multiple H1 tags', () => {
      const result = seoAnalysisService.analyzeHeaderStructure(['h1', 'h2', 'h1'])
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Multiple H1'))).toBe(true)
    })
  })

  describe('calculateReadabilityScore', () => {
    it('should calculate readability score', () => {
      const score = seoAnalysisService.calculateReadabilityScore(mockData.content)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should return 0 for empty content', () => {
      const score = seoAnalysisService.calculateReadabilityScore('')
      expect(score).toBe(0)
    })

    it('should favor shorter sentences', () => {
      const easyText = 'I like cats. Cats are cute. They play.'
      const hardText = 'The categorical imperative of contemporary philosophical discourse necessitates exhaustive examination.'

      const easyScore = seoAnalysisService.calculateReadabilityScore(easyText)
      const hardScore = seoAnalysisService.calculateReadabilityScore(hardText)

      expect(easyScore).toBeGreaterThan(hardScore)
    })
  })

  describe('getRecommendations', () => {
    it('should provide actionable recommendations', () => {
      const metrics = seoAnalysisService.analyzeSEO(mockData)
      const recommendations = seoAnalysisService.getRecommendations(metrics)
      expect(Array.isArray(recommendations)).toBe(true)
    })
  })

  describe('analyzeCompetitorSEO', () => {
    it('should analyze competitor SEO', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          score: 85,
          title: { status: 'good', score: 100, message: '', suggestions: [] },
        }),
      } as Response)

      const result = await seoAnalysisService.analyzeCompetitorSEO('https://competitor.com')
      expect(result).not.toBeNull()
      expect(result?.score).toBe(85)
    })

    it('should return null on failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      const result = await seoAnalysisService.analyzeCompetitorSEO('https://competitor.com')
      expect(result).toBeNull()
    })
  })
})
