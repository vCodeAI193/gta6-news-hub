/**
 * Feature 3: Search trends visualization endpoint and chart component.
 *
 * Tracks search trends over time, aggregates by time period, and provides
 * data suitable for visualization (charts, graphs).
 */

/**
 * Create search trends table during DB initialization
 */
export function createSearchTrendsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS search_trends (
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      search_date TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      unique_users INTEGER NOT NULL DEFAULT 0,
      category TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(query, search_date)
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_search_trends_date
    ON search_trends(search_date DESC)
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_search_trends_query
    ON search_trends(query)
  `)
}

/**
 * Record a search event for trends
 */
export function recordSearchEvent(db, { query, category = null, userId = null }) {
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const now = new Date().toISOString()
  const trendId = `${query}:${date}`

  try {
    const stmt = db.prepare(`
      INSERT INTO search_trends (id, query, search_date, count, unique_users, category, created_at)
      VALUES (?, ?, ?, 1, 1, ?, ?)
    `)
    stmt.run(trendId, query, date, category, now)
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      // Increment existing trend
      const updateStmt = db.prepare(`
        UPDATE search_trends
        SET count = count + 1,
            unique_users = CASE WHEN ? THEN unique_users + 1 ELSE unique_users END
        WHERE query = ? AND search_date = ?
      `)
      // userId being new is not tracked server-side in this simple impl
      updateStmt.run(userId ? 1 : 0, query, date)
    }
  }
}

/**
 * Get trends for a date range with bucketing
 * bucket: 'day' | 'week' | 'month'
 */
export function getTrendsByPeriod(db, { days = 30, bucket = 'day', limit = 20 } = {}) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  let dateGroup = "search_date"
  if (bucket === 'week') {
    dateGroup = "strftime('%Y-W%W', search_date)"
  } else if (bucket === 'month') {
    dateGroup = "strftime('%Y-%m', search_date)"
  }

  const stmt = db.prepare(`
    SELECT
      ${dateGroup} as period,
      query,
      SUM(count) as total_searches,
      SUM(unique_users) as total_users
    FROM search_trends
    WHERE search_date >= ?
    GROUP BY period, query
    ORDER BY period DESC, total_searches DESC
    LIMIT ?
  `)

  const rows = stmt.all(cutoff, limit)
  return rows.map((row) => ({
    period: row.period,
    query: row.query,
    totalSearches: row.total_searches,
    totalUsers: row.total_users,
  }))
}

/**
 * Get top trending queries for a date range
 */
export function getTopTrends(db, { days = 7, limit = 10 } = {}) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const stmt = db.prepare(`
    SELECT query, SUM(count) as total, SUM(unique_users) as users
    FROM search_trends
    WHERE search_date >= ?
    GROUP BY query
    ORDER BY total DESC
    LIMIT ?
  `)

  const rows = stmt.all(cutoff, limit)
  return rows.map((row) => ({
    query: row.query,
    searches: row.total,
    users: row.users,
  }))
}

/**
 * Get trend velocity (change) for a query
 * Compares two periods to show if trending up/down
 */
export function getTrendVelocity(db, query, { recentDays = 7, compareDays = 14 } = {}) {
  const recent = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const older = new Date(Date.now() - compareDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const recentStmt = db.prepare(`
    SELECT SUM(count) as total FROM search_trends
    WHERE query = ? AND search_date >= ?
  `)

  const olderStmt = db.prepare(`
    SELECT SUM(count) as total FROM search_trends
    WHERE query = ? AND search_date >= ? AND search_date < ?
  `)

  const recentCount = (recentStmt.get(query, recent)?.total || 0)
  const olderCount = (olderStmt.get(query, older, recent)?.total || 0)

  const velocity = olderCount > 0 ? ((recentCount - olderCount) / olderCount) * 100 : 0

  return {
    query,
    recentCount,
    olderCount,
    velocityPercent: Math.round(velocity),
    trending: velocity > 0 ? 'up' : velocity < 0 ? 'down' : 'stable',
  }
}

/**
 * Get trending queries as a time series for charting
 * Returns { timestamps: [], series: [{ name: 'query', data: [] }] }
 */
export function getTrendTimeSeries(db, { days = 30, topN = 5 } = {}) {
  // Get top N queries first
  const topQueries = getTopTrends(db, { days, limit: topN })
  const queryList = topQueries.map((t) => t.query)

  if (queryList.length === 0) {
    return { timestamps: [], series: [] }
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const placeholders = queryList.map(() => '?').join(',')

  const stmt = db.prepare(`
    SELECT search_date, query, SUM(count) as count
    FROM search_trends
    WHERE search_date >= ? AND query IN (${placeholders})
    GROUP BY search_date, query
    ORDER BY search_date ASC
  `)

  const rows = stmt.all(cutoff, ...queryList)

  // Organize by date
  const byDate = new Map()
  const allDates = new Set()

  for (const row of rows) {
    allDates.add(row.search_date)
    if (!byDate.has(row.search_date)) {
      byDate.set(row.search_date, {})
    }
    byDate.get(row.search_date)[row.query] = row.count
  }

  const timestamps = Array.from(allDates).sort()
  const series = queryList.map((query) => ({
    name: query,
    data: timestamps.map((date) => byDate.get(date)?.[query] || 0),
  }))

  return { timestamps, series }
}

/**
 * Get related trending queries (co-occurrence)
 */
export function getRelatedTrends(db, query, { days = 7, limit = 5 } = {}) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const stmt = db.prepare(`
    SELECT DISTINCT st2.query, COUNT(st2.query) as cooccur
    FROM search_trends st1
    JOIN search_trends st2
      ON st1.search_date = st2.search_date AND st1.query != st2.query
    WHERE st1.query = ? AND st1.search_date >= ?
    GROUP BY st2.query
    ORDER BY cooccur DESC
    LIMIT ?
  `)

  const rows = stmt.all(query, cutoff, limit)
  return rows.map((row) => ({
    query: row.query,
    cooccurrence: row.cooccur,
  }))
}

/**
 * Clear old trend data (older than days)
 */
export function clearOldTrends(db, days = 365) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const stmt = db.prepare(`
    DELETE FROM search_trends
    WHERE search_date < ?
  `)

  stmt.run(cutoff)
}
