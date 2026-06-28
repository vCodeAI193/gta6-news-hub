import { useEffect, useState } from 'react'

interface Props {
  images: Array<{ src: string; alt?: string; caption?: string }>
  initialIndex?: number
  onClose: () => void
}

export function ImageLightbox({ images, initialIndex = 0, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIndex(i => Math.min(images.length - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  const img = images[index]

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Bildvorschau">
      <button type="button" className="lightbox__backdrop" onClick={onClose} aria-label="Schließen" />
      <div className="lightbox__content">
        <button className="lightbox__close" onClick={onClose} aria-label="Schließen">✕</button>
        <img
          src={img.src}
          alt={img.alt ?? ''}
          className="lightbox__img"
          style={{ transform: `scale(${zoom})` }}
        />
        <div className="lightbox__controls">
          <button className="btn btn--ghost" onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0}>‹</button>
          <span className="lightbox__counter">{index + 1} / {images.length}</span>
          <button className="btn btn--ghost" onClick={() => setIndex(i => Math.min(images.length - 1, i + 1))} disabled={index === images.length - 1}>›</button>
          <button className="btn btn--ghost" onClick={() => setZoom(z => Math.min(3, z + 0.5))}>🔍+</button>
          <button className="btn btn--ghost" onClick={() => setZoom(1)}>1:1</button>
          <button className="btn btn--ghost" onClick={() => setZoom(z => Math.max(0.5, z - 0.5))}>🔍−</button>
        </div>
        {img.caption && <p className="lightbox__caption">{img.caption}</p>}
      </div>
    </div>
  )
}
