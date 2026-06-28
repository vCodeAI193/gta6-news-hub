import { describe, it, expect } from 'vitest'
import {
  discoveryStream,
  personalizeRank,
  pickRandom,
  readingBucket,
  relatedTags,
  similarImages,
  tagCloud,
  topicArticles,
} from './discovery'
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
  make({ id: 'a', category: 'trailer', tags: ['Vice City', 'Trailer'], date: '2026-04-01', image: 'a.jpg' }),
  make({ id: 'b', category: 'leak', tags: ['Vice City', 'Map'], date: '2026-03-01', image: 'b.jpg' }),
  make({ id: 'c', category: 'trailer', tags: ['Trailer'], date: '2026-05-01', image: 'c.jpg' }),
  make({ id: 'd', category: 'release', tags: ['Termin'], date: '2026-02-01', body: 'w '.repeat(2000) }),
]

describe('discovery', () => {
  it('tagCloud zählt Tags', () => {
    const cloud = tagCloud(sample)
    expect(cloud[0].tag).toBe('Trailer') // 2x
    expect(cloud[0].count).toBe(2)
  })

  it('relatedTags findet Ko-Vorkommen', () => {
    const rel = relatedTags(sample, 'Vice City')
    const tags = rel.map((r) => r.tag)
    expect(tags).toContain('Trailer')
    expect(tags).toContain('Map')
    expect(tags).not.toContain('Vice City')
  })

  it('topicArticles liefert getaggte Artikel nach Datum', () => {
    const arts = topicArticles('Trailer', sample)
    expect(arts.map((a) => a.id)).toEqual(['c', 'a'])
  })

  it('personalizeRank zieht Interessen nach vorn', () => {
    const ranked = personalizeRank(sample, ['release'])
    expect(ranked[0].category).toBe('release')
  })

  it('readingBucket klassifiziert Lesezeit', () => {
    expect(readingBucket(sample[0])).toBe('kurz')
    expect(readingBucket(sample[3])).toBe('lang')
  })

  it('pickRandom ist deterministisch zum Seed', () => {
    expect(pickRandom(sample, 'seed-1')?.id).toBe(pickRandom(sample, 'seed-1')?.id)
  })

  it('similarImages nutzt Kategorie + Tag-Überschneidung', () => {
    const sim = similarImages(sample[0], sample)
    expect(sim.map((a) => a.id)).toContain('c') // gleiche Kategorie + Tag "Trailer"
    expect(sim.map((a) => a.id)).not.toContain('a') // nicht sich selbst
  })

  it('discoveryStream ist deterministisch und paginiert', () => {
    const p1 = discoveryStream(sample, 's', 0, 2)
    const p2 = discoveryStream(sample, 's', 2, 2)
    expect(p1.length).toBe(2)
    expect(discoveryStream(sample, 's', 0, 2).map((a) => a.id)).toEqual(p1.map((a) => a.id))
    expect(p1.map((a) => a.id)).not.toEqual(p2.map((a) => a.id))
  })
})
