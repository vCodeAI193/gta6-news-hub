import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { PanoramaViewer } from '../components/PanoramaViewer'
import { mapPois, type MapPoi } from '../data/map'

export function MapPage() {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [selected, setSelected] = useState<MapPoi | null>(null)
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  const clampScale = (s: number) => Math.min(3, Math.max(1, s))

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setScale((s) => clampScale(s + (e.deltaY < 0 ? 0.2 : -0.2)))
  }
  const onDown = (e: React.MouseEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }
  const onMove = (e: React.MouseEvent) => {
    if (!drag.current) return
    setOffset({ x: drag.current.ox + (e.clientX - drag.current.x), y: drag.current.oy + (e.clientY - drag.current.y) })
  }
  const onUp = () => {
    drag.current = null
  }
  const reset = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  return (
    <>
      <Seo title="Vice-City-Karte" path="/karte" />
      <header className="page-head">
        <h1 className="page-head__title">🗺️ Interaktive Vice-City-Karte</h1>
        <p className="page-head__desc">
          Zoomen (Mausrad), ziehen zum Verschieben, Marker anklicken. Stilisierte Fan-Karte
          des Bundesstaats Leonida.
        </p>
      </header>

      <div className="mapwrap">
        {/* Interaktive Karte: Pan/Zoom erfordern Maus-Handler auf dem Container. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <div
          className="mapview"
          onWheel={onWheel}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          role="application"
          aria-label="Karte"
        >
          <div
            className="mapview__inner"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
          >
            <svg viewBox="0 0 100 100" className="mapview__bg" preserveAspectRatio="none" aria-hidden="true">
              <rect x="0" y="0" width="100" height="100" fill="#0e2230" />
              <rect x="14" y="18" width="62" height="60" rx="3" fill="#13384a" />
              <path d="M76 8 L96 100 L62 100 Z" fill="#0b2c3a" opacity="0.7" />
              <circle cx="22" cy="30" r="10" fill="#0f4035" opacity="0.7" />
              <rect x="0" y="86" width="100" height="14" fill="#08303f" />
            </svg>
            {mapPois.map((poi) => (
              <button
                key={poi.id}
                type="button"
                className={`mappoi mappoi--${poi.category}${selected?.id === poi.id ? ' mappoi--active' : ''}`}
                style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelected(poi)
                }}
                aria-label={poi.name}
                title={poi.name}
              />
            ))}
          </div>

          <div className="mapview__controls">
            <button type="button" className="icon-btn" onClick={() => setScale((s) => clampScale(s + 0.3))} aria-label="Vergrößern">+</button>
            <button type="button" className="icon-btn" onClick={() => setScale((s) => clampScale(s - 0.3))} aria-label="Verkleinern">−</button>
            <button type="button" className="icon-btn" onClick={reset} aria-label="Zurücksetzen">⟲</button>
          </div>
        </div>

        <aside className="mapinfo">
          {selected ? (
            <>
              <h2 className="mapinfo__title">{selected.name}</h2>
              <p className="badge badge--muted">{selected.category}</p>
              <p>{selected.description}</p>
              {selected.loreId && (
                <Link to={`/lore/${selected.loreId}`} className="modal__source-link">
                  Mehr im Lore-Wiki →
                </Link>
              )}
            </>
          ) : (
            <>
              <h2 className="mapinfo__title">Orte erkunden</h2>
              <p>Wähle einen Marker auf der Karte, um Details zu sehen.</p>
              <ul className="mapinfo__list">
                {mapPois.map((p) => (
                  <li key={p.id}>
                    <button type="button" className="linkbtn" onClick={() => setSelected(p)}>{p.name}</button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>

      <section className="panorama-section">
        <h2 className="section-title">🌆 360°-Panorama: Skyline bei Nacht</h2>
        <PanoramaViewer
          src="https://picsum.photos/seed/gta6-panorama/2400/600"
          caption="Ziehe horizontal, um die Vice-City-Skyline zu schwenken (illustrativ)."
        />
      </section>
    </>
  )
}
