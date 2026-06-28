import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseAdvancedQuery,
  buildFilterPredicate,
  formatFilterDescription,
  buildQueryString,
  escapeSearchTerm,
} from './advancedQuery.mjs'

test('Feature 4: Parse author filter', () => {
  const filters1 = parseAdvancedQuery('author:"John Smith" trailer')
  assert.equal(filters1.authors.length, 1)
  assert.equal(filters1.authors[0], 'John Smith')
  assert.equal(filters1.textTerms.includes('trailer'), true)

  const filters2 = parseAdvancedQuery('author:JohnSmith vice')
  assert.equal(filters2.authors[0], 'JohnSmith')
  assert.equal(filters2.textTerms.includes('vice'), true)
})

test('Feature 4: Parse date filters', () => {
  const filters1 = parseAdvancedQuery('date:2026-05-01')
  assert.equal(filters1.dateFrom, '2026-05-01')
  // Single date sets both from and to
  assert.ok(filters1.dateTo)

  const filters2 = parseAdvancedQuery('date:>2026-05-01')
  assert.equal(filters2.dateFrom, '2026-05-01')

  const filters3 = parseAdvancedQuery('date:<2026-05-01')
  assert.equal(filters3.dateTo, '2026-05-01')

  const filters4 = parseAdvancedQuery('date:2026-05-01..2026-06-01')
  assert.equal(filters4.dateFrom, '2026-05-01')
  assert.equal(filters4.dateTo, '2026-06-01')
})

test('Feature 4: Parse rating filters', () => {
  const filters1 = parseAdvancedQuery('rating:>=4')
  assert.equal(filters1.ratingMin, 4)

  const filters2 = parseAdvancedQuery('rating:<=3.5')
  assert.equal(filters2.ratingMax, 3.5)

  const filters3 = parseAdvancedQuery('rating:4.5')
  assert.equal(filters3.ratingMin, 4.5)
  assert.equal(filters3.ratingMax, 4.5)
})

test('Feature 4: Parse category filters', () => {
  const filters = parseAdvancedQuery('category:leak category:trailer')
  assert.equal(filters.categories.length, 2)
  assert.ok(filters.categories.includes('leak'))
  assert.ok(filters.categories.includes('trailer'))
})

test('Feature 4: Parse reliability filters', () => {
  const filters = parseAdvancedQuery('reliability:confirmed reliability:rumor')
  assert.equal(filters.reliability.length, 2)
  assert.ok(filters.reliability.includes('confirmed'))
  assert.ok(filters.reliability.includes('rumor'))
})

test('Feature 4: Parse tag filters', () => {
  const filters = parseAdvancedQuery('tags:vice-city,lucia,map')
  assert.equal(filters.tags.length, 3)
  assert.ok(filters.tags.includes('vice-city'))
  assert.ok(filters.tags.includes('lucia'))
  assert.ok(filters.tags.includes('map'))
})

test('Feature 4: Parse complex query with multiple filters', () => {
  const query = 'trailer author:"Rockstar" date:>2026-05-01 category:official tags:vice-city,lucia reliability:confirmed'
  const filters = parseAdvancedQuery(query)

  assert.equal(filters.authors.length, 1)
  assert.ok(filters.dateFrom)
  assert.equal(filters.categories.length, 1)
  assert.ok(filters.tags.length > 0)
  assert.equal(filters.reliability.length, 1)
  assert.equal(filters.textTerms.length, 1)
  assert.equal(filters.textTerms[0], 'trailer')
})

test('Feature 4: Build filter predicate', () => {
  const filters = {
    authors: ['Rockstar'],
    dateFrom: '2026-05-01',
    dateTo: '2026-06-01',
    ratingMin: null,
    ratingMax: null,
    categories: ['trailer'],
    reliability: ['confirmed'],
    tags: ['vice-city'],
    textTerms: [],
  }

  const predicate = buildFilterPredicate(filters)

  const article1 = {
    title: 'New Trailer',
    excerpt: 'Official',
    body: 'Vice City',
    author: 'Rockstar',
    category: 'trailer',
    date: '2026-05-15',
    reliability: 'confirmed',
    tags: ['vice-city', 'trailer'],
  }

  const article2 = {
    title: 'Leak',
    excerpt: 'Unconfirmed',
    body: 'Map',
    author: 'Community',
    category: 'leak',
    date: '2026-05-15',
    reliability: 'rumor',
    tags: ['leak'],
  }

  assert.equal(predicate(article1), true)
  assert.equal(predicate(article2), false)
})

test('Feature 4: Filter by text terms only', () => {
  const filters = {
    authors: [],
    dateFrom: null,
    dateTo: null,
    ratingMin: null,
    ratingMax: null,
    categories: [],
    reliability: [],
    tags: [],
    textTerms: ['trailer', 'vice'],
  }

  const predicate = buildFilterPredicate(filters)

  const article = {
    title: 'Trailer for Vice City',
    excerpt: 'Official',
    body: 'More text',
    author: 'Test',
    category: 'trailer',
    date: '2026-05-01',
    reliability: 'confirmed',
    tags: [],
  }

  assert.equal(predicate(article), true)

  const article2 = {
    title: 'Map Leak',
    excerpt: 'Not a trailer',
    body: 'Some content',
    author: 'Test',
    category: 'leak',
    date: '2026-05-01',
    reliability: 'rumor',
    tags: [],
  }

  assert.equal(predicate(article2), false)
})

test('Feature 4: Format filter description', () => {
  const filters = {
    authors: ['Rockstar', 'Take-Two'],
    dateFrom: '2026-05-01',
    dateTo: '2026-06-01',
    categories: ['trailer', 'official'],
    reliability: ['confirmed'],
    tags: ['vice-city'],
    textTerms: [],
  }

  const desc = formatFilterDescription(filters)
  assert.ok(desc.includes('Rockstar'))
  assert.ok(desc.includes('Zeitraum'))
  assert.ok(desc.includes('trailer'))
  assert.ok(desc.includes('confirmed'))
})

test('Feature 4: Build query string from filters', () => {
  const filters = {
    authors: ['Rockstar'],
    dateFrom: '2026-05-01',
    dateTo: '2026-06-01',
    ratingMin: null,
    ratingMax: null,
    categories: ['trailer'],
    reliability: ['confirmed'],
    tags: ['vice-city'],
    textTerms: [],
  }

  const query = buildQueryString(filters, 'official')
  assert.ok(query.includes('official'))
  assert.ok(query.includes('author:"Rockstar"'))
  assert.ok(query.includes('date:2026-05-01..2026-06-01'))
  assert.ok(query.includes('category:trailer'))
  assert.ok(query.includes('reliability:confirmed'))
})

test('Feature 4: Escape special characters', () => {
  const escaped = escapeSearchTerm('$100 (USD)')
  assert.ok(escaped.includes('\\$'))
  assert.ok(escaped.includes('\\('))
})

test('Feature 4: Date range validation', () => {
  const filters = parseAdvancedQuery('date:2026-05-01..2026-04-01')
  // Should still parse, validation happens at filter application level
  assert.ok(filters.dateFrom)
  assert.ok(filters.dateTo)
})
