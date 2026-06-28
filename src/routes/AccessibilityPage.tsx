import { useState } from 'react'
import { Seo } from '../components/Seo'
import { applyFontFamily, applyHighContrast, type FontFamily } from '../lib/a11y'
import { useToast } from '../context/ToastContext'

export function AccessibilityPage() {
  const { notify } = useToast()
  const [font, setFont] = useState<FontFamily>('system')
  const [highContrast, setHighContrast] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  function changeFont(f: FontFamily) {
    setFont(f)
    applyFontFamily(f)
    notify(`Schriftart: ${f}`, 'success')
  }

  function toggleHighContrast() {
    const next = !highContrast
    setHighContrast(next)
    applyHighContrast(next)
    notify(next ? 'Hochkontrast aktiviert' : 'Hochkontrast deaktiviert', 'success')
  }

  function toggleReducedMotion() {
    const next = !reducedMotion
    setReducedMotion(next)
    document.documentElement.classList.toggle('force-reduced-motion', next)
    notify(next ? 'Animationen reduziert' : 'Animationen normal', 'success')
  }

  return (
    <>
      <Seo title="Barrierefreiheit" description="Barrierefreiheits-Einstellungen für GTA 6 News Hub." path="/barrierefreiheit" />
      <header className="page-head">
        <h1 className="page-head__title">♿ Barrierefreiheit</h1>
        <p className="page-head__desc">Passe die Darstellung an deine Bedürfnisse an.</p>
      </header>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card__body">
          <h2>Schriftart</h2>
          <div className="facet__chips">
            {(['system', 'dyslexia', 'monospace'] as FontFamily[]).map(f => (
              <button key={f} className={`chip${font === f ? ' chip--active' : ''}`} onClick={() => changeFont(f)}>
                {f === 'system' ? 'Standard' : f === 'dyslexia' ? 'Dyslexie-freundlich' : 'Monospace'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card__body">
          <h2>Darstellung</h2>
          <div className="notif-prefs__list">
            <label className="notif-prefs__row" aria-label="Hochkontrast-Modus">
              <input type="checkbox" checked={highContrast} onChange={toggleHighContrast} />
              <div>
                <strong>Hochkontrast-Modus</strong>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Erhöhter Kontrast für bessere Lesbarkeit</div>
              </div>
            </label>
            <label className="notif-prefs__row" aria-label="Animationen reduzieren">
              <input type="checkbox" checked={reducedMotion} onChange={toggleReducedMotion} />
              <div>
                <strong>Animationen reduzieren</strong>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Weniger Bewegung für Personen mit Vestibulär-Erkrankungen</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card__body">
          <h2>Tastatur-Navigation</h2>
          <p>Alle Funktionen sind per Tastatur erreichbar:</p>
          <ul style={{ paddingLeft: '1.25rem' }}>
            <li><kbd>Tab</kbd> — Nächstes interaktives Element</li>
            <li><kbd>Shift+Tab</kbd> — Vorheriges Element</li>
            <li><kbd>Enter</kbd> / <kbd>Space</kbd> — Element aktivieren</li>
            <li><kbd>Esc</kbd> — Dialoge schließen</li>
            <li><kbd>↑↓</kbd> — In Listen navigieren</li>
          </ul>
          <a href="#main-content" className="btn btn--ghost" style={{ marginTop: '0.75rem', display: 'inline-block' }}>
            Zum Hauptinhalt springen
          </a>
        </div>
      </div>

      <div className="card">
        <div className="card__body">
          <h2>Barrierefreiheits-Erklärung</h2>
          <p>
            GTA 6 News Hub strebt WCAG 2.1 AA-Konformität an. Wir nutzen:
          </p>
          <ul style={{ paddingLeft: '1.25rem' }}>
            <li>Semantisches HTML mit ARIA-Rollen</li>
            <li>Farbkontrastverhältnis ≥ 4.5:1</li>
            <li>Fokus-Indikatoren für alle interaktiven Elemente</li>
            <li>Alternativtexte für alle informativen Bilder</li>
            <li><code>prefers-reduced-motion</code> wird respektiert</li>
            <li>Skip-Link zum Hauptinhalt</li>
          </ul>
          <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Feedback: <a href="mailto:a11y@gta6newshub.de">a11y@gta6newshub.de</a>
          </p>
        </div>
      </div>
    </>
  )
}
