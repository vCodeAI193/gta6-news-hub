import { readJSON, writeJSON } from './storage'

export interface PrivacySettings {
  profilePublic: boolean
  showActivity: boolean
  showBookmarks: boolean
  allowMentions: boolean
  cookieAnalytics: boolean
  cookieMarketing: boolean
  ageVerified: boolean
}

const DEFAULTS: PrivacySettings = {
  profilePublic: true,
  showActivity: true,
  showBookmarks: false,
  allowMentions: true,
  cookieAnalytics: false,
  cookieMarketing: false,
  ageVerified: false,
}

export function getPrivacySettings(): PrivacySettings {
  return readJSON<PrivacySettings>('privacy_settings', DEFAULTS)
}

export function updatePrivacySettings(patch: Partial<PrivacySettings>): PrivacySettings {
  const settings = { ...getPrivacySettings(), ...patch }
  writeJSON('privacy_settings', settings)
  return settings
}

export interface ConsentRecord {
  purpose: string
  consented: boolean
  timestamp: number
}

export function getConsentLog(): ConsentRecord[] {
  return readJSON<ConsentRecord[]>('consent_log', [])
}

export function recordConsent(purpose: string, consented: boolean): void {
  const log = getConsentLog()
  writeJSON('consent_log', [...log, { purpose, consented, timestamp: Date.now() }])
}

export function exportAllData(): object {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('gta6hub_'))
  const result: Record<string, unknown> = {}
  for (const key of keys) {
    try {
      result[key] = JSON.parse(localStorage.getItem(key) ?? 'null')
    } catch {
      result[key] = localStorage.getItem(key)
    }
  }
  return { exportedAt: new Date().toISOString(), data: result }
}

export function deleteAllUserData(): void {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('gta6hub_'))
  for (const key of keys) localStorage.removeItem(key)
}

export function importUserData(data: Record<string, unknown>): number {
  let count = 0
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('gta6hub_')) {
      localStorage.setItem(key, JSON.stringify(value))
      count++
    }
  }
  return count
}

export function cookieInventory(): Array<{ name: string; purpose: string; expires: string }> {
  return [
    { name: 'gta6hub_prefs', purpose: 'Nutzer-Präferenzen', expires: 'Dauerhaft' },
    { name: 'gta6hub_subscription', purpose: 'Abonnement-Status', expires: 'Dauerhaft' },
    { name: 'gta6hub_auth_token', purpose: 'Authentifizierung (optional)', expires: 'Session' },
    { name: 'gta6hub_notif_prefs', purpose: 'Benachrichtigungs-Einstellungen', expires: 'Dauerhaft' },
  ]
}

export function verifyAge(birthYear: number): boolean {
  return new Date().getFullYear() - birthYear >= 18
}
