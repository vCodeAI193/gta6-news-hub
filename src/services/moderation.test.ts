import { describe, it, expect } from 'vitest'
import { isSpam, getCommentQualityScore, flagSpoiler, computeTrustScore } from './moderationService'

describe('isSpam', () => {
  it('detects repeated chars', () => {
    expect(isSpam('aaaaaaa spam')).toBe(true)
  })
  it('returns false for normal text', () => {
    expect(isSpam('This is a normal comment about GTA 6.')).toBe(false)
  })
  it('detects known spam patterns', () => {
    expect(isSpam('Buy now cheap casino pills')).toBe(true)  // matches 'buy now' and 'casino'
  })
})

describe('getCommentQualityScore', () => {
  it('returns 0 for empty text', () => {
    expect(getCommentQualityScore('')).toBe(0)
  })
  it('returns higher score for longer, quality text', () => {
    const short = getCommentQualityScore('ok')
    const long = getCommentQualityScore('This is a great article about GTA 6. I especially liked the part about the map!')
    expect(long).toBeGreaterThan(short)
  })
  it('returns value between 0 and 100', () => {
    const score = getCommentQualityScore('Some text here.')
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

describe('flagSpoiler', () => {
  it('flags text with "spoiler"', () => {
    expect(flagSpoiler('spoiler: the main character dies')).toBe(true)
  })
  it('flags "spoiler alert"', () => {
    expect(flagSpoiler('SPOILER ALERT: ...')).toBe(true)
  })
  it('does not flag normal text', () => {
    expect(flagSpoiler('Great news about GTA 6!')).toBe(false)
  })
})

describe('computeTrustScore', () => {
  it('returns score between 0 and 100', () => {
    const result = computeTrustScore('user1', { commentsCount: 5, reportsReceived: 0, age: 10 })
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })
  it('gives higher score for active user with no reports', () => {
    const good = computeTrustScore('good', { commentsCount: 60, reportsReceived: 0, age: 60 })
    const bad = computeTrustScore('bad', { commentsCount: 1, reportsReceived: 10, age: 1 })
    expect(good.score).toBeGreaterThan(bad.score)
  })
})
