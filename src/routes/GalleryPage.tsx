import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { Lightbox } from '../components/Lightbox'
import { useArticles } from '../hooks/useArticles'
import { collectGallery, filterGallery } from '../lib/gallery'

export function GalleryPage() {
  const { articles } = useArticles()
  const [query, setQuery] = useState('')
  const [lightbox, setLightbox] = useState<string | null>(null)

  const items = useMemo(() => collectGallery(articles), [articles])
  const filtered = useMemo(() => filterGallery(items, query), [items, query])

  return (
    <>
      <Seo title="Galerie" path="/galerie" />
      <header className="page-head">
        <h1 className="page-head__title">🖼️ Galerie & Screenshots</h1>
        <p className="page-head__desc">Alle Bilder aus News-Artikeln und dem Lore-Wiki — durchsuchbar.</p>
      </header>

      <input
        className="search__input gallery__search"
        type="search"
        placeholder="Galerie durchsuchen…"
        aria-label="Galerie durchsuchen"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <p className="feed__count">{filtered.length} Bilder</p>

      {filtered.length === 0 ? (
        <p className="comments__empty">Keine Bilder gefunden.</p>
      ) : (
        <div className="gallery-grid">
          {filtered.map((item) => (
            <figure key={item.src} className="gallery-item">
              <button type="button" className="gallery-item__btn" onClick={() => setLightbox(item.src)} aria-label={`Bild öffnen: ${item.caption}`}>
                <img src={item.src} alt={item.caption} loading="lazy" />
              </button>
              <figcaption className="gallery-item__cap">
                <Link to={item.href}>{item.caption}</Link>
                <span className={`badge badge--muted`}>{item.source === 'lore' ? 'Lore' : 'News'}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </>
  )
}
