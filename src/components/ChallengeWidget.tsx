import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isApiEnabled } from '../services/api'
import { socialApi, type ChallengeState } from '../services/socialApi'

/** Wöchentliche Community-Challenge mit Fortschrittsbalken (nur eingeloggt). */
export function ChallengeWidget() {
  const { user } = useAuth()
  const { notify } = useToast()
  const [state, setState] = useState<ChallengeState | null>(null)

  const load = () => socialApi.challenges().then(setState, () => setState(null))
  useEffect(() => {
    if (isApiEnabled() && user) load()
    else setState(null)
  }, [user])

  if (!isApiEnabled() || !user || !state) return null

  const pct = Math.round((state.progress / state.challenge.goal) * 100)

  const claim = async () => {
    try {
      const { reward } = await socialApi.claimChallenge(state.challenge.id)
      notify(`Challenge gemeistert! +${reward} Reputation 🏅`, 'success')
      load()
    } catch {
      notify('Belohnung konnte nicht abgeholt werden', 'error')
    }
  }

  return (
    <section className="challenge">
      <div className="challenge__head">
        <h3 className="challenge__title">🏅 {state.challenge.title}</h3>
        <span className="challenge__reward">+{state.challenge.reward} Rep</span>
      </div>
      <p className="challenge__desc">{state.challenge.description}</p>
      <div className="challenge__bar">
        <div className="challenge__fill" style={{ width: `${pct}%` }} />
        <span className="challenge__label">{state.progress} / {state.challenge.goal}</span>
      </div>
      {state.completed && !state.claimed && (
        <button type="button" className="btn btn--small" onClick={claim}>Belohnung abholen</button>
      )}
      {state.claimed && <p className="challenge__done">✓ Belohnung erhalten</p>}
    </section>
  )
}
