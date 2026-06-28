import { storage } from './storage'

export interface Experiment {
  id: string
  name: string
  description: string
  category: 'ui' | 'feature' | 'performance' | 'ai'
  status: 'draft' | 'active' | 'ended'
  optedIn: boolean
  feedbackCount: number
  createdAt: string
}

export interface TimeCapsule {
  id: string
  prediction: string
  authorName: string
  topic: string
  sealedUntil: string
  createdAt: string
  opened: boolean
  votes: number
}

export interface AvatarConfig {
  hair: string
  skin: string
  outfit: string
  accessory: string
  background: string
  name: string
}

const CAPSULES_KEY = 'gta6hub_time_capsules'
const AVATAR_KEY = 'gta6hub_avatar'
const OPT_INS_KEY = 'gta6hub_experiment_optins'

const DEFAULT_EXPERIMENTS: Experiment[] = [
  { id: 'exp1', name: 'Neues Karten-Layout', description: 'Experimentelles Grid-Layout mit größeren Karten und Hover-Previews.', category: 'ui', status: 'active', optedIn: false, feedbackCount: 34, createdAt: '2024-06-01T00:00:00Z' },
  { id: 'exp2', name: 'KI-Schlagzeilen-Zusammenfassung', description: 'Automatische 1-Satz-Zusammenfassung jedes Artikels in der Listenansicht.', category: 'ai', status: 'active', optedIn: false, feedbackCount: 18, createdAt: '2024-07-01T00:00:00Z' },
  { id: 'exp3', name: 'Audio-News (TTS)', description: 'Vorlesen von Artikeln mit natürlicher Text-zu-Sprache-Stimme.', category: 'feature', status: 'active', optedIn: false, feedbackCount: 52, createdAt: '2024-07-15T00:00:00Z' },
  { id: 'exp4', name: 'Reaktiver Hintergrund', description: 'Hero-Bereich reagiert auf Mausbewegungen mit subtilen Paralllax-Effekten.', category: 'ui', status: 'draft', optedIn: false, feedbackCount: 0, createdAt: '2024-08-01T00:00:00Z' },
]

const SEED_CAPSULES: TimeCapsule[] = [
  { id: 'cap1', prediction: 'GTA VI wird 2025 erscheinen', authorName: 'EarlyFan', topic: 'Release', sealedUntil: '2025-12-31T23:59:59Z', createdAt: '2024-01-01T00:00:00Z', opened: false, votes: 156 },
  { id: 'cap2', prediction: 'Jason wird im Laufe der Story zum Antagonisten', authorName: 'TheoryMaster', topic: 'Story', sealedUntil: '2026-01-01T00:00:00Z', createdAt: '2024-03-15T00:00:00Z', opened: false, votes: 43 },
]

export function getExperiments(): Experiment[] {
  const optIns = storage.get<Record<string, boolean>>(OPT_INS_KEY) ?? {}
  return DEFAULT_EXPERIMENTS.map(e => ({ ...e, optedIn: optIns[e.id] ?? false }))
}

export function toggleExperiment(id: string): boolean {
  const optIns = storage.get<Record<string, boolean>>(OPT_INS_KEY) ?? {}
  optIns[id] = !optIns[id]
  storage.set(OPT_INS_KEY, optIns)
  return optIns[id]
}

export function isExperimentActive(id: string): boolean {
  const optIns = storage.get<Record<string, boolean>>(OPT_INS_KEY) ?? {}
  return optIns[id] ?? false
}

export function getTimeCapsules(): TimeCapsule[] {
  const stored = storage.get<TimeCapsule[]>(CAPSULES_KEY)
  if (!stored) { storage.set(CAPSULES_KEY, SEED_CAPSULES); return SEED_CAPSULES }
  return stored
}

export function sealTimeCapsule(prediction: string, authorName: string, topic: string, sealDays: number): TimeCapsule {
  const capsules = getTimeCapsules()
  const sealedUntil = new Date(Date.now() + sealDays * 86400000).toISOString()
  const cap: TimeCapsule = { id: crypto.randomUUID(), prediction, authorName, topic, sealedUntil, createdAt: new Date().toISOString(), opened: false, votes: 0 }
  capsules.push(cap)
  storage.set(CAPSULES_KEY, capsules)
  return cap
}

export function voteTimeCapsule(id: string): void {
  const capsules = getTimeCapsules()
  const cap = capsules.find(c => c.id === id)
  if (cap) { cap.votes++; storage.set(CAPSULES_KEY, capsules) }
}

export function isSealed(cap: TimeCapsule): boolean {
  return new Date(cap.sealedUntil) > new Date()
}

export function getAvatarConfig(): AvatarConfig {
  return storage.get<AvatarConfig>(AVATAR_KEY) ?? {
    hair: 'short',
    skin: 'medium',
    outfit: 'casual',
    accessory: 'none',
    background: 'city',
    name: 'Spieler',
  }
}

export function saveAvatarConfig(config: AvatarConfig): void {
  storage.set(AVATAR_KEY, config)
}

const HAIR_OPTIONS = ['short', 'long', 'braids', 'bun', 'mohawk', 'bald']
const SKIN_OPTIONS = ['light', 'medium', 'tan', 'dark', 'deep']
const OUTFIT_OPTIONS = ['casual', 'street', 'formal', 'beach', 'gta']
const ACCESSORY_OPTIONS = ['none', 'glasses', 'cap', 'chain', 'earrings', 'bandana']
const BG_OPTIONS = ['city', 'beach', 'everglades', 'neon', 'sunset']

export const AVATAR_OPTIONS = { hair: HAIR_OPTIONS, skin: SKIN_OPTIONS, outfit: OUTFIT_OPTIONS, accessory: ACCESSORY_OPTIONS, background: BG_OPTIONS }
