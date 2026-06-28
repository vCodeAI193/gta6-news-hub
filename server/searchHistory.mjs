/**
 * Feature 1: Search history sync across devices via localStorage + sync endpoint.
 *
 * Backend supports:
 * - Storing search history per user in DB
 * - Syncing local history (from client localStorage) to backend
 * - Retrieving synced history across devices
 * - Deduplication and timestamp-based ordering
 */

import { randomUUID } from 'node:crypto'

/**
 * Create search history table during DB initialization
 */
export function createSearchHistoryTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS search_history (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      query TEXT NOT NULL,
      results_count INTEGER DEFAULT 0,
      filters TEXT DEFAULT '{}',
      device_id TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT,
      UNIQUE(user_id, query, device_id)
    )
  `)
}

/**
 * Store a search query in history
 */
export function storeSearchHistory(db, { userId, query, resultsCount = 0, filters = {}, deviceId }) {
  const id = randomUUID()
  const now = new Date().toISOString()
  const filtersJson = JSON.stringify(filters)

  try {
    const stmt = db.prepare(`
      INSERT INTO search_history (id, user_id, query, results_count, filters, device_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(id, userId, query, resultsCount, filtersJson, deviceId, now)
    return { id, userId, query, resultsCount, filters, deviceId, createdAt: now }
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      // Update existing entry instead
      const updateStmt = db.prepare(`
        UPDATE search_history
        SET results_count = ?, synced_at = ?, created_at = ?
        WHERE user_id = ? AND query = ? AND device_id = ?
      `)
      updateStmt.run(resultsCount, now, now, userId, query, deviceId)
      return { id, userId, query, resultsCount, filters, deviceId, createdAt: now }
    }
    throw err
  }
}

/**
 * Get search history for a user (paginated, newest first)
 */
export function getSearchHistory(db, userId, { limit = 20, offset = 0 } = {}) {
  if (!userId) return { items: [], total: 0 }

  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM search_history WHERE user_id = ?
  `)
  const { total } = countStmt.get(userId)

  const stmt = db.prepare(`
    SELECT id, query, results_count, filters, device_id, created_at, synced_at
    FROM search_history
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `)

  const rows = stmt.all(userId, limit, offset)
  const items = rows.map((row) => ({
    id: row.id,
    query: row.query,
    resultsCount: row.results_count,
    filters: JSON.parse(row.filters || '{}'),
    deviceId: row.device_id,
    createdAt: row.created_at,
    syncedAt: row.synced_at,
  }))

  return { items, total }
}

/**
 * Sync local search history from client to backend
 * Accepts array of { query, timestamp, filters, deviceId }
 */
export function syncSearchHistory(db, userId, localHistory) {
  if (!userId || !Array.isArray(localHistory)) return { synced: 0, skipped: 0 }

  let synced = 0
  let skipped = 0

  for (const entry of localHistory) {
    try {
      const result = storeSearchHistory(db, {
        userId,
        query: entry.query,
        resultsCount: entry.resultsCount || 0,
        filters: entry.filters || {},
        deviceId: entry.deviceId,
      })
      synced++
    } catch (err) {
      skipped++
    }
  }

  return { synced, skipped }
}

/**
 * Clear old search history (older than days)
 */
export function clearOldSearchHistory(db, userId, days = 90) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const stmt = db.prepare(`
    DELETE FROM search_history
    WHERE user_id = ? AND created_at < ?
  `)
  stmt.run(userId, cutoff)
}

/**
 * Get search trends for a user
 */
export function getSearchTrends(db, userId, { days = 30, limit = 10 } = {}) {
  if (!userId) return []

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const stmt = db.prepare(`
    SELECT query, COUNT(*) as count, MAX(created_at) as last_searched
    FROM search_history
    WHERE user_id = ? AND created_at > ?
    GROUP BY query
    ORDER BY count DESC
    LIMIT ?
  `)

  const rows = stmt.all(userId, cutoff, limit)
  return rows.map((row) => ({
    query: row.query,
    count: row.count,
    lastSearched: row.last_searched,
  }))
}

/**
 * Get popular searches across all users (public trends)
 */
export function getPopularSearches(db, { days = 7, limit = 20 } = {}) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const stmt = db.prepare(`
    SELECT query, COUNT(*) as count, COUNT(DISTINCT user_id) as unique_users
    FROM search_history
    WHERE created_at > ?
    GROUP BY query
    ORDER BY count DESC
    LIMIT ?
  `)

  const rows = stmt.all(cutoff, limit)
  return rows.map((row) => ({
    query: row.query,
    searchCount: row.count,
    uniqueUsers: row.unique_users,
  }))
}
