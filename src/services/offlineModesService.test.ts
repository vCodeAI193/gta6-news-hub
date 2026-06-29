import { describe, it, expect, vi, beforeEach } from 'vitest'
import { offlineModesService } from './offlineModesService'

describe('OfflineModesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAvailableModes', () => {
    it('should return all available offline modes', () => {
      const modes = offlineModesService.getAvailableModes()
      expect(modes.length).toBeGreaterThan(0)
      expect(modes.some(m => m.id === 'read-only')).toBe(true)
      expect(modes.some(m => m.id === 'essentials')).toBe(true)
      expect(modes.some(m => m.id === 'full')).toBe(true)
    })
  })

  describe('getMode', () => {
    it('should get mode by ID', () => {
      const mode = offlineModesService.getMode('read-only')
      expect(mode).not.toBeNull()
      expect(mode?.name).toBe('Read-Only Mode')
    })

    it('should return null for invalid mode', () => {
      const mode = offlineModesService.getMode('invalid')
      expect(mode).toBeNull()
    })
  })

  describe('getModeConfig', () => {
    it('should get configuration for mode', () => {
      const config = offlineModesService.getModeConfig('read-only')
      expect(config.readonly).toBe(true)
      expect(config.canCreateContent).toBe(false)
      expect(config.canEditContent).toBe(false)
    })

    it('should get full mode config', () => {
      const config = offlineModesService.getModeConfig('full')
      expect(config.readonly).toBe(false)
      expect(config.canCreateContent).toBe(true)
      expect(config.canEditContent).toBe(true)
      expect(config.canSync).toBe(true)
    })

    it('should return safe defaults for invalid mode', () => {
      const config = offlineModesService.getModeConfig('invalid')
      expect(config.readonly).toBe(true)
      expect(config.canCreateContent).toBe(false)
    })
  })

  describe('isFeatureEnabled', () => {
    it('should check if feature is enabled', () => {
      expect(offlineModesService.isFeatureEnabled('read-only', 'read')).toBe(true)
      expect(offlineModesService.isFeatureEnabled('read-only', 'write')).toBe(false)
    })

    it('should return false for invalid mode', () => {
      expect(offlineModesService.isFeatureEnabled('invalid', 'read')).toBe(false)
    })
  })

  describe('getRecommendedMode', () => {
    it('should return a recommended mode', () => {
      const mode = offlineModesService.getRecommendedMode()
      expect(['read-only', 'essentials', 'full']).toContain(mode)
    })
  })

  describe('getRequiredSpace', () => {
    it('should get required cache space for mode', () => {
      const space = offlineModesService.getRequiredSpace('read-only')
      expect(space).toBe(50)
    })

    it('should return default for invalid mode', () => {
      const space = offlineModesService.getRequiredSpace('invalid')
      expect(space).toBe(50)
    })
  })

  describe('checkAvailableSpace', () => {
    it('should check available storage', async () => {
      const space = await offlineModesService.checkAvailableSpace()
      expect(typeof space).toBe('number')
    })
  })

  describe('requestPersistentStorage', () => {
    it('should request persistent storage', async () => {
      const result = await offlineModesService.requestPersistentStorage()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('isStoragePersistent', () => {
    it('should check if storage is persistent', async () => {
      const result = await offlineModesService.isStoragePersistent()
      expect(typeof result).toBe('boolean')
    })
  })
})
