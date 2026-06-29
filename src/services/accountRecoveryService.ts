/**
 * Account Recovery Service
 * Handles password resets, account recovery, and security recovery options
 */

export interface RecoveryOption {
  type: 'email' | 'sms' | 'security_key' | 'recovery_code'
  identifier: string
  verified: boolean
  lastUsed?: number
}

export interface RecoveryToken {
  token: string
  userId: string
  type: 'password_reset' | 'account_recovery' | 'email_verification'
  expiresAt: number
  used: boolean
}

class AccountRecoveryService {
  /**
   * Request password reset
   */
  async requestPasswordReset(emailOrUsername: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch('/api/auth/password-reset-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername }),
    })

    if (!response.ok) {
      return { success: false, message: 'Failed to request password reset' }
    }
    return response.json()
  }

  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(token: string): Promise<boolean> {
    const response = await fetch('/api/auth/verify-reset-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) return false
    const result = await response.json()
    return result.valid ?? false
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    })

    if (!response.ok) {
      return { success: false, message: 'Failed to reset password' }
    }
    return response.json()
  }

  /**
   * Get recovery options for user
   */
  async getRecoveryOptions(userId: string): Promise<RecoveryOption[]> {
    const response = await fetch(`/api/users/${userId}/recovery-options`)
    if (!response.ok) return []
    return response.json()
  }

  /**
   * Add recovery option
   */
  async addRecoveryOption(userId: string, type: RecoveryOption['type'], identifier: string): Promise<RecoveryOption> {
    const response = await fetch(`/api/users/${userId}/recovery-options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, identifier }),
    })

    if (!response.ok) throw new Error('Failed to add recovery option')
    return response.json()
  }

  /**
   * Remove recovery option
   */
  async removeRecoveryOption(userId: string, type: RecoveryOption['type']): Promise<void> {
    const response = await fetch(`/api/users/${userId}/recovery-options/${type}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to remove recovery option')
  }

  /**
   * Generate recovery codes
   */
  async generateRecoveryCodes(userId: string): Promise<{ codes: string[]; createdAt: number }> {
    const response = await fetch(`/api/users/${userId}/recovery-codes`, {
      method: 'POST',
    })

    if (!response.ok) throw new Error('Failed to generate recovery codes')
    return response.json()
  }

  /**
   * Verify recovery code
   */
  async verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
    const response = await fetch('/api/auth/verify-recovery-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code }),
    })

    if (!response.ok) return false
    const result = await response.json()
    return result.valid ?? false
  }

  /**
   * Request account recovery
   */
  async requestAccountRecovery(email: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch('/api/auth/account-recovery-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      return { success: false, message: 'Failed to request account recovery' }
    }
    return response.json()
  }

  /**
   * Verify identity for recovery
   */
  async verifyIdentity(
    userId: string,
    method: 'email' | 'sms' | 'security_key',
    verificationCode?: string
  ): Promise<{ verified: boolean; recoveryToken?: string }> {
    const response = await fetch('/api/auth/verify-recovery-identity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, method, verificationCode }),
    })

    if (!response.ok) {
      return { verified: false }
    }
    return response.json()
  }

  /**
   * Get backup codes for emergency access
   */
  async getBackupCodes(userId: string): Promise<string[]> {
    const response = await fetch(`/api/users/${userId}/backup-codes`)
    if (!response.ok) return []
    const result = await response.json()
    return result.codes ?? []
  }

  /**
   * Validate backup code
   */
  async validateBackupCode(userId: string, code: string): Promise<boolean> {
    const response = await fetch('/api/auth/validate-backup-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code }),
    })

    if (!response.ok) return false
    const result = await response.json()
    return result.valid ?? false
  }

  /**
   * Get recovery status for account
   */
  async getRecoveryStatus(userId: string): Promise<{
    hasRecoveryOptions: boolean
    hasRecoveryCodes: boolean
    hasBackupCodes: boolean
    lastRecoveryAttempt?: number
  } | null> {
    const response = await fetch(`/api/users/${userId}/recovery-status`)
    if (!response.ok) return null
    return response.json()
  }
}

export const accountRecoveryService = new AccountRecoveryService()
