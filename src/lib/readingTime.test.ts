import { describe, expect, it } from 'vitest'
import { readingTimeLabel, readingTimeMinutes } from './readingTime'

describe('readingTime', () => {
  it('mindestens 1 Minute', () => {
    expect(readingTimeMinutes('kurz')).toBe(1)
  })

  it('rechnet ~200 Wörter pro Minute', () => {
    const text = Array.from({ length: 400 }, () => 'wort').join(' ')
    expect(readingTimeMinutes(text)).toBe(2)
  })

  it('liefert ein lesbares Label', () => {
    expect(readingTimeLabel('a b c')).toMatch(/Min\. Lesezeit/)
  })
})
