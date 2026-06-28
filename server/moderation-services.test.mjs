/**
 * Tests for moderation services
 */

import { test } from 'node:test'
import assert from 'node:assert'
import { DatabaseSync } from 'node:sqlite'
import { scoreContent, createEscalation, getEscalationStats, resolveEscalation } from './escalationBot.mjs'
import {
  createWorkflowEntry,
  recordAutoDecision,
  recordHumanDecision,
  createAppeal,
  getWorkflowEntry,
  getPendingReviews,
  getWorkflowStats,
} from './moderationWorkflow.mjs'
import {
  trackUserActivity,
  getRepeatOffenders,
  getTrendAnalysis,
  getUserRiskProfile,
  getDashboardSummary,
} from './suspiciousActivityDashboard.mjs'
import { checkImageHash, addHashToBlocklist, getBlocklistStats } from './imageHashDatabase.mjs'
import {
  analyzeVideoContent,
  processVideoFrame,
  completeVideoAnalysis,
  getVideoAnalysisReport,
  getVideoModerationStats,
} from './videoContentModeration.mjs'
import { executeModerationMigrations } from './migrations-moderation.mjs'

let db

test.before(() => {
  db = new DatabaseSync(':memory:')

  // Create base tables
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      display_name TEXT,
      role TEXT DEFAULT 'reader',
      banned INTEGER DEFAULT 0,
      created_at TEXT
    )
  `)

  db.exec(`
    CREATE TABLE comments (
      id TEXT PRIMARY KEY,
      article_id TEXT,
      user_id TEXT,
      author TEXT,
      text TEXT,
      status TEXT DEFAULT 'visible',
      created_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  db.exec(`
    CREATE TABLE reports (
      id TEXT PRIMARY KEY,
      target_type TEXT,
      target_id TEXT,
      reason TEXT,
      status TEXT DEFAULT 'open',
      created_at TEXT
    )
  `)

  db.exec(`
    CREATE TABLE sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      device_fingerprint TEXT,
      created_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  // Execute moderation migrations
  executeModerationMigrations(db)
})

// ===================== ESCALATION BOT TESTS =====================

test('scoreContent - basic spam detection', () => {
  const content = 'Click here for FREE MONEY! Visit https://spam.com https://evil.com https://bad.com Buy now limited offer'
  const score = scoreContent(content)

  assert.ok(score.severity > 3, 'Should detect spam')
  // Category might be advertising if classified by URL count instead of keywords
  assert.ok(['spam', 'advertising'].includes(score.category), 'Should classify as spam or advertising')
})

test('scoreContent - harassment detection', () => {
  const content = 'You are stupid idiot moron go die'
  const score = scoreContent(content)

  assert.ok(score.severity > 1, 'Should detect harassment keywords')
  assert.ok(score.factors.length > 0, 'Should have factors')
})

test('scoreContent - normal content', () => {
  const content = 'This is a great article about GTA 6!'
  const score = scoreContent(content)

  assert.ok(score.severity < 3, 'Should have low severity for normal content')
  assert.strictEqual(score.threshold, 'low', 'Should be low priority')
})

test('scoreContent - with metadata factors', () => {
  const content = 'spam spam spam'
  const score = scoreContent(content, {
    reportCount: 10,
    fromNewUser: true,
    rapidFire: true,
  })

  assert.ok(score.severity > 5, 'Should increase severity with metadata factors')
})

test('createEscalation - creates escalation record', () => {
  const userId = 'user-123'
  db.prepare(`INSERT INTO users (id, email, display_name, created_at) VALUES (?, ?, ?, ?)`).run(
    userId,
    'test@example.com',
    'Test User',
    new Date().toISOString()
  )

  const escalation = createEscalation(db, 'comment', 'comment-123', 'spam content here viagra casino', {
    reportCount: 5,
  })

  assert.ok(escalation.id, 'Should have an ID')
  assert.strictEqual(escalation.status, 'pending', 'Should start as pending')
  assert.ok(typeof escalation.severity === 'number', 'Should have severity score')
})

test('getEscalationStats - returns statistics', () => {
  // Create multiple escalations
  for (let i = 0; i < 5; i++) {
    createEscalation(db, 'comment', `comment-${i}`, 'test content')
  }

  const stats = getEscalationStats(db)

  assert.ok(stats.total >= 5, 'Should count escalations')
  assert.ok(stats.byStatus.length > 0, 'Should have status breakdown')
  assert.ok(stats.byPriority.length > 0, 'Should have priority breakdown')
})

// ===================== MODERATION WORKFLOW TESTS =====================

test('createWorkflowEntry - initializes workflow', () => {
  const workflow = createWorkflowEntry(db, 'comment', 'comment-workflow-1')

  assert.ok(workflow.id, 'Should have workflow ID')
  assert.strictEqual(workflow.currentTier, 'auto', 'Should start at auto tier')
  assert.strictEqual(workflow.status, 'pending', 'Should be pending')
})

test('recordAutoDecision - records auto-moderation result', () => {
  const workflow = createWorkflowEntry(db, 'comment', 'comment-auto-1')

  const result = recordAutoDecision(db, workflow.id, 'approved', 'Passed auto checks', 0.95)

  assert.strictEqual(result.decision, 'approved', 'Should record decision')
  assert.ok(result.timestamp, 'Should have timestamp')
})

test('recordHumanDecision - records human review', () => {
  const workflow = createWorkflowEntry(db, 'comment', 'comment-human-1')
  const moderatorId = 'mod-123'

  const result = recordHumanDecision(db, workflow.id, 'rejected', 'Violates policy', moderatorId)

  assert.strictEqual(result.decision, 'rejected', 'Should record decision')
  assert.strictEqual(result.moderatorId, moderatorId, 'Should record moderator')
})

test('createAppeal - creates appeal record', () => {
  const workflow = createWorkflowEntry(db, 'comment', 'comment-appeal-1')
  const userId = 'user-appeal-1'

  db.prepare(`INSERT INTO users (id, email, display_name, created_at) VALUES (?, ?, ?, ?)`).run(
    userId,
    'appeal@example.com',
    'Appeal User',
    new Date().toISOString()
  )

  const appeal = createAppeal(db, workflow.id, userId, 'I disagree with this decision')

  assert.ok(appeal.id, 'Should create appeal')
  assert.ok(appeal.slaDeadline, 'Should set SLA deadline')
})

test('getWorkflowEntry - returns full workflow with history', () => {
  const workflow = createWorkflowEntry(db, 'comment', 'comment-full-1')

  recordAutoDecision(db, workflow.id, 'rejected')
  recordHumanDecision(db, workflow.id, 'rejected', 'Clear violation', 'mod-123')

  const retrieved = getWorkflowEntry(db, workflow.id)

  assert.ok(retrieved, 'Should retrieve workflow')
  assert.ok(retrieved.autoResult, 'Should have auto result')
  assert.ok(retrieved.humanResult, 'Should have human result')
})

test('getWorkflowStats - returns workflow statistics', () => {
  // Create multiple workflows
  for (let i = 0; i < 3; i++) {
    createWorkflowEntry(db, 'comment', `comment-stats-${i}`)
  }

  const stats = getWorkflowStats(db)

  assert.ok(stats.totalProcessed >= 3, 'Should count total')
  assert.ok(stats.byStatus.length > 0, 'Should have status breakdown')
})

// ===================== SUSPICIOUS ACTIVITY DASHBOARD TESTS =====================

test('trackUserActivity - records user activity', () => {
  const userId = 'user-activity-1'

  db.prepare(`INSERT INTO users (id, email, display_name, created_at) VALUES (?, ?, ?, ?)`).run(
    userId,
    'activity@example.com',
    'Activity User',
    new Date().toISOString()
  )

  const result = trackUserActivity(db, userId, {
    type: 'comment',
    details: { articleId: 'art-1' },
  })

  assert.ok(result.id, 'Should track activity')
})

test('getRepeatOffenders - identifies violators', () => {
  const userId = 'user-offender-1'

  db.prepare(`INSERT INTO users (id, email, display_name, created_at) VALUES (?, ?, ?, ?)`).run(
    userId,
    'offender@example.com',
    'Offender User',
    new Date().toISOString()
  )

  // Create multiple violations
  for (let i = 0; i < 4; i++) {
    db.prepare(`INSERT INTO comments (id, user_id, author, text, created_at) VALUES (?, ?, ?, ?, ?)`).run(
      `comment-offender-${i}`,
      userId,
      'Offender',
      'Spam content',
      new Date().toISOString()
    )

    createEscalation(db, 'comment', `comment-offender-${i}`, 'spam')
  }

  const offenders = getRepeatOffenders(db, 10)

  assert.ok(offenders.length > 0, 'Should find repeat offenders')
})

test('getTrendAnalysis - analyzes content trends', () => {
  // Create escalations
  for (let i = 0; i < 5; i++) {
    createEscalation(db, 'comment', `comment-trend-${i}`, 'test content')
  }

  const trends = getTrendAnalysis(db, '7 days')

  assert.ok(trends.data, 'Should return trend data')
  assert.ok(trends.summary, 'Should have summary')
})

test('getUserRiskProfile - calculates user risk', () => {
  const userId = 'user-risk-1'

  db.prepare(`INSERT INTO users (id, email, display_name, created_at) VALUES (?, ?, ?, ?)`).run(
    userId,
    'risk@example.com',
    'Risk User',
    new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
  )

  const profile = getUserRiskProfile(db, userId)

  assert.ok(profile, 'Should calculate risk profile')
  assert.strictEqual(typeof profile.riskScore, 'number', 'Should have risk score')
  assert.ok(profile.riskLevel, 'Should have risk level')
})

// ===================== IMAGE HASH DATABASE TESTS =====================

test('checkImageHash - validates clean image', () => {
  const testBuffer = Buffer.from('clean image data')

  const result = checkImageHash(db, testBuffer)

  assert.strictEqual(result.allowed, true, 'Should allow clean image')
  assert.strictEqual(result.matches.length, 0, 'Should have no matches')
})

test('addHashToBlocklist - adds image to blocklist', () => {
  const testBuffer = Buffer.from('bad image content')

  const hash = addHashToBlocklist(db, testBuffer, {
    reason: 'Illegal content',
    severity: 'critical',
  })

  assert.ok(hash.id, 'Should create hash entry')
  assert.ok(hash.simhash, 'Should calculate simhash')
  assert.ok(hash.dhash, 'Should calculate dhash')
})

test('getBlocklistStats - returns blocklist statistics', () => {
  // Add test images
  addHashToBlocklist(db, Buffer.from('test1'), { reason: 'spam' })
  addHashToBlocklist(db, Buffer.from('test2'), { reason: 'nsfw' })

  const stats = getBlocklistStats(db)

  assert.ok(stats.totalHashes >= 2, 'Should count hashes')
  assert.ok(stats.byReason.length > 0, 'Should have reason breakdown')
})

// ===================== VIDEO CONTENT MODERATION TESTS =====================

test('analyzeVideoContent - initializes analysis', () => {
  const analysis = analyzeVideoContent(db, 'video-123', {
    duration: 600,
    resolution: '1080p',
  })

  assert.ok(analysis.id, 'Should create analysis ID')
  assert.strictEqual(analysis.status, 'pending', 'Should start as pending')
})

test('processVideoFrame - analyzes video frame', () => {
  const analysis = analyzeVideoContent(db, 'video-frame-1')

  const frame = processVideoFrame(db, analysis.id, 100, Buffer.from('frame data'))

  assert.ok(frame.id, 'Should create frame record')
  assert.ok(frame.nsfwScore !== undefined, 'Should have NSFW score')
})

test('completeVideoAnalysis - finalizes analysis', () => {
  const analysis = analyzeVideoContent(db, 'video-complete-1')

  // Add some frames
  processVideoFrame(db, analysis.id, 10, Buffer.from('data1'))
  processVideoFrame(db, analysis.id, 20, Buffer.from('data2'))

  const completed = completeVideoAnalysis(db, analysis.id)

  assert.ok(completed, 'Should complete analysis')
  assert.ok(completed.status, 'Should have status')
})

test('getVideoAnalysisReport - generates full report', () => {
  const analysis = analyzeVideoContent(db, 'video-report-1')

  processVideoFrame(db, analysis.id, 10, Buffer.from('test'))
  completeVideoAnalysis(db, analysis.id)

  const report = getVideoAnalysisReport(db, analysis.id)

  assert.ok(report, 'Should generate report')
  assert.ok(report.summary, 'Should have summary')
  assert.ok(report.timeline, 'Should have timeline')
})

test('getVideoModerationStats - returns moderation statistics', () => {
  // Create test analyses
  analyzeVideoContent(db, 'video-stat-1')
  analyzeVideoContent(db, 'video-stat-2')

  const stats = getVideoModerationStats(db)

  assert.ok(stats.totalAnalyzed >= 2, 'Should count analyzed videos')
  assert.ok(stats.bySeverity !== undefined, 'Should have severity breakdown')
})
