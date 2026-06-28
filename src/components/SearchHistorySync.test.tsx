import { test, describe } from 'vitest'
import assert from 'assert'
import {
  addToSearchHistory,
  getLocalSearchHistory,
  clearLocalSearchHistory,
  getOrCreateDeviceId,
} from './SearchHistorySync'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value)
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('Feature 1: Search History Sync', () => {
  test('Add search to history', () => {
    localStorage.clear()
    addToSearchHistory('trailer', 5, { category: 'trailer' })
    const history = getLocalSearchHistory()

    assert.equal(history.length, 1)
    assert.equal(history[0].query, 'trailer')
    assert.equal(history[0].resultsCount, 5)
  })

  test('Deduplication works - same query moves to end', () => {
    localStorage.clear()
    addToSearchHistory('leak', 3)
    addToSearchHistory('map', 7)
    addToSearchHistory('leak', 10)

    const history = getLocalSearchHistory()
    assert.equal(history.length, 2)
    assert.equal(history[history.length - 1].query, 'leak')
    assert.equal(history[history.length - 1].resultsCount, 10)
  })

  test('Limit to 50 entries', () => {
    localStorage.clear()
    for (let i = 0; i < 60; i++) {
      addToSearchHistory(`query-${i}`, i)
    }

    const history = getLocalSearchHistory()
    assert.equal(history.length, 50)
    assert.equal(history[0].query, 'query-10')
    assert.equal(history[history.length - 1].query, 'query-59')
  })

  test('Device ID is generated and persisted', () => {
    localStorage.clear()
    const id1 = getOrCreateDeviceId()
    const id2 = getOrCreateDeviceId()

    assert.equal(id1, id2)
    assert.ok(id1.startsWith('device-'))
  })

  test('Clear history works', () => {
    localStorage.clear()
    addToSearchHistory('test')
    assert.equal(getLocalSearchHistory().length, 1)

    clearLocalSearchHistory()
    assert.equal(getLocalSearchHistory().length, 0)
  })

  test('Ignores queries shorter than 2 chars', () => {
    localStorage.clear()
    addToSearchHistory('a', 0)
    addToSearchHistory('ab', 1)

    const history = getLocalSearchHistory()
    assert.equal(history.length, 1)
    assert.equal(history[0].query, 'ab')
  })

  test('Preserves filters in history entries', () => {
    localStorage.clear()
    const filters = { category: 'leak', reliability: 'confirmed' }
    addToSearchHistory('query', 5, filters)

    const history = getLocalSearchHistory()
    assert.deepEqual(history[0].filters, filters)
  })

  test('History entries have timestamps', () => {
    localStorage.clear()
    addToSearchHistory('test')
    const history = getLocalSearchHistory()

    assert.ok(typeof history[0].timestamp === 'number')
    assert.ok(history[0].timestamp > 0)
  })

  test('Recovers from corrupted JSON gracefully', () => {
    localStorage.clear()
    localStorage.setItem('gta6_search_history', 'invalid json {')
    const history = getLocalSearchHistory()

    assert.equal(history.length, 0)
  })
})
