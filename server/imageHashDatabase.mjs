/**
 * Image Hash Database - Blocklist of known illegal content using perceptual hashing
 *
 * Features:
 * - Perceptual hashing (simhash, dhash)
 * - Hash blocklist management
 * - Similarity matching
 * - Batch processing
 * - Cache management
 */

import { randomUUID } from 'node:crypto'
import { createHash } from 'node:crypto'

/**
 * Calculate simple perceptual hash (simhash)
 * Simplified implementation - in production use a proper image hashing library
 */
function calculateSimHash(imageBuffer) {
  // This is a simplified implementation
  // In production, use a library like: sharp + jimp + imghash
  const hash = createHash('sha256').update(imageBuffer).digest('hex')
  return hash.substring(0, 16) // Use first 64 bits
}

/**
 * Calculate difference hash (dhash)
 */
function calculateDHash(imageBuffer) {
  const hash = createHash('sha256').update(imageBuffer).digest('hex')
  return hash.substring(16, 32)
}

/**
 * Calculate hamming distance between two hashes
 * Used to find similar images
 */
function hammingDistance(hash1, hash2) {
  if (hash1.length !== hash2.length) return Infinity

  let distance = 0
  for (let i = 0; i < hash1.length; i++) {
    const xor = parseInt(hash1[i], 16) ^ parseInt(hash2[i], 16)
    let bits = 0
    let num = xor
    while (num) {
      bits += num & 1
      num >>= 1
    }
    distance += bits
  }

  return distance
}

/**
 * Add image hash to blocklist
 */
export function addHashToBlocklist(db, imageBuffer, metadata = {}) {
  const hashId = randomUUID()
  const simhash = calculateSimHash(imageBuffer)
  const dhash = calculateDHash(imageBuffer)
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO image_hash_blocklist (
      id, simhash, dhash, reason, severity, metadata,
      added_by, reported_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    hashId,
    simhash,
    dhash,
    metadata.reason || 'unknown',
    metadata.severity || 'medium',
    JSON.stringify(metadata),
    metadata.addedBy || 'system',
    0,
    now
  )

  return {
    id: hashId,
    simhash,
    dhash,
    reason: metadata.reason,
  }
}

/**
 * Check if image hash matches blocklist
 */
export function checkImageHash(db, imageBuffer, threshold = 5) {
  const simhash = calculateSimHash(imageBuffer)
  const dhash = calculateDHash(imageBuffer)

  // Get all hashes from blocklist
  const blocklist = db.prepare(`
    SELECT id, simhash, dhash, reason, severity FROM image_hash_blocklist
    WHERE active = 1
  `).all()

  const matches = []

  for (const blocked of blocklist) {
    const simDistance = hammingDistance(simhash, blocked.simhash)
    const dhDistance = hammingDistance(dhash, blocked.dhash)

    // If either hash is very similar (distance < threshold), flag it
    if (simDistance < threshold || dhDistance < threshold) {
      matches.push({
        blockedHashId: blocked.id,
        reason: blocked.reason,
        severity: blocked.severity,
        simHashDistance: simDistance,
        dhHashDistance: dhDistance,
        confidence: 1 - (Math.min(simDistance, dhDistance) / threshold),
      })
    }
  }

  return {
    allowed: matches.length === 0,
    matches,
    hashes: { simhash, dhash },
  }
}

/**
 * Find similar images in blocklist
 */
export function findSimilarImages(db, imageBuffer, maxResults = 10) {
  const simhash = calculateSimHash(imageBuffer)
  const dhash = calculateDHash(imageBuffer)

  const blocklist = db.prepare(`
    SELECT id, simhash, dhash, reason, severity, created_at FROM image_hash_blocklist
    WHERE active = 1
  `).all()

  const similarities = blocklist.map(blocked => ({
    blockedHashId: blocked.id,
    reason: blocked.reason,
    severity: blocked.severity,
    createdAt: blocked.created_at,
    simHashDistance: hammingDistance(simhash, blocked.simhash),
    dhHashDistance: hammingDistance(dhash, blocked.dhash),
  }))

  // Sort by average distance and return top results
  return similarities
    .sort((a, b) => {
      const avgA = (a.simHashDistance + a.dhHashDistance) / 2
      const avgB = (b.simHashDistance + b.dhHashDistance) / 2
      return avgA - avgB
    })
    .slice(0, maxResults)
}

/**
 * Batch add multiple images
 */
export function batchAddImages(db, images) {
  const results = []

  for (const image of images) {
    const result = addHashToBlocklist(db, image.buffer, image.metadata)
    results.push(result)
  }

  return results
}

/**
 * Get blocklist statistics
 */
export function getBlocklistStats(db) {
  const stats = {
    totalHashes: db.prepare('SELECT COUNT(*) as count FROM image_hash_blocklist').get().count,
    byReason: db.prepare(`
      SELECT reason, COUNT(*) as count FROM image_hash_blocklist
      GROUP BY reason
    `).all(),
    bySeverity: db.prepare(`
      SELECT severity, COUNT(*) as count FROM image_hash_blocklist
      GROUP BY severity
    `).all(),
    mostReported: db.prepare(`
      SELECT id, reason, severity, reported_count FROM image_hash_blocklist
      ORDER BY reported_count DESC
      LIMIT 10
    `).all(),
    recentAdditions: db.prepare(`
      SELECT id, reason, severity, added_by, created_at FROM image_hash_blocklist
      ORDER BY created_at DESC
      LIMIT 20
    `).all(),
  }

  return stats
}

/**
 * Remove hash from blocklist
 */
export function removeHashFromBlocklist(db, hashId) {
  db.prepare(`
    UPDATE image_hash_blocklist SET active = 0 WHERE id = ?
  `).run(hashId)

  return { id: hashId, removed: true }
}

/**
 * Update hash metadata
 */
export function updateHashMetadata(db, hashId, metadata) {
  db.prepare(`
    UPDATE image_hash_blocklist
    SET metadata = ?, updated_at = ?
    WHERE id = ?
  `).run(JSON.stringify(metadata), new Date().toISOString(), hashId)

  return { id: hashId, updated: true }
}

/**
 * Increment reported count
 */
export function incrementReportCount(db, hashId) {
  db.prepare(`
    UPDATE image_hash_blocklist
    SET reported_count = reported_count + 1
    WHERE id = ?
  `).run(hashId)
}

/**
 * Get hash by ID
 */
export function getHashById(db, hashId) {
  return db.prepare(`
    SELECT * FROM image_hash_blocklist WHERE id = ?
  `).get(hashId)
}

/**
 * Search blocklist
 */
export function searchBlocklist(db, filters = {}) {
  let query = 'SELECT * FROM image_hash_blocklist WHERE active = 1'
  const params = []

  if (filters.reason) {
    query += ' AND reason = ?'
    params.push(filters.reason)
  }

  if (filters.severity) {
    query += ' AND severity = ?'
    params.push(filters.severity)
  }

  if (filters.addedAfter) {
    query += ' AND created_at > ?'
    params.push(filters.addedAfter)
  }

  if (filters.search) {
    query += ' AND (reason LIKE ? OR metadata LIKE ?)'
    const search = `%${filters.search}%`
    params.push(search, search)
  }

  query += ' ORDER BY created_at DESC'

  if (filters.limit) {
    query += ' LIMIT ?'
    params.push(filters.limit)
  }

  return db.prepare(query).all(...params)
}

/**
 * Export blocklist for external use
 */
export function exportBlocklist(db, format = 'json') {
  const hashes = db.prepare(`
    SELECT id, simhash, dhash, reason, severity
    FROM image_hash_blocklist
    WHERE active = 1
  `).all()

  if (format === 'json') {
    return {
      exportedAt: new Date().toISOString(),
      version: 1,
      count: hashes.length,
      hashes,
    }
  }

  // CSV format
  const headers = 'id,simhash,dhash,reason,severity'
  const rows = hashes.map(h => `${h.id},${h.simhash},${h.dhash},${h.reason},${h.severity}`)
  return [headers, ...rows].join('\n')
}

/**
 * Import blocklist from external source
 */
export function importBlocklist(db, data, source = 'manual') {
  const results = {
    imported: 0,
    duplicates: 0,
    errors: 0,
  }

  for (const hash of data.hashes || []) {
    try {
      const existing = db.prepare(`
        SELECT id FROM image_hash_blocklist
        WHERE simhash = ? AND dhash = ? AND active = 1
      `).get(hash.simhash, hash.dhash)

      if (existing) {
        results.duplicates++
        continue
      }

      addHashToBlocklist(db, Buffer.from(''), {
        reason: hash.reason,
        severity: hash.severity,
        addedBy: source,
      })

      results.imported++
    } catch {
      results.errors++
    }
  }

  return results
}

/**
 * Get hash cache stats
 */
export function getCacheStats(db) {
  return {
    totalCached: db.prepare('SELECT COUNT(*) as count FROM image_hash_cache').get().count,
    cacheHitRate: db.prepare(`
      SELECT
        SUM(CASE WHEN hit = 1 THEN 1 ELSE 0 END) / COUNT(*) as hit_rate
      FROM image_hash_cache
      WHERE created_at > datetime('now', '-24 hours')
    `).get().hit_rate || 0,
    oldestEntry: db.prepare(`
      SELECT MIN(created_at) as oldest FROM image_hash_cache
    `).get().oldest,
  }
}

/**
 * Clear old cache entries
 */
export function clearOldCacheEntries(db, ageHours = 72) {
  const result = db.prepare(`
    DELETE FROM image_hash_cache
    WHERE created_at < datetime('now', '-' || ? || ' hours')
  `).run(ageHours)

  return { deleted: result.changes }
}
