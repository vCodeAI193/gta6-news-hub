import { readJSON, removeKey, writeJSON } from './storage'

/**
 * Schlanker API-Client für das echte Backend (server/). Ist `VITE_API_URL`
 * nicht gesetzt, gilt das Backend als deaktiviert und die App nutzt weiter die
 * localStorage-Service-Schicht (Offline-/Fallback-Betrieb).
 */
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
const TOKEN_KEY = 'auth:token'

export function isApiEnabled(): boolean {
  return Boolean(BASE_URL)
}

export function getToken(): string | null {
  return readJSON<string | null>(TOKEN_KEY, null)
}

export function setToken(token: string | null): void {
  if (token) writeJSON(TOKEN_KEY, token)
  else removeKey(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  auth?: boolean
}

export async function api<T>(path: string, { method = 'GET', body, auth = true }: RequestOptions = {}): Promise<T> {
  if (!BASE_URL) throw new ApiError(0, 'API nicht konfiguriert')

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let data: unknown = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    const message = (data as { error?: string })?.error ?? `HTTP ${res.status}`
    throw new ApiError(res.status, message)
  }
  return data as T
}
