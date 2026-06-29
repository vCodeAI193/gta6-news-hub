/**
 * Service Worker Service
 * Manage service worker lifecycle and caching strategies
 */

export interface CacheStrategy {
  name: string
  pattern: RegExp
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate'
  maxAge: number // milliseconds
}

export interface ServiceWorkerStatus {
  installed: boolean
  active: boolean
  updateAvailable: boolean
  version: string
}

export interface PrecacheConfig {
  urls: string[]
  version: string
}

class ServiceWorkerService {
  private swRegistration: ServiceWorkerContainer | null = null
  private cacheStrategies: CacheStrategy[] = []

  /**
   * Register service worker
   */
  async register(swPath: string = '/sw.js'): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSWSupported()) return null

    try {
      const registration = await navigator.serviceWorker.register(swPath, {
        scope: '/',
      })
      this.swRegistration = navigator.serviceWorker
      return registration
    } catch (error) {
      console.error('Service worker registration failed:', error)
      return null
    }
  }

  /**
   * Unregister service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.isSWSupported()) return false

    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        await registration.unregister()
      }
      return true
    } catch {
      return false
    }
  }

  /**
   * Check service worker status
   */
  async getStatus(): Promise<ServiceWorkerStatus> {
    if (!this.isSWSupported()) {
      return {
        installed: false,
        active: false,
        updateAvailable: false,
        version: '',
      }
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const updateCheckResult = await registration.update()

      return {
        installed: !!registration.installing,
        active: !!registration.active,
        updateAvailable: !!updateCheckResult.installing,
        version: registration.active?.scriptURL?.split('?')[1] || '1.0.0',
      }
    } catch {
      return {
        installed: false,
        active: false,
        updateAvailable: false,
        version: '',
      }
    }
  }

  /**
   * Check for updates
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.isSWSupported()) return false

    try {
      const registration = await navigator.serviceWorker.ready
      await registration.update()
      return !!registration.installing
    } catch {
      return false
    }
  }

  /**
   * Skip waiting and activate new SW
   */
  async skipWaiting(): Promise<boolean> {
    if (!this.isSWSupported()) return false

    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const registration of registrations) {
        const newWorker = registration.installing || registration.waiting
        if (newWorker) {
          newWorker.postMessage({ type: 'SKIP_WAITING' })
          return true
        }
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * Add cache strategy
   */
  addCacheStrategy(strategy: CacheStrategy): void {
    this.cacheStrategies.push(strategy)
  }

  /**
   * Get cache strategies
   */
  getCacheStrategies(): CacheStrategy[] {
    return this.cacheStrategies
  }

  /**
   * Precache assets
   */
  async precacheAssets(config: PrecacheConfig): Promise<void> {
    if (!this.isSWSupported()) return

    try {
      const cache = await caches.open(`precache-${config.version}`)
      await cache.addAll(config.urls)
    } catch (error) {
      console.error('Precaching failed:', error)
    }
  }

  /**
   * Clear old caches
   */
  async clearOldCaches(currentVersion: string): Promise<number> {
    if (!this.isSWSupported()) return 0

    let deletedCount = 0
    try {
      const cacheNames = await caches.keys()
      for (const name of cacheNames) {
        if (!name.includes(currentVersion)) {
          await caches.delete(name)
          deletedCount++
        }
      }
    } catch {
      // Silent fail
    }

    return deletedCount
  }

  /**
   * Get cache size
   */
  async getCacheSize(): Promise<number> {
    if (!this.isSWSupported()) return 0

    try {
      const cacheNames = await caches.keys()
      let totalSize = 0

      for (const name of cacheNames) {
        const cache = await caches.open(name)
        const keys = await cache.keys()
        for (const request of keys) {
          const response = await cache.match(request)
          if (response) {
            totalSize += response.blob().then(blob => blob.size)
          }
        }
      }

      return totalSize
    } catch {
      return 0
    }
  }

  /**
   * Send message to active service worker
   */
  async postMessage(message: unknown): Promise<void> {
    if (!this.isSWSupported()) return

    try {
      const registration = await navigator.serviceWorker.ready
      if (registration.active) {
        registration.active.postMessage(message)
      }
    } catch {
      // Silent fail
    }
  }

  /**
   * Listen to messages from service worker
   */
  onMessage(callback: (message: unknown) => void): () => void {
    if (!this.isSWSupported()) return () => {}

    const handler = (event: ExtendableMessageEvent) => {
      callback(event.data)
    }

    navigator.serviceWorker.addEventListener('message', handler as EventListener)

    return () => {
      navigator.serviceWorker.removeEventListener('message', handler)
    }
  }

  /**
   * Check if SW is supported
   */
  private isSWSupported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.serviceWorker
  }
}

export const serviceWorkerService = new ServiceWorkerService()
