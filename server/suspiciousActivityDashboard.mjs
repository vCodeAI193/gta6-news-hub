/**
 * Suspicious Activity Dashboard - Admin panel for anomaly detection
 *
 * Features:
 * - Real-time anomaly detection
 * - Repeat offender tracking
 * - Trend analysis
 * - User behavior profiling
 * - Risk scoring
 */

import { randomUUID } from 'node:crypto'

const ANOMALY_TYPES = {
  rapidPosting: 'rapid_posting',
  bulkReporting: 'bulk_reporting',
  patternedBehavior: 'patterned_behavior',
  contentViolations: 'content_violations',
  accountAnomalies: 'account_anomalies',
  networkAnomalies: 'network_anomalies',
}

const RISK_LEVELS = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
}

/**
 * Track user activity and detect anomalies
 */
export function trackUserActivity(db, userId, activity) {
  const activityId = randomUUID()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO user_activities (
      id, user_id, activity_type, details, created_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run(
    activityId,
    userId,
    activity.type,
    JSON.stringify(activity.details || {}),
    now
  )

  // Check for anomalies after recording
  const anomalies = detectAnomalies(db, userId)
  if (anomalies.length > 0) {
    recordAnomalies(db, userId, anomalies)
  }

  return { id: activityId, anomalies }
}

/**
 * Detect anomalies in user behavior
 */
function detectAnomalies(db, userId) {
  const anomalies = []

  // Check for rapid posting
  const recentActivities = db.prepare(`
    SELECT COUNT(*) as count
    FROM user_activities
    WHERE user_id = ? AND created_at > datetime('now', '-5 minutes')
    AND activity_type IN ('comment', 'post')
  `).get(userId).count

  if (recentActivities > 10) {
    anomalies.push({
      type: ANOMALY_TYPES.rapidPosting,
      severity: recentActivities > 20 ? 'high' : 'medium',
      count: recentActivities,
    })
  }

  // Check for bulk reporting
  const recentReports = db.prepare(`
    SELECT COUNT(*) as count
    FROM user_activities
    WHERE user_id = ? AND created_at > datetime('now', '-1 hour')
    AND activity_type = 'report'
  `).get(userId).count

  if (recentReports > 5) {
    anomalies.push({
      type: ANOMALY_TYPES.bulkReporting,
      severity: recentReports > 10 ? 'high' : 'medium',
      count: recentReports,
    })
  }

  // Check for content violations
  const violationCount = db.prepare(`
    SELECT COUNT(*) as count
    FROM escalations
    WHERE created_at > datetime('now', '-24 hours')
    AND category IN ('spam', 'harassment', 'hate_speech')
    AND target_id IN (
      SELECT id FROM comments WHERE user_id = ?
    )
  `).get(userId).count

  if (violationCount > 2) {
    anomalies.push({
      type: ANOMALY_TYPES.contentViolations,
      severity: violationCount > 5 ? 'high' : 'medium',
      count: violationCount,
    })
  }

  // Check account anomalies
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  if (user) {
    const accountAge = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60)
    const violationCount2 = db.prepare(`
      SELECT COUNT(*) as count FROM escalations
      WHERE target_id = (SELECT id FROM comments WHERE user_id = ?)
    `).get(userId).count

    if (accountAge < 24 && violationCount2 > 1) {
      anomalies.push({
        type: ANOMALY_TYPES.accountAnomalies,
        severity: 'high',
        reason: 'New account with violations',
      })
    }
  }

  return anomalies
}

/**
 * Record detected anomalies
 */
function recordAnomalies(db, userId, anomalies) {
  for (const anomaly of anomalies) {
    const anomalyId = randomUUID()
    const riskLevel = calculateRiskLevel(anomaly)

    db.prepare(`
      INSERT INTO anomalies (
        id, user_id, anomaly_type, severity, risk_level,
        details, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      anomalyId,
      userId,
      anomaly.type,
      anomaly.severity,
      riskLevel,
      JSON.stringify(anomaly),
      'detected',
      new Date().toISOString()
    )
  }
}

/**
 * Calculate risk level from anomaly
 */
function calculateRiskLevel(anomaly) {
  if (anomaly.severity === 'high') {
    if (anomaly.type === ANOMALY_TYPES.rapidPosting) return RISK_LEVELS.high
    if (anomaly.type === ANOMALY_TYPES.contentViolations) return RISK_LEVELS.critical
    if (anomaly.type === ANOMALY_TYPES.accountAnomalies) return RISK_LEVELS.high
  }

  return RISK_LEVELS.medium
}

/**
 * Get repeat offenders
 */
export function getRepeatOffenders(db, limit = 50) {
  return db.prepare(`
    SELECT
      u.id, u.display_name, u.email,
      COUNT(DISTINCT e.id) as violation_count,
      COUNT(DISTINCT CASE WHEN e.status = 'resolved' THEN e.id END) as resolved_count,
      MAX(e.created_at) as latest_violation,
      JSON_GROUP_ARRAY(DISTINCT e.category) as violation_categories
    FROM users u
    JOIN comments c ON u.id = c.user_id
    JOIN escalations e ON c.id = e.target_id AND e.target_type = 'comment'
    WHERE e.created_at > datetime('now', '-30 days')
    GROUP BY u.id
    HAVING violation_count >= 3
    ORDER BY violation_count DESC
    LIMIT ?
  `).all(limit)
}

/**
 * Get trend analysis
 */
export function getTrendAnalysis(db, timeRange = '7 days') {
  const stats = db.prepare(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as total,
      COUNT(CASE WHEN severity_score >= 7 THEN 1 END) as high_severity,
      COUNT(CASE WHEN category = 'spam' THEN 1 END) as spam_count,
      COUNT(CASE WHEN category = 'harassment' THEN 1 END) as harassment_count,
      COUNT(CASE WHEN category = 'hate_speech' THEN 1 END) as hate_count
    FROM escalations
    WHERE created_at > datetime('now', '-' || ? || '')
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).all(timeRange)

  return {
    timeRange,
    data: stats,
    summary: {
      totalEscalations: stats.reduce((sum, s) => sum + s.total, 0),
      highSeverityCount: stats.reduce((sum, s) => sum + s.high_severity, 0),
      trend: calculateTrend(stats.map(s => s.total)),
    },
  }
}

/**
 * Calculate trend direction
 */
function calculateTrend(values) {
  if (values.length < 2) return 'stable'

  const recent = values[0]
  const previous = values[Math.min(1, values.length - 1)]

  const change = ((recent - previous) / previous) * 100

  if (change > 10) return 'increasing'
  if (change < -10) return 'decreasing'
  return 'stable'
}

/**
 * Get user risk profile
 */
export function getUserRiskProfile(db, userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  if (!user) return null

  const violationCount = db.prepare(`
    SELECT COUNT(*) as count FROM escalations
    WHERE target_id IN (
      SELECT id FROM comments WHERE user_id = ?
    )
  `).get(userId).count

  const reportCount = db.prepare(`
    SELECT COUNT(*) as count FROM reports
    WHERE created_at > datetime('now', '-30 days')
    AND target_id IN (
      SELECT id FROM comments WHERE user_id = ?
    )
  `).get(userId).count

  const accountAge = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)

  const recentActivities = db.prepare(`
    SELECT COUNT(*) as count FROM user_activities
    WHERE user_id = ? AND created_at > datetime('now', '-24 hours')
  `).get(userId).count

  let riskScore = 0
  const factors = []

  if (violationCount > 5) {
    riskScore += 30
    factors.push('high_violation_count')
  }

  if (reportCount > 3) {
    riskScore += 25
    factors.push('frequently_reported')
  }

  if (accountAge < 7) {
    riskScore += 20
    factors.push('new_account')
  }

  if (recentActivities > 50) {
    riskScore += 15
    factors.push('excessive_activity')
  }

  if (user.banned) {
    riskScore = 100
    factors.push('banned_user')
  }

  let riskLevel = RISK_LEVELS.low
  if (riskScore >= 80) riskLevel = RISK_LEVELS.critical
  else if (riskScore >= 50) riskLevel = RISK_LEVELS.high
  else if (riskScore >= 20) riskLevel = RISK_LEVELS.medium

  return {
    userId,
    displayName: user.display_name,
    email: user.email,
    riskScore,
    riskLevel,
    factors,
    metrics: {
      violationCount,
      reportCount,
      accountAgeDays: Math.floor(accountAge),
      recentActivityCount: recentActivities,
    },
  }
}

/**
 * Get dashboard summary
 */
export function getDashboardSummary(db) {
  const now = new Date()
  const hour24Ago = new Date(now - 24 * 60 * 60 * 1000).toISOString()
  const week7Ago = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()

  return {
    escalations: {
      today: db.prepare(`
        SELECT COUNT(*) as count FROM escalations
        WHERE created_at > ?
      `).get(new Date(now.setHours(0, 0, 0, 0)).toISOString()).count,
      last24h: db.prepare(`
        SELECT COUNT(*) as count FROM escalations
        WHERE created_at > ?
      `).get(hour24Ago).count,
      pending: db.prepare(`
        SELECT COUNT(*) as count FROM escalations WHERE status = ?
      `).get('pending').count,
      critical: db.prepare(`
        SELECT COUNT(*) as count FROM escalations
        WHERE severity_score >= 9
      `).get().count,
    },
    anomalies: {
      detected24h: db.prepare(`
        SELECT COUNT(*) as count FROM anomalies
        WHERE created_at > ? AND status = ?
      `).get(hour24Ago, 'detected').count,
      critical: db.prepare(`
        SELECT COUNT(*) as count FROM anomalies
        WHERE risk_level = ? AND status = ?
      `).get(RISK_LEVELS.critical, 'detected').count,
    },
    topCategories: db.prepare(`
      SELECT category, COUNT(*) as count FROM escalations
      WHERE created_at > ?
      GROUP BY category
      ORDER BY count DESC
      LIMIT 5
    `).all(week7Ago),
    repeatOffenders: db.prepare(`
      SELECT COUNT(DISTINCT u.id) as count FROM users u
      WHERE u.id IN (
        SELECT u2.id FROM users u2
        JOIN comments c ON u2.id = c.user_id
        JOIN escalations e ON c.id = e.target_id
        WHERE e.created_at > ?
        GROUP BY u2.id
        HAVING COUNT(*) >= 3
      )
    `).get(week7Ago).count,
  }
}

/**
 * Get network analysis (IP/device clustering)
 */
export function getNetworkAnalysis(db) {
  return {
    ipClusters: db.prepare(`
      SELECT
        ip_address,
        COUNT(DISTINCT user_id) as account_count,
        COUNT(*) as activity_count,
        MAX(created_at) as last_activity
      FROM user_activities
      WHERE ip_address IS NOT NULL
      AND created_at > datetime('now', '-7 days')
      GROUP BY ip_address
      HAVING account_count > 1
      ORDER BY account_count DESC
      LIMIT 20
    `).all(),
    deviceFingerprints: db.prepare(`
      SELECT
        device_fingerprint,
        COUNT(DISTINCT user_id) as account_count,
        COUNT(*) as activity_count
      FROM sessions
      WHERE device_fingerprint IS NOT NULL
      AND created_at > datetime('now', '-7 days')
      GROUP BY device_fingerprint
      HAVING account_count > 1
      ORDER BY account_count DESC
      LIMIT 20
    `).all(),
  }
}

/**
 * Get anomaly by ID
 */
export function getAnomaly(db, anomalyId) {
  return db.prepare('SELECT * FROM anomalies WHERE id = ?').get(anomalyId)
}

/**
 * Mark anomaly as investigated
 */
export function markAnomalyInvestigated(db, anomalyId, investigatorId, findings = '') {
  const now = new Date().toISOString()

  db.prepare(`
    UPDATE anomalies
    SET status = ?, investigated_at = ?, investigator_id = ?, findings = ?
    WHERE id = ?
  `).run('investigated', now, investigatorId, findings, anomalyId)

  return { id: anomalyId, status: 'investigated' }
}
