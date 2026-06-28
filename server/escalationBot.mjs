/**
 * Escalation Bot - Automated severity scoring and escalation to human moderators
 *
 * Features:
 * - Automatic severity scoring (1-10 scale)
 * - Content classification (spam, harassment, misinformation, NSFW, etc.)
 * - Escalation rules and thresholds
 * - Time-based priority assignment
 * - Integration with moderation workflow
 */

const SEVERITY_THRESHOLDS = {
  critical: 9,    // Immediate action required
  high: 7,        // Urgent review needed
  medium: 4,      // Standard review queue
  low: 1,         // Low priority
}

const CONTENT_CATEGORIES = {
  spam: 'spam',
  harassment: 'harassment',
  misinformation: 'misinformation',
  nsfw: 'nsfw',
  violence: 'violence',
  hateSpeech: 'hate_speech',
  copyright: 'copyright',
  advertising: 'advertising',
  other: 'other',
}

const KEYWORD_PATTERNS = {
  spam: [
    /viagra|cialis|casino|poker|lottery/gi,
    /click here|buy now|limited offer|act now/gi,
    /free money|earn fast|work from home/gi,
  ],
  harassment: [
    /kill yourself|go die/gi,
    /idiot|stupid|moron/gi,
  ],
  hateSpeech: [
    /racial|ethnic|discriminat/gi,
  ],
  misinformation: [
    /fake news|hoax|conspiracy|illuminati/gi,
  ],
}

/**
 * Score content severity based on multiple factors
 * Returns: { severity: number (1-10), category: string, factors: Array }
 */
export function scoreContent(text, metadata = {}) {
  let severity = 0
  const factors = []

  // Text length analysis
  if (text.length > 5000) {
    severity += 0.5
    factors.push({ factor: 'excessive_length', weight: 0.5 })
  }

  // Keyword analysis
  let keywordMatches = 0
  for (const [category, patterns] of Object.entries(KEYWORD_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = (text.match(pattern) || []).length
      if (matches > 0) {
        keywordMatches += matches
        severity += matches
        factors.push({ factor: `keyword_${category}`, count: matches, weight: matches })
      }
    }
  }

  // URL analysis
  const urlCount = (text.match(/https?:\/\/[^\s]+/gi) || []).length
  if (urlCount > 3) {
    severity += urlCount * 1.5
    factors.push({ factor: 'excessive_urls', count: urlCount, weight: urlCount * 1.5 })
  }

  // Repeated characters (spam indicator)
  const repeatedChars = text.match(/(.)\1{5,}/g)
  if (repeatedChars) {
    severity += repeatedChars.length * 0.5
    factors.push({ factor: 'repeated_chars', count: repeatedChars.length, weight: repeatedChars.length * 0.5 })
  }

  // ALL CAPS (shouting)
  if (text.length > 20 && text === text.toUpperCase()) {
    severity += 1
    factors.push({ factor: 'all_caps', weight: 1 })
  }

  // Excessive punctuation
  const exclamationCount = (text.match(/!/g) || []).length
  if (exclamationCount > 5) {
    severity += 0.5
    factors.push({ factor: 'excessive_punctuation', count: exclamationCount, weight: 0.5 })
  }

  // Metadata factors
  if (metadata.reportCount && metadata.reportCount > 5) {
    severity += metadata.reportCount * 0.5
    factors.push({ factor: 'multiple_reports', count: metadata.reportCount, weight: metadata.reportCount * 0.5 })
  }

  if (metadata.fromNewUser) {
    severity += 1
    factors.push({ factor: 'new_user_account', weight: 1 })
  }

  if (metadata.rapidFire) {
    severity += 2
    factors.push({ factor: 'rapid_fire_posting', weight: 2 })
  }

  // Cap severity at 10
  severity = Math.min(severity, 10)

  return {
    severity: Math.round(severity * 10) / 10,
    category: detectCategory(text),
    factors,
    threshold: determineSeverityLevel(severity),
  }
}

/**
 * Detect primary content category
 */
function detectCategory(text) {
  const lower = text.toLowerCase()

  for (const [category, patterns] of Object.entries(KEYWORD_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lower)) {
        return category
      }
    }
  }

  if ((text.match(/https?:\/\//gi) || []).length > 2) {
    return CONTENT_CATEGORIES.advertising
  }

  return CONTENT_CATEGORIES.other
}

/**
 * Determine severity level name from score
 */
function determineSeverityLevel(score) {
  if (score >= SEVERITY_THRESHOLDS.critical) return 'critical'
  if (score >= SEVERITY_THRESHOLDS.high) return 'high'
  if (score >= SEVERITY_THRESHOLDS.medium) return 'medium'
  return 'low'
}

/**
 * Create escalation record
 */
export function createEscalation(db, targetType, targetId, content, metadata = {}) {
  const scoring = scoreContent(content, metadata)
  const escalationId = crypto.randomUUID()

  db.prepare(`
    INSERT INTO escalations (
      id, target_type, target_id, severity_score, category,
      status, priority, assigned_to, scoring_factors,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    escalationId,
    targetType,
    targetId,
    scoring.severity,
    scoring.category,
    'pending',
    scoring.threshold,
    null, // unassigned
    JSON.stringify(scoring.factors),
    new Date().toISOString(),
    new Date().toISOString()
  )

  return {
    id: escalationId,
    ...scoring,
    status: 'pending',
  }
}

/**
 * Get escalations by priority
 */
export function getEscalationsByPriority(db, priority = null) {
  let query = 'SELECT * FROM escalations WHERE status = ?'
  const params = ['pending']

  if (priority) {
    query += ' AND priority = ?'
    params.push(priority)
  }

  query += ' ORDER BY created_at DESC'

  return db.prepare(query).all(...params)
}

/**
 * Assign escalation to moderator
 */
export function assignEscalation(db, escalationId, moderatorId, notes = '') {
  const now = new Date().toISOString()

  db.prepare(`
    UPDATE escalations
    SET assigned_to = ?, assigned_at = ?, status = ?, moderator_notes = ?
    WHERE id = ?
  `).run(moderatorId, now, 'assigned', notes, escalationId)

  return { id: escalationId, assigned_to: moderatorId, assigned_at: now }
}

/**
 * Resolve escalation
 */
export function resolveEscalation(db, escalationId, action, reason = '') {
  const now = new Date().toISOString()

  db.prepare(`
    UPDATE escalations
    SET status = ?, resolution_action = ?, resolution_reason = ?, resolved_at = ?
    WHERE id = ?
  `).run('resolved', action, reason, now, escalationId)

  return { id: escalationId, resolved_at: now, action }
}

/**
 * Get escalation statistics
 */
export function getEscalationStats(db) {
  const stats = {
    total: db.prepare('SELECT COUNT(*) as count FROM escalations').get().count,
    byStatus: db.prepare(`
      SELECT status, COUNT(*) as count
      FROM escalations
      GROUP BY status
    `).all(),
    byPriority: db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM escalations
      GROUP BY priority
    `).all(),
    byCategory: db.prepare(`
      SELECT category, COUNT(*) as count
      FROM escalations
      GROUP BY category
    `).all(),
    averageSeverity: db.prepare(`
      SELECT AVG(severity_score) as avg
      FROM escalations
    `).get().avg || 0,
  }

  return stats
}

/**
 * Get escalation timeline
 */
export function getEscalationTimeline(db, escalationId) {
  return db.prepare(`
    SELECT * FROM escalation_timeline
    WHERE escalation_id = ?
    ORDER BY created_at ASC
  `).all(escalationId)
}

/**
 * Add timeline event
 */
export function addTimelineEvent(db, escalationId, eventType, details = {}) {
  const eventId = crypto.randomUUID()

  db.prepare(`
    INSERT INTO escalation_timeline (
      id, escalation_id, event_type, details, created_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run(
    eventId,
    escalationId,
    eventType,
    JSON.stringify(details),
    new Date().toISOString()
  )

  return { id: eventId, type: eventType }
}
