import { useEffect } from 'react'

interface LightboxProps {
  src: string
  onClose: () => void
}

/** Vollbild-Ansicht für Galeriebilder. Schließt mit Escape/Klick. */
export function Lightbox({ src, onClose }: LightboxProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Bildansicht">
      <button type="button" className="lightbox__bg" aria-label="Schließen" onClick={onClose} />
      <button type="button" className="modal__close" aria-label="Schließen" onClick={onClose}>
        ×
      </button>
      <img src={src} alt="" className="lightbox__img" />
    </div>
  )
}

interface GalleryProps {
  images: string[]
  onSelect: (src: string) => void
}

export function Gallery({ images, onSelect }: GalleryProps) {
  if (images.length === 0) return null
  return (
    <div className="gallery">
      {images.map((src) => (
        <button key={src} type="button" className="gallery__thumb" onClick={() => onSelect(src)}>
          <img src={src} alt="" loading="lazy" />
        </button>
      ))}
    </div>
  )
}
