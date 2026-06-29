import { describe, it, expect, vi, beforeEach } from 'vitest'
import { imageUpscalingService } from './imageUpscalingService'

global.fetch = vi.fn()

describe('ImageUpscalingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('upscaleImage', () => {
    it('should upscale image with 2x scale', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'upscale-1',
          originalUrl: 'https://example.com/original.jpg',
          upscaledUrl: 'https://example.com/upscaled.jpg',
          scale: 2,
          originalSize: { width: 1024, height: 768 },
          upscaledSize: { width: 2048, height: 1536 },
          quality: 0.95,
          createdAt: Date.now(),
        }),
      } as Response)

      const result = await imageUpscalingService.upscaleImage({
        imageUrl: 'https://example.com/original.jpg',
        scale: 2,
        model: 'quality',
      })

      expect(result.scale).toBe(2)
      expect(result.upscaledSize.width).toBe(2048)
      expect(result.processingTime).toBeGreaterThanOrEqual(0)
    })

    it('should throw error on failed upscaling', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      await expect(
        imageUpscalingService.upscaleImage({
          imageUrl: 'https://example.com/original.jpg',
          scale: 4,
          model: 'standard',
        })
      ).rejects.toThrow()
    })
  })

  describe('batchUpscale', () => {
    it('should upscale multiple images', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      const requests = [
        {
          imageUrl: 'https://example.com/img1.jpg',
          scale: 2 as const,
          model: 'standard' as const,
        },
        {
          imageUrl: 'https://example.com/img2.jpg',
          scale: 4 as const,
          model: 'quality' as const,
        },
      ]

      const result = await imageUpscalingService.batchUpscale(requests)
      expect(Array.isArray(result)).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        '/api/images/upscale/batch',
        expect.any(Object)
      )
    })
  })

  describe('enhanceImage', () => {
    it('should enhance image with filters', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          enhancedUrl: 'https://example.com/enhanced.jpg',
        }),
      } as Response)

      const result = await imageUpscalingService.enhanceImage(
        'https://example.com/original.jpg',
        { sharpen: 0.8, denoise: 0.5 }
      )

      expect(result).toBe('https://example.com/enhanced.jpg')
    })
  })

  describe('restoreImage', () => {
    it('should restore degraded image', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          restoredUrl: 'https://example.com/restored.jpg',
        }),
      } as Response)

      const result = await imageUpscalingService.restoreImage('https://example.com/old.jpg')
      expect(result).toBe('https://example.com/restored.jpg')
    })
  })

  describe('optimizeImage', () => {
    it('should optimize image for web', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          optimizedUrl: 'https://example.com/optimized.webp',
          compressionRatio: 0.4,
          originalSize: 1000000,
          optimizedSize: 400000,
        }),
      } as Response)

      const result = await imageUpscalingService.optimizeImage(
        'https://example.com/original.jpg',
        'webp'
      )

      expect(result.compressionRatio).toBe(0.4)
      expect(result.optimizedSize).toBeLessThan(result.originalSize)
    })
  })

  describe('getUpscaleProgress', () => {
    it('should get upscaling progress', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'processing',
          progress: 50,
        }),
      } as Response)

      const result = await imageUpscalingService.getUpscaleProgress('upscale-1')
      expect(result.status).toBe('processing')
      expect(result.progress).toBe(50)
    })

    it('should return failed status on error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      const result = await imageUpscalingService.getUpscaleProgress('upscale-1')
      expect(result.status).toBe('failed')
    })
  })

  describe('validateImage', () => {
    it('should validate correct image format', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      const result = imageUpscalingService.validateImage(file)
      expect(result.valid).toBe(true)
    })

    it('should reject unsupported format', () => {
      const file = new File([''], 'test.bmp', { type: 'image/bmp' })
      const result = imageUpscalingService.validateImage(file)
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject oversized files', () => {
      const largeContent = new Array(51 * 1024 * 1024).fill('x')
      const file = new File(largeContent, 'test.jpg', { type: 'image/jpeg' })
      const result = imageUpscalingService.validateImage(file)
      expect(result.valid).toBe(false)
    })
  })

  describe('calculateUpscaledDimensions', () => {
    it('should calculate upscaled dimensions', () => {
      const result = imageUpscalingService.calculateUpscaledDimensions(1024, 768, 2)
      expect(result.width).toBe(2048)
      expect(result.height).toBe(1536)
    })

    it('should constrain to max dimension', () => {
      const result = imageUpscalingService.calculateUpscaledDimensions(5000, 5000, 4)
      expect(result.width).toBeLessThanOrEqual(8192)
      expect(result.height).toBeLessThanOrEqual(8192)
    })

    it('should maintain aspect ratio', () => {
      const result = imageUpscalingService.calculateUpscaledDimensions(800, 600, 2)
      expect(result.width / result.height).toBeCloseTo(800 / 600, 1)
    })
  })

  describe('estimateUpscalingCost', () => {
    it('should estimate upscaling cost', () => {
      const estimate = imageUpscalingService.estimateUpscalingCost(1024, 768, 2)
      expect(estimate.estimatedTime).toBeGreaterThanOrEqual(2000)
      expect(estimate.estimatedCredits).toBeGreaterThan(0)
    })

    it('should scale cost with larger images', () => {
      const small = imageUpscalingService.estimateUpscalingCost(512, 512, 2)
      const large = imageUpscalingService.estimateUpscalingCost(2048, 2048, 2)
      expect(large.estimatedTime).toBeGreaterThan(small.estimatedTime)
    })
  })
})
