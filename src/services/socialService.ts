/**
 * Social & Community Service — Wave 4
 * All persistence via localStorage. Local simulation only.
 * Replace individual functions with real API calls when a backend is available.
 */
import { readJSON, writeJSON, createId } from './storage'

// ─── Direct Messages ────────────────────────────────────────────────────────

export interface DirectMessage {
  id: string
  from: string
  to: string
  text: string
  timestamp: number
}

const ME = 'ich'

export function getMessages(userId: string): DirectMessage[] {
  const all = readJSON<DirectMessage[]>('dm:messages', [])
  return all.filter(
    (m) =>
      (m.from === ME && m.to === userId) || (m.from === userId && m.to === ME),
  )
}

export function sendMessage(to: string, text: string): DirectMessage {
  const msg: DirectMessage = {
    id: createId('dm'),
    from: ME,
    to,
    text,
    timestamp: Date.now(),
  }
  const all = readJSON<DirectMessage[]>('dm:messages', [])
  writeJSON('dm:messages', [...all, msg])
  return msg
}

export function getConversations(): string[] {
  const all = readJSON<DirectMessage[]>('dm:messages', [])
  const partners = new Set<string>()
  for (const m of all) {
    if (m.from !== ME) partners.add(m.from)
    if (m.to !== ME) partners.add(m.to)
  }
  // Seed with some demo conversations so UI isn't empty
  if (partners.size === 0) {
    return ['Vice_Fan99', 'LeonaMiami', 'RockstarWatcher']
  }
  return Array.from(partners)
}

// ─── Groups / Clans ─────────────────────────────────────────────────────────

export interface Group {
  id: string
  name: string
  description: string
  tags: string[]
  memberCount: number
  createdAt: number
}

const DEFAULT_GROUPS: Group[] = [
  {
    id: 'g-leaks',
    name: 'Leak-Jäger',
    description: 'Alles rund um GTA VI Leaks & Gerüchte.',
    tags: ['leaks', 'rumor'],
    memberCount: 342,
    createdAt: 1700000000000,
  },
  {
    id: 'g-trailer',
    name: 'Trailer-Analyse',
    description: 'Frame-by-Frame: Alle Details aus den offiziellen Trailern.',
    tags: ['trailer', 'official'],
    memberCount: 891,
    createdAt: 1700100000000,
  },
  {
    id: 'g-vice',
    name: 'Vice City Fans',
    description: 'Fan-Gruppe für Vice City Nostalgie & neue Einblicke.',
    tags: ['vicecity', 'maps'],
    memberCount: 1204,
    createdAt: 1700200000000,
  },
  {
    id: 'g-theory',
    name: 'Theorie-Schmiede',
    description: 'Kollaborative Theorien zur Story & den Charakteren.',
    tags: ['story', 'theory'],
    memberCount: 567,
    createdAt: 1700300000000,
  },
]

export function getGroups(): Group[] {
  const stored = readJSON<Group[]>('community:groups', [])
  const combined = [...DEFAULT_GROUPS, ...stored]
  const seen = new Set<string>()
  return combined.filter((g) => {
    if (seen.has(g.id)) return false
    seen.add(g.id)
    return true
  })
}

export function createGroup(name: string, description: string): Group {
  const group: Group = {
    id: createId('g'),
    name,
    description,
    tags: [],
    memberCount: 1,
    createdAt: Date.now(),
  }
  const stored = readJSON<Group[]>('community:groups', [])
  writeJSON('community:groups', [...stored, group])
  // Auto-join on create
  joinGroup(group.id)
  return group
}

export function joinGroup(id: string): void {
  const joined = readJSON<string[]>('community:joined', [])
  if (!joined.includes(id)) {
    writeJSON('community:joined', [...joined, id])
  }
}

export function leaveGroup(id: string): void {
  const joined = readJSON<string[]>('community:joined', [])
  writeJSON(
    'community:joined',
    joined.filter((j) => j !== id),
  )
}

export function getJoinedGroups(): string[] {
  return readJSON<string[]>('community:joined', [])
}

// ─── Shared Collections ──────────────────────────────────────────────────────

export interface SharedCollection {
  id: string
  name: string
  articleIds: string[]
  author: string
  createdAt: number
}

export function getCollections(): SharedCollection[] {
  return readJSON<SharedCollection[]>('community:collections', [])
}

export function createCollection(
  name: string,
  articleIds: string[],
): SharedCollection {
  const col: SharedCollection = {
    id: createId('col'),
    name,
    articleIds,
    author: ME,
    createdAt: Date.now(),
  }
  const existing = readJSON<SharedCollection[]>('community:collections', [])
  writeJSON('community:collections', [...existing, col])
  return col
}

export function getCollection(id: string): SharedCollection | null {
  return getCollections().find((c) => c.id === id) ?? null
}

// ─── Block List ───────────────────────────────────────────────────────────────

export function blockUser(username: string): void {
  const blocked = readJSON<string[]>('social:blocked', [])
  if (!blocked.includes(username)) {
    writeJSON('social:blocked', [...blocked, username])
  }
}

export function unblockUser(username: string): void {
  const blocked = readJSON<string[]>('social:blocked', [])
  writeJSON(
    'social:blocked',
    blocked.filter((u) => u !== username),
  )
}

export function getBlockedUsers(): string[] {
  return readJSON<string[]>('social:blocked', [])
}

export function isBlocked(username: string): boolean {
  return getBlockedUsers().includes(username)
}

// ─── Community Events ─────────────────────────────────────────────────────────

export interface CommunityEvent {
  id: string
  title: string
  type: 'watchparty' | 'ama' | 'stream'
  date: string
  description: string
}

const DEFAULT_EVENTS: CommunityEvent[] = [
  {
    id: 'ev-1',
    title: 'Trailer-Watch-Party #2',
    type: 'watchparty',
    date: '2026-07-10',
    description: 'Gemeinsam den nächsten offiziellen Trailer schauen & kommentieren.',
  },
  {
    id: 'ev-2',
    title: 'AMA mit Leak-Analyst Vice_Fan99',
    type: 'ama',
    date: '2026-07-15',
    description: 'Frag den bekanntesten Leak-Analysten der Community live.',
  },
  {
    id: 'ev-3',
    title: 'Community-Stream: GTA VI Theorien',
    type: 'stream',
    date: '2026-07-22',
    description: 'Live-Stream mit Deep-Dive in alle bisherigen Story-Theorien.',
  },
]

export function getEvents(): CommunityEvent[] {
  const stored = readJSON<CommunityEvent[]>('community:events', [])
  const combined = [...DEFAULT_EVENTS, ...stored]
  const seen = new Set<string>()
  return combined.filter((e) => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })
}

export function addEvent(
  event: Omit<CommunityEvent, 'id'>,
): CommunityEvent {
  const ev: CommunityEvent = { ...event, id: createId('ev') }
  const stored = readJSON<CommunityEvent[]>('community:events', [])
  writeJSON('community:events', [...stored, ev])
  return ev
}

// ─── Community Votes ──────────────────────────────────────────────────────────

export interface CommunityVote {
  id: string
  question: string
  options: string[]
  votes: Record<string, number>
  createdAt: number
}

const DEFAULT_VOTES: CommunityVote[] = [
  {
    id: 'vote-1',
    question: 'Welches Feature wollt ihr als nächstes im Hub sehen?',
    options: ['Live-Ticker', 'Koop-Theorien-Board', 'Interaktive Karte', 'Podcast-Sektion'],
    votes: { 'Live-Ticker': 42, 'Koop-Theorien-Board': 28, 'Interaktive Karte': 91, 'Podcast-Sektion': 15 },
    createdAt: 1700000000000,
  },
  {
    id: 'vote-2',
    question: 'Wann erscheint GTA VI eurer Meinung nach?',
    options: ['2025', '2026 Q1', '2026 Q2', '2026 Q3+'],
    votes: { '2025': 5, '2026 Q1': 12, '2026 Q2': 67, '2026 Q3+': 44 },
    createdAt: 1700100000000,
  },
]

export function getVotes(): CommunityVote[] {
  const stored = readJSON<CommunityVote[]>('community:votes', [])
  const combined = [...DEFAULT_VOTES, ...stored]
  const seen = new Set<string>()
  return combined.filter((v) => {
    if (seen.has(v.id)) return false
    seen.add(v.id)
    return true
  })
}

export function castVote(voteId: string, option: string): void {
  const userVotes = readJSON<Record<string, string>>('community:userVotes', {})
  if (userVotes[voteId]) return // already voted

  // Update stored votes
  const stored = readJSON<CommunityVote[]>('community:votes', [])
  const defaults = DEFAULT_VOTES
  const allVotes = [...defaults, ...stored]
  const found = allVotes.find((v) => v.id === voteId)
  if (!found) return

  const updated = { ...found, votes: { ...found.votes, [option]: (found.votes[option] ?? 0) + 1 } }
  const inStored = stored.find((v) => v.id === voteId)
  if (inStored) {
    writeJSON('community:votes', stored.map((v) => (v.id === voteId ? updated : v)))
  } else {
    writeJSON('community:votes', [...stored, updated])
  }

  writeJSON('community:userVotes', { ...userVotes, [voteId]: option })
}

export function getUserVote(voteId: string): string | null {
  const userVotes = readJSON<Record<string, string>>('community:userVotes', {})
  return userVotes[voteId] ?? null
}

// ─── Comment Reactions ────────────────────────────────────────────────────────

export function getCommentReactions(commentId: string): Record<string, number> {
  return readJSON<Record<string, Record<string, number>>>('social:reactions', {})[commentId] ?? {}
}

export function reactToComment(commentId: string, emoji: string): void {
  const allReactions = readJSON<Record<string, Record<string, number>>>('social:reactions', {})
  const userReactions = readJSON<Record<string, string>>('social:userReactions', {})

  const prev = userReactions[commentId]
  const reactions = { ...(allReactions[commentId] ?? {}) }

  if (prev === emoji) {
    // Toggle off
    reactions[prev] = Math.max(0, (reactions[prev] ?? 1) - 1)
    delete userReactions[commentId]
  } else {
    if (prev) {
      reactions[prev] = Math.max(0, (reactions[prev] ?? 1) - 1)
    }
    reactions[emoji] = (reactions[emoji] ?? 0) + 1
    userReactions[commentId] = emoji
  }

  writeJSON('social:reactions', { ...allReactions, [commentId]: reactions })
  writeJSON('social:userReactions', userReactions)
}

export function getUserReaction(commentId: string): string | null {
  return readJSON<Record<string, string>>('social:userReactions', {})[commentId] ?? null
}

// ─── Collaborative Lists ──────────────────────────────────────────────────────

export interface CollabList {
  id: string
  title: string
  type: 'wishlist' | 'theory'
  items: string[]
  contributors: string[]
  createdAt: number
}

const DEFAULT_COLLAB: CollabList[] = [
  {
    id: 'cl-1',
    title: 'GTA VI Wunschliste',
    type: 'wishlist',
    items: ['Echte Polizei-KI', 'Wetter-System', 'Größte Map der Serie', 'Co-Op Story'],
    contributors: ['Vice_Fan99', 'LeonaMiami', 'RockstarWatcher'],
    createdAt: 1700000000000,
  },
  {
    id: 'cl-2',
    title: 'Story-Theorien',
    type: 'theory',
    items: ['Lucia ist Undercoveragentin', 'Jason ist der Antagonist', 'Vice City liegt auf mehreren Inseln'],
    contributors: ['TheoryMaster', 'LeonaMiami'],
    createdAt: 1700100000000,
  },
]

export function getCollabLists(): CollabList[] {
  const stored = readJSON<CollabList[]>('community:collab', [])
  const combined = [...DEFAULT_COLLAB, ...stored]
  const seen = new Set<string>()
  return combined.filter((l) => {
    if (seen.has(l.id)) return false
    seen.add(l.id)
    return true
  })
}

export function addToCollabList(listId: string, item: string): void {
  const stored = readJSON<CollabList[]>('community:collab', [])
  const defaults = DEFAULT_COLLAB
  const all = [...defaults, ...stored]
  const found = all.find((l) => l.id === listId)
  if (!found || found.items.includes(item)) return

  const updated = { ...found, items: [...found.items, item], contributors: [...new Set([...found.contributors, ME])] }
  const inStored = stored.find((l) => l.id === listId)
  if (inStored) {
    writeJSON('community:collab', stored.map((l) => (l.id === listId ? updated : l)))
  } else {
    writeJSON('community:collab', [...stored, updated])
  }
}

// ─── Spotlight (deterministic, weekly rotation) ───────────────────────────────

const SPOTLIGHT_MEMBERS = [
  { name: 'Vice_Fan99', title: 'Leak-Spezialist', bio: 'Analysiert seit 2013 jedes Rockstar-Detail.' },
  { name: 'LeonaMiami', title: 'Lore-Meisterin', bio: 'Kennt jeden NPC-Dialog auswendig.' },
  { name: 'RockstarWatcher', title: 'Trailer-Detektiv', bio: 'Frame-by-Frame Analyse ist meine Passion.' },
  { name: 'TheoryMaster', title: 'Story-Theoretiker', bio: 'Verbindet alle Dots zur großen Theorie.' },
  { name: 'MiamiMapper', title: 'Karten-Experte', bio: 'Hat die Vice City Map auf GPS-Genauigkeit gebracht.' },
  { name: 'SoundtrackGuru', title: 'Audio-Analyst', bio: 'Findet Easter-Eggs in jedem Soundtrack-Clip.' },
  { name: 'NightlifeKing', title: 'Beta-Veteran', bio: 'Seit GTA3 dabei, seit GTA6 besessen.' },
]

export function getSpotlightMember(date = new Date().toISOString().slice(0, 10)) {
  // Weekly rotation: deterministic from ISO week
  const d = new Date(date)
  const week = Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000))
  return SPOTLIGHT_MEMBERS[week % SPOTLIGHT_MEMBERS.length]
}

// ─── Best Comments of the Day (simulated) ────────────────────────────────────

export interface HighlightComment {
  id: string
  author: string
  text: string
  reactions: number
  articleTitle: string
}

const DAILY_HIGHLIGHTS: HighlightComment[] = [
  {
    id: 'h-1',
    author: 'Vice_Fan99',
    text: 'Habt ihr bemerkt, dass der Hubschrauber im Trailer exakt über dem Standort der Malibu-Bar schwebt?',
    reactions: 47,
    articleTitle: 'Trailer 2 Frame-by-Frame Analyse',
  },
  {
    id: 'h-2',
    author: 'LeonaMiami',
    text: 'Das Kennzeichen im Clip „GTAVI26" ist eindeutig ein Easter-Egg für den Release. Bestätigt!',
    reactions: 33,
    articleTitle: 'Easter Eggs im neuesten Trailer',
  },
  {
    id: 'h-3',
    author: 'TheoryMaster',
    text: 'Lucias Tattoo entspricht 1:1 dem Wappen der Vice City PD aus GTA Vice City Stories.',
    reactions: 28,
    articleTitle: 'Charakter-Analyse: Lucia',
  },
]

export function getDailyHighlights(): HighlightComment[] {
  return DAILY_HIGHLIGHTS
}
