import { describe, it, expect } from 'vitest'
import { normalizeLocale, SUPPORTED_LOCALES, formatCurrency, formatNumber } from './a11y'

describe('normalizeLocale', () => {
  it('returns de for de-DE', () => {
    expect(normalizeLocale('de-DE')).toBe('de')
  })
  it('returns en for en-US', () => {
    expect(normalizeLocale('en-US')).toBe('en')
  })
  it('falls back to de for unknown locale', () => {
    expect(normalizeLocale('zh-CN')).toBe('de')
  })
  it('returns supported locale directly', () => {
    for (const l of SUPPORTED_LOCALES) {
      expect(normalizeLocale(l)).toBe(l)
    }
  })
})

describe('formatCurrency', () => {
  it('formats euros in German locale', () => {
    const result = formatCurrency(9.99, { locale: 'de-DE', currency: 'EUR' })
    expect(result).toContain('9')
    expect(result).toContain('99')
  })
  it('formats USD in en-US locale', () => {
    const result = formatCurrency(4.99, { locale: 'en-US', currency: 'USD' })
    expect(result).toContain('4')
  })
})

describe('formatNumber', () => {
  it('formats a large number', () => {
    const result = formatNumber(1000000, { locale: 'en-US' })
    expect(result).toContain('1')
    expect(result).toContain('000')
  })
})
