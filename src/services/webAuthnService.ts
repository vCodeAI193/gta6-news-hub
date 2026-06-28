/**
 * WebAuthn / FIDO2 Security Keys Service
 * Handles registration and authentication with hardware security keys
 */

export interface SecurityKeyCredential {
  id: string
  credentialId: string
  publicKey: string
  keyName: string
  registeredAt: number
  lastUsedAt?: number
  transports?: string[]
}

export interface RegistrationOptions {
  challenge: string
  rp: {
    name: string
    id: string
  }
  user: {
    id: string
    name: string
    displayName: string
  }
  pubKeyCredParams: Array<{ type: string; alg: number }>
  timeout: number
  attestation: 'none' | 'direct' | 'indirect' | 'enterprise'
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform'
    residentKey?: 'discouraged' | 'preferred' | 'required'
    userVerification?: 'required' | 'preferred' | 'discouraged'
  }
}

export interface AuthenticationOptions {
  challenge: string
  timeout: number
  rpId: string
  userVerification: 'required' | 'preferred' | 'discouraged'
  allowCredentials: Array<{
    id: string
    type: 'public-key'
    transports?: string[]
  }>
}

class WebAuthnService {
  private static readonly CHALLENGE_SIZE = 32
  private static readonly TIMEOUT = 60000 // 1 minute

  /**
   * Check if browser supports WebAuthn
   */
  isSupported(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      navigator.credentials &&
      navigator.credentials.create &&
      navigator.credentials.get
    )
  }

  /**
   * Get registration options for new security key
   */
  async getRegistrationOptions(userId: string, userName: string, displayName: string): Promise<RegistrationOptions> {
    const response = await fetch('/api/auth/webauthn/register/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName, displayName }),
    })

    if (!response.ok) throw new Error('Failed to get registration options')
    return response.json()
  }

  /**
   * Register a new security key
   */
  async registerSecurityKey(
    userId: string,
    keyName: string
  ): Promise<SecurityKeyCredential> {
    if (!WebAuthnService.isSupported()) {
      throw new Error('WebAuthn not supported in this browser')
    }

    // Get registration options from server
    const options = await this.getRegistrationOptions(userId, userId, userId)
    const credentialCreateOptions = {
      ...options,
      challenge: this.base64ToArrayBuffer(options.challenge),
      user: {
        ...options.user,
        id: this.stringToArrayBuffer(options.user.id),
      },
    }

    // Create credential with security key
    const credential = await navigator.credentials.create({
      publicKey: credentialCreateOptions,
    }) as PublicKeyCredential | null

    if (!credential) throw new Error('Failed to create credential')

    // Send to server for verification
    const response = await fetch('/api/auth/webauthn/register/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        keyName,
        credentialId: this.arrayBufferToBase64(credential.id),
        clientDataJSON: this.arrayBufferToBase64(credential.response.clientDataJSON),
        attestationObject: this.arrayBufferToBase64(
          (credential.response as AuthenticatorAttestationResponse).attestationObject
        ),
      }),
    })

    if (!response.ok) throw new Error('Failed to verify and register key')

    return response.json()
  }

  /**
   * Get authentication options for login
   */
  async getAuthenticationOptions(): Promise<AuthenticationOptions> {
    const response = await fetch('/api/auth/webauthn/authenticate/options')
    if (!response.ok) throw new Error('Failed to get authentication options')
    return response.json()
  }

  /**
   * Authenticate with security key
   */
  async authenticateWithKey(): Promise<{ userId: string; token: string }> {
    if (!WebAuthnService.isSupported()) {
      throw new Error('WebAuthn not supported in this browser')
    }

    const options = await this.getAuthenticationOptions()
    const credentialGetOptions = {
      ...options,
      challenge: this.base64ToArrayBuffer(options.challenge),
      allowCredentials: options.allowCredentials.map(cred => ({
        ...cred,
        id: this.base64ToArrayBuffer(cred.id),
      })),
    }

    // Get credential from security key
    const assertion = await navigator.credentials.get({
      publicKey: credentialGetOptions,
    }) as PublicKeyCredential | null

    if (!assertion) throw new Error('Authentication failed')

    // Send to server for verification
    const response = await fetch('/api/auth/webauthn/authenticate/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credentialId: this.arrayBufferToBase64(assertion.id),
        clientDataJSON: this.arrayBufferToBase64(assertion.response.clientDataJSON),
        authenticatorData: this.arrayBufferToBase64(
          (assertion.response as AuthenticatorAssertionResponse).authenticatorData
        ),
        signature: this.arrayBufferToBase64(
          (assertion.response as AuthenticatorAssertionResponse).signature
        ),
        userHandle: assertion.response.userHandle ? this.arrayBufferToBase64(assertion.response.userHandle) : null,
      }),
    })

    if (!response.ok) throw new Error('Authentication verification failed')
    return response.json()
  }

  /**
   * Get user's registered security keys
   */
  async getSecurityKeys(userId: string): Promise<SecurityKeyCredential[]> {
    const response = await fetch(`/api/users/${userId}/security-keys`)
    if (!response.ok) return []
    return response.json()
  }

  /**
   * Revoke a security key
   */
  async revokeSecurityKey(keyId: string): Promise<void> {
    const response = await fetch(`/api/auth/webauthn/keys/${keyId}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to revoke key')
  }

  /**
   * Rename a security key
   */
  async renameSecurityKey(keyId: string, newName: string): Promise<SecurityKeyCredential> {
    const response = await fetch(`/api/auth/webauthn/keys/${keyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyName: newName }),
    })
    if (!response.ok) throw new Error('Failed to rename key')
    return response.json()
  }

  // Helper methods for base64 encoding/decoding
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]!)
    }
    return btoa(binary)
  }

  private stringToArrayBuffer(str: string): ArrayBuffer {
    const encoder = new TextEncoder()
    return encoder.encode(str).buffer
  }
}

export const webAuthnService = new WebAuthnService()
