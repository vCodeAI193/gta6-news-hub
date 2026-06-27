import { useState } from 'react'
import { subscribeNewsletter } from '../services/miscServices'
import { useToast } from '../context/ToastContext'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const { notify } = useToast()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (subscribeNewsletter(email)) {
      setDone(true)
      notify('Newsletter abonniert (lokal gespeichert)', 'success')
    } else {
      notify('Bitte gültige E-Mail eingeben', 'error')
    }
  }

  return (
    <section className="newsletter">
      <div>
        <h3 className="newsletter__title">📨 Nichts mehr verpassen</h3>
        <p className="newsletter__text">
          Erhalte die wichtigsten GTA-6-News per E-Mail. (Demo: speichert lokal, kein Versand.)
        </p>
      </div>
      {done ? (
        <p className="newsletter__done">✓ Du bist dabei!</p>
      ) : (
        <form className="newsletter__form" onSubmit={submit}>
          <input
            type="email"
            className="newsletter__input"
            placeholder="deine@email.de"
            aria-label="E-Mail-Adresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn">
            Abonnieren
          </button>
        </form>
      )}
    </section>
  )
}
