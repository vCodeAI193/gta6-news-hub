import { useRef, useState } from 'react'

interface PanoramaViewerProps {
  src: string
  caption?: string
}

/**
 * Einfacher 360°-/Panorama-Viewer: ein breites Bild, das per Ziehen horizontal
 * geschwenkt wird (ohne externe Bibliothek).
 */
export function PanoramaViewer({ src, caption }: PanoramaViewerProps) {
  const [offset, setOffset] = useState(50)
  const drag = useRef<{ x: number; start: number } | null>(null)

  const onDown = (clientX: number) => {
    drag.current = { x: clientX, start: offset }
  }
  const onMove = (clientX: number, width: number) => {
    if (!drag.current) return
    const delta = ((clientX - drag.current.x) / width) * 100
    setOffset(Math.min(100, Math.max(0, drag.current.start - delta)))
  }
  const onUp = () => {
    drag.current = null
  }

  return (
    <figure className="panorama">
      {/* Schwenkbares Panorama: Drag-Handler auf dem Container sind beabsichtigt. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className="panorama__stage"
        onMouseDown={(e) => onDown(e.clientX)}
        onMouseMove={(e) => onMove(e.clientX, e.currentTarget.clientWidth)}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={(e) => onDown(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX, e.currentTarget.clientWidth)}
        onTouchEnd={onUp}
        role="img"
        aria-label={caption ?? '360-Grad-Panorama'}
        style={{ backgroundImage: `url(${src})`, backgroundPositionX: `${offset}%` }}
      >
        <span className="panorama__hint">↔ Ziehen zum Schwenken</span>
      </div>
      {caption && <figcaption className="hotspots__caption">{caption}</figcaption>}
    </figure>
  )
}
