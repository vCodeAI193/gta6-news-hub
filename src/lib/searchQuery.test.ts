import { describe, it, expect } from 'vitest'
import {
  levenshtein,
  lexicalScore,
  makeSnippet,
  parseQuery,
  synonymsOf,
  textMatches,
} from './searchQuery'

describe('searchQuery', () => {
  it('parst Phrasen, Ausschluss und OR', () => {
    const p = parseQuery('"vice city" trailer -leak release OR termin')
    expect(p.exclude).toContain('leak')
    expect(p.alternatives.length).toBe(2)
    expect(p.alternatives[0].phrases).toContain('vice city')
    expect(p.alternatives[0].words).toContain('trailer')
  })

  it('UND-Verknüpfung verlangt alle Begriffe', () => {
    expect(textMatches('GTA 6 Trailer zu Vice City', 'trailer vice')).toBe(true)
    expect(textMatches('GTA 6 Trailer', 'trailer leak')).toBe(false)
  })

  it('Ausschluss filtert Treffer heraus', () => {
    expect(textMatches('Ein Leak zur Karte', 'karte -leak')).toBe(false)
    expect(textMatches('Offizielle Karte', 'karte -leak')).toBe(true)
  })

  it('OR matcht eine Alternative', () => {
    expect(textMatches('Der Release-Termin steht', 'release OR soundtrack')).toBe(true)
    expect(textMatches('Neuer Soundtrack', 'release OR soundtrack')).toBe(true)
    expect(textMatches('Neue Charaktere', 'release OR soundtrack')).toBe(false)
  })

  it('Phrasen verlangen die exakte Folge', () => {
    expect(textMatches('Willkommen in Vice City', '"vice city"')).toBe(true)
    expect(textMatches('City von Vice', '"vice city"')).toBe(false)
  })

  it('Synonyme erweitern die Suche', () => {
    expect(synonymsOf('map')).toContain('karte')
    expect(textMatches('Die Map von Leonida', 'karte')).toBe(true)
    expect(textMatches('Neuer Clip veröffentlicht', 'trailer')).toBe(true)
  })

  it('toleriert Tippfehler bei längeren Wörtern', () => {
    expect(levenshtein('trailer', 'trailor')).toBe(1)
    expect(textMatches('Der neue Trailer', 'trailor')).toBe(true)
    // kurze Wörter ohne Toleranz
    expect(textMatches('Auto', 'xuto')).toBe(false)
  })

  it('makeSnippet liefert Kontext um den Treffer', () => {
    const text = 'Lorem ipsum dolor. ' + 'x'.repeat(100) + ' Vice City ' + 'y'.repeat(100)
    const s = makeSnippet(text, 'vice city', 30)
    expect(s.toLowerCase()).toContain('vice city')
    expect(s.startsWith('…')).toBe(true)
  })

  it('lexicalScore gewichtet Titel höher als Body', () => {
    const a = lexicalScore({ title: 'Trailer', body: 'x' }, 'trailer')
    const b = lexicalScore({ title: 'x', body: 'trailer' }, 'trailer')
    expect(a).toBeGreaterThan(b)
  })
})
