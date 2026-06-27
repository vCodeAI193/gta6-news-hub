import type { Article } from '../types'
import { loreEntries } from '../data/lore'

export interface GalleryItem {
  src: string
  caption: string
  /** Interner Link zur Quelle (Artikel/Lore). */
  href: string
  source: 'article' | 'lore'
}

/**
 * Sammelt alle Bilder aus Artikeln (Cover + Galerien) und Lore-Einträgen zu
 * einer durchsuchbaren Medienbibliothek (reine Funktion, getestet).
 */
export function collectGallery(articles: Article[]): GalleryItem[] {
  const items: GalleryItem[] = []
  const seen = new Set<string>()
  const add = (src: string, caption: string, href: string, source: GalleryItem['source']) => {
    if (seen.has(src)) return
    seen.add(src)
    items.push({ src, caption, href, source })
  }

  for (const a of articles) {
    add(a.image, a.title, `/news/${a.id}`, 'article')
    for (const g of a.gallery ?? []) add(g, a.title, `/news/${a.id}`, 'article')
  }
  for (const l of loreEntries) add(l.image, l.name, `/lore/${l.id}`, 'lore')

  return items
}

/** Filtert die Galerie nach einem Suchbegriff (Caption). */
export function filterGallery(items: GalleryItem[], query: string): GalleryItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter((i) => i.caption.toLowerCase().includes(q))
}
