import { describe, it, expect } from 'vitest'
import { generateCover, hashSeed } from './coverImage'

describe('coverImage', () => {
  it('hashSeed ist deterministisch und stabil', () => {
    expect(hashSeed('gta6')).toBe(hashSeed('gta6'))
    expect(hashSeed('a')).not.toBe(hashSeed('b'))
  })

  it('generateCover liefert ein SVG-Data-URI', () => {
    const uri = generateCover('GTA 6 Trailer')
    expect(uri.startsWith('data:image/svg+xml')).toBe(true)
    expect(uri).toContain('svg')
  })

  it('ist deterministisch zum Seed', () => {
    expect(generateCover('seed-x')).toBe(generateCover('seed-x'))
  })

  it('escaped Sonderzeichen im Label', () => {
    const uri = decodeURIComponent(generateCover('x', { label: 'A & B <c>' }))
    expect(uri).toContain('&amp;')
    expect(uri).not.toContain('<c>')
  })
})
