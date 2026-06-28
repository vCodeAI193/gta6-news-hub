import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  aiStatus,
  analyzeSentiment,
  altText,
  autoTag,
  briefing,
  cosineSim,
  detectDuplicates,
  embed,
  emergingTrends,
  factCheck,
  moderateText,
  ragAnswer,
  readability,
  seoSuggest,
  semanticRank,
  sourceCredibility,
  summarize,
  summarizeComments,
  titleSuggestions,
  tokenize,
} from './ai.mjs'

test('tokenize entfernt Stoppwörter und kurze Wörter', () => {
  const t = tokenize('Der neue GTA 6 Trailer ist da und sehr spannend')
  assert.ok(t.includes('trailer'))
  assert.ok(t.includes('spannend'))
  assert.ok(!t.includes('der'))
  assert.ok(!t.includes('ist'))
})

test('aiStatus ist ohne Key heuristisch', () => {
  const prev = process.env.ANTHROPIC_API_KEY
  delete process.env.ANTHROPIC_API_KEY
  const s = aiStatus()
  assert.equal(s.available, false)
  assert.equal(s.provider, 'heuristic')
  if (prev) process.env.ANTHROPIC_API_KEY = prev
})

test('summarize kürzt langen Text und hält Satzgrenzen', () => {
  const text =
    'Rockstar hat GTA 6 offiziell angekündigt. Das Spiel erscheint 2026. ' +
    'Der Trailer zeigt Vice City. Viele Fans sind begeistert. Es gibt neue Charaktere.'
  const sum = summarize(text, { sentences: 2 })
  assert.ok(sum.length > 0)
  assert.ok(sum.length < text.length)
})

test('summarize gibt kurzen Text unverändert zurück', () => {
  assert.equal(summarize('Nur ein Satz.', { sentences: 2 }), 'Nur ein Satz.')
})

test('autoTag liefert häufige Inhaltswörter', () => {
  const tags = autoTag('Vice City Vice City Trailer Rockstar Rockstar Rockstar')
  assert.equal(tags[0], 'rockstar')
  assert.ok(tags.includes('vice') || tags.includes('city'))
})

test('Sentiment erkennt positiv und negativ', () => {
  assert.equal(analyzeSentiment('Das ist mega genial und spannend, freue mich').label, 'positiv')
  assert.equal(analyzeSentiment('Totaler Müll, langweilig und enttäuschend').label, 'negativ')
  assert.equal(analyzeSentiment('Es gibt eine Karte').label, 'neutral')
})

test('moderateText flaggt Toxizität und Spam', () => {
  assert.equal(moderateText('Du Idiot').flagged, true)
  assert.equal(moderateText('http://a.com http://b.com http://c.com').flagged, true)
  assert.equal(moderateText('Schöner Artikel, danke').flagged, false)
})

test('readability liefert plausible Werte', () => {
  const r = readability('Dies ist ein einfacher Satz. Er ist kurz und klar.')
  assert.ok(r.score >= 0 && r.score <= 100)
  assert.ok(['leicht', 'mittel', 'schwer'].includes(r.level))
  assert.ok(r.minutes >= 1)
})

test('cosineSim/embed: gleiche Texte ähnlich, fremde nicht', () => {
  const a = embed('gta 6 trailer vice city')
  const b = embed('vice city trailer gta 6')
  const c = embed('völlig anderes thema banane apfel')
  assert.ok(cosineSim(a, b) > 0.9)
  assert.ok(cosineSim(a, c) < 0.2)
})

test('semanticRank findet das passende Item', () => {
  const items = [
    { text: 'Map und Karte von Vice City' },
    { text: 'Soundtrack und Musik im Spiel' },
  ]
  const ranked = semanticRank('Wo finde ich die Karte?', items)
  assert.equal(ranked[0].item.text, items[0].text)
})

test('detectDuplicates bündelt ähnliche Meldungen', () => {
  const groups = detectDuplicates([
    { id: 1, text: 'GTA 6 Trailer zeigt Vice City' },
    { id: 2, text: 'Vice City im GTA 6 Trailer zu sehen' },
    { id: 3, text: 'Komplett anderes Thema über Pferde' },
  ])
  assert.equal(groups.length, 1)
  assert.equal(groups[0].length, 2)
})

test('sourceCredibility bewertet Quellen', () => {
  assert.ok(sourceCredibility('rockstargames.com').score > sourceCredibility('anonymer reddit leak').score)
  assert.equal(sourceCredibility('https://www.ign.com').label, 'verlässlich')
})

test('factCheck stützt bekannte Behauptungen', () => {
  const corpus = [{ text: 'GTA 6 erscheint 2026 für PS5 und Xbox' }]
  const r = factCheck('Wann erscheint GTA 6 für PS5?', corpus)
  assert.ok(['gestützt', 'teils belegt'].includes(r.verdict))
  assert.ok(r.evidence.length >= 1)
})

test('briefing und podcast aus Artikeln', () => {
  const arts = [
    { id: 'a', title: 'A', body: 'GTA 6 kommt 2026. Es wird groß.', date: '2026-06-01' },
    { id: 'b', title: 'B', body: 'Neuer Trailer ist da. Fans freuen sich.', date: '2026-06-02' },
  ]
  const b = briefing(arts)
  assert.equal(b.items.length, 2)
  assert.equal(b.items[0].id, 'b') // neuester zuerst
})

test('summarizeComments aggregiert Stimmung und Themen', () => {
  const s = summarizeComments([
    { text: 'Mega genial, freue mich!' },
    { text: 'Total enttäuschend und langweilig' },
  ])
  assert.equal(s.count, 2)
  assert.ok(Array.isArray(s.themes))
})

test('emergingTrends sortiert nach Momentum', () => {
  const t = emergingTrends([
    { term: 'leak', count: 10, prev: 9 },
    { term: 'trailer', count: 20, prev: 2 },
  ])
  assert.equal(t[0].term, 'trailer')
})

test('titleSuggestions, altText, seoSuggest liefern brauchbares', () => {
  assert.ok(titleSuggestions('Rockstar bestätigt GTA 6 Trailer mit Vice City').length >= 1)
  assert.ok(altText('Neuer Trailer', 'trailer').includes('Trailer'))
  const seo = seoSuggest('GTA 6 Trailer', 'Rockstar zeigt Vice City im neuen Trailer.')
  assert.ok(seo.keywords.includes('gta 6'))
  assert.ok(seo.description.length > 0)
})

test('ragAnswer liefert Antwort mit Quellen', () => {
  const arts = [
    { id: 'a', title: 'Release', body: 'GTA 6 erscheint im November 2026.' },
    { id: 'b', title: 'Karte', body: 'Die Karte zeigt Vice City und Leonida.' },
  ]
  const r = ragAnswer('Wann erscheint GTA 6?', arts)
  assert.ok(r.sources.length >= 1)
  assert.equal(r.sources[0].id, 'a')
})
