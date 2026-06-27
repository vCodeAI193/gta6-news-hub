export type CategoryId = 'official' | 'trailer' | 'leak' | 'release'

export interface Category {
  id: CategoryId
  /** Display label (German) */
  label: string
  /** Short description shown as a tooltip / meta text */
  description: string
}

export interface Article {
  id: string
  title: string
  /** Short teaser shown on cards */
  excerpt: string
  /** Full article body (plain text paragraphs separated by \n\n) */
  body: string
  category: CategoryId
  /** ISO 8601 date string, e.g. "2026-05-06" */
  date: string
  /** Original source / outlet name */
  source: string
  /** Optional link to the original source */
  sourceUrl?: string
  /** Cover image URL */
  image: string
  /** Marks an article as highlighted (hero) */
  featured?: boolean
}
