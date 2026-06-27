import { describe, expect, it } from 'vitest'
import { buildTimeline, groupByYear } from './timeline'
import { collectGallery, filterGallery } from './gallery'
import type { Article } from '../types'

const make = (over: Partial<Article>): Article => ({
  id: 'x', title: 'T', excerpt: 'e', body: 'b', category: 'official',
  date: '2026-01-01', source: 's', image: 'cover-x', ...over,
})

const articles: Article[] = [
  make({ id: 'a', date: '2026-05-01', image: 'img-a', gallery: ['img-a2'] }),
  make({ id: 'b', date: '2026-01-10', image: 'img-b' }),
]

describe('buildTimeline', () => {
  it('sortiert aufsteigend und ergänzt den Release-Meilenstein', () => {
    const events = buildTimeline(articles)
    const dates = events.map((e) => e.date)
    expect(dates).toEqual([...dates].sort())
    expect(events.some((e) => e.kind === 'milestone' && e.date === '2026-11-19')).toBe(true)
  })

  it('gruppiert nach Jahr', () => {
    const groups = groupByYear(buildTimeline(articles))
    expect(groups[0].year).toBe('2026')
  })
})

describe('collectGallery', () => {
  it('sammelt Cover + Galeriebilder und dedupliziert', () => {
    const items = collectGallery(articles)
    const srcs = items.map((i) => i.src)
    expect(srcs).toContain('img-a')
    expect(srcs).toContain('img-a2')
    // Keine Duplikate
    expect(new Set(srcs).size).toBe(srcs.length)
  })

  it('enthält Lore-Bilder', () => {
    expect(collectGallery(articles).some((i) => i.source === 'lore')).toBe(true)
  })

  it('filtert nach Caption', () => {
    const items = collectGallery(articles)
    expect(filterGallery(items, 'zzzznope')).toHaveLength(0)
    expect(filterGallery(items, '').length).toBe(items.length)
  })
})
