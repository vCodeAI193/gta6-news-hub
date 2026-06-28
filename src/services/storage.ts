/**
 * Typisierte, namespaced localStorage-Helfer.
 *
 * Bildet die Persistenz-Grundlage der gesamten Mock-Service-Schicht. SSR-/
 * Test-sicher (greift defensiv auf `window` zu) und tolerant gegenüber
 * deaktiviertem Storage oder kaputtem JSON.
 */
const PREFIX = 'gta6hub:'

function hasStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  if (!hasStorage()) return fallback
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON<T>(key: string, value: T): void {
  if (!hasStorage()) return
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* Speicher voll oder gesperrt — bewusst ignoriert. */
  }
}

export function removeKey(key: string): void {
  if (!hasStorage()) return
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignoriert */
  }
}

/** Erzeugt eine einfache, kollisionsarme ID ohne externe Abhängigkeit. */
export function createId(prefix = 'id'): string {
  const rand = Math.floor(performance.now() * 1000) % 1_000_000
  return `${prefix}-${rand.toString(36)}-${(globalThis.crypto?.randomUUID?.() ?? String(rand)).slice(0, 8)}`
}

/**
 * Convenience-Objekt mit get/set/remove-API.
 * Delegiert intern an readJSON / writeJSON / removeKey.
 */
export const storage = {
  get<T>(key: string): T | null {
    if (!hasStorage()) return null
    try {
      const raw = window.localStorage.getItem(PREFIX + key)
      if (raw == null) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  },
  set<T>(key: string, value: T): void {
    writeJSON(key, value)
  },
  remove(key: string): void {
    removeKey(key)
  },
}
