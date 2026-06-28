import { storage } from './storage'

export interface FeatureFlag {
  key: string
  description: string
  enabled: boolean
  rolloutPercent: number
  targetUsers: string[]
}

const FLAGS_KEY = 'gta6hub_feature_flags'

const DEFAULT_FLAGS: FeatureFlag[] = [
  { key: 'new_search_ui', description: 'Neue Suchoberfläche', enabled: false, rolloutPercent: 0, targetUsers: [] },
  { key: 'ai_summaries', description: 'KI-Zusammenfassungen in Artikeln', enabled: true, rolloutPercent: 100, targetUsers: [] },
  { key: 'live_events', description: 'Live-Blog-Funktionen', enabled: true, rolloutPercent: 100, targetUsers: [] },
  { key: 'ugc_articles', description: 'Nutzerartikel veröffentlichen', enabled: false, rolloutPercent: 0, targetUsers: [] },
  { key: 'ar_preview', description: 'AR-Vorschau (WebXR)', enabled: false, rolloutPercent: 0, targetUsers: [] },
  { key: 'voice_search', description: 'Sprachgesteuerte Suche', enabled: false, rolloutPercent: 0, targetUsers: [] },
  { key: 'premium_content', description: 'Premium-Inhalte', enabled: true, rolloutPercent: 100, targetUsers: [] },
  { key: 'experiment_lab', description: 'Experimentier-Labor', enabled: false, rolloutPercent: 0, targetUsers: [] },
]

export function getFlags(): FeatureFlag[] {
  const saved = storage.get<FeatureFlag[]>(FLAGS_KEY)
  if (!saved) return DEFAULT_FLAGS
  return DEFAULT_FLAGS.map(def => {
    const override = saved.find(s => s.key === def.key)
    return override ? { ...def, ...override } : def
  })
}

export function isEnabled(key: string, userId?: string): boolean {
  const flags = getFlags()
  const flag = flags.find(f => f.key === key)
  if (!flag) return false
  if (!flag.enabled) return false
  if (userId && flag.targetUsers.includes(userId)) return true
  if (flag.rolloutPercent >= 100) return true
  if (flag.rolloutPercent <= 0) return false
  const hash = userId ? userId.split('').reduce((acc, c) => acc ^ c.charCodeAt(0), 0) : 0
  return (hash % 100) < flag.rolloutPercent
}

export function setFlag(key: string, patch: Partial<FeatureFlag>): FeatureFlag {
  const flags = getFlags()
  const idx = flags.findIndex(f => f.key === key)
  if (idx === -1) throw new Error(`Unknown flag: ${key}`)
  const updated = { ...flags[idx], ...patch }
  flags[idx] = updated
  storage.set(FLAGS_KEY, flags)
  return updated
}
