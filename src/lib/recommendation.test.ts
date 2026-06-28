import { describe, expect, it } from 'vitest'
import {
  explainRecommendation,
  moodFilter,
  recommendFeed,
  scoreArticle,
  timeSaveMode,
} from './recommendation'
import type { Article } from '../types'

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 'a1',
    title: 'Test Article',
    excerpt: 'Excerpt',
    body: 'Body text here for testing purposes.',
    category: 'official',
    date: new Date().toISOString().slice(0, 10),
    source: 'Rockstar',
    image: '/img.jpg',
    ...overrides,
  }
}

describe('scoreArticle', () => {
  it('returns higher score when category matches interests', () => {
    const article = makeArticle({ category: 'official' })
    const withInterest = scoreArticle(article, ['official'], [], [], [])
    const withoutInterest = scoreArticle(article, ['leak'], [], [], [])
    expect(withInterest).toBeGreaterThan(withoutInterest)
  })

  it('returns -Infinity for hidden source', () => {
    const article = makeArticle({ source: 'BadSource' })
    const score = scoreArticle(article, ['official'], [], [], ['BadSource'])
    expect(score).toBe(-Infinity)
  })

  it('returns -Infinity for hidden tag', () => {
    const article = makeArticle({ tags: ['spoiler'] })
    const score = scoreArticle(article, ['official'], [], ['spoiler'], [])
    expect(score).toBe(-Infinity)
  })

  it('penalises already-read articles', () => {
    const article = makeArticle({ id: 'a1' })
    const fresh = scoreArticle(article, ['official'], [], [], [])
    const read = scoreArticle(article, ['official'], [{ articleId: 'a1' }], [], [])
    expect(fresh).toBeGreaterThan(read)
  })

  it('boosts recent articles over older ones', () => {
    const recent = makeArticle({
      id: 'recent',
      date: new Date().toISOString().slice(0, 10),
    })
    const old = makeArticle({
      id: 'old',
      date: '2020-01-01',
    })
    const recentScore = scoreArticle(recent, [], [], [], [])
    const oldScore = scoreArticle(old, [], [], [], [])
    expect(recentScore).toBeGreaterThan(oldScore)
  })
})

describe('recommendFeed', () => {
  it('excludes hidden sources', () => {
    const articles = [
      makeArticle({ id: '1', source: 'Hidden' }),
      makeArticle({ id: '2', source: 'Visible' }),
    ]
    const result = recommendFeed(articles, [], [], [], ['Hidden'])
    expect(result.map((a) => a.id)).toEqual(['2'])
  })

  it('sorts by score descending', () => {
    const articles = [
      makeArticle({ id: 'old', date: '2020-01-01', category: 'leak' }),
      makeArticle({ id: 'recent', category: 'official' }),
    ]
    const result = recommendFeed(articles, ['official'], [], [], [])
    expect(result[0].id).toBe('recent')
  })
})

describe('explainRecommendation', () => {
  it('explains by interest category', () => {
    const article = makeArticle({ category: 'trailer' })
    const explanation = explainRecommendation(article, ['trailer'], [])
    expect(explanation).toContain('Trailer')
  })

  it('explains by tag when no interest match', () => {
    const article = makeArticle({ category: 'leak', tags: ['Vice City'] })
    const explanation = explainRecommendation(article, ['official'], [])
    expect(explanation).toContain('Vice City')
  })

  it('returns default when no match', () => {
    const article = makeArticle({ category: 'leak' })
    const explanation = explainRecommendation(article, ['official'], [])
    expect(explanation).toBeTruthy()
  })
})

describe('moodFilter', () => {
  const confirmed = makeArticle({ id: 'c', reliability: 'confirmed' })
  const rumor = makeArticle({ id: 'r', reliability: 'rumor', category: 'leak' })
  const officialCat = makeArticle({ id: 'o', category: 'official' })

  it('returns all articles for "alle"', () => {
    expect(moodFilter([confirmed, rumor, officialCat], 'alle')).toHaveLength(3)
  })

  it('returns only confirmed for "fakten"', () => {
    const result = moodFilter([confirmed, rumor, officialCat], 'fakten')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('c')
  })

  it('returns confirmed + official category for "positiv"', () => {
    const result = moodFilter([confirmed, rumor, officialCat], 'positiv')
    expect(result.map((a) => a.id).sort()).toEqual(['c', 'o'].sort())
  })
})

describe('timeSaveMode', () => {
  it('keeps short articles (<=2 min)', () => {
    const short = makeArticle({ id: 'short', body: 'Short body.' })
    const long = makeArticle({
      id: 'long',
      body: Array(500).fill('word').join(' '),
    })
    const result = timeSaveMode([short, long])
    expect(result.map((a) => a.id)).toContain('short')
    expect(result.map((a) => a.id)).not.toContain('long')
  })

  it('returns empty array when all articles are long', () => {
    const long = makeArticle({ body: Array(1000).fill('word').join(' ') })
    expect(timeSaveMode([long])).toHaveLength(0)
  })
})
