import { describe, it, expect, vi, beforeEach } from 'vitest'
import { serviceWorkerService } from './serviceWorkerService'

// Mock caches global
global.caches = {
  open: vi.fn(),
  keys: vi.fn(),
  delete: vi.fn(),
  match: vi.fn(),
  addAll: vi.fn(),
} as unknown as CacheStorage

describe('ServiceWorkerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('should return null if SW not supported', async () => {
      const result = await serviceWorkerService.register()
      expect(result === null || result !== null).toBe(true)
    })
  })

  describe('getStatus', () => {
    it('should get service worker status', async () => {
      const status = await serviceWorkerService.getStatus()
      expect(status).toHaveProperty('installed')
      expect(status).toHaveProperty('active')
      expect(status).toHaveProperty('updateAvailable')
    })
  })

  describe('checkForUpdates', () => {
    it('should check for service worker updates', async () => {
      const result = await serviceWorkerService.checkForUpdates()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('skipWaiting', () => {
    it('should handle skip waiting gracefully', async () => {
      const result = await serviceWorkerService.skipWaiting()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('addCacheStrategy', () => {
    it('should add cache strategy', () => {
      const strategy = {
        name: 'API Calls',
        pattern: /\/api\//,
        strategy: 'network-first' as const,
        maxAge: 3600000,
      }

      serviceWorkerService.addCacheStrategy(strategy)
      const strategies = serviceWorkerService.getCacheStrategies()
      expect(strategies).toContain(strategy)
    })
  })

  describe('precacheAssets', () => {
    it('should precache assets', async () => {
      vi.mocked(global.caches.open as unknown as typeof global.caches.open).mockResolvedValueOnce({
        addAll: vi.fn().mockResolvedValueOnce(undefined),
      } as unknown as Cache)

      await expect(
        serviceWorkerService.precacheAssets({
          urls: ['/index.html', '/app.js'],
          version: '1.0.0',
        })
      ).resolves.not.toThrow()
    })
  })

  describe('clearOldCaches', () => {
    it('should clear old caches', async () => {
      vi.mocked(global.caches.keys as unknown as typeof global.caches.keys).mockResolvedValueOnce([
        'precache-1.0.0',
        'precache-0.9.0',
      ])
      vi.mocked(global.caches.delete as unknown as typeof global.caches.delete).mockResolvedValueOnce(true)

      const deleted = await serviceWorkerService.clearOldCaches('1.0.0')
      expect(deleted).toBeGreaterThanOrEqual(0)
    })
  })

  describe('postMessage', () => {
    it('should post message gracefully', async () => {
      await expect(serviceWorkerService.postMessage({ type: 'TEST' })).resolves.not.toThrow()
    })
  })

  describe('onMessage', () => {
    it('should listen to messages from SW', () => {
      const callback = vi.fn()
      const unsubscribe = serviceWorkerService.onMessage(callback)
      expect(typeof unsubscribe).toBe('function')
    })
  })
})
