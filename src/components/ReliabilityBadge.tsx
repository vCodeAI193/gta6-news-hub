import type { Reliability } from '../types'

const LABELS: Record<Reliability, string> = {
  confirmed: 'Bestätigt',
  rumor: 'Gerücht',
  unconfirmed: 'Unbestätigt',
}

export function ReliabilityBadge({ reliability }: { reliability?: Reliability }) {
  if (!reliability) return null
  return (
    <span className={`reliability reliability--${reliability}`} title="Verlässlichkeit der Meldung">
      {LABELS[reliability]}
    </span>
  )
}
