import { useRealtime } from '../context/RealtimeContext'

/** Eilmeldungs-Banner, das per WebSocket an alle Clients gepusht wird. */
export function BreakingNewsBanner() {
  const { breaking, dismissBreaking } = useRealtime()
  if (!breaking) return null

  return (
    <div className="breaking" role="alert">
      <span className="breaking__label">BREAKING</span>
      <span className="breaking__text">{breaking.message}</span>
      <button type="button" className="breaking__close" aria-label="Schließen" onClick={dismissBreaking}>
        ×
      </button>
    </div>
  )
}
