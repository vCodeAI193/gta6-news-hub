import { storage } from './storage'

export type IntegrationId =
  | 'discord'
  | 'twitch'
  | 'youtube'
  | 'reddit'
  | 'twitter'
  | 'bluesky'
  | 'steam'
  | 'igdb'
  | 'deepl'
  | 'mapbox'
  | 'stripe'
  | 'paypal'
  | 'algolia'
  | 'zapier'

export interface Integration {
  id: IntegrationId
  name: string
  description: string
  icon: string
  category: 'social' | 'gaming' | 'translation' | 'payment' | 'search' | 'automation'
  configured: boolean
  enabled: boolean
  configKeys: string[]
}

const INTEGRATIONS_KEY = 'gta6hub_integrations'

const DEFAULTS: Integration[] = [
  { id: 'discord', name: 'Discord', description: 'Rich Presence & Webhooks', icon: '🎮', category: 'social', configured: false, enabled: false, configKeys: ['DISCORD_WEBHOOK_URL', 'DISCORD_CLIENT_ID'] },
  { id: 'twitch', name: 'Twitch', description: 'Stream-Einbettung & Events', icon: '📺', category: 'social', configured: false, enabled: false, configKeys: ['TWITCH_CLIENT_ID', 'TWITCH_CLIENT_SECRET'] },
  { id: 'youtube', name: 'YouTube', description: 'Video-Einbettung & Daten', icon: '▶️', category: 'social', configured: false, enabled: false, configKeys: ['YOUTUBE_API_KEY'] },
  { id: 'reddit', name: 'Reddit', description: 'Subreddit-Aggregation', icon: '🤖', category: 'social', configured: false, enabled: false, configKeys: ['REDDIT_CLIENT_ID', 'REDDIT_CLIENT_SECRET'] },
  { id: 'twitter', name: 'X (Twitter)', description: 'Auto-Crosspost', icon: '✖️', category: 'social', configured: false, enabled: false, configKeys: ['TWITTER_API_KEY', 'TWITTER_API_SECRET'] },
  { id: 'bluesky', name: 'Bluesky', description: 'AT Protocol Crosspost', icon: '🦋', category: 'social', configured: false, enabled: false, configKeys: ['BLUESKY_HANDLE', 'BLUESKY_APP_PASSWORD'] },
  { id: 'steam', name: 'Steam', description: 'Spielinfos & Status', icon: '🎯', category: 'gaming', configured: false, enabled: false, configKeys: ['STEAM_API_KEY'] },
  { id: 'igdb', name: 'IGDB', description: 'Spieldatenbank-Sync', icon: '🕹️', category: 'gaming', configured: false, enabled: false, configKeys: ['IGDB_CLIENT_ID', 'IGDB_CLIENT_SECRET'] },
  { id: 'deepl', name: 'DeepL', description: 'Hochwertige Übersetzungen', icon: '🌐', category: 'translation', configured: false, enabled: false, configKeys: ['DEEPL_API_KEY'] },
  { id: 'mapbox', name: 'Mapbox', description: 'Echte Kartendaten', icon: '🗺️', category: 'search', configured: false, enabled: false, configKeys: ['MAPBOX_TOKEN'] },
  { id: 'stripe', name: 'Stripe', description: 'Zahlungsabwicklung', icon: '💳', category: 'payment', configured: false, enabled: false, configKeys: ['STRIPE_PUBLIC_KEY', 'STRIPE_SECRET_KEY'] },
  { id: 'paypal', name: 'PayPal', description: 'Alternativer Zahlungsweg', icon: '💰', category: 'payment', configured: false, enabled: false, configKeys: ['PAYPAL_CLIENT_ID'] },
  { id: 'algolia', name: 'Algolia', description: 'Suchdienst-Abstraktion', icon: '🔍', category: 'search', configured: false, enabled: false, configKeys: ['ALGOLIA_APP_ID', 'ALGOLIA_API_KEY'] },
  { id: 'zapier', name: 'Zapier', description: 'No-Code-Automatisierung', icon: '⚡', category: 'automation', configured: false, enabled: false, configKeys: ['ZAPIER_WEBHOOK_URL'] },
]

export function getIntegrations(): Integration[] {
  const saved = storage.get<Partial<Integration>[]>(INTEGRATIONS_KEY) ?? []
  return DEFAULTS.map(def => {
    const override = saved.find(s => s.id === def.id)
    return override ? { ...def, ...override } : def
  })
}

export function configureIntegration(id: IntegrationId, config: Record<string, string>): Integration {
  const integrations = getIntegrations()
  const idx = integrations.findIndex(i => i.id === id)
  if (idx === -1) throw new Error(`Unknown integration: ${id}`)
  integrations[idx].configured = Object.values(config).every(v => v.trim().length > 0)
  integrations[idx].enabled = integrations[idx].configured
  storage.set(INTEGRATIONS_KEY, integrations)
  return integrations[idx]
}

export function toggleIntegration(id: IntegrationId, enabled: boolean): Integration {
  const integrations = getIntegrations()
  const idx = integrations.findIndex(i => i.id === id)
  if (idx === -1) throw new Error(`Unknown integration: ${id}`)
  if (!integrations[idx].configured && enabled) throw new Error('Integration not configured')
  integrations[idx].enabled = enabled
  storage.set(INTEGRATIONS_KEY, integrations)
  return integrations[idx]
}

export function getEnabledIntegrations(): Integration[] {
  return getIntegrations().filter(i => i.enabled)
}
