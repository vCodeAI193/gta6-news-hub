import { describe, expect, it } from 'vitest'
import {
  fallbackSuggestions,
  filterArticles,
  searchSuggestions,
  timeAgo,
} from './filterArticles'
import type { Article } from '../types'

const make = (over: Partial<Article>): Article => ({
  id: 'x',
  title: 'Titel',
  excerpt: 'Teaser',
  body: 'Inhalt',
  category: 'official',
  date: '2026-01-01',
  source: 'Quelle',
  image: 'i',
  ...over,
})

const sample: Article[] = [
  make({ id: 'a', title: 'Trailer 2', category: 'trailer', date: '2026-04-18', tags: ['Vice City'] }),
  make({ id: 'b', title: 'Release', category: 'release', date: '2026-05-06', source: 'Sony' }),
  make({ id: 'c', title: 'Leak Map', category: 'leak', date: '2026-03-29', tags: ['Leonida'] }),
]

describe('filterArticles (erweitert)', () => {
  it('mehrere Kategorien (ODER)', () => {
    const r = filterArticles(sample, { categories: ['trailer', 'leak'] })
    expect(r.map((a) => a.id).sort()).toEqual(['a', 'c'])
  })

  it('Tag-Filter', () => {
    expect(filterArticles(sample, { tag: 'Leonida' }).map((a) => a.id)).toEqual(['c'])
  })

  it('Datumsbereich', () => {
    const r = filterArticles(sample, { from: '2026-04-01', to: '2026-05-31' })
    expect(r.map((a) => a.id).sort()).toEqual(['a', 'b'])
  })

  it('Sortierung nach Quelle', () => {
    const r = filterArticles(sample, { sort: 'source' })
    expect(r[0].source).toBe('Quelle') // alphabetisch vor "Sony"? Q > S? -> "Quelle" < "Sony"
  })

  it('Standard-Sortierung nach Datum absteigend', () => {
    expect(filterArticles(sample, {}).map((a) => a.id)).toEqual(['b', 'a', 'c'])
  })

  it('Fuzzy-Suche findet trotz Tippfehler', () => {
    expect(filterArticles(sample, { query: 'relese' }).map((a) => a.id)).toContain('b')
  })
})

describe('Vorschläge', () => {
  it('Autocomplete aus Titel/Tags', () => {
    expect(searchSuggestions(sample, 'leo')).toContain('Leonida')
  })

  it('Fallback liefert neueste Artikel', () => {
    expect(fallbackSuggestions(sample, {}, 2)).toHaveLength(2)
  })
})

describe('timeAgo', () => {
  it('formatiert relative Zeit', () => {
    const now = new Date('2026-01-01T12:00:00Z')
    expect(timeAgo('2026-01-01T11:00:00Z', now)).toMatch(/Stunde/)
  })
})
