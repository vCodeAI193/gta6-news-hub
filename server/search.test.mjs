import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  facetsFor,
  lexicalScore,
  makeSnippet,
  matchesQuery,
  parseQuery,
  searchArticles,
  searchComments,
} from './search.mjs'

const arts = [
  { id: 'a', title: 'Trailer 2 zu Vice City', excerpt: 'Der Trailer', body: 'Vice City bei Nacht. '.repeat(20), category: 'trailer', date: '2026-04-01', source: 'Rockstar', tags: ['Vice City', 'Trailer'], reliability: 'confirmed' },
  { id: 'b', title: 'Leak: Karte aufgetaucht', excerpt: 'Map Leak', body: 'Angebliche Karte. '.repeat(5), category: 'leak', date: '2026-03-01', source: 'Reddit', tags: ['Map'], reliability: 'rumor' },
  { id: 'c', title: 'Release-Termin bestätigt', excerpt: 'Termin', body: 'Erscheint 2026. '.repeat(3), category: 'release', date: '2026-05-01', source: 'Rockstar', tags: ['Termin'], reliability: 'confirmed' },
]

test('parseQuery + matchesQuery: UND, OR, Ausschluss', () => {
  assert.equal(matchesQuery('Trailer zu Vice City', parseQuery('trailer vice')), true)
  assert.equal(matchesQuery('Nur ein Trailer', parseQuery('trailer leak')), false)
  assert.equal(matchesQuery('Ein Leak', parseQuery('release OR leak')), true)
  assert.equal(matchesQuery('Offizielle Karte', parseQuery('karte -leak')), true)
  assert.equal(matchesQuery('Geleakte Karte als Leak', parseQuery('karte -leak')), false)
})

test('Synonyme greifen serverseitig', () => {
  assert.equal(matchesQuery('Die Map von Leonida', parseQuery('karte')), true)
})

test('searchArticles rankt und liefert Snippet + Facetten', () => {
  const out = searchArticles(arts, 'trailer')
  assert.ok(out.total >= 1)
  assert.equal(out.results[0].id, 'a')
  assert.ok(out.results[0].snippet.length > 0)
  assert.ok(out.facets.categories.length >= 1)
})

test('searchArticles filtert nach Verlässlichkeit und Lesezeit', () => {
  const conf = searchArticles(arts, '', { reliability: 'confirmed' })
  assert.ok(conf.results.every((r) => r.reliability === 'confirmed'))
  const short = searchArticles(arts, '', { maxMinutes: 1 })
  assert.ok(short.results.every((r) => r.minutes <= 1))
})

test('facetsFor zählt Kategorien und Tags', () => {
  const f = facetsFor(arts)
  assert.ok(f.categories.find((c) => c.value === 'trailer'))
  assert.ok(f.tags.find((t) => t.value === 'Vice City'))
})

test('searchComments findet passende Kommentare mit Snippet', () => {
  const out = searchComments([{ id: '1', text: 'Der Trailer ist genial' }, { id: '2', text: 'Langweilig' }], 'trailer')
  assert.equal(out.length, 1)
  assert.ok(out[0].snippet.includes('Trailer'))
})

test('lexicalScore und makeSnippet sind robust bei leerer Query', () => {
  assert.equal(lexicalScore({ title: 'x' }, parseQuery('')), 0)
  assert.ok(typeof makeSnippet('Ein Text', parseQuery('')) === 'string')
})
