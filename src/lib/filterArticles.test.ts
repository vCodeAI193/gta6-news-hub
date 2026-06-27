import { describe, expect, it } from 'vitest'
import { filterArticles, formatDate } from './filterArticles'
import type { Article } from '../types'

const sample: Article[] = [
  {
    id: 'a',
    title: 'Trailer 2 ist da',
    excerpt: 'Vice City bei Nacht',
    body: 'Lucia und Jason',
    category: 'trailer',
    date: '2026-04-18',
    source: 'Rockstar Games',
    image: 'x',
  },
  {
    id: 'b',
    title: 'Release bestätigt',
    excerpt: 'November 2026',
    body: 'Holiday window',
    category: 'release',
    date: '2026-05-06',
    source: 'Rockstar Newswire',
    image: 'x',
  },
  {
    id: 'c',
    title: 'Map Leak',
    excerpt: 'Leonida',
    body: 'unbestätigt',
    category: 'leak',
    date: '2026-03-29',
    source: 'Forum',
    image: 'x',
  },
]

describe('filterArticles', () => {
  it('returns all articles when no filter is given', () => {
    expect(filterArticles(sample, {})).toHaveLength(3)
  })

  it('filters by category', () => {
    const result = filterArticles(sample, { category: 'leak' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('c')
  })

  it('treats "all" as no category restriction', () => {
    expect(filterArticles(sample, { category: 'all' })).toHaveLength(3)
  })

  it('matches the query against the title', () => {
    const result = filterArticles(sample, { query: 'trailer' })
    expect(result.map((a) => a.id)).toEqual(['a'])
  })

  it('matches the query against the body and source', () => {
    expect(filterArticles(sample, { query: 'lucia' })).toHaveLength(1)
    expect(filterArticles(sample, { query: 'newswire' })).toHaveLength(1)
  })

  it('is case-insensitive and trims whitespace', () => {
    expect(filterArticles(sample, { query: '  LEONIDA ' })).toHaveLength(1)
  })

  it('combines query and category', () => {
    expect(
      filterArticles(sample, { query: '2026', category: 'release' }),
    ).toHaveLength(1)
    expect(
      filterArticles(sample, { query: 'trailer', category: 'release' }),
    ).toHaveLength(0)
  })

  it('returns an empty array when nothing matches', () => {
    expect(filterArticles(sample, { query: 'zzzzz' })).toEqual([])
  })
})

describe('formatDate', () => {
  it('formats an ISO date into a German long date', () => {
    expect(formatDate('2026-11-19')).toBe('19. November 2026')
  })

  it('returns the input unchanged for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})
