import { useState } from 'react'

interface BeforeAfterProps {
  beforeSrc: string
  afterSrc: string
  beforeLabel?: string
  afterLabel?: string
}

/** Vorher/Nachher-Vergleich per Schieberegler (z. B. Trailer 1 vs. Trailer 2). */
export function BeforeAfter({ beforeSrc, afterSrc, beforeLabel = 'Vorher', afterLabel = 'Nachher' }: BeforeAfterProps) {
  const [pos, setPos] = useState(50)

  return (
    <div className="ba">
      <div className="ba__stage">
        <img className="ba__img" src={afterSrc} alt={afterLabel} />
        <div className="ba__clip" style={{ width: `${pos}%` }}>
          <img className="ba__img" src={beforeSrc} alt={beforeLabel} />
        </div>
        <span className="ba__label ba__label--before">{beforeLabel}</span>
        <span className="ba__label ba__label--after">{afterLabel}</span>
        <div className="ba__divider" style={{ left: `${pos}%` }} aria-hidden="true" />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="ba__range"
        aria-label="Vergleich verschieben"
      />
    </div>
  )
}
