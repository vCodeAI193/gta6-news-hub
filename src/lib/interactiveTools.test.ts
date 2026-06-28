import { describe, it, expect } from 'vitest'
import {
  VEHICLES,
  searchVehicles,
  searchWeapons,
  computeHypeMeter,
  TIMELINE_ENTRIES,
  filterTimeline,
  EDITIONS,
} from './interactiveTools'
import type { Article } from '../types'

describe('searchVehicles', () => {
  it('returns all when query is empty', () => {
    expect(searchVehicles('')).toHaveLength(VEHICLES.length)
  })
  it('finds by name', () => {
    const r = searchVehicles('infernus')
    expect(r.some(v => v.id === 'infernus')).toBe(true)
  })
  it('finds by type', () => {
    const r = searchVehicles('helicopter')
    expect(r.every(v => v.type === 'helicopter')).toBe(true)
  })
  it('returns empty for unknown', () => {
    expect(searchVehicles('xxxxxxunknown')).toHaveLength(0)
  })
})

describe('searchWeapons', () => {
  it('finds by category', () => {
    const r = searchWeapons('pistol')
    expect(r.some(w => w.category === 'pistol')).toBe(true)
  })
  it('returns empty for unknown', () => {
    expect(searchWeapons('lightsaber')).toHaveLength(0)
  })
})

describe('computeHypeMeter', () => {
  it('returns score between 0 and 100', () => {
    const r = computeHypeMeter([])
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score).toBeLessThanOrEqual(100)
  })
  it('returns higher score with confirmed articles', () => {
    const today = new Date().toISOString().slice(0, 10)
    const makeArticle = (reliability: string): Article => ({
      id: 'a', title: 't', excerpt: '', body: '', category: 'official',
      date: today, source: 's', reliability: reliability as 'confirmed' | 'rumor' | 'unconfirmed',
      readingTime: 1, tags: [], author: '', sources: [],
    } as unknown as Article)
    const confirmed = computeHypeMeter([makeArticle('confirmed'), makeArticle('official')])
    const rumors = computeHypeMeter([makeArticle('rumor'), makeArticle('unconfirmed')])
    expect(confirmed.score).toBeGreaterThan(rumors.score)
  })
})

describe('filterTimeline', () => {
  it('returns all entries when no filter', () => {
    expect(filterTimeline(TIMELINE_ENTRIES)).toHaveLength(TIMELINE_ENTRIES.length)
  })
  it('filters by type', () => {
    const trailers = filterTimeline(TIMELINE_ENTRIES, 'trailer')
    expect(trailers.every(e => e.type === 'trailer')).toBe(true)
  })
  it('sorts by date ascending', () => {
    const sorted = filterTimeline(TIMELINE_ENTRIES)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].date >= sorted[i - 1].date).toBe(true)
    }
  })
})

describe('EDITIONS', () => {
  it('has at least 3 editions', () => {
    expect(EDITIONS.length).toBeGreaterThanOrEqual(3)
  })
  it('each edition has price and platform', () => {
    for (const ed of EDITIONS) {
      expect(ed.price).toBeGreaterThan(0)
      expect(ed.platform.length).toBeGreaterThan(0)
    }
  })
})
