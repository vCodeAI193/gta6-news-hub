import { useState } from 'react'
import { categories } from '../data/categories'
import { usePreferences } from '../context/PreferencesContext'
import type { CategoryId } from '../types'

/** Einmaliges Onboarding: Interessen wählen → personalisiert den Feed. */
export function OnboardingDialog() {
  const { prefs, update } = usePreferences()
  const [selected, setSelected] = useState<CategoryId[]>(prefs.interests)

  if (prefs.onboarded) return null

  const toggle = (id: CategoryId) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const finish = () => update({ interests: selected, onboarded: true })

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="onb-title">
      <div className="modal onboarding">
        <div className="modal__body">
          <h2 className="modal__title" id="onb-title">
            Willkommen im GTA 6 News Hub 👋
          </h2>
          <p>Wähle deine Interessen — wir gewichten deinen Feed entsprechend.</p>
          <div className="filters">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className="chip"
                aria-pressed={selected.includes(c.id)}
                onClick={() => toggle(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="onboarding__actions">
            <button type="button" className="btn btn--ghost" onClick={() => update({ onboarded: true })}>
              Überspringen
            </button>
            <button type="button" className="btn" onClick={finish}>
              Los geht’s
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
