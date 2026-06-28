import { useState, useEffect } from 'react'
import { readJSON, writeJSON, removeKey } from '../services/storage'

interface TourStep {
  title: string
  description: string
  icon: string
}

const STEPS: TourStep[] = [
  { title: 'Willkommen!', description: 'GTA 6 News Hub ist deine Anlaufstelle für alles rund um GTA VI.', icon: '🎮' },
  { title: 'Aktuelle News', description: 'Bleib mit den neuesten Nachrichten, Leaks und Analysen auf dem Laufenden.', icon: '📰' },
  { title: 'Community', description: 'Diskutiere mit anderen Fans, vote auf Leaks und sammle XP-Punkte.', icon: '👥' },
  { title: 'Personalisierung', description: 'Passe deinen Feed an – speichere Favoriten und abonniere Themen.', icon: '⭐' },
  { title: 'Bereit!', description: 'Du kennst jetzt die wichtigsten Features. Viel Spaß beim Erkunden!', icon: '🚀' },
]

const TOUR_KEY = 'gta6hub_tour_done'

export function AppOnboardingTour({ onDone }: { onDone?: () => void }) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!readJSON<boolean>(TOUR_KEY, false)) setVisible(true)
  }, [])

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }

  function finish() {
    writeJSON(TOUR_KEY, true)
    setVisible(false)
    onDone?.()
  }

  if (!visible) return null

  const current = STEPS[step]
  return (
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-label="Onboarding-Tour">
      <div className="tour-modal">
        <div className="tour-icon">{current.icon}</div>
        <h2 className="tour-title">{current.title}</h2>
        <p className="tour-desc">{current.description}</p>
        <div className="tour-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`tour-dot${i === step ? ' tour-dot--active' : ''}`} />
          ))}
        </div>
        <div className="tour-actions">
          <button type="button" className="btn btn--ghost" onClick={finish}>Überspringen</button>
          <button type="button" className="btn" onClick={next}>
            {step === STEPS.length - 1 ? 'Loslegen!' : 'Weiter'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function resetTour() {
  removeKey(TOUR_KEY)
}
