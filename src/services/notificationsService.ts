import { readJSON, writeJSON } from './storage'

export interface NotifPrefs {
  breakingNews: boolean
  comments: boolean
  reactions: boolean
  mentions: boolean
  weeklyDigest: boolean
  countdownMilestones: boolean
  quietHoursStart: number
  quietHoursEnd: number
}

export const DEFAULT_PREFS: NotifPrefs = {
  breakingNews: true,
  comments: true,
  reactions: false,
  mentions: true,
  weeklyDigest: true,
  countdownMilestones: true,
  quietHoursStart: 22,
  quietHoursEnd: 8,
}

export function getNotifPrefs(): NotifPrefs {
  return readJSON<NotifPrefs>('notif_prefs', DEFAULT_PREFS)
}

export function updateNotifPrefs(patch: Partial<NotifPrefs>): NotifPrefs {
  const current = getNotifPrefs()
  const updated = { ...current, ...patch }
  writeJSON('notif_prefs', updated)
  return updated
}

export interface InboxNotif {
  id: string
  type: 'mention' | 'comment' | 'reaction' | 'milestone' | 'breaking'
  message: string
  link?: string
  readAt?: number
  createdAt: number
}

export function getInboxNotifs(): InboxNotif[] {
  return readJSON<InboxNotif[]>('inbox_notifs', [])
}

export function addInboxNotif(n: Omit<InboxNotif, 'id' | 'createdAt'>): InboxNotif {
  const notif: InboxNotif = { ...n, id: crypto.randomUUID(), createdAt: Date.now() }
  const all = getInboxNotifs()
  // Bundle similar: skip if same type+link in last 5 minutes
  const recent = all.find(x => x.type === n.type && x.link === n.link && Date.now() - x.createdAt < 5 * 60 * 1000)
  if (recent) return recent
  writeJSON('inbox_notifs', [...all, notif])
  return notif
}

export function markRead(id: string): void {
  const all = getInboxNotifs().map(n => n.id === id ? { ...n, readAt: Date.now() } : n)
  writeJSON('inbox_notifs', all)
}

export function markAllRead(): void {
  const all = getInboxNotifs().map(n => ({ ...n, readAt: n.readAt ?? Date.now() }))
  writeJSON('inbox_notifs', all)
}

export function unreadCount(): number {
  return getInboxNotifs().filter(n => !n.readAt).length
}

export function isQuietHours(): boolean {
  const prefs = getNotifPrefs()
  const h = new Date().getHours()
  if (prefs.quietHoursStart > prefs.quietHoursEnd) {
    return h >= prefs.quietHoursStart || h < prefs.quietHoursEnd
  }
  return h >= prefs.quietHoursStart && h < prefs.quietHoursEnd
}

export function updateFavicon(count: number): void {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, 32, 32)
  ctx.fillStyle = '#e94560'
  ctx.font = 'bold 20px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(count > 9 ? '9+' : String(count), 16, 23)
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (link) link.href = canvas.toDataURL()
}
