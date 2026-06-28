import { readJSON, writeJSON } from './storage'

export interface ChatMessage {
  id: string
  roomId: string
  userId: string
  username: string
  text: string
  timestamp: string
  pinned: boolean
  moderated: boolean
}

export interface ChatRoom {
  id: string
  eventId: string
  slowModeSeconds: number
  active: boolean
}

const ROOMS_KEY = 'gta6hub_chat_rooms'
const MSGS_KEY = 'gta6hub_chat_messages'
const LAST_MSG_KEY = 'gta6hub_chat_last_msg'

export function getOrCreateRoom(eventId: string): ChatRoom {
  const rooms = readJSON<ChatRoom[]>(ROOMS_KEY, [])
  const existing = rooms.find(r => r.eventId === eventId)
  if (existing) return existing
  const room: ChatRoom = {
    id: crypto.randomUUID(),
    eventId,
    slowModeSeconds: 30,
    active: true,
  }
  rooms.push(room)
  writeJSON(ROOMS_KEY, rooms)
  return room
}

export function setSlowMode(roomId: string, seconds: number): void {
  const rooms = readJSON<ChatRoom[]>(ROOMS_KEY, [])
  const room = rooms.find(r => r.id === roomId)
  if (room) { room.slowModeSeconds = seconds; writeJSON(ROOMS_KEY, rooms) }
}

export function sendMessage(roomId: string, userId: string, username: string, text: string): ChatMessage | null {
  const rooms = readJSON<ChatRoom[]>(ROOMS_KEY, [])
  const room = rooms.find(r => r.id === roomId)
  if (!room || !room.active) return null

  const lastMsgKey = `${LAST_MSG_KEY}_${roomId}_${userId}`
  const lastMsgAt = readJSON<string>(lastMsgKey, '')
  if (lastMsgAt) {
    const elapsed = (Date.now() - new Date(lastMsgAt).getTime()) / 1000
    if (elapsed < room.slowModeSeconds) return null
  }

  const msgs = readJSON<ChatMessage[]>(MSGS_KEY, [])
  const msg: ChatMessage = {
    id: crypto.randomUUID(),
    roomId,
    userId,
    username,
    text: text.slice(0, 500),
    timestamp: new Date().toISOString(),
    pinned: false,
    moderated: false,
  }
  msgs.push(msg)
  writeJSON(MSGS_KEY, msgs.slice(-1000))
  writeJSON(lastMsgKey, msg.timestamp)
  return msg
}

export function getMessages(roomId: string, limit = 100): ChatMessage[] {
  const msgs = readJSON<ChatMessage[]>(MSGS_KEY, [])
  return msgs.filter(m => m.roomId === roomId && !m.moderated).slice(-limit)
}

export function pinMessage(msgId: string): void {
  const msgs = readJSON<ChatMessage[]>(MSGS_KEY, [])
  const msg = msgs.find(m => m.id === msgId)
  if (msg) { msg.pinned = true; writeJSON(MSGS_KEY, msgs) }
}

export function deleteMessage(msgId: string): void {
  const msgs = readJSON<ChatMessage[]>(MSGS_KEY, [])
  const msg = msgs.find(m => m.id === msgId)
  if (msg) { msg.moderated = true; writeJSON(MSGS_KEY, msgs) }
}
