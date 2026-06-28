import { useState } from 'react'
import { Seo } from '../components/Seo'
import {
  getPrivacySettings,
  updatePrivacySettings,
  exportAllData,
  deleteAllUserData,
  cookieInventory,
  verifyAge,
  recordConsent,
  type PrivacySettings,
} from '../services/privacyService'
import { useToast } from '../context/ToastContext'

export function PrivacyDashboardPage() {
  const { notify } = useToast()
  const [settings, setSettings] = useState<PrivacySettings>(getPrivacySettings)
  const [birthYear, setBirthYear] = useState('')
  const cookies = cookieInventory()

  function toggle(key: keyof PrivacySettings) {
    const val = !settings[key]
    const updated = updatePrivacySettings({ [key]: val })
    setSettings(updated)
    if (key === 'cookieAnalytics' || key === 'cookieMarketing') {
      recordConsent(key, val)
    }
    notify('Gespeichert', 'success')
  }

  function handleExport() {
    const data = exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'gta6hub-data-export.json'
    a.click()
    URL.revokeObjectURL(url)
    notify('Export gestartet', 'success')
  }

  function handleDelete() {
    if (!window.confirm('Alle Daten unwiderruflich löschen?')) return
    deleteAllUserData()
    notify('Daten gelöscht', 'info')
    window.location.reload()
  }

  function handleAgeVerify() {
    const year = parseInt(birthYear)
    if (verifyAge(year)) {
      updatePrivacySettings({ ageVerified: true })
      setSettings(getPrivacySettings())
      notify('Altersverifizierung erfolgreich', 'success')
    } else {
      notify('Du musst mindestens 18 Jahre alt sein.', 'error')
    }
  }

  const privacyItems: Array<{ key: keyof PrivacySettings; label: string; desc: string }> = [
    { key: 'profilePublic', label: 'Profil öffentlich', desc: 'Dein Profil ist für andere sichtbar.' },
    { key: 'showActivity', label: 'Aktivität anzeigen', desc: 'Kommentare und Reaktionen sind öffentlich.' },
    { key: 'showBookmarks', label: 'Lesezeichen zeigen', desc: 'Deine gespeicherten Artikel sind sichtbar.' },
    { key: 'allowMentions', label: '@Erwähnungen erlauben', desc: 'Andere können dich erwähnen.' },
    { key: 'cookieAnalytics', label: 'Analytics-Cookies', desc: 'Anonyme Nutzungsstatistiken (Plausible).' },
    { key: 'cookieMarketing', label: 'Marketing-Cookies', desc: 'Für personalisierte Inhalte (inaktiv ohne externe Dienste).' },
  ]

  return (
    <>
      <Seo title="Datenschutz-Dashboard" description="Deine Datenschutzeinstellungen auf GTA 6 News Hub." path="/datenschutz-dashboard" />
      <header className="page-head">
        <h1 className="page-head__title">🔏 Datenschutz-Dashboard</h1>
      </header>

      <section className="card" style={{ marginBottom: '2rem' }}>
        <div className="card__body">
          <h2>Privatsphäre-Einstellungen</h2>
          <div className="notif-prefs__list">
            {privacyItems.map(({ key, label, desc }) => (
              <label key={key} className="notif-prefs__row" title={desc} aria-label={label}>
                <input type="checkbox" checked={!!settings[key]} onChange={() => toggle(key)} />
                <div>
                  <strong>{label}</strong>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="card" style={{ marginBottom: '2rem' }}>
        <div className="card__body">
          <h2>Cookie-Inventar</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.4rem' }}>Cookie</th>
                <th style={{ textAlign: 'left', padding: '0.4rem' }}>Zweck</th>
                <th style={{ textAlign: 'left', padding: '0.4rem' }}>Ablauf</th>
              </tr>
            </thead>
            <tbody>
              {cookies.map((c, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border,#444)' }}>
                  <td style={{ padding: '0.4rem', fontFamily: 'monospace', fontSize: '0.8125rem' }}>{c.name}</td>
                  <td style={{ padding: '0.4rem' }}>{c.purpose}</td>
                  <td style={{ padding: '0.4rem', color: 'var(--text-muted)' }}>{c.expires}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {!settings.ageVerified && (
        <section className="card" style={{ marginBottom: '2rem' }}>
          <div className="card__body">
            <h2>Altersverifizierung</h2>
            <p>GTA 6 ist für Spieler ab 18 Jahren. Bitte Geburtsjahr angeben:</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="chat__input"
                type="number"
                placeholder="Geburtsjahr (z. B. 1990)"
                value={birthYear}
                onChange={e => setBirthYear(e.target.value)}
              />
              <button className="btn" onClick={handleAgeVerify}>Bestätigen</button>
            </div>
          </div>
        </section>
      )}

      <section className="card" style={{ marginBottom: '2rem' }}>
        <div className="card__body">
          <h2>Deine Daten (DSGVO)</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Alle Daten werden lokal in deinem Browser gespeichert (localStorage). Exportiere oder lösche sie jederzeit.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn" onClick={handleExport}>📥 Daten exportieren</button>
            <button className="btn btn--ghost" style={{ color: 'var(--error, #e94560)' }} onClick={handleDelete}>
              🗑 Alle Daten löschen
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
