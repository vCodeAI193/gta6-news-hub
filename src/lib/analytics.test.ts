import { describe, it, expect, beforeEach } from 'vitest'
import { trackEvent, getEventLog, getTopEvents, submitNps, getNpsAverage, captureUtm, getLastUtm } from './analytics'

beforeEach(() => {
  localStorage.clear()
})

describe('trackEvent', () => {
  it('stores an event in localStorage', () => {
    trackEvent('test_event', { key: 'value' })
    const log = getEventLog()
    expect(log.some(e => e.name === 'test_event')).toBe(true)
  })
  it('stores multiple events', () => {
    trackEvent('event_a')
    trackEvent('event_b')
    trackEvent('event_a')
    const log = getEventLog()
    expect(log).toHaveLength(3)
  })
})

describe('getTopEvents', () => {
  it('counts and sorts events by frequency', () => {
    trackEvent('common')
    trackEvent('common')
    trackEvent('rare')
    const top = getTopEvents(10)
    expect(top[0].name).toBe('common')
    expect(top[0].count).toBe(2)
    expect(top[1].name).toBe('rare')
    expect(top[1].count).toBe(1)
  })
})

describe('NPS', () => {
  it('returns null average when no responses', () => {
    expect(getNpsAverage()).toBeNull()
  })
  it('returns correct average', () => {
    submitNps(8)
    submitNps(10)
    expect(getNpsAverage()).toBe(9)
  })
  it('records comment', () => {
    submitNps(7, 'Great site!')
    expect(getNpsAverage()).toBe(7)
  })
})

describe('UTM capture', () => {
  it('returns empty object with no UTM params', () => {
    expect(getLastUtm()).toEqual({})
  })
  it('captures UTM from URL', () => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: '?utm_source=newsletter&utm_medium=email' },
      writable: true,
    })
    captureUtm()
    const utm = getLastUtm()
    expect(utm.utm_source).toBe('newsletter')
    expect(utm.utm_medium).toBe('email')
  })
})
