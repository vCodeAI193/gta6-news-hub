export type CategoryId = 'official' | 'trailer' | 'leak' | 'release'

/** Verlässlichkeit einer Meldung — vor allem für Leaks relevant. */
export type Reliability = 'confirmed' | 'rumor' | 'unconfirmed'

/** Veröffentlichungsstatus (für den Admin-/CMS-Workflow). */
export type ArticleStatus = 'published' | 'draft' | 'review' | 'submitted' | 'rejected'

export interface Category {
  id: CategoryId
  /** Anzeigename (Deutsch) */
  label: string
  /** Kurzbeschreibung (Tooltip / Meta-Text) */
  description: string
  /** URL-Slug für Kategorie-Seiten */
  slug: string
}

export interface ArticleSource {
  name: string
  url?: string
}

export interface Article {
  id: string
  title: string
  /** Kurzer Teaser für Karten */
  excerpt: string
  /** Volltext als Markdown */
  body: string
  category: CategoryId
  /** ISO-8601-Datum, z. B. "2026-05-06" */
  date: string
  /** Optionales Aktualisierungsdatum */
  updatedDate?: string
  /** Primärquelle (Kompatibilität + Anzeige) */
  source: string
  /** Optionaler Link zur Primärquelle */
  sourceUrl?: string
  /** Weitere Quellen */
  sources?: ArticleSource[]
  /** Cover-Bild-URL */
  image: string
  /** Optionale weitere Bilder (Galerie) */
  gallery?: string[]
  /** Optionale Video-Einbettung (YouTube-Watch- oder Embed-URL) */
  videoUrl?: string
  /** Freie Schlagworte */
  tags?: string[]
  /** Autor/Redakteur */
  author?: string
  /** Verlässlichkeit der Meldung */
  reliability?: Reliability
  /** Hervorhebung (Hero/Karussell) */
  featured?: boolean
  /** Veröffentlichungsstatus (Default: published) */
  status?: ArticleStatus
  /** Geplante Veröffentlichung (ISO-Datum); vor diesem Datum ausgeblendet */
  publishAt?: string
  /** Markiert nutzergenerierte (Admin-)Artikel aus dem localStorage-Store */
  userCreated?: boolean
  /** Aufrufzähler (vom Backend). */
  views?: number
}
