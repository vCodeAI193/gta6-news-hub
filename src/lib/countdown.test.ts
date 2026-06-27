import { describe, expect, it } from 'vitest'
import { getTimeLeft, RELEASE_DATE } from './countdown'

describe('getTimeLeft', () => {
  it('computes days, hours, minutes and seconds remaining', () => {
    const now = new Date('2026-11-18T00:00:00Z')
    const result = getTimeLeft(RELEASE_DATE, now)
    expect(result).toEqual({ days: 1, hours: 0, minutes: 0, seconds: 0 })
  })

  it('breaks down a partial day correctly', () => {
    const target = new Date('2026-01-02T01:02:03Z')
    const now = new Date('2026-01-01T00:00:00Z')
    expect(getTimeLeft(target, now)).toEqual({
      days: 1,
      hours: 1,
      minutes: 2,
      seconds: 3,
    })
  })

  it('clamps to zero once the target is in the past', () => {
    const now = new Date('2027-01-01T00:00:00Z')
    expect(getTimeLeft(RELEASE_DATE, now)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    })
  })
})
