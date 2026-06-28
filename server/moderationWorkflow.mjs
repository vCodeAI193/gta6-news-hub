/**
 * Moderation Workflows - Three-tier system (auto -> human -> appeals)
 *
 * Features:
 * - Automatic filtering tier
 * - Human moderation tier
 * - Appeals process
 * - Status tracking and audit trail
 * - SLA tracking for moderators
 */

import { randomUUID } from 'node:crypto'

export const WORKFLOW_TIERS = {
  auto: 'auto',
  human: 'human',
  appeal: 'appeal',
}

export const DECISION_STATUS = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  appealed: 'appealed',
  resolved: 'resolved',
}

const DEFAULT_SLAS = {
  auto: 5 * 60 * 1000, // 5 minutes
  human: 24 * 60 * 60 * 1000, // 24 hours
  appeal: 48 * 60 * 60 * 1000, // 48 hours
}

/**
 * Create a moderation workflow entry
 */
export function createWorkflowEntry(db, targetType, targetId, metadata = {}) {
  const entryId = randomUUID()
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO moderation_workflow (
      id, target_type, target_id, current_tier, status,
      auto_result, human_result, appeal_result,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entryId,
    targetType,
    targetId,
    WORKFLOW_TIERS.auto,
    DECISION_STATUS.pending,
    null,
    null,
    null,
    now,
    now
  )

  return {
    id: entryId,
    targetType,
    targetId,
    currentTier: WORKFLOW_TIERS.auto,
    status: DECISION_STATUS.pending,
    createdAt: now,
  }
}

/**
 * Record auto-moderation decision
 */
export function recordAutoDecision(db, workflowId, decision, reason = '', confidence = 1.0) {
  const now = new Date().toISOString()

  const result = {
    decision: decision,
    reason,
    confidence,
    timestamp: now,
  }

  db.prepare(`
    UPDATE moderation_workflow
    SET auto_result = ?, current_tier = ?, updated_at = ?
    WHERE id = ?
  `).run(
    JSON.stringify(result),
    decision === 'rejected' ? WORKFLOW_TIERS.human : WORKFLOW_TIERS.human,
    now,
    workflowId
  )

  return result
}

/**
 * Assign to human moderator
 */
export function assignToModerator(db, workflowId, moderatorId, priority = 'normal') {
  const now = new Date().toISOString()
  const slaDeadline = new Date(Date.now() + DEFAULT_SLAS.human).toISOString()

  db.prepare(`
    UPDATE moderation_workflow
    SET assigned_moderator = ?, assigned_at = ?, sla_deadline = ?, priority = ?, updated_at = ?
    WHERE id = ?
  `).run(moderatorId, now, slaDeadline, priority, now, workflowId)

  return {
    assigned: true,
    moderatorId,
    slaDeadline,
  }
}

/**
 * Record human decision
 */
export function recordHumanDecision(db, workflowId, decision, reason = '', moderatorId) {
  const now = new Date().toISOString()

  const result = {
    decision,
    reason,
    moderatorId,
    timestamp: now,
  }

  const newStatus = decision === 'appealed' ? DECISION_STATUS.appealed : DECISION_STATUS.resolved

  db.prepare(`
    UPDATE moderation_workflow
    SET human_result = ?, status = ?, current_tier = ?, updated_at = ?
    WHERE id = ?
  `).run(
    JSON.stringify(result),
    newStatus,
    decision === 'appealed' ? WORKFLOW_TIERS.appeal : WORKFLOW_TIERS.human,
    now,
    workflowId
  )

  return result
}

/**
 * Create appeal
 */
export function createAppeal(db, workflowId, userId, reason = '') {
  const appealId = randomUUID()
  const now = new Date().toISOString()
  const slaDeadline = new Date(Date.now() + DEFAULT_SLAS.appeal).toISOString()

  db.prepare(`
    INSERT INTO moderation_appeals (
      id, workflow_id, user_id, reason, status, sla_deadline, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    appealId,
    workflowId,
    userId,
    reason,
    DECISION_STATUS.pending,
    slaDeadline,
    now
  )

  db.prepare(`
    UPDATE moderation_workflow
    SET current_tier = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(WORKFLOW_TIERS.appeal, DECISION_STATUS.appealed, now, workflowId)

  return {
    id: appealId,
    workflowId,
    status: DECISION_STATUS.pending,
    slaDeadline,
  }
}

/**
 * Get workflow entry with full history
 */
export function getWorkflowEntry(db, workflowId) {
  const workflow = db.prepare('SELECT * FROM moderation_workflow WHERE id = ?').get(workflowId)

  if (!workflow) return null

  const timeline = db.prepare(`
    SELECT * FROM moderation_timeline
    WHERE workflow_id = ?
    ORDER BY created_at ASC
  `).all(workflowId)

  const appeal = workflow.status === DECISION_STATUS.appealed
    ? db.prepare('SELECT * FROM moderation_appeals WHERE workflow_id = ? LIMIT 1').get(workflowId)
    : null

  return {
    ...workflow,
    autoResult: workflow.auto_result ? JSON.parse(workflow.auto_result) : null,
    humanResult: workflow.human_result ? JSON.parse(workflow.human_result) : null,
    appealResult: workflow.appeal_result ? JSON.parse(workflow.appeal_result) : null,
    timeline,
    appeal,
  }
}

/**
 * Get pending human reviews
 */
export function getPendingReviews(db, filters = {}) {
  let query = `
    SELECT w.*, COUNT(DISTINCT t.id) as timeline_count
    FROM moderation_workflow w
    LEFT JOIN moderation_timeline t ON w.id = t.workflow_id
    WHERE w.current_tier = ? AND (w.assigned_moderator IS NULL OR w.assigned_moderator = ?)
  `

  const params = [WORKFLOW_TIERS.human, filters.moderatorId || '']

  if (filters.priority) {
    query += ' AND w.priority = ?'
    params.push(filters.priority)
  }

  if (filters.targetType) {
    query += ' AND w.target_type = ?'
    params.push(filters.targetType)
  }

  query += ' GROUP BY w.id ORDER BY w.priority DESC, w.created_at ASC'

  return db.prepare(query).all(...params)
}

/**
 * Get pending appeals
 */
export function getPendingAppeals(db) {
  return db.prepare(`
    SELECT a.*, w.target_type, w.target_id
    FROM moderation_appeals a
    JOIN moderation_workflow w ON a.workflow_id = w.id
    WHERE a.status = ?
    ORDER BY a.created_at ASC
  `).all(DECISION_STATUS.pending)
}

/**
 * Resolve appeal
 */
export function resolveAppeal(db, appealId, decision, reason = '', reviewerId) {
  const now = new Date().toISOString()

  const appealResult = {
    decision,
    reason,
    reviewerId,
    timestamp: now,
  }

  db.prepare(`
    UPDATE moderation_appeals
    SET status = ?, resolved_at = ?, reviewer_id = ?, resolution_reason = ?
    WHERE id = ?
  `).run(decision === 'upheld' ? 'upheld' : 'overturned', now, reviewerId, reason, appealId)

  const appeal = db.prepare('SELECT * FROM moderation_appeals WHERE id = ?').get(appealId)

  db.prepare(`
    UPDATE moderation_workflow
    SET appeal_result = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(JSON.stringify(appealResult), DECISION_STATUS.resolved, now, appeal.workflow_id)

  return appealResult
}

/**
 * Get workflow statistics
 */
export function getWorkflowStats(db, dateRange = null) {
  const whereClause = dateRange
    ? `WHERE created_at >= ? AND created_at <= ?`
    : ''

  const params = dateRange ? [dateRange.start, dateRange.end] : []

  const stats = {
    totalProcessed: db.prepare(`
      SELECT COUNT(*) as count FROM moderation_workflow ${whereClause}
    `).get(...params).count,

    byStatus: db.prepare(`
      SELECT status, COUNT(*) as count FROM moderation_workflow ${whereClause}
      GROUP BY status
    `).all(...params),

    byTier: db.prepare(`
      SELECT current_tier, COUNT(*) as count FROM moderation_workflow ${whereClause}
      GROUP BY current_tier
    `).all(...params),

    avgTimeInQueue: db.prepare(`
      SELECT AVG(
        CAST((julianday(updated_at) - julianday(created_at)) * 24 * 60 AS INTEGER)
      ) as avg_minutes
      FROM moderation_workflow ${whereClause}
    `).get(...params).avg_minutes || 0,

    slaMissCount: db.prepare(`
      SELECT COUNT(*) as count FROM moderation_workflow
      WHERE sla_deadline < datetime('now') AND status != ?
      ${whereClause ? ' AND ' + whereClause.replace('WHERE ', '') : ''}
    `).get(DECISION_STATUS.resolved, ...params).count,

    appealRate: db.prepare(`
      SELECT COUNT(*) as total FROM moderation_appeals
      ${whereClause ? 'WHERE ' + whereClause.replace('WHERE ', '') : ''}
    `).get(...params).total,
  }

  return stats
}

/**
 * Add timeline event
 */
export function addTimelineEvent(db, workflowId, eventType, details = {}) {
  const eventId = randomUUID()

  db.prepare(`
    INSERT INTO moderation_timeline (
      id, workflow_id, event_type, details, created_at
    ) VALUES (?, ?, ?, ?, ?)
  `).run(
    eventId,
    workflowId,
    eventType,
    JSON.stringify(details),
    new Date().toISOString()
  )

  return { id: eventId, eventType }
}

/**
 * Get SLA violations
 */
export function getSLAViolations(db) {
  return db.prepare(`
    SELECT *,
      CAST((julianday('now') - julianday(sla_deadline)) * 24 * 60 AS INTEGER) as minutes_overdue
    FROM moderation_workflow
    WHERE sla_deadline < datetime('now') AND status != ?
    ORDER BY sla_deadline ASC
  `).all(DECISION_STATUS.resolved)
}

/**
 * Get moderator metrics
 */
export function getModeratorMetrics(db, moderatorId) {
  return {
    totalReviewed: db.prepare(`
      SELECT COUNT(*) as count FROM moderation_workflow
      WHERE assigned_moderator = ?
    `).get(moderatorId).count,

    avgReviewTime: db.prepare(`
      SELECT AVG(
        CAST((julianday(updated_at) - julianday(assigned_at)) * 24 * 60 AS INTEGER)
      ) as avg_minutes
      FROM moderation_workflow
      WHERE assigned_moderator = ?
    `).get(moderatorId).avg_minutes || 0,

    appealUpholders: db.prepare(`
      SELECT COUNT(*) as count FROM moderation_appeals
      WHERE reviewer_id = ? AND status = ?
    `).get(moderatorId, 'upheld').count,

    appealOverturnRate: db.prepare(`
      SELECT COUNT(*) as count FROM moderation_appeals
      WHERE reviewer_id = ? AND status = ?
    `).get(moderatorId, 'overturned').count,
  }
}
