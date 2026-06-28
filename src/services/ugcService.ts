import { storage } from './storage'

export type UgcType = 'article' | 'theory' | 'guide' | 'review' | 'fanart' | 'suggestion' | 'translation' | 'meme' | 'mapPoi'

export interface UgcItem {
  id: string
  type: UgcType
  title: string
  content: string
  authorId: string
  authorName: string
  tags: string[]
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  votes: number
  views: number
  createdAt: string
  updatedAt: string
  imageUrl?: string
  licenseType: 'cc0' | 'cc-by' | 'personal'
  reputationBoost: number
}

export interface Suggestion extends UgcItem {
  type: 'suggestion'
  category: 'feature' | 'content' | 'design' | 'bug'
}

const UGC_KEY = 'gta6hub_ugc'
const VOTES_KEY = 'gta6hub_ugc_votes'

const SEED_UGC: UgcItem[] = [
  {
    id: 'ugc1',
    type: 'theory',
    title: 'Lucia ist eine verdeckte DEA-Agentin',
    content: 'Basierend auf Trailer-Details glaube ich, dass Lucias Hintergrund als Strafvollzugsbeamte kein Zufall ist...',
    authorId: 'fan1',
    authorName: 'GtaFan2025',
    tags: ['theorie', 'lucia', 'storyline'],
    status: 'approved',
    votes: 47,
    views: 312,
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z',
    licenseType: 'personal',
    reputationBoost: 0,
  },
  {
    id: 'ugc2',
    type: 'guide',
    title: 'Alle bestätigten Locations aus Trailer 1',
    content: 'Eine vollständige Liste aller im ersten Trailer gezeigten Orte mit Timestamps...',
    authorId: 'fan2',
    authorName: 'TrailerAnalyst',
    tags: ['guide', 'trailer', 'locations'],
    status: 'approved',
    votes: 89,
    views: 756,
    createdAt: '2024-06-10T14:30:00Z',
    updatedAt: '2024-06-10T14:30:00Z',
    licenseType: 'cc-by',
    reputationBoost: 10,
  },
  {
    id: 'ugc3',
    type: 'suggestion',
    title: 'Dunkel-Modus für alle Seiten verbessern',
    content: 'Die Kontrastrating im Dunkel-Modus könnten auf bestimmten Seiten verbessert werden.',
    authorId: 'fan3',
    authorName: 'AccessibFan',
    tags: ['design', 'accessibility'],
    status: 'pending',
    votes: 12,
    views: 45,
    createdAt: '2024-07-01T09:00:00Z',
    updatedAt: '2024-07-01T09:00:00Z',
    licenseType: 'cc0',
    reputationBoost: 0,
  },
]

export function getAllUgc(type?: UgcType, status?: UgcItem['status']): UgcItem[] {
  const all = storage.get<UgcItem[]>(UGC_KEY) ?? SEED_UGC
  return all.filter(u => (!type || u.type === type) && (!status || u.status === status))
}

export function getUgcItem(id: string): UgcItem | null {
  const all = storage.get<UgcItem[]>(UGC_KEY) ?? SEED_UGC
  return all.find(u => u.id === id) ?? null
}

export function submitUgc(item: Omit<UgcItem, 'id' | 'status' | 'votes' | 'views' | 'createdAt' | 'updatedAt' | 'reputationBoost'>): UgcItem {
  const all = storage.get<UgcItem[]>(UGC_KEY) ?? SEED_UGC
  const newItem: UgcItem = {
    ...item,
    id: crypto.randomUUID(),
    status: 'pending',
    votes: 0,
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reputationBoost: 0,
  }
  all.push(newItem)
  storage.set(UGC_KEY, all)
  return newItem
}

export function moderateUgc(id: string, status: 'approved' | 'rejected', boost = 0): UgcItem | null {
  const all = storage.get<UgcItem[]>(UGC_KEY) ?? SEED_UGC
  const item = all.find(u => u.id === id)
  if (!item) return null
  item.status = status
  item.reputationBoost = boost
  item.updatedAt = new Date().toISOString()
  storage.set(UGC_KEY, all)
  return item
}

export function voteUgc(id: string, userId: string, direction: 1 | -1): number {
  const votedKey = `${VOTES_KEY}_${userId}`
  const voted = storage.get<Record<string, number>>(votedKey) ?? {}
  const all = storage.get<UgcItem[]>(UGC_KEY) ?? SEED_UGC
  const item = all.find(u => u.id === id)
  if (!item) return 0
  if (voted[id] === direction) return item.votes
  if (voted[id]) item.votes -= voted[id]
  item.votes += direction
  voted[id] = direction
  storage.set(UGC_KEY, all)
  storage.set(votedKey, voted)
  return item.votes
}

export interface CreatorStats {
  userId: string
  approved: number
  totalVotes: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  rewardPoints: number
}

export function getCreatorStats(userId: string): CreatorStats {
  const all = storage.get<UgcItem[]>(UGC_KEY) ?? SEED_UGC
  const mine = all.filter(u => u.authorId === userId && u.status === 'approved')
  const approved = mine.length
  const totalVotes = mine.reduce((s, u) => s + u.votes, 0)
  const rewardPoints = approved * 10 + totalVotes
  const tier = rewardPoints >= 500 ? 'platinum' : rewardPoints >= 200 ? 'gold' : rewardPoints >= 50 ? 'silver' : 'bronze'
  return { userId, approved, totalVotes, tier, rewardPoints }
}

export function getTopCreators(): CreatorStats[] {
  const all = storage.get<UgcItem[]>(UGC_KEY) ?? SEED_UGC
  const byUser: Record<string, UgcItem[]> = {}
  for (const u of all.filter(u => u.status === 'approved')) {
    if (!byUser[u.authorId]) byUser[u.authorId] = []
    byUser[u.authorId].push(u)
  }
  return Object.keys(byUser).map(userId => {
    const items = byUser[userId]
    const approved = items.length
    const totalVotes = items.reduce((s, u) => s + u.votes, 0)
    const rewardPoints = approved * 10 + totalVotes
    const tier: CreatorStats['tier'] = rewardPoints >= 500 ? 'platinum' : rewardPoints >= 200 ? 'gold' : rewardPoints >= 50 ? 'silver' : 'bronze'
    return { userId, approved, totalVotes, tier, rewardPoints }
  }).sort((a, b) => b.rewardPoints - a.rewardPoints).slice(0, 10)
}
