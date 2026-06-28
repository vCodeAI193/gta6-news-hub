/**
 * Feature 2: Video content search with timestamps.
 *
 * Enables searching within video content and jumping to relevant timestamps.
 * Stores video transcripts with time-coded segments for precise searching.
 */

import { randomUUID } from 'node:crypto'

/**
 * Create video content table during DB initialization
 */
export function createVideoSearchTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS video_content (
      id TEXT PRIMARY KEY,
      article_id TEXT UNIQUE,
      video_url TEXT NOT NULL,
      video_duration INTEGER,
      transcript TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS video_segments (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      text TEXT NOT NULL,
      keywords TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      FOREIGN KEY (video_id) REFERENCES video_content(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_video_segments_text
    ON video_segments(text)
  `)
}

/**
 * Register a video with transcript for an article
 */
export function registerVideo(db, { articleId, videoUrl, duration = 0, transcript = '' }) {
  const id = randomUUID()
  const now = new Date().toISOString()

  const stmt = db.prepare(`
    INSERT INTO video_content (id, article_id, video_url, video_duration, transcript, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(article_id) DO UPDATE SET
      video_url = excluded.video_url,
      video_duration = excluded.video_duration,
      transcript = excluded.transcript,
      updated_at = excluded.updated_at
  `)

  stmt.run(id, articleId, videoUrl, duration, transcript, now, now)
  return { id, articleId, videoUrl, duration }
}

/**
 * Add time-coded segment to video (e.g., for chapters or auto-generated transcript)
 * segment = { startTime (seconds), endTime, text, keywords? }
 */
export function addVideoSegment(db, videoId, segment) {
  const segmentId = randomUUID()
  const now = new Date().toISOString()
  const keywords = JSON.stringify(segment.keywords || [])

  const stmt = db.prepare(`
    INSERT INTO video_segments (id, video_id, start_time, end_time, text, keywords, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    segmentId,
    videoId,
    Math.floor(segment.startTime),
    Math.floor(segment.endTime),
    segment.text,
    keywords,
    now,
  )

  return { id: segmentId, videoId, startTime: segment.startTime, endTime: segment.endTime, text: segment.text }
}

/**
 * Auto-segment a transcript into roughly equal chunks
 * Useful for auto-generated transcripts without natural boundaries
 */
export function segmentTranscript(transcript, segmentDuration = 30, videoDuration = 0) {
  // Simple word-based segmentation
  const words = transcript.split(/\s+/)
  const segments = []

  if (!videoDuration || words.length === 0) return segments

  const wordsPerSegment = Math.ceil(words.length / (videoDuration / segmentDuration))

  for (let i = 0; i < words.length; i += wordsPerSegment) {
    const startIdx = i
    const endIdx = Math.min(i + wordsPerSegment, words.length)
    const text = words.slice(startIdx, endIdx).join(' ')

    segments.push({
      startTime: (i / words.length) * videoDuration,
      endTime: Math.min((endIdx / words.length) * videoDuration, videoDuration),
      text,
      keywords: extractKeywords(text),
    })
  }

  return segments
}

/**
 * Extract keywords from text (simple noun extraction)
 */
function extractKeywords(text) {
  // Simple heuristic: capitalized words and GTA-related terms
  const gta6Terms = [
    'gta6',
    'gta',
    'lucia',
    'jason',
    'vice',
    'city',
    'leonida',
    'leak',
    'trailer',
    'rockstar',
    'map',
    'character',
  ]
  const lower = text.toLowerCase()
  return gta6Terms.filter((term) => lower.includes(term))
}

/**
 * Search within video segments
 */
export function searchVideoSegments(db, query) {
  if (!query || query.length < 2) return []

  const queryLower = `%${query.toLowerCase()}%`

  const stmt = db.prepare(`
    SELECT
      vs.id,
      vs.video_id,
      vs.start_time,
      vs.end_time,
      vs.text,
      vs.keywords,
      vc.article_id,
      vc.video_url,
      vc.video_duration
    FROM video_segments vs
    JOIN video_content vc ON vs.video_id = vc.id
    WHERE LOWER(vs.text) LIKE ?
    ORDER BY vs.start_time ASC
  `)

  const rows = stmt.all(queryLower)
  return rows.map((row) => ({
    id: row.id,
    videoId: row.video_id,
    articleId: row.article_id,
    videoUrl: row.video_url,
    startTime: row.start_time,
    endTime: row.end_time,
    text: row.text,
    keywords: JSON.parse(row.keywords || '[]'),
    videoDuration: row.video_duration,
  }))
}

/**
 * Get all segments for a video
 */
export function getVideoSegments(db, videoId) {
  const stmt = db.prepare(`
    SELECT id, start_time, end_time, text, keywords
    FROM video_segments
    WHERE video_id = ?
    ORDER BY start_time ASC
  `)

  const rows = stmt.all(videoId)
  return rows.map((row) => ({
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    text: row.text,
    keywords: JSON.parse(row.keywords || '[]'),
  }))
}

/**
 * Get video info for an article
 */
export function getArticleVideo(db, articleId) {
  const stmt = db.prepare(`
    SELECT id, article_id, video_url, video_duration, transcript
    FROM video_content
    WHERE article_id = ?
  `)

  const row = stmt.get(articleId)
  if (!row) return null

  return {
    id: row.id,
    articleId: row.article_id,
    videoUrl: row.video_url,
    duration: row.video_duration,
    transcript: row.transcript,
  }
}

/**
 * Batch add video segments (e.g., from auto-transcript service)
 */
export function batchAddSegments(db, videoId, segments) {
  let added = 0
  for (const segment of segments) {
    try {
      addVideoSegment(db, videoId, segment)
      added++
    } catch (err) {
      console.error('Failed to add segment:', err)
    }
  }
  return { added, total: segments.length }
}
