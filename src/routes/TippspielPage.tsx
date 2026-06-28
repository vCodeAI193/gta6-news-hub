import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isApiEnabled } from '../services/api'
import { socialApi, type PredictionQuestion } from '../services/socialApi'

export function TippspielPage() {
  const { user } = useAuth()
  const { notify } = useToast()
  const [questions, setQuestions] = useState<PredictionQuestion[] | null>(null)

  const load = () => socialApi.predictions().then(setQuestions, () => setQuestions([]))
  useEffect(() => {
    if (isApiEnabled()) load()
    else setQuestions([])
  }, [])

  const vote = async (qid: string, choice: string) => {
    if (!user) {
      notify('Bitte melde dich an, um zu tippen.', 'info')
      return
    }
    await socialApi.predict(qid, choice)
    load()
  }

  return (
    <>
      <Seo title="Release-Tippspiel" path="/tippspiel" />
      <header className="page-head">
        <h1 className="page-head__title">🎯 Release-Tippspiel</h1>
        <p className="page-head__desc">
          Tippe auf den Release und die Details. Auswertung nach dem 19. November 2026.
        </p>
      </header>

      {!isApiEnabled() ? (
        <div className="empty">
          <p className="empty__title">Backend erforderlich</p>
          <p>Das Tippspiel ist nur mit laufendem Server verfügbar.</p>
        </div>
      ) : !questions ? (
        <p className="comments__empty">Lade…</p>
      ) : (
        <div className="polls__grid">
          {questions.map((q) => {
            const total = Object.values(q.counts).reduce((a, b) => a + b, 0)
            const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100))
            return (
              <div className="poll" key={q.id}>
                <p className="poll__q">{q.question}</p>
                <ul className="poll__options">
                  {q.options.map((opt) => {
                    const chosen = q.mine === opt
                    return (
                      <li key={opt}>
                        <button
                          type="button"
                          className={`poll__option${chosen ? ' poll__option--mine' : ''}`}
                          onClick={() => vote(q.id, opt)}
                          aria-pressed={chosen}
                        >
                          <span className="poll__bar" style={{ width: `${q.mine ? pct(q.counts[opt] ?? 0) : 0}%` }} aria-hidden="true" />
                          <span className="poll__label">{opt}</span>
                          {q.mine && <span className="poll__pct">{pct(q.counts[opt] ?? 0)}%</span>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
                <p className="poll__total">{total} Tipps{q.mine ? '' : ' · tippe, um Ergebnisse zu sehen'}</p>
              </div>
            )
          })}
        </div>
      )}

      {!user && isApiEnabled() && (
        <p className="comments__empty">
          <Link to="/login" className="linkbtn">Melde dich an</Link>, um deinen Tipp abzugeben.
        </p>
      )}
    </>
  )
}
