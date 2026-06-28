import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { aiApi, type AiStatus } from '../services/aiApi'
import type { RagSource } from '../lib/aiLocal'

interface Turn {
  role: 'user' | 'assistant'
  text: string
  sources?: RagSource[]
}

const EXAMPLES = [
  'Wann erscheint GTA 6?',
  'Was zeigt der neue Trailer?',
  'Welche Leaks gibt es zur Karte?',
]

/**
 * „Frag den Hub" (FEATURES-3 #4): RAG-Chat, der Fragen aus dem Artikelbestand
 * beantwortet. Ohne Backend rein lokal (Retrieval + extraktive Antwort), mit
 * `ANTHROPIC_API_KEY` formuliert Claude die Antwort.
 */
export function AskHubPage() {
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<AiStatus | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    aiApi.status().then(setStatus)
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns])

  async function ask(question: string) {
    const q = question.trim()
    if (q.length < 3 || busy) return
    setInput('')
    setTurns((prev) => [...prev, { role: 'user', text: q }])
    setBusy(true)
    try {
      const res = await aiApi.ask(q)
      setTurns((prev) => [...prev, { role: 'assistant', text: res.answer, sources: res.sources }])
    } catch {
      setTurns((prev) => [...prev, { role: 'assistant', text: 'Entschuldigung, das hat nicht geklappt.' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Seo title="Frag den Hub" description="Stelle Fragen zu GTA 6 – beantwortet aus allen Artikeln." path="/frag" />
      <header className="page-head">
        <h1 className="page-head__title">🤖 Frag den Hub</h1>
        <p className="page-head__desc">
          Stelle eine Frage zu GTA 6. Die Antwort wird aus den Artikeln des Hubs zusammengestellt.
          {status && (
            <span className="ai-mode">
              {' '}
              Modus: <strong>{status.provider === 'anthropic' ? 'KI (Claude)' : 'lokal/heuristisch'}</strong>
            </span>
          )}
        </p>
      </header>

      <div className="chat">
        {turns.length === 0 && (
          <div className="chat__empty">
            <p>Beispiel-Fragen:</p>
            <div className="chat__examples">
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" className="btn btn--ghost btn--small" onClick={() => ask(ex)}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((turn, i) => (
          <div key={i} className={`chat__turn chat__turn--${turn.role}`}>
            <div className="chat__bubble">
              {turn.text}
              {turn.sources && turn.sources.length > 0 && (
                <div className="chat__sources">
                  <span>Quellen:</span>
                  {turn.sources.map((s) => (
                    <Link key={s.id} to={`/news/${s.id}`} className="chat__source">
                      {s.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && <div className="chat__turn chat__turn--assistant"><div className="chat__bubble">…</div></div>}
        <div ref={endRef} />
      </div>

      <form
        className="chat__form"
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
      >
        <input
          type="text"
          className="chat__input"
          placeholder="Deine Frage zu GTA 6…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Frage eingeben"
        />
        <button type="submit" className="btn" disabled={busy || input.trim().length < 3}>
          Fragen
        </button>
      </form>
    </>
  )
}
