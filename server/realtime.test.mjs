import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { WebSocket } from 'ws'
import { createApp } from './app.mjs'
import { attachWebSocket, createHub } from './realtime.mjs'

let server
let wss
let base
let wsUrl
const openClients = new Set()

before(async () => {
  const hub = createHub()
  const { app } = createApp({ dbPath: ':memory:', hub })
  server = createServer(app)
  wss = attachWebSocket(server, hub)
  await new Promise((resolve) => server.listen(0, resolve))
  const { port } = server.address()
  base = `http://localhost:${port}`
  wsUrl = `ws://localhost:${port}/ws`
})

after(async () => {
  for (const c of openClients) c.terminate()
  await new Promise((resolve) => wss.close(resolve))
  await new Promise((resolve) => server.close(resolve))
})

function connect() {
  const ws = new WebSocket(wsUrl)
  openClients.add(ws)
  return new Promise((resolve) => ws.on('open', () => resolve(ws)))
}

function waitFor(ws, predicate, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeout)
    const onMsg = (raw) => {
      const msg = JSON.parse(raw.toString())
      if (predicate(msg)) {
        clearTimeout(timer)
        ws.off('message', onMsg)
        resolve(msg)
      }
    }
    ws.on('message', onMsg)
  })
}

async function adminToken() {
  const creds = { email: 'rt@b.de', password: 'password123' }
  const reg = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...creds, displayName: 'RT' }),
  })
  const regBody = await reg.json()
  if (regBody.token) return regBody.token
  // Bereits registriert → einloggen.
  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  })
  return (await login.json()).token
}

describe('Realtime', () => {
  it('zählt Präsenz pro Artikel', async () => {
    const a = await connect()
    const b = await connect()
    a.send(JSON.stringify({ type: 'viewing', articleId: 'X' }))
    b.send(JSON.stringify({ type: 'viewing', articleId: 'X' }))
    const msg = await waitFor(a, (m) => m.type === 'presence' && m.articleId === 'X' && m.count === 2)
    assert.equal(msg.count, 2)
    a.close()
    b.close()
  })

  it('verteilt neue Kommentare live an Betrachter des Artikels', async () => {
    const token = await adminToken()
    const viewer = await connect()
    viewer.send(JSON.stringify({ type: 'viewing', articleId: 'release-date-confirmed' }))
    await new Promise((r) => setTimeout(r, 100))

    const received = waitFor(viewer, (m) => m.type === 'comment')
    await fetch(`${base}/api/articles/release-date-confirmed/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: 'Live-Kommentar!' }),
    })
    const msg = await received
    assert.equal(msg.comment.text, 'Live-Kommentar!')
    viewer.close()
  })

  it('sendet Eilmeldungen an alle', async () => {
    const token = await adminToken()
    const client = await connect()
    const received = waitFor(client, (m) => m.type === 'breaking')
    await fetch(`${base}/api/broadcast/breaking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: 'GTA 6 Trailer 3 ist da!' }),
    })
    const msg = await received
    assert.match(msg.message, /Trailer 3/)
    client.close()
  })
})
