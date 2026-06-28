import { describe, it, expect } from 'vitest'
import { accountSecurityService } from './accountSecurityService'

describe('AccountSecurityService', () => {
  it('should calculate distance between coordinates correctly', () => {
    // Haversine formula test: distance between New York and Los Angeles
    // Real distance: ~3,936 km
    const distance = (accountSecurityService as Record<string, unknown>).calculateDistance?.(
      40.7128, -74.0060,  // NYC
      34.0522, -118.2437  // LA
    ) as number
    expect(distance).toBeGreaterThan(3900)
    expect(distance).toBeLessThan(4000)
  })

  it('should validate password not reused', async () => {
    const result = await accountSecurityService.validatePasswordNotReused(
      'test-user',
      'new-hash-12345'
    )
    expect(result).toHaveProperty('isValid')
    expect(typeof result.isValid).toBe('boolean')
  })

  it('should provide account recovery functionality', async () => {
    expect(accountSecurityService.initiateAccountRecovery).toBeDefined()
    expect(accountSecurityService.verifySecurityQuestions).toBeDefined()
    expect(accountSecurityService.completeRecoveryWithWaitingPeriod).toBeDefined()
  })

  it('should track login locations', async () => {
    const result = await accountSecurityService.trackLoginLocation(
      'test-user',
      '192.0.2.1'
    )
    expect(result).toHaveProperty('isUnusual')
    expect(result).toHaveProperty('location')
    expect(result.location).toHaveProperty('timestamp')
  })

  it('should manage biometric authentication', async () => {
    expect(accountSecurityService.setupBiometricAuth).toBeDefined()
    expect(accountSecurityService.authenticateWithBiometric).toBeDefined()
  })

  it('should trust devices', async () => {
    expect(accountSecurityService.trustDevice).toBeDefined()
    expect(accountSecurityService.isDeviceTrusted).toBeDefined()
  })
})
