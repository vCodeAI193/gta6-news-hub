import { useEffect, useState } from 'react'
import { aiApi } from '../services/aiApi'

/**
 * KI-Artikelzusammenfassung (FEATURES-3 #1): zeigt ein knappes TL;DR oben im
 * Artikel. Quelle ist `aiApi` (Backend/Anthropic, sonst lokale Heuristik).
 */
export function ArticleSummary({ text }: { text: string }) {
  const [summary, setSummary] = useState<string>('')
  const [provider, setProvider] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    aiApi
      .summarize(text, 2)
      .then((r) => {
        if (!active) return
        setSummary(r.summary)
        setProvider(r.provider)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [text])

  if (loading) return <div className="tldr tldr--loading">📝 Zusammenfassung wird erstellt…</div>
  if (!summary) return null

  return (
    <aside className="tldr" aria-label="Zusammenfassung">
      <p className="tldr__label">
        🤖 TL;DR
        {provider === 'anthropic' && <span className="tldr__badge">KI</span>}
      </p>
      <p className="tldr__text">{summary}</p>
    </aside>
  )
}
