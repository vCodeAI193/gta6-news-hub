import { createServer } from 'node:http'
import { createApp } from './app.mjs'
import { attachWebSocket, createHub } from './realtime.mjs'

/**
 * Produktiver Einstiegspunkt. Persistente DB-Datei via DB_PATH (Default:
 * server/data.sqlite). Startet HTTP-API + WebSocket-Echtzeit. Start: `npm run server`.
 */
const port = Number(process.env.PORT || 8787)
const dbPath = process.env.DB_PATH || new URL('./data.sqlite', import.meta.url).pathname

const hub = createHub()
const { app } = createApp({ dbPath, hub })
const server = createServer(app)
attachWebSocket(server, hub)

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`🎮 GTA 6 News Hub API läuft auf http://localhost:${port}`)
  // eslint-disable-next-line no-console
  console.log(`   WebSocket: ws://localhost:${port}/ws`)
})
