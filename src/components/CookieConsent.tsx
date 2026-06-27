import { usePreferences } from '../context/PreferencesContext'
import { enableAnalytics } from '../lib/analytics'

/** DSGVO-Consent-Banner. Aktiviert Analytics nur nach Zustimmung. */
export function CookieConsent() {
  const { prefs, update } = usePreferences()
  if (prefs.consent !== null) return null

  const accept = () => {
    update({ consent: true })
    enableAnalytics()
  }
  const decline = () => update({ consent: false })

  return (
    <div className="consent" role="dialog" aria-label="Datenschutz-Hinweis">
      <p className="consent__text">
        Wir nutzen optional datenschutzfreundliche Statistik (ohne Cookies, ohne
        personenbezogene Daten), um den Hub zu verbessern.
      </p>
      <div className="consent__actions">
        <button type="button" className="btn btn--small btn--ghost" onClick={decline}>
          Ablehnen
        </button>
        <button type="button" className="btn btn--small" onClick={accept}>
          Einverstanden
        </button>
      </div>
    </div>
  )
}
