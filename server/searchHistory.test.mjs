import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import {
  createSearchHistoryTable,
  storeSearchHistory,
  getSearchHistory,
  syncSearchHistory,
  getSearchTrends,
  getPopularSearches,
  clearOldSearchHistory,
} from './searchHistory.mjs'

let db

test.before(() => {
  db = new DatabaseSync(':memory:')
  createSearchHistoryTable(db)
})

test('Feature 1: Store and retrieve search history', () => {
  const result = storeSearchHistory(db, {
    userId: 'user1',
    query: 'trailer',
    resultsCount: 5,
    filters: { category: 'trailer' },
    deviceId: 'device-1',
  })

  assert.ok(result.id)
  assert.equal(result.query, 'trailer')
  assert.equal(result.resultsCount, 5)

  const { items, total } = getSearchHistory(db, 'user1')
  assert.equal(total, 1)
  assert.equal(items[0].query, 'trailer')
  assert.equal(items[0].resultsCount, 5)
  assert.deepEqual(items[0].filters, { category: 'trailer' })
})

test('Feature 1: Deduplication on same query and device', () => {
  storeSearchHistory(db, {
    userId: 'user2',
    query: 'leak',
    resultsCount: 3,
    deviceId: 'device-1',
  })

  const beforeCount = getSearchHistory(db, 'user2').total

  // Store same query again - should update instead of insert
  storeSearchHistory(db, {
    userId: 'user2',
    query: 'leak',
    resultsCount: 7,
    deviceId: 'device-1',
  })

  const afterCount = getSearchHistory(db, 'user2').total
  assert.equal(beforeCount, afterCount, 'Should not create duplicate entries')

  const { items } = getSearchHistory(db, 'user2')
  assert.equal(items[0].resultsCount, 7, 'Should update result count')
})

test('Feature 1: Pagination works correctly', () => {
  const userId = 'user3'
  for (let i = 0; i < 25; i++) {
    storeSearchHistory(db, {
      userId,
      query: `query-${i}`,
      resultsCount: i,
      deviceId: 'device-1',
    })
  }

  const page1 = getSearchHistory(db, userId, { limit: 10, offset: 0 })
  assert.equal(page1.items.length, 10)
  assert.equal(page1.total, 25)

  const page2 = getSearchHistory(db, userId, { limit: 10, offset: 10 })
  assert.equal(page2.items.length, 10)
  assert.notEqual(page1.items[0].query, page2.items[0].query)
})

test('Feature 1: Sync local history from client', () => {
  const userId = 'user4'
  const localHistory = [
    { query: 'map', resultsCount: 2, filters: {}, deviceId: 'mobile-1' },
    { query: 'character', resultsCount: 5, filters: { category: 'official' }, deviceId: 'mobile-1' },
    { query: 'soundtrack', resultsCount: 3, filters: {}, deviceId: 'mobile-1' },
  ]

  const { synced, skipped } = syncSearchHistory(db, userId, localHistory)
  assert.equal(synced, 3)
  assert.equal(skipped, 0)

  const { items, total } = getSearchHistory(db, userId)
  assert.equal(total, 3)
  assert.ok(items.some((i) => i.query === 'map'))
  assert.ok(items.some((i) => i.query === 'character'))
})

test('Feature 1: Get search trends for user', () => {
  const userId = 'user5'
  // Since UNIQUE(user_id, query, device_id) is set, multiple calls to same query update instead
  storeSearchHistory(db, {
    userId,
    query: 'popular',
    resultsCount: 1,
    deviceId: 'device-1',
  })

  storeSearchHistory(db, {
    userId,
    query: 'popular-2',
    resultsCount: 5,
    deviceId: 'device-1',
  })

  storeSearchHistory(db, {
    userId,
    query: 'rare',
    resultsCount: 1,
    deviceId: 'device-1',
  })

  const trends = getSearchTrends(db, userId, { limit: 5 })
  assert.ok(trends.length > 0)
  assert.ok(trends.some((t) => t.query === 'popular' || t.query === 'popular-2'))
})

test('Feature 1: Get popular searches across all users', () => {
  const searchData = [
    { userId: 'user10', query: 'vice city', deviceId: 'device-1' },
    { userId: 'user11', query: 'vice city', deviceId: 'device-1' },
    { userId: 'user12', query: 'vice city', deviceId: 'device-1' },
    { userId: 'user10', query: 'lucia', deviceId: 'device-1' },
  ]

  for (const { userId, query, deviceId } of searchData) {
    storeSearchHistory(db, { userId, query, resultsCount: 0, deviceId })
  }

  const popular = getPopularSearches(db, { limit: 5 })
  const viceCityTrend = popular.find((p) => p.query === 'vice city')
  assert.ok(viceCityTrend)
  assert.equal(viceCityTrend.searchCount, 3)
  assert.equal(viceCityTrend.uniqueUsers, 3)
})

test('Feature 1: Clear old search history', () => {
  db.exec(`
    INSERT INTO search_history (id, user_id, query, device_id, created_at)
    VALUES
      ('old1', 'user_old', 'test', 'dev1', datetime('2020-01-01')),
      ('old2', 'user_old', 'test2', 'dev1', datetime('2024-01-01'))
  `)

  clearOldSearchHistory(db, 'user_old', 365)

  const { items } = getSearchHistory(db, 'user_old')
  assert.ok(items.every((i) => new Date(i.createdAt) > new Date('2020-02-01')))
})
