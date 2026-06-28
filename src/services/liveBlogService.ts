import { readJSON, writeJSON } from './storage'

export interface LiveBlogPost {
  id: string
  eventId: string
  author: string
  content: string
  type: 'update' | 'highlight' | 'media' | 'poll'
  pinned: boolean
  timestamp: string
  reactions: Record<string, number>
}

export interface LiveEvent {
  id: string
  title: string
  description: string
  startAt: string
  endAt?: string
  timezone: string
  type: 'reveal' | 'trailer' | 'showcase' | 'livestream' | 'release'
  live: boolean
  streamUrl?: string
  iCalUid: string
}

const EVENTS_KEY = 'gta6hub_live_events'
const POSTS_KEY = 'gta6hub_live_posts'

const SEED_EVENTS: LiveEvent[] = [
  {
    id: 'ev1',
    title: 'GTA VI State of Play',
    description: 'Sony PlayStation Showcase mit GTA VI-Fokus',
    startAt: '2025-09-15T18:00:00Z',
    timezone: 'UTC',
    type: 'showcase',
    live: false,
    iCalUid: 'ev1@gta6newshub.de',
  },
  {
    id: 'ev2',
    title: 'GTA VI Gameplay-Trailer',
    description: 'Offizieller Gameplay-Trailer von Rockstar Games',
    startAt: '2025-10-20T17:00:00Z',
    timezone: 'UTC',
    type: 'trailer',
    live: false,
    iCalUid: 'ev2@gta6newshub.de',
  },
  {
    id: 'ev3',
    title: 'GTA VI Release',
    description: 'Globaler Launch von Grand Theft Auto VI',
    startAt: '2025-05-26T00:00:00Z',
    timezone: 'UTC',
    type: 'release',
    live: false,
    iCalUid: 'ev3@gta6newshub.de',
  },
]

export function getLiveEvents(): LiveEvent[] {
  return readJSON<LiveEvent[]>(EVENTS_KEY, SEED_EVENTS)
}

export function addLiveEvent(ev: Omit<LiveEvent, 'id' | 'iCalUid'>): LiveEvent {
  const events = getLiveEvents()
  const id = crypto.randomUUID()
  const newEv: LiveEvent = { ...ev, id, iCalUid: `${id}@gta6newshub.de` }
  events.push(newEv)
  writeJSON(EVENTS_KEY, events)
  return newEv
}

export function setEventLive(eventId: string, live: boolean): void {
  const events = getLiveEvents()
  const ev = events.find(e => e.id === eventId)
  if (ev) { ev.live = live; writeJSON(EVENTS_KEY, events) }
}

export function getLivePosts(eventId: string): LiveBlogPost[] {
  const all = readJSON<LiveBlogPost[]>(POSTS_KEY, [])
  return all.filter(p => p.eventId === eventId).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

export function addLivePost(post: Omit<LiveBlogPost, 'id' | 'timestamp' | 'reactions'>): LiveBlogPost {
  const all = readJSON<LiveBlogPost[]>(POSTS_KEY, [])
  const newPost: LiveBlogPost = {
    ...post,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    reactions: {},
  }
  all.push(newPost)
  writeJSON(POSTS_KEY, all.slice(-500))
  return newPost
}

export function reactToPost(postId: string, emoji: string): void {
  const all = readJSON<LiveBlogPost[]>(POSTS_KEY, [])
  const post = all.find(p => p.id === postId)
  if (!post) return
  post.reactions[emoji] = (post.reactions[emoji] ?? 0) + 1
  writeJSON(POSTS_KEY, all)
}

export function generateIcal(event: LiveEvent): string {
  const start = new Date(event.startAt)
  const end = event.endAt ? new Date(event.endAt) : new Date(start.getTime() + 2 * 60 * 60 * 1000)
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace('T', 'T')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GTA6 News Hub//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.iCalUid}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `DTSTAMP:${fmt(new Date())}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcal(event: LiveEvent): void {
  const content = generateIcal(event)
  const blob = new Blob([content], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${event.title.replace(/\s+/g, '-')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
