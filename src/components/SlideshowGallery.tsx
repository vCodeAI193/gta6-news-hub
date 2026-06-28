import { useEffect, useState } from 'react'
import { ImageLightbox } from './ImageLightbox'

interface GalleryImage { src: string; alt?: string; caption?: string }

interface Props {
  images: GalleryImage[]
  autoPlay?: boolean
  interval?: number
}

export function SlideshowGallery({ images, autoPlay = false, interval = 4000 }: Props) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(autoPlay)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!playing || images.length < 2) return
    const id = setInterval(() => setIndex(i => (i + 1) % images.length), interval)
    return () => clearInterval(id)
  }, [playing, images.length, interval])

  if (!images.length) return null

  return (
    <div className="gallery">
      <div className="gallery__main">
        <button type="button" className="gallery__zoom-btn" onClick={() => setLightboxIdx(index)} aria-label="Bild vergrößern">
          <img src={images[index].src} alt={images[index].alt ?? ''} className="gallery__img" />
          {images[index].caption && <p className="gallery__caption">{images[index].caption}</p>}
        </button>
      </div>
      <div className="gallery__controls">
        <button className="btn btn--ghost" onClick={() => setIndex(i => Math.max(0, i - 1))}>‹</button>
        <span className="gallery__counter">{index + 1}/{images.length}</span>
        <button className="btn btn--ghost" onClick={() => setIndex(i => Math.min(images.length - 1, i + 1))}>›</button>
        <button className="btn btn--ghost" onClick={() => setPlaying(p => !p)} title="Diashow">
          {playing ? '⏸' : '▶'}
        </button>
      </div>
      <div className="gallery__thumbs">
        {images.map((img, i) => (
          <button type="button" key={i} className={`gallery__thumb-btn${i === index ? ' gallery__thumb--active' : ''}`} onClick={() => setIndex(i)} aria-label={img.alt ?? `Bild ${i + 1}`}>
            <img
              src={img.src}
              alt={img.alt ?? ''}
              className="gallery__thumb"
            />
          </button>
        ))}
      </div>
      {lightboxIdx !== null && (
        <ImageLightbox images={images} initialIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </div>
  )
}
