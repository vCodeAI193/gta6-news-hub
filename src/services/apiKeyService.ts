import { storage } from './storage'

export interface ApiKey {
  id: string
  name: string
  key: string
  plan: 'free' | 'basic' | 'pro'
  requestsPerDay: number
  usedToday: number
  createdAt: string
  lastUsedAt: string | null
  active: boolean
}

const KEYS_KEY = 'gta6hub_api_keys'

function generateKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let key = 'ghub_'
  for (let i = 0; i < 32; i++) key += chars[Math.floor(Math.random() * chars.length)]
  return key
}

export function getApiKeys(): ApiKey[] {
  return storage.get<ApiKey[]>(KEYS_KEY) ?? []
}

export function createApiKey(name: string, plan: ApiKey['plan'] = 'free'): ApiKey {
  const quotas = { free: 100, basic: 1000, pro: 10000 }
  const key: ApiKey = {
    id: crypto.randomUUID(),
    name,
    key: generateKey(),
    plan,
    requestsPerDay: quotas[plan],
    usedToday: 0,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    active: true,
  }
  const keys = getApiKeys()
  keys.push(key)
  storage.set(KEYS_KEY, keys)
  return key
}

export function revokeApiKey(id: string): boolean {
  const keys = getApiKeys()
  const idx = keys.findIndex(k => k.id === id)
  if (idx === -1) return false
  keys[idx].active = false
  storage.set(KEYS_KEY, keys)
  return true
}

export function deleteApiKey(id: string): boolean {
  const keys = getApiKeys()
  const filtered = keys.filter(k => k.id !== id)
  if (filtered.length === keys.length) return false
  storage.set(KEYS_KEY, filtered)
  return true
}

export function recordApiUsage(keyId: string): boolean {
  const keys = getApiKeys()
  const key = keys.find(k => k.id === keyId)
  if (!key || !key.active) return false
  if (key.usedToday >= key.requestsPerDay) return false
  key.usedToday++
  key.lastUsedAt = new Date().toISOString()
  storage.set(KEYS_KEY, keys)
  return true
}

export function getApiDocs() {
  return {
    version: 'v1',
    baseUrl: '/api/v1',
    endpoints: [
      { method: 'GET', path: '/articles', description: 'List articles', auth: true },
      { method: 'GET', path: '/articles/:id', description: 'Get article by ID', auth: true },
      { method: 'GET', path: '/categories', description: 'List categories', auth: false },
      { method: 'GET', path: '/search?q=', description: 'Search articles', auth: true },
      { method: 'POST', path: '/webhooks', description: 'Register webhook', auth: true },
    ],
  }
}
