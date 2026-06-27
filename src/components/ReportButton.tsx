import { useState } from 'react'
import { reportArticle } from '../services/miscServices'
import { useToast } from '../context/ToastContext'

const REASONS = ['Falschinformation', 'Veralteter Inhalt', 'Defekter Link', 'Sonstiges']

export function ReportButton({ articleId }: { articleId: string }) {
  const [open, setOpen] = useState(false)
  const { notify } = useToast()

  const submit = (reason: string) => {
    reportArticle(articleId, reason)
    setOpen(false)
    notify('Danke! Deine Meldung wurde erfasst.', 'success')
  }

  return (
    <div className="report">
      <button type="button" className="btn btn--small btn--ghost" onClick={() => setOpen((o) => !o)}>
        ⚑ Melden
      </button>
      {open && (
        <div className="report__menu" role="menu">
          {REASONS.map((r) => (
            <button key={r} type="button" className="report__item" role="menuitem" onClick={() => submit(r)}>
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
