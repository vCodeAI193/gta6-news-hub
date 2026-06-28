/**
 * Entitäts-Autocomplete (FEATURES-3 #12): Vorschläge zu Personen, Orten und
 * Themen. Speist sich aus dem Lore-Wiki (benannte Entitäten mit Typ) sowie aus
 * Artikel-Tags, -Quellen und -Autoren. Rein funktional und getestet.
 */
import type { Article } from '../types'
import { loreEntries } from '../data/lore'

export interface Entity {
  name: string
  kind: 'person' | 'ort' | 'fraktion' | 'thema' | 'quelle' | 'autor'
}

const LORE_KIND: Record<string, Entity['kind']> = {
  character: 'person',
  location: 'ort',
  faction: 'fraktion',
}

/** Baut den (deduplizierten) Entitäts-Index aus Lore + Artikeln. */
export function buildEntityIndex(articles: Article[]): Entity[] {
  const map = new Map<string, Entity>()
  const add = (name: string, kind: Entity['kind']) => {
    const key = name.trim().toLowerCase()
    if (key && !map.has(key)) map.set(key, { name: name.trim(), kind })
  }
  for (const e of loreEntries) add(e.name, LORE_KIND[e.type] ?? 'thema')
  for (const a of articles) {
    for (const tag of a.tags ?? []) add(tag, 'thema')
    if (a.source) add(a.source, 'quelle')
    if (a.author) add(a.author, 'autor')
  }
  return [...map.values()]
}

/** Liefert passende Entitäts-Namen zu einer (Teil-)Eingabe. */
export function entitySuggestions(articles: Article[], query: string, limit = 6): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const index = buildEntityIndex(articles)
  const starts: string[] = []
  const contains: string[] = []
  for (const e of index) {
    const lower = e.name.toLowerCase()
    if (lower.startsWith(q)) starts.push(e.name)
    else if (lower.includes(q)) contains.push(e.name)
  }
  return [...starts, ...contains].slice(0, limit)
}
