import { describe, it, expect } from 'vitest'
import { buildEntityIndex, entitySuggestions } from './entities'
import type { Article } from '../types'

const make = (over: Partial<Article>): Article => ({
  id: 'x',
  title: 'Titel',
  excerpt: 'Teaser',
  body: 'Inhalt',
  category: 'official',
  date: '2026-01-01',
  source: 'Rockstar',
  image: 'i',
  ...over,
})

const sample: Article[] = [
  make({ id: 'a', tags: ['Vice City', 'Trailer'], author: 'Max Muster', source: 'Rockstar' }),
]

describe('entities', () => {
  it('baut einen Index aus Lore + Artikeln', () => {
    const idx = buildEntityIndex(sample)
    const names = idx.map((e) => e.name)
    expect(names).toContain('Vice City') // Tag/Thema oder Lore-Ort
    expect(names).toContain('Max Muster') // Autor
    expect(names).toContain('Rockstar') // Quelle
    expect(idx.some((e) => e.kind === 'person')).toBe(true) // Lore-Charaktere
  })

  it('schlägt per Präfix vor (Präfix vor Teilstring)', () => {
    const sug = entitySuggestions(sample, 'vice')
    expect(sug[0].toLowerCase().startsWith('vice')).toBe(true)
  })

  it('liefert nichts bei leerer Eingabe', () => {
    expect(entitySuggestions(sample, '')).toEqual([])
  })

  it('dedupliziert Namen', () => {
    const idx = buildEntityIndex([...sample, ...sample])
    const rockstar = idx.filter((e) => e.name === 'Rockstar')
    expect(rockstar.length).toBe(1)
  })
})
