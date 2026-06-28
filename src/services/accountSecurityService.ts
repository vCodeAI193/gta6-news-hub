/**
 * Account Security Service
 * Handles session geolocation, password history, account recovery, and biometric fallback
 */

export interface SessionLocation {
  ip: string
  country: string
  city: string
  lat: number
  lng: number
  timestamp: number
  trustLevel: 'new' | 'known' | 'trusted'
}

export interface PasswordHistoryEntry {
  hash: string
  setAt: number
}

export interface SecurityQuestion {
  id: string
  question: string
  answerHash: string
}

export interface AccountRecoveryRequest {
  id: string
  userId: string
  status: 'pending' | 'verified' | 'completed' | 'denied'
  requestedAt: number
  verifiedAt?: number
  completedAt?: number
  method: 'security_questions' | 'backup_code' | 'email_verification'
  cooldownUntil?: number
}

class AccountSecurityService {
  private static readonly PASSWORD_HISTORY_SIZE = 12
  private static readonly PASSWORD_REUSE_MONTHS = 12
  private static readonly GEOLOCATION_DISTANCE_THRESHOLD_KM = 100
  private static readonly RECOVERY_COOLDOWN_MS = 24 * 60 * 60 * 1000
  private static readonly RECOVERY_ATTEMPT_LIMIT = 3
  private static readonly RECOVERY_ATTEMPT_WINDOW_MS = 24 * 60 * 60 * 1000

  /**
   * Track login location and check for unusual access
   */
  async trackLoginLocation(userId: string, ipAddress: string): Promise<{
    isUnusual: boolean
    location: SessionLocation
    warning?: string
  }> {
    try {
      const location = await this.getLocationFromIP(ipAddress)
      const previousLocations = await this.getPreviousLocations(userId)

      const isUnusual = this.isUnusualLocation(location, previousLocations)

      const sessionLocation: SessionLocation = {
        ...location,
        timestamp: Date.now(),
        trustLevel: isUnusual ? 'new' : 'known',
      }

      // Store location
      await this.storeSessionLocation(userId, sessionLocation)

      return {
        isUnusual,
        location: sessionLocation,
        warning: isUnusual
          ? `New login detected from ${location.city}, ${location.country}`
          : undefined,
      }
    } catch {
      // Fallback: assume known location
      return {
        isUnusual: false,
        location: {
          ip: ipAddress,
          country: 'Unknown',
          city: 'Unknown',
          lat: 0,
          lng: 0,
          timestamp: Date.now(),
          trustLevel: 'known',
        },
      }
    }
  }

  /**
   * Validate new password doesn't reuse recent passwords
   */
  async validatePasswordNotReused(
    userId: string,
    newPasswordHash: string
  ): Promise<{ isValid: boolean; message?: string }> {
    try {
      const history = await this.getPasswordHistory(userId)

      const recentPasswordHashes = history.slice(0, AccountSecurityService.PASSWORD_HISTORY_SIZE)

      const monthsAgo = AccountSecurityService.PASSWORD_REUSE_MONTHS * 30 * 24 * 60 * 60 * 1000
      const cutoffTime = Date.now() - monthsAgo

      const reusedInRecent = recentPasswordHashes.some(
        entry => entry.setAt > cutoffTime && this.passwordHashesMatch(newPasswordHash, entry.hash)
      )

      if (reusedInRecent) {
        return {
          isValid: false,
          message: `Cannot reuse password from last ${AccountSecurityService.PASSWORD_REUSE_MONTHS} months`,
        }
      }

      return { isValid: true }
    } catch {
      return { isValid: true }
    }
  }

  /**
   * Add password to history
   */
  async addToPasswordHistory(userId: string, passwordHash: string): Promise<void> {
    const entry: PasswordHistoryEntry = {
      hash: passwordHash,
      setAt: Date.now(),
    }

    await fetch(`/api/users/${userId}/password-history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
  }

  /**
   * Create account recovery request
   */
  async initiateAccountRecovery(userId: string): Promise<{
    recoveryId: string
    cooldownUntil?: number
  }> {
    // Check recovery attempt rate limiting
    const recentAttempts = await this.getRecentRecoveryAttempts(userId)
    if (recentAttempts.length >= AccountSecurityService.RECOVERY_ATTEMPT_LIMIT) {
      const oldestAttempt = recentAttempts[0]!.requestedAt
      const canRetryAt = oldestAttempt + AccountSecurityService.RECOVERY_ATTEMPT_WINDOW_MS
      return {
        recoveryId: '',
        cooldownUntil: canRetryAt,
      }
    }

    const recovery: AccountRecoveryRequest = {
      id: `recovery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      status: 'pending',
      requestedAt: Date.now(),
      method: 'security_questions',
    }

    const response = await fetch(`/api/users/${userId}/recovery-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recovery),
    })

    if (!response.ok) throw new Error('Failed to create recovery request')
    const created = await response.json()

    return { recoveryId: created.id }
  }

  /**
   * Verify security questions for account recovery
   */
  async verifySecurityQuestions(
    recoveryId: string,
    answers: Record<string, string>
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`/api/account-recovery/${recoveryId}/verify-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })

      if (!response.ok) {
        return {
          success: false,
          message: 'Incorrect security answers',
        }
      }

      const result = await response.json()
      return {
        success: result.verified,
        message: result.verified ? 'Answers verified. You can now reset your password.' : 'Answers incorrect',
      }
    } catch {
      return {
        success: false,
        message: 'Failed to verify security answers',
      }
    }
  }

  /**
   * Complete account recovery with waiting period
   */
  async completeRecoveryWithWaitingPeriod(
    recoveryId: string,
    newPassword: string
  ): Promise<{ success: boolean; cooldownUntil: number }> {
    const cooldownUntil = Date.now() + AccountSecurityService.RECOVERY_COOLDOWN_MS

    const response = await fetch(`/api/account-recovery/${recoveryId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newPassword,
        cooldownUntil,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to complete recovery')
    }

    return { success: true, cooldownUntil }
  }

  /**
   * Setup biometric authentication with password fallback
   */
  async setupBiometricAuth(userId: string): Promise<{
    biometricToken: string
    requiresPasswordFallback: boolean
  }> {
    // Check if user's device supports biometrics
    const supportsBiometric = await this.checkBiometricSupport()

    const response = await fetch(`/api/users/${userId}/biometric-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supportsDevice: supportsBiometric,
        requiresPasswordFallback: true,
      }),
    })

    if (!response.ok) throw new Error('Failed to setup biometric auth')

    const result = await response.json()
    return {
      biometricToken: result.token,
      requiresPasswordFallback: result.requiresPasswordFallback,
    }
  }

  /**
   * Authenticate with biometric + fallback to password
   */
  async authenticateWithBiometric(userId: string): Promise<{
    success: boolean
    requiresFallback: boolean
    token?: string
  }> {
    // Try biometric first
    const biometricResult = await this.attemptBiometricAuth(userId)

    if (biometricResult.success) {
      return { success: true, requiresFallback: false, token: biometricResult.token }
    }

    // Biometric failed, need password fallback
    return { success: false, requiresFallback: true }
  }

  /**
   * Trust a device for 30 days (skip 2FA)
   */
  async trustDevice(userId: string, deviceId: string, duration: number = 30): Promise<void> {
    const trustUntil = Date.now() + duration * 24 * 60 * 60 * 1000

    await fetch(`/api/users/${userId}/trusted-devices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, trustUntil }),
    })
  }

  /**
   * Check if device is trusted
   */
  async isDeviceTrusted(userId: string, deviceId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/users/${userId}/trusted-devices/${deviceId}`)
      if (!response.ok) return false
      const data = await response.json()
      return data.isTrusted && data.trustUntil > Date.now()
    } catch {
      return false
    }
  }

  // Private helper methods

  private async getLocationFromIP(ip: string): Promise<Omit<SessionLocation, 'timestamp' | 'trustLevel'>> {
    const response = await fetch(`/api/geoip?ip=${ip}`)
    if (!response.ok) throw new Error('Failed to get location')
    return response.json()
  }

  private async getPreviousLocations(userId: string): Promise<SessionLocation[]> {
    try {
      const response = await fetch(`/api/users/${userId}/login-locations`)
      if (!response.ok) return []
      return response.json()
    } catch {
      return []
    }
  }

  private isUnusualLocation(
    newLocation: Omit<SessionLocation, 'timestamp' | 'trustLevel'>,
    previousLocations: SessionLocation[]
  ): boolean {
    if (previousLocations.length === 0) return true

    const knownLocations = previousLocations.filter(l => l.trustLevel !== 'new')
    if (knownLocations.length === 0) return true

    // Check if distance exceeds threshold
    for (const known of knownLocations) {
      const distance = this.calculateDistance(
        newLocation.lat,
        newLocation.lng,
        known.lat,
        known.lng
      )
      if (distance < AccountSecurityService.GEOLOCATION_DISTANCE_THRESHOLD_KM) {
        return false
      }
    }

    return true
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private async storeSessionLocation(userId: string, location: SessionLocation): Promise<void> {
    await fetch(`/api/users/${userId}/login-locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(location),
    })
  }

  private async getPasswordHistory(userId: string): Promise<PasswordHistoryEntry[]> {
    try {
      const response = await fetch(`/api/users/${userId}/password-history`)
      if (!response.ok) return []
      return response.json()
    } catch {
      return []
    }
  }

  private passwordHashesMatch(hash1: string, hash2: string): boolean {
    // In production, use bcrypt.compare()
    return hash1 === hash2
  }

  private async getRecentRecoveryAttempts(userId: string): Promise<AccountRecoveryRequest[]> {
    try {
      const response = await fetch(
        `/api/users/${userId}/recovery-requests?recent=true&limit=${AccountSecurityService.RECOVERY_ATTEMPT_LIMIT}`
      )
      if (!response.ok) return []
      return response.json()
    } catch {
      return []
    }
  }

  private async checkBiometricSupport(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    const navigatorWithBiometric = navigator as { credentials?: { type?: string } }
    return !!(
      window.PublicKeyCredential ||
      navigatorWithBiometric.credentials?.type === 'biometric'
    )
  }

  private async attemptBiometricAuth(userId: string): Promise<{ success: boolean; token?: string }> {
    // This would use WebAuthn biometric capabilities in production
    try {
      const response = await fetch(`/api/users/${userId}/biometric-auth/verify`, {
        method: 'POST',
      })
      if (!response.ok) return { success: false }
      const result = await response.json()
      return { success: result.verified, token: result.token }
    } catch {
      return { success: false }
    }
  }
}

export const accountSecurityService = new AccountSecurityService()
