/**
 * Offline Modes Service
 * Define and manage different offline functionality modes
 */

export interface OfflineMode {
  id: string
  name: string
  description: string
  features: string[] // enabled features
  syncStrategy: 'manual' | 'auto' | 'hybrid'
  cacheSize: number // MB
  priority: 'low' | 'medium' | 'high'
}

export interface OfflineModeConfig {
  readonly: boolean
  canCreateContent: boolean
  canEditContent: boolean
  canSync: boolean
  canViewHistory: boolean
  refreshInterval: number // ms, 0 = manual
}

class OfflineModesService {
  private static readonly OFFLINE_MODES: Record<string, OfflineMode> = {
    'read-only': {
      id: 'read-only',
      name: 'Read-Only Mode',
      description: 'Browse cached content, no editing or creation',
      features: ['read', 'search', 'navigate'],
      syncStrategy: 'manual',
      cacheSize: 50,
      priority: 'low',
    },
    'essentials': {
      id: 'essentials',
      name: 'Essentials Mode',
      description: 'Core features only: read, search, basic sync',
      features: ['read', 'search', 'sync', 'navigate'],
      syncStrategy: 'hybrid',
      cacheSize: 150,
      priority: 'medium',
    },
    'full': {
      id: 'full',
      name: 'Full Offline Mode',
      description: 'All features: read, write, sync, history',
      features: ['read', 'write', 'sync', 'search', 'history', 'navigate'],
      syncStrategy: 'auto',
      cacheSize: 500,
      priority: 'high',
    },
  }

  /**
   * Get available offline modes
   */
  getAvailableModes(): OfflineMode[] {
    return Object.values(OfflineModesService.OFFLINE_MODES)
  }

  /**
   * Get mode by ID
   */
  getMode(modeId: string): OfflineMode | null {
    return OfflineModesService.OFFLINE_MODES[modeId] || null
  }

  /**
   * Get configuration for mode
   */
  getModeConfig(modeId: string): OfflineModeConfig {
    const mode = this.getMode(modeId)
    if (!mode) {
      return {
        readonly: true,
        canCreateContent: false,
        canEditContent: false,
        canSync: false,
        canViewHistory: false,
        refreshInterval: 0,
      }
    }

    return {
      readonly: !mode.features.includes('write'),
      canCreateContent: mode.features.includes('write'),
      canEditContent: mode.features.includes('write'),
      canSync: mode.features.includes('sync'),
      canViewHistory: mode.features.includes('history'),
      refreshInterval: mode.syncStrategy === 'auto' ? 30000 : 0,
    }
  }

  /**
   * Check if feature is enabled in mode
   */
  isFeatureEnabled(modeId: string, feature: string): boolean {
    const mode = this.getMode(modeId)
    return mode?.features.includes(feature) || false
  }

  /**
   * Get recommended mode based on device and network
   */
  getRecommendedMode(): string {
    if (typeof navigator === 'undefined') return 'essentials'

    const connection = navigator.connection as
      | { effectiveType?: string; saveData?: boolean }
      | undefined

    if (connection?.saveData) return 'read-only'
    if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') {
      return 'read-only'
    }
    if (connection?.effectiveType === '3g') return 'essentials'

    return 'full'
  }

  /**
   * Get storage space needed for mode
   */
  getRequiredSpace(modeId: string): number {
    const mode = this.getMode(modeId)
    return mode?.cacheSize || 50
  }

  /**
   * Check if device has enough space
   */
  async checkAvailableSpace(): Promise<number> {
    if (!navigator.storage?.estimate) return 0

    try {
      const estimate = await navigator.storage.estimate()
      return estimate.available || 0
    } catch {
      return 0
    }
  }

  /**
   * Request persistent storage
   */
  async requestPersistentStorage(): Promise<boolean> {
    if (!navigator.storage?.persist) return false

    try {
      return await navigator.storage.persist()
    } catch {
      return false
    }
  }

  /**
   * Check if storage is persistent
   */
  async isStoragePersistent(): Promise<boolean> {
    if (!navigator.storage?.persisted) return false

    try {
      return await navigator.storage.persisted()
    } catch {
      return false
    }
  }
}

export const offlineModesService = new OfflineModesService()
