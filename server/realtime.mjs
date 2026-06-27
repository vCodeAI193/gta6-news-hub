import { EventEmitter } from 'node:events'
import { WebSocketServer } from 'ws'

/**
 * Echtzeit-Schicht: ein simpler Hub (EventEmitter), den die API-Routen zum
 * Publizieren von Domain-Events nutzen, plus ein WebSocket-Server, der diese an
 * verbundene Clients verteilt und Präsenz ("X lesen gerade") berechnet.
 */
export function createHub() {
  const emitter = new EventEmitter()
  emitter.setMaxListeners(0)
  return {
    publish: (type, payload) => emitter.emit('event', { type, payload }),
    on: (handler) => emitter.on('event', handler),
    off: (handler) => emitter.off('event', handler),
  }
}

/** Hängt einen WebSocket-Server an den HTTP-Server und verbindet ihn mit dem Hub. */
export function attachWebSocket(server, hub) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  // socket -> aktuell betrachtete articleId (für Präsenz & gezielte Events)
  const viewing = new Map()

  const send = (socket, message) => {
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(message))
  }
  const broadcast = (message) => {
    for (const client of wss.clients) send(client, message)
  }

  const presenceFor = (articleId) => {
    let count = 0
    for (const id of viewing.values()) if (id === articleId) count += 1
    return count
  }
  const sendPresence = (articleId) => {
    if (!articleId) return
    const count = presenceFor(articleId)
    for (const client of wss.clients) {
      if (viewing.get(client) === articleId) send(client, { type: 'presence', articleId, count })
    }
  }
  const sendOnline = () => broadcast({ type: 'online', count: wss.clients.size })

  wss.on('connection', (socket) => {
    viewing.set(socket, null)
    send(socket, { type: 'welcome' })
    sendOnline()

    socket.on('message', (raw) => {
      let msg
      try {
        msg = JSON.parse(raw.toString())
      } catch {
        return
      }
      if (msg.type === 'viewing') {
        const previous = viewing.get(socket)
        viewing.set(socket, msg.articleId ?? null)
        if (previous) sendPresence(previous)
        if (msg.articleId) sendPresence(msg.articleId)
      }
    })

    socket.on('close', () => {
      const previous = viewing.get(socket)
      viewing.delete(socket)
      if (previous) sendPresence(previous)
      sendOnline()
    })
  })

  // Domain-Events aus den API-Routen an die Clients weiterreichen.
  hub.on(({ type, payload }) => {
    if (type === 'comment') {
      for (const client of wss.clients) {
        if (viewing.get(client) === payload.articleId) {
          send(client, { type: 'comment', articleId: payload.articleId, comment: payload.comment })
        }
      }
    } else if (type === 'article') {
      broadcast({ type: 'article', action: payload.action, id: payload.id })
    } else if (type === 'breaking') {
      broadcast({ type: 'breaking', id: payload.id, message: payload.message })
    }
  })

  return wss
}
