/**
 * Video Content Moderation - Frame-by-frame analysis for NSFW and policy violations
 *
 * Features:
 * - Frame extraction and analysis
 * - NSFW detection
 * - Policy violation detection
 * - Scene analysis
 * - Timeline tracking
 */

import { randomUUID } from 'node:crypto'

const VIOLATION_TYPES = {
  nsfw: 'nsfw',
  violence: 'violence',
  hateSpeech: 'hate_speech',
  copyright: 'copyright',
  watermark: 'missing_watermark',
  other: 'other',
}

const FRAME_ANALYSIS_SETTINGS = {
  extractEvery: 5, // Extract every 5th frame
  nsfwThreshold: 0.7,
  violationThreshold: 0.6,
}

/**
 * Analyze video content
 */
export function analyzeVideoContent(db, videoId, videoMetadata = {}) {
  const analysisId = randomUUID()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO video_analysis (
      id, video_id, status, frames_analyzed, violations_found,
      metadata, started_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    analysisId,
    videoId,
    'pending',
    0,
    0,
    JSON.stringify(videoMetadata),
    now,
    now
  )

  return {
    id: analysisId,
    videoId,
    status: 'pending',
    startedAt: now,
  }
}

/**
 * Process video frame
 */
export function processVideoFrame(db, analysisId, frameNumber, frameData) {
  const frameId = randomUUID()
  const now = new Date().toISOString()

  // Simulate frame analysis
  const nsfwScore = simulateNSFWDetection(frameData)
  const violationScores = simulateViolationDetection(frameData)

  const violations = []

  if (nsfwScore > FRAME_ANALYSIS_SETTINGS.nsfwThreshold) {
    violations.push({
      type: VIOLATION_TYPES.nsfw,
      confidence: nsfwScore,
      timestamp: frameNumber,
    })
  }

  for (const [type, score] of Object.entries(violationScores)) {
    if (score > FRAME_ANALYSIS_SETTINGS.violationThreshold) {
      violations.push({
        type,
        confidence: score,
        timestamp: frameNumber,
      })
    }
  }

  db.prepare(`
    INSERT INTO video_frames (
      id, analysis_id, frame_number, nsfw_score, violation_scores,
      violations_detected, processed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    frameId,
    analysisId,
    frameNumber,
    nsfwScore,
    JSON.stringify(violationScores),
    violations.length > 0 ? 1 : 0,
    now
  )

  if (violations.length > 0) {
    recordFrameViolations(db, analysisId, frameId, frameNumber, violations)
  }

  return {
    id: frameId,
    frameNumber,
    nsfwScore,
    violations,
  }
}

/**
 * Simulate NSFW detection (in production, use ML model)
 */
function simulateNSFWDetection(frameData) {
  // Simulated NSFW detection score
  return Math.random() * 0.3 // Returns 0-0.3 (usually safe)
}

/**
 * Simulate violation detection (in production, use multiple ML models)
 */
function simulateViolationDetection(frameData) {
  return {
    violence: Math.random() * 0.2,
    hate_speech_indicators: Math.random() * 0.1,
    watermark_present: Math.random() > 0.5 ? 1.0 : 0,
    audio_quality_issues: Math.random() * 0.3,
  }
}

/**
 * Record frame violations
 */
function recordFrameViolations(db, analysisId, frameId, frameNumber, violations) {
  for (const violation of violations) {
    const violationId = randomUUID()

    db.prepare(`
      INSERT INTO video_violations (
        id, analysis_id, frame_id, frame_number, violation_type,
        confidence, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      violationId,
      analysisId,
      frameId,
      frameNumber,
      violation.type,
      violation.confidence,
      JSON.stringify(violation),
      new Date().toISOString()
    )
  }

  // Update analysis summary
  const totalViolations = db.prepare(`
    SELECT COUNT(*) as count FROM video_violations WHERE analysis_id = ?
  `).get(analysisId).count

  db.prepare(`
    UPDATE video_analysis
    SET violations_found = ?, updated_at = ?
    WHERE id = ?
  `).run(totalViolations, new Date().toISOString(), analysisId)
}

/**
 * Complete video analysis
 */
export function completeVideoAnalysis(db, analysisId) {
  const analysis = db.prepare('SELECT * FROM video_analysis WHERE id = ?').get(analysisId)

  if (!analysis) return null

  const violations = db.prepare(`
    SELECT * FROM video_violations
    WHERE analysis_id = ? ORDER BY frame_number ASC
  `).all(analysisId)

  const severity = calculateVideoSeverity(violations)
  const now = new Date().toISOString()

  db.prepare(`
    UPDATE video_analysis
    SET status = ?, severity = ?, completed_at = ?, updated_at = ?
    WHERE id = ?
  `).run(
    violations.length > 0 ? 'flagged' : 'approved',
    severity,
    now,
    now,
    analysisId
  )

  return {
    id: analysisId,
    status: violations.length > 0 ? 'flagged' : 'approved',
    severity,
    violationCount: violations.length,
    violations: groupViolationsByType(violations),
  }
}

/**
 * Calculate overall severity
 */
function calculateVideoSeverity(violations) {
  if (violations.length === 0) return 'none'

  const criticalCount = violations.filter(v => v.confidence > 0.9).length
  const highCount = violations.filter(v => v.confidence > 0.7).length

  if (criticalCount > 0) return 'critical'
  if (highCount > 2) return 'high'
  if (violations.length > 5) return 'medium'

  return 'low'
}

/**
 * Group violations by type
 */
function groupViolationsByType(violations) {
  const grouped = {}

  for (const violation of violations) {
    if (!grouped[violation.violation_type]) {
      grouped[violation.violation_type] = []
    }
    grouped[violation.violation_type].push({
      frameNumber: violation.frame_number,
      confidence: violation.confidence,
    })
  }

  return grouped
}

/**
 * Get video analysis report
 */
export function getVideoAnalysisReport(db, analysisId) {
  const analysis = db.prepare('SELECT * FROM video_analysis WHERE id = ?').get(analysisId)

  if (!analysis) return null

  const violations = db.prepare(`
    SELECT * FROM video_violations WHERE analysis_id = ?
    ORDER BY frame_number ASC
  `).all(analysisId)

  const frames = db.prepare(`
    SELECT * FROM video_frames WHERE analysis_id = ?
    ORDER BY frame_number ASC
  `).all(analysisId)

  const timeline = generateViolationTimeline(violations, frames)

  return {
    id: analysisId,
    videoId: analysis.video_id,
    status: analysis.status,
    severity: analysis.severity,
    completedAt: analysis.completed_at,
    metadata: JSON.parse(analysis.metadata),
    summary: {
      totalFramesAnalyzed: frames.length,
      violationsFound: violations.length,
      violationTypes: groupViolationsByType(violations),
    },
    timeline,
    violations: violations.map(v => ({
      ...v,
      metadata: JSON.parse(v.metadata),
    })),
  }
}

/**
 * Generate violation timeline
 */
function generateViolationTimeline(violations, frames) {
  const timeline = []

  for (const violation of violations) {
    const frame = frames.find(f => f.id === violation.frame_id)

    timeline.push({
      frameNumber: violation.frame_number,
      timestamp: frame ? calculateTimestamp(frame.frame_number) : null,
      type: violation.violation_type,
      confidence: violation.confidence,
      details: JSON.parse(violation.metadata),
    })
  }

  return timeline
}

/**
 * Calculate timestamp from frame number
 */
function calculateTimestamp(frameNumber) {
  const fps = 24 // Assume 24 fps
  const seconds = frameNumber / fps
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Flag video for manual review
 */
export function flagVideoForReview(db, analysisId, reason = '') {
  const now = new Date().toISOString()

  db.prepare(`
    UPDATE video_analysis
    SET flagged_for_review = 1, review_reason = ?, updated_at = ?
    WHERE id = ?
  `).run(reason, now, analysisId)

  return { id: analysisId, flaggedForReview: true }
}

/**
 * Get review queue
 */
export function getReviewQueue(db, limit = 20) {
  return db.prepare(`
    SELECT va.*, COUNT(vv.id) as violation_count
    FROM video_analysis va
    LEFT JOIN video_violations vv ON va.id = vv.analysis_id
    WHERE va.flagged_for_review = 1 OR va.severity IN ('high', 'critical')
    GROUP BY va.id
    ORDER BY va.severity DESC, va.created_at ASC
    LIMIT ?
  `).all(limit)
}

/**
 * Get statistics
 */
export function getVideoModerationStats(db) {
  return {
    totalAnalyzed: db.prepare('SELECT COUNT(*) as count FROM video_analysis').get().count,
    flagged: db.prepare(`
      SELECT COUNT(*) as count FROM video_analysis
      WHERE status = ? OR flagged_for_review = 1
    `).get('flagged').count,
    bySeverity: db.prepare(`
      SELECT severity, COUNT(*) as count FROM video_analysis
      WHERE severity IS NOT NULL
      GROUP BY severity
    `).all(),
    byViolationType: db.prepare(`
      SELECT violation_type, COUNT(*) as count FROM video_violations
      GROUP BY violation_type
    `).all(),
    avgViolationsPerVideo: db.prepare(`
      SELECT AVG(violation_count) as avg FROM (
        SELECT COUNT(*) as violation_count FROM video_violations
        GROUP BY analysis_id
      )
    `).get().avg || 0,
  }
}

/**
 * Export analysis report
 */
export function exportAnalysisReport(db, analysisId, format = 'json') {
  const report = getVideoAnalysisReport(db, analysisId)

  if (format === 'json') {
    return JSON.stringify(report, null, 2)
  }

  // CSV format
  let csv = 'Frame,Timestamp,Violation Type,Confidence\n'

  for (const event of report.timeline) {
    csv += `${event.frameNumber},${event.timestamp},${event.type},${event.confidence.toFixed(2)}\n`
  }

  return csv
}

/**
 * Get analysis by video ID
 */
export function getAnalysisByVideoId(db, videoId) {
  return db.prepare(`
    SELECT * FROM video_analysis
    WHERE video_id = ?
    ORDER BY created_at DESC
  `).all(videoId)
}

/**
 * Delete analysis
 */
export function deleteAnalysis(db, analysisId) {
  db.prepare('DELETE FROM video_violations WHERE analysis_id = ?').run(analysisId)
  db.prepare('DELETE FROM video_frames WHERE analysis_id = ?').run(analysisId)
  db.prepare('DELETE FROM video_analysis WHERE id = ?').run(analysisId)

  return { id: analysisId, deleted: true }
}
