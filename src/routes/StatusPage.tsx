import { useEffect, useState } from 'react'
import { Seo } from '../components/Seo'
import { api, isApiEnabled } from '../services/api'
import { useRealtime } from '../context/RealtimeContext'
import { useFlags } from '../context/FlagsContext'

interface Health {
  ok: boolean
  version: string
  uptimeSec: number
  requests: number
  byStatus: Record<string, number>
  byMethod: Record<string, number>
}

function formatUptime(sec: number): string {
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return [d && `${d}d`, h && `${h}h`, `${m}m`].filter(Boolean).join(' ')
}

export function StatusPage() {
  const { online, connected } = useRealtime()
  const flags = useFlags()
  const [health, setHealth] = useState<Health | null>(null)
  const [reachable, setReachable] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isApiEnabled()) {
      setReachable(false)
      return
    }
    const load = () =>
      api<Health>('/api/health', { auth: false }).then(
        (h) => {
          setHealth(h)
          setReachable(true)
        },
        () => setReachable(false),
      )
    load()
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <Seo title="Systemstatus" path="/status" />
      <header className="page-head">
        <h1 className="page-head__title">📡 Systemstatus</h1>
        <p className="page-head__desc">Live-Überblick über API, Echtzeit und aktive Funktionen.</p>
      </header>

      <div className="status-grid">
        <div className="status-card">
          <span className={`status-led ${reachable ? 'status-led--ok' : 'status-led--down'}`} />
          <div>
            <strong>API</strong>
            <p>{reachable === null ? 'Prüfe…' : reachable ? 'Erreichbar' : 'Nicht erreichbar / kein Backend'}</p>
            {health && <p className="status-meta">v{health.version}</p>}
          </div>
        </div>

        <div className="status-card">
          <span className={`status-led ${connected ? 'status-led--ok' : 'status-led--down'}`} />
          <div>
            <strong>Echtzeit (WebSocket)</strong>
            <p>{connected ? `Verbunden · ${online} online` : 'Getrennt'}</p>
          </div>
        </div>

        {health && (
          <>
            <div className="status-card">
              <span className="status-led status-led--ok" />
              <div>
                <strong>Uptime</strong>
                <p>{formatUptime(health.uptimeSec)}</p>
                <p className="status-meta">{health.requests} Requests</p>
              </div>
            </div>
            <div className="status-card status-card--wide">
              <div>
                <strong>Requests nach Status</strong>
                <ul className="status-bars">
                  {Object.entries(health.byStatus).map(([code, n]) => (
                    <li key={code}>
                      <span className="status-bars__label">{code}</span>
                      <span className="status-bars__count">{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      <section>
        <h2 className="section-title">Feature-Flags</h2>
        <ul className="flaglist">
          {Object.entries(flags).map(([key, on]) => (
            <li key={key}>
              <span className={`status-led ${on ? 'status-led--ok' : 'status-led--down'}`} />
              {key}: <strong>{on ? 'aktiv' : 'aus'}</strong>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
