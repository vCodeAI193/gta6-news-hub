/**
 * Moderation API Routes - Integration with Express app
 * Add these routes to the main app.mjs
 */

import { requireAuth } from './auth.mjs'
import {
  scoreContent,
  createEscalation,
  getEscalationsByPriority,
  assignEscalation,
  resolveEscalation,
  getEscalationStats,
  getEscalationTimeline,
  addTimelineEvent,
} from './escalationBot.mjs'
import {
  createWorkflowEntry,
  recordAutoDecision,
  recordHumanDecision,
  createAppeal,
  getWorkflowEntry,
  getPendingReviews,
  getPendingAppeals,
  resolveAppeal,
  getWorkflowStats,
  getSLAViolations,
  getModeratorMetrics,
} from './moderationWorkflow.mjs'
import {
  trackUserActivity,
  getRepeatOffenders,
  getTrendAnalysis,
  getUserRiskProfile,
  getDashboardSummary,
  getNetworkAnalysis,
  getAnomaly,
  markAnomalyInvestigated,
} from './suspiciousActivityDashboard.mjs'
import {
  checkImageHash,
  addHashToBlocklist,
  findSimilarImages,
  getBlocklistStats,
  removeHashFromBlocklist,
  searchBlocklist,
  getHashById,
} from './imageHashDatabase.mjs'
import {
  analyzeVideoContent,
  processVideoFrame,
  completeVideoAnalysis,
  getVideoAnalysisReport,
  getReviewQueue,
  getVideoModerationStats,
  flagVideoForReview,
  deleteAnalysis,
} from './videoContentModeration.mjs'

/**
 * Mount moderation routes on Express app
 */
export function mountModerationRoutes(app, db) {
  // ===================== ESCALATION BOT ROUTES =====================

  // Get escalations by priority
  app.get('/api/admin/escalations/pending', requireAuth(db, 'admin'), (req, res) => {
    const { priority, limit = 20 } = req.query

    const escalations = getEscalationsByPriority(db, priority)
      .slice(0, parseInt(limit))
      .map((e) => ({
        id: e.id,
        targetType: e.target_type,
        targetId: e.target_id,
        severity: e.severity_score,
        category: e.category,
        status: e.status,
        priority: e.priority,
        assignedTo: e.assigned_to,
        createdAt: e.created_at,
      }))

    res.json({ escalations })
  })

  // Get escalation detail
  app.get('/api/admin/escalations/:id', requireAuth(db, 'admin'), (req, res) => {
    const escalation = db
      .prepare('SELECT * FROM escalations WHERE id = ?')
      .get(req.params.id)

    if (!escalation) return res.status(404).json({ error: 'Not found' })

    const timeline = getEscalationTimeline(db, req.params.id)

    res.json({
      escalation: {
        ...escalation,
        scoringFactors: JSON.parse(escalation.scoring_factors || '[]'),
      },
      timeline,
    })
  })

  // Assign escalation to moderator
  app.post('/api/admin/escalations/:id/assign', requireAuth(db, 'admin'), (req, res) => {
    const { moderatorId } = req.body

    if (!moderatorId) return res.status(400).json({ error: 'moderatorId required' })

    const result = assignEscalation(db, req.params.id, moderatorId, req.body.notes)
    addTimelineEvent(db, req.params.id, 'assigned', { moderatorId })

    res.json(result)
  })

  // Resolve escalation
  app.post('/api/admin/escalations/:id/resolve', requireAuth(db, 'admin'), (req, res) => {
    const { action, reason } = req.body

    if (!action) return res.status(400).json({ error: 'action required' })

    const result = resolveEscalation(db, req.params.id, action, reason)
    addTimelineEvent(db, req.params.id, 'resolved', { action, reason })

    res.json(result)
  })

  // Get escalation statistics
  app.get('/api/admin/escalations/stats', requireAuth(db, 'admin'), (_req, res) => {
    const stats = getEscalationStats(db)
    res.json({ stats })
  })

  // ===================== MODERATION WORKFLOW ROUTES =====================

  // Get pending reviews
  app.get('/api/admin/reviews/pending', requireAuth(db, 'admin'), (req, res) => {
    const { moderatorId, priority, targetType, limit = 20 } = req.query

    const reviews = getPendingReviews(db, {
      moderatorId,
      priority,
      targetType,
    }).slice(0, parseInt(limit))

    res.json({ reviews })
  })

  // Get pending appeals
  app.get('/api/admin/appeals/pending', requireAuth(db, 'admin'), (req, res) => {
    const appeals = getPendingAppeals(db)

    res.json({ appeals })
  })

  // Resolve appeal
  app.post('/api/admin/appeals/:id/resolve', requireAuth(db, 'admin'), (req, res) => {
    const { decision, reason } = req.body

    if (!decision) return res.status(400).json({ error: 'decision required' })

    const result = resolveAppeal(db, req.params.id, decision, reason, req.auth.user.id)

    res.json(result)
  })

  // Get workflow statistics
  app.get('/api/admin/workflows/stats', requireAuth(db, 'admin'), (_req, res) => {
    const stats = getWorkflowStats(db)
    res.json({ stats })
  })

  // Get SLA violations
  app.get('/api/admin/workflows/sla-violations', requireAuth(db, 'admin'), (_req, res) => {
    const violations = getSLAViolations(db)
    res.json({ violations })
  })

  // Get moderator metrics
  app.get('/api/admin/moderators/:id/metrics', requireAuth(db, 'admin'), (req, res) => {
    const metrics = getModeratorMetrics(db, req.params.id)
    res.json({ metrics })
  })

  // ===================== SUSPICIOUS ACTIVITY DASHBOARD ROUTES =====================

  // Get dashboard summary
  app.get('/api/admin/moderation/dashboard', requireAuth(db, 'admin'), (_req, res) => {
    const summary = getDashboardSummary(db)
    res.json(summary)
  })

  // Get repeat offenders
  app.get('/api/admin/suspicious-activity/repeat-offenders', requireAuth(db, 'admin'), (req, res) => {
    const { limit = 50 } = req.query
    const offenders = getRepeatOffenders(db, parseInt(limit))

    res.json({
      offenders: offenders.map((o) => ({
        id: o.id,
        displayName: o.display_name,
        email: o.email,
        violationCount: o.violation_count,
        resolvedCount: o.resolved_count,
        latestViolation: o.latest_violation,
        violationCategories: JSON.parse(o.violation_categories || '[]'),
      })),
    })
  })

  // Get anomalies
  app.get('/api/admin/suspicious-activity/anomalies', requireAuth(db, 'admin'), (_req, res) => {
    const anomalies = db
      .prepare('SELECT * FROM anomalies WHERE status = ? ORDER BY created_at DESC LIMIT 50')
      .all('detected')

    res.json({
      anomalies: anomalies.map((a) => ({
        id: a.id,
        userId: a.user_id,
        anomalyType: a.anomaly_type,
        severity: a.severity,
        riskLevel: a.risk_level,
        details: JSON.parse(a.details || '{}'),
        status: a.status,
        createdAt: a.created_at,
      })),
    })
  })

  // Get trend analysis
  app.get('/api/admin/suspicious-activity/trends', requireAuth(db, 'admin'), (req, res) => {
    const { timeRange = '7 days' } = req.query
    const trends = getTrendAnalysis(db, timeRange)

    res.json({ trends })
  })

  // Get user risk profile
  app.get('/api/admin/suspicious-activity/user/:userId/risk', requireAuth(db, 'admin'), (req, res) => {
    const profile = getUserRiskProfile(db, req.params.userId)

    if (!profile) return res.status(404).json({ error: 'User not found' })

    res.json({ profile })
  })

  // Get network analysis
  app.get('/api/admin/suspicious-activity/network', requireAuth(db, 'admin'), (_req, res) => {
    const analysis = getNetworkAnalysis(db)
    res.json({ analysis })
  })

  // Mark anomaly as investigated
  app.post('/api/admin/anomalies/:id/investigate', requireAuth(db, 'admin'), (req, res) => {
    const { findings } = req.body

    const result = markAnomalyInvestigated(db, req.params.id, req.auth.user.id, findings)

    res.json(result)
  })

  // ===================== IMAGE HASH DATABASE ROUTES =====================

  // Check image hash
  app.post('/api/admin/image-hash/check', requireAuth(db, 'admin'), (req, res) => {
    const { imageBuffer, threshold = 5 } = req.body

    if (!imageBuffer) return res.status(400).json({ error: 'imageBuffer required' })

    const result = checkImageHash(db, Buffer.from(imageBuffer, 'base64'), threshold)

    res.json(result)
  })

  // Get blocklist
  app.get('/api/admin/image-hash/blocklist', requireAuth(db, 'admin'), (req, res) => {
    const { reason, severity, search, limit = 50 } = req.query

    const entries = searchBlocklist(db, {
      reason,
      severity,
      search,
      limit: parseInt(limit),
    })

    res.json({
      entries: entries.map((e) => ({
        id: e.id,
        reason: e.reason,
        severity: e.severity,
        reportedCount: e.reported_count,
        createdAt: e.created_at,
      })),
    })
  })

  // Get blocklist stats
  app.get('/api/admin/image-hash/stats', requireAuth(db, 'admin'), (_req, res) => {
    const stats = getBlocklistStats(db)

    res.json({
      stats: {
        totalHashes: stats.totalHashes,
        byReason: stats.byReason,
        bySeverity: stats.bySeverity,
      },
    })
  })

  // Add hash to blocklist
  app.post('/api/admin/image-hash/add', requireAuth(db, 'admin'), (req, res) => {
    const { imageBuffer, reason, severity } = req.body

    const hash = addHashToBlocklist(db, Buffer.from(imageBuffer || '', 'base64'), {
      reason,
      severity,
      addedBy: req.auth.user.id,
    })

    res.json(hash)
  })

  // Remove hash from blocklist
  app.delete('/api/admin/image-hash/:id', requireAuth(db, 'admin'), (req, res) => {
    const result = removeHashFromBlocklist(db, req.params.id)
    res.json(result)
  })

  // Find similar images
  app.post('/api/admin/image-hash/find-similar', requireAuth(db, 'admin'), (req, res) => {
    const { imageBuffer, maxResults = 10 } = req.body

    if (!imageBuffer) return res.status(400).json({ error: 'imageBuffer required' })

    const similar = findSimilarImages(db, Buffer.from(imageBuffer, 'base64'), maxResults)

    res.json({ similar })
  })

  // ===================== VIDEO CONTENT MODERATION ROUTES =====================

  // Get video review queue
  app.get('/api/admin/video-moderation/queue', requireAuth(db, 'admin'), (req, res) => {
    const { status, limit = 20 } = req.query

    const queue = getReviewQueue(db, parseInt(limit))
      .filter((v) => !status || v.status === status)
      .map((v) => ({
        id: v.id,
        videoId: v.video_id,
        status: v.status,
        severity: v.severity,
        framesAnalyzed: v.frames_analyzed,
        violationsFound: v.violations_found,
        flaggedForReview: v.flagged_for_review === 1,
        reviewReason: v.review_reason,
        completedAt: v.completed_at,
      }))

    res.json({ analyses: queue })
  })

  // Get video analysis detail
  app.get('/api/admin/video-moderation/:id', requireAuth(db, 'admin'), (req, res) => {
    const report = getVideoAnalysisReport(db, req.params.id)

    if (!report) return res.status(404).json({ error: 'Not found' })

    res.json({ report })
  })

  // Flag video for review
  app.post('/api/admin/video-moderation/:id/flag', requireAuth(db, 'admin'), (req, res) => {
    const { reason } = req.body

    const result = flagVideoForReview(db, req.params.id, reason)

    res.json(result)
  })

  // Delete analysis
  app.delete('/api/admin/video-moderation/:id', requireAuth(db, 'admin'), (req, res) => {
    const result = deleteAnalysis(db, req.params.id)
    res.json(result)
  })

  // Get video moderation stats
  app.get('/api/admin/video-moderation/stats', requireAuth(db, 'admin'), (_req, res) => {
    const stats = getVideoModerationStats(db)
    res.json({ stats })
  })
}
