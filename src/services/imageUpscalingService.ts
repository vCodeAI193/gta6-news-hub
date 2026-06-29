/**
 * Image Upscaling Service
 * Upscale and enhance images using AI models
 */

export interface UpscaleRequest {
  imageUrl: string
  scale: 2 | 4 | 8 // upscale factor
  model: 'standard' | 'quality' | 'face'
  noiseReduction?: boolean
}

export interface UpscaleResult {
  id: string
  originalUrl: string
  upscaledUrl: string
  scale: number
  originalSize: { width: number; height: number }
  upscaledSize: { width: number; height: number }
  quality: number
  processingTime: number
  createdAt: number
}

export interface EnhancementOptions {
  sharpen?: number // 0-1
  denoise?: number // 0-1
  colorEnhance?: number // 0-1
  contrastEnhance?: number // 0-1
}

class ImageUpscalingService {
  private static readonly MAX_UPSCALE_DIMENSION = 8192 // pixels
  private static readonly SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp']
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

  /**
   * Upscale image
   */
  async upscaleImage(request: UpscaleRequest): Promise<UpscaleResult> {
    try {
      const startTime = Date.now()

      const response = await fetch('/api/images/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) throw new Error('Upscaling failed')

      const result = await response.json()
      const processingTime = Date.now() - startTime

      return {
        ...result,
        processingTime,
      }
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Image upscaling failed'
      )
    }
  }

  /**
   * Batch upscale multiple images
   */
  async batchUpscale(requests: UpscaleRequest[]): Promise<UpscaleResult[]> {
    try {
      const response = await fetch('/api/images/upscale/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests }),
      })

      if (!response.ok) throw new Error('Batch upscaling failed')
      return response.json()
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Batch upscaling failed'
      )
    }
  }

  /**
   * Enhance image with various filters
   */
  async enhanceImage(
    imageUrl: string,
    options: EnhancementOptions
  ): Promise<string> {
    try {
      const response = await fetch('/api/images/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, options }),
      })

      if (!response.ok) throw new Error('Enhancement failed')
      const result = await response.json()
      return result.enhancedUrl
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Image enhancement failed'
      )
    }
  }

  /**
   * Restore old/degraded images
   */
  async restoreImage(imageUrl: string): Promise<string> {
    try {
      const response = await fetch('/api/images/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })

      if (!response.ok) throw new Error('Restoration failed')
      const result = await response.json()
      return result.restoredUrl
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Image restoration failed'
      )
    }
  }

  /**
   * Optimize image for web
   */
  async optimizeImage(imageUrl: string, targetFormat: 'webp' | 'avif' = 'webp'): Promise<{
    optimizedUrl: string
    compressionRatio: number
    originalSize: number
    optimizedSize: number
  }> {
    try {
      const response = await fetch('/api/images/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, targetFormat }),
      })

      if (!response.ok) throw new Error('Optimization failed')
      return response.json()
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Image optimization failed'
      )
    }
  }

  /**
   * Get upscaling progress
   */
  async getUpscaleProgress(resultId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number // 0-100
    error?: string
  }> {
    try {
      const response = await fetch(`/api/images/upscale/${resultId}/progress`)
      if (!response.ok) {
        return { status: 'failed', progress: 0 }
      }
      return response.json()
    } catch {
      return { status: 'failed', progress: 0 }
    }
  }

  /**
   * Validate image before upscaling
   */
  validateImage(file: File): { valid: boolean; error?: string } {
    if (file.size > ImageUpscalingService.MAX_FILE_SIZE) {
      return { valid: false, error: 'File too large (max 50MB)' }
    }

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !ImageUpscalingService.SUPPORTED_FORMATS.includes(extension)) {
      return { valid: false, error: 'Unsupported image format' }
    }

    return { valid: true }
  }

  /**
   * Calculate estimated dimensions after upscaling
   */
  calculateUpscaledDimensions(
    width: number,
    height: number,
    scale: number
  ): { width: number; height: number } {
    const upscaledWidth = width * scale
    const upscaledHeight = height * scale

    if (upscaledWidth > ImageUpscalingService.MAX_UPSCALE_DIMENSION ||
        upscaledHeight > ImageUpscalingService.MAX_UPSCALE_DIMENSION) {
      const ratio = height / width
      const constrainedWidth = ImageUpscalingService.MAX_UPSCALE_DIMENSION
      const constrainedHeight = constrainedWidth * ratio

      return {
        width: Math.floor(constrainedWidth),
        height: Math.floor(constrainedHeight),
      }
    }

    return { width: upscaledWidth, height: upscaledHeight }
  }

  /**
   * Estimate upscaling cost/time
   */
  estimateUpscalingCost(
    width: number,
    height: number,
    scale: number
  ): { estimatedTime: number; estimatedCredits: number } {
    const upscaledDimensions = this.calculateUpscaledDimensions(width, height, scale)
    const pixelCount = upscaledDimensions.width * upscaledDimensions.height
    const baseTime = 2000 // 2 seconds
    const estimatedTime = Math.max(baseTime, Math.floor(pixelCount / 1000000 * 5000))
    const estimatedCredits = Math.ceil(pixelCount / 1000000)

    return { estimatedTime, estimatedCredits }
  }
}

export const imageUpscalingService = new ImageUpscalingService()
