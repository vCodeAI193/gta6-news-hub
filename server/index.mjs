import { createApp } from './app.mjs'

/**
 * Produktiver Einstiegspunkt. Persistente DB-Datei via DB_PATH (Default:
 * server/data.sqlite). Start: `npm run server`.
 */
const port = Number(process.env.PORT || 8787)
const dbPath = process.env.DB_PATH || new URL('./data.sqlite', import.meta.url).pathname

const { app } = createApp({ dbPath })

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`🎮 GTA 6 News Hub API läuft auf http://localhost:${port}`)
  // eslint-disable-next-line no-console
  console.log(`   Health: http://localhost:${port}/api/health`)
})
