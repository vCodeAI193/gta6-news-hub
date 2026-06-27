import { useState } from 'react'

export interface Hotspot {
  id: string
  x: number // Prozent
  y: number
  label: string
  detail: string
}

interface HotspotsProps {
  image: string
  hotspots: Hotspot[]
  caption?: string
}

/** Annotiertes Standbild mit anklickbaren Hotspots (Trailer-Frame-Analyse). */
export function Hotspots({ image, hotspots, caption }: HotspotsProps) {
  const [active, setActive] = useState<string | null>(null)
  const current = hotspots.find((h) => h.id === active)

  return (
    <figure className="hotspots">
      <div className="hotspots__stage">
        <img src={image} alt={caption ?? 'Annotiertes Standbild'} className="hotspots__img" />
        {hotspots.map((h) => (
          <button
            key={h.id}
            type="button"
            className={`hotspots__dot${active === h.id ? ' hotspots__dot--active' : ''}`}
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
            aria-label={h.label}
            onClick={() => setActive(active === h.id ? null : h.id)}
          >
            {hotspots.indexOf(h) + 1}
          </button>
        ))}
        {current && (
          <div className="hotspots__popover" style={{ left: `${current.x}%`, top: `${current.y}%` }}>
            <strong>{current.label}</strong>
            <p>{current.detail}</p>
          </div>
        )}
      </div>
      {caption && <figcaption className="hotspots__caption">{caption}</figcaption>}
    </figure>
  )
}
