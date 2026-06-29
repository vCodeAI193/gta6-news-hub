import { describe, it, expect, vi, beforeEach } from 'vitest'
import { accountRecoveryService } from './accountRecoveryService'

describe('AccountRecoveryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('requestPasswordReset', () => {
    it('should request password reset', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Email sent' }),
      })

      const result = await accountRecoveryService.requestPasswordReset('user@example.com')
      expect(result.success).toBe(true)
    })
  })

  describe('resetPassword', () => {
    it('should reset password', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Password reset' }),
      })

      const result = await accountRecoveryService.resetPassword('token123', 'newpassword123')
      expect(result.success).toBe(true)
    })
  })

  describe('getRecoveryOptions', () => {
    it('should get recovery options', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { type: 'email', identifier: 'user@example.com', verified: true },
          { type: 'sms', identifier: '+1234567890', verified: false },
        ],
      })

      const options = await accountRecoveryService.getRecoveryOptions('user1')
      expect(options).toHaveLength(2)
      expect(options[0].type).toBe('email')
    })
  })

  describe('generateRecoveryCodes', () => {
    it('should generate recovery codes', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ codes: ['CODE1', 'CODE2', 'CODE3'], createdAt: 1000 }),
      })

      const result = await accountRecoveryService.generateRecoveryCodes('user1')
      expect(result.codes).toHaveLength(3)
    })
  })

  describe('verifyRecoveryCode', () => {
    it('should verify recovery code', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      })

      const valid = await accountRecoveryService.verifyRecoveryCode('user1', 'CODE1')
      expect(valid).toBe(true)
    })
  })

  describe('getBackupCodes', () => {
    it('should get backup codes', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ codes: ['BACKUP1', 'BACKUP2'] }),
      })

      const codes = await accountRecoveryService.getBackupCodes('user1')
      expect(codes).toHaveLength(2)
    })
  })

  describe('getRecoveryStatus', () => {
    it('should get recovery status', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hasRecoveryOptions: true,
          hasRecoveryCodes: true,
          hasBackupCodes: false,
        }),
      })

      const status = await accountRecoveryService.getRecoveryStatus('user1')
      expect(status?.hasRecoveryOptions).toBe(true)
    })
  })
})
