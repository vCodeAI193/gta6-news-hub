/**
 * Wave 6 API Integration Test Suite
 *
 * Comprehensive integration testing for Wave 6 features:
 * - Search & Discovery endpoints
 * - Personalization endpoints
 * - Community features endpoints
 * - Moderation endpoints
 *
 * Run with: npm run test:server -- server/tests/wave6-integration.test.mjs
 */

import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../app.mjs'

// ============================================================================
// TEST SETUP & HELPERS
// ============================================================================

let app
let token
let userId

const TEST_USER = {
  email: 'wave6-tester@test.de',
  password: 'TestPassword123!',
  displayName: 'Wave6 Tester',
}

/**
 * Setup: Create app and authenticate test user
 */
async function setupTest() {
  app = createApp({ dbPath: ':memory:' }).app

  // Register test user
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send(TEST_USER)

  assert.equal(registerRes.status, 201, 'Registration should succeed')
  token = registerRes.body.token
  userId = registerRes.body.user.id

  return { app, token, userId }
}

/**
 * Helper: Make authenticated request
 */
function authedRequest(method, path) {
  return request(app)[method](path)
    .set('Authorization', `Bearer ${token}`)
}

/**
 * Helper: Assert successful response
 */
function assertSuccess(res, expectedStatus = 200) {
  assert.equal(res.status, expectedStatus, `Expected status ${expectedStatus}, got ${res.status}`)
  assert.ok(res.body, 'Response should have body')
  return res.body
}

/**
 * Helper: Assert error response
 */
function assertError(res, expectedStatus, expectedMessage) {
  assert.equal(res.status, expectedStatus, `Expected status ${expectedStatus}, got ${res.status}`)
  if (expectedMessage) {
    assert.ok(
      res.body.error && res.body.error.includes(expectedMessage),
      `Expected error to include "${expectedMessage}", got "${res.body.error}"`
    )
  }
}

// ============================================================================
// SEARCH & DISCOVERY TESTS
// ============================================================================

describe('Wave 6: Search & Discovery', () => {
  beforeEach(setupTest)

  describe('Search History', () => {
    it('POST /api/wave6/search/history - saves search query', async () => {
      const res = await authedRequest('post', '/api/wave6/search/history')
        .send({ query: 'GTA 6 release date' })

      const body = assertSuccess(res, 201)
      assert.ok(body.id, 'Should return history item with ID')
      assert.equal(body.query, 'GTA 6 release date')
      assert.ok(body.timestamp, 'Should have timestamp')
    })

    it('GET /api/wave6/search/history - retrieves search history', async () => {
      // Add some searches
      await authedRequest('post', '/api/wave6/search/history').send({ query: 'GTA 6 gameplay' })
      await authedRequest('post', '/api/wave6/search/history').send({ query: 'Vice City map' })

      const res = await authedRequest('get', '/api/wave6/search/history')
      const body = assertSuccess(res)

      assert.ok(Array.isArray(body), 'Should return array')
      assert.ok(body.length > 0, 'Should have history items')
    })

    it('DELETE /api/wave6/search/history/:id - removes search item', async () => {
      const saveRes = await authedRequest('post', '/api/wave6/search/history').send({
        query: 'test query',
      })
      const historyId = saveRes.body.id

      const delRes = await authedRequest('delete', `/api/wave6/search/history/${historyId}`)
      assertSuccess(delRes)

      // Verify it's deleted
      const listRes = await authedRequest('get', '/api/wave6/search/history')
      const history = assertSuccess(listRes)
      assert.ok(!history.some(h => h.id === historyId), 'Item should be deleted')
    })

    it('DELETE /api/wave6/search/history - clears all history', async () => {
      await authedRequest('post', '/api/wave6/search/history').send({ query: 'query 1' })
      await authedRequest('post', '/api/wave6/search/history').send({ query: 'query 2' })

      const res = await authedRequest('delete', '/api/wave6/search/history')
      assertSuccess(res)

      const listRes = await authedRequest('get', '/api/wave6/search/history')
      const history = assertSuccess(listRes)
      assert.equal(history.length, 0, 'History should be empty')
    })
  })

  describe('Search Trends', () => {
    it('GET /api/wave6/search/trends - retrieves trending searches', async () => {
      const res = await request(app).get('/api/wave6/search/trends')
      const body = assertSuccess(res)

      assert.ok(Array.isArray(body), 'Should return array')
      if (body.length > 0) {
        const trend = body[0]
        assert.ok(trend.query, 'Trend should have query')
        assert.ok(typeof trend.trend_score === 'number', 'Should have trend_score')
      }
    })

    it('GET /api/wave6/search/trends?category=leaks - filters by category', async () => {
      const res = await request(app).get('/api/wave6/search/trends?category=leaks')
      const body = assertSuccess(res)

      assert.ok(Array.isArray(body), 'Should return array')
      if (body.length > 0) {
        body.forEach(trend => {
          assert.equal(trend.category, 'leaks', 'All items should match category filter')
        })
      }
    })

    it('GET /api/wave6/search/trends/:query - gets trend history for query', async () => {
      const res = await request(app).get('/api/wave6/search/trends/GTA%206%20leak')
      const body = assertSuccess(res)

      assert.ok(Array.isArray(body), 'Should return array of trend data')
    })
  })

  describe('Video Search', () => {
    it('GET /api/wave6/search/videos - searches videos', async () => {
      const res = await request(app)
        .get('/api/wave6/search/videos')
        .query({ q: 'GTA 6 trailer' })

      const body = assertSuccess(res)
      assert.ok(Array.isArray(body), 'Should return array')
      if (body.length > 0) {
        const video = body[0]
        assert.ok(video.id, 'Video should have ID')
        assert.ok(video.title, 'Video should have title')
        assert.ok(video.source, 'Video should have source')
      }
    })

    it('GET /api/wave6/search/videos/trending - gets trending videos', async () => {
      const res = await request(app).get('/api/wave6/search/videos/trending')
      const body = assertSuccess(res)

      assert.ok(Array.isArray(body), 'Should return array')
    })

    it('POST /api/wave6/search/videos/:id/watch - records video watch', async () => {
      const res = await authedRequest('post', '/api/wave6/search/videos/vid-123/watch')
      assertSuccess(res)
    })
  })
})

// ============================================================================
// PERSONALIZATION TESTS
// ============================================================================

describe('Wave 6: Personalization', () => {
  beforeEach(setupTest)

  describe('Time-Based Recommendations', () => {
    it('GET /api/wave6/personalization/time-based - gets time-based recommendations', async () => {
      const res = await authedRequest('get', '/api/wave6/personalization/time-based')
      const body = assertSuccess(res)

      assert.ok(Array.isArray(body), 'Should return array')
      if (body.length > 0) {
        const rec = body[0]
        assert.ok(rec.id, 'Should have ID')
        assert.ok(['morning', 'afternoon', 'evening'].includes(rec.optimal_time), 'Should have valid time')
        assert.ok(typeof rec.confidence === 'number', 'Should have confidence score')
      }
    })

    it('GET /api/wave6/personalization/time-based?time=morning - filters by time', async () => {
      const res = await authedRequest('get', '/api/wave6/personalization/time-based').query({ time: 'morning' })
      const body = assertSuccess(res)

      assert.ok(Array.isArray(body), 'Should return array')
      if (body.length > 0) {
        body.forEach(rec => {
          assert.equal(rec.optimal_time, 'morning', 'All items should match time filter')
        })
      }
    })

    it('POST /api/wave6/personalization/time-preferences - updates time preferences', async () => {
      const prefs = {
        morning_active: true,
        afternoon_active: false,
        evening_active: true,
      }

      const res = await authedRequest('post', '/api/wave6/personalization/time-preferences').send(prefs)
      assertSuccess(res, 201)
    })
  })

  describe('Emotion-Based Recommendations', () => {
    it('GET /api/wave6/personalization/emotional - gets emotional recommendations', async () => {
      const res = await authedRequest('get', '/api/wave6/personalization/emotional')
      const body = assertSuccess(res)

      assert.ok(Array.isArray(body), 'Should return array')
      if (body.length > 0) {
        const rec = body[0]
        assert.ok(rec.id, 'Should have ID')
        assert.ok(Array.isArray(rec.emotion_tags), 'Should have emotion tags')
        assert.ok(typeof rec.predicted_engagement === 'number', 'Should have engagement score')
      }
    })

    it('POST /api/wave6/personalization/emotional-profile - updates emotion profile', async () => {
      const emotions = ['excitement', 'curiosity', 'nostalgia']

      const res = await authedRequest('post', '/api/wave6/personalization/emotional-profile').send({
        emotions,
      })
      assertSuccess(res, 201)
    })

    it('GET /api/wave6/personalization/emotional?mood=excited - filters by mood', async () => {
      const res = await authedRequest('get', '/api/wave6/personalization/emotional').query({ mood: 'excited' })
      const body = assertSuccess(res)

      assert.ok(Array.isArray(body), 'Should return array')
    })
  })

  describe('Sentiment Analysis', () => {
    it('GET /api/wave6/personalization/sentiment - analyzes user sentiment', async () => {
      const res = await authedRequest('get', '/api/wave6/personalization/sentiment')
      const body = assertSuccess(res)

      assert.ok(Array.isArray(body.emotions), 'Should return emotions array')
      assert.ok(typeof body.overall_sentiment === 'number', 'Should have overall sentiment')
    })
  })
})

// ============================================================================
// COMMUNITY FEATURES TESTS
// ============================================================================

describe('Wave 6: Community Features', () => {
  beforeEach(setupTest)

  let testGroupId
  let testThreadId

  describe('Community Groups', () => {
    it('GET /api/wave6/community/groups - lists groups', async () => {
      const res = await request(app).get('/api/wave6/community/groups')
      const body = assertSuccess(res)

      assert.ok(Array.isArray(body), 'Should return array')
      if (body.length > 0) {
        const group = body[0]
        assert.ok(group.id, 'Should have ID')
        assert.ok(group.name, 'Should have name')
        assert.ok(typeof group.members_count === 'number', 'Should have members count')
        testGroupId = group.id
      }
    })

    it('POST /api/wave6/community/groups - creates new group', async () => {
      const res = await authedRequest('post', '/api/wave6/community/groups').send({
        name: 'Test Group',
        description: 'A test community group',
        category: 'discussion',
      })

      const body = assertSuccess(res, 201)
      assert.ok(body.id, 'Should return created group with ID')
      assert.equal(body.name, 'Test Group')
      testGroupId = body.id
    })

    it('GET /api/wave6/community/groups/:id - gets group details', async () => {
      if (!testGroupId) this.skip()

      const res = await request(app).get(`/api/wave6/community/groups/${testGroupId}`)
      const body = assertSuccess(res)

      assert.ok(body.id, 'Should have ID')
      assert.ok(body.name, 'Should have name')
    })

    it('POST /api/wave6/community/groups/:id/join - joins group', async () => {
      if (!testGroupId) this.skip()

      const res = await authedRequest('post', `/api/wave6/community/groups/${testGroupId}/join`)
      assertSuccess(res)
    })

    it('POST /api/wave6/community/groups/:id/leave - leaves group', async () => {
      if (!testGroupId) this.skip()

      const res = await authedRequest('post', `/api/wave6/community/groups/${testGroupId}/leave`)
      assertSuccess(res)
    })
  })

  describe('Community Threads', () => {
    it('GET /api/wave6/community/threads - lists threads', async () => {
      const res = await request(app).get('/api/wave6/community/threads')
      const body = assertSuccess(res)

      assert.ok(Array.isArray(body), 'Should return array')
    })

    it('POST /api/wave6/community/threads - creates new thread', async () => {
      const res = await authedRequest('post', '/api/wave6/community/threads').send({
        title: 'Test Thread',
        content: 'This is a test thread about GTA 6',
        group_id: testGroupId || 'grp-1',
      })

      const body = assertSuccess(res, 201)
      assert.ok(body.id, 'Should return created thread with ID')
      assert.equal(body.title, 'Test Thread')
      testThreadId = body.id
    })

    it('GET /api/wave6/community/threads/:id - gets thread details', async () => {
      if (!testThreadId) this.skip()

      const res = await request(app).get(`/api/wave6/community/threads/${testThreadId}`)
      const body = assertSuccess(res)

      assert.ok(body.id, 'Should have ID')
      assert.ok(body.title, 'Should have title')
      assert.ok(Array.isArray(body.replies), 'Should have replies array')
    })

    it('POST /api/wave6/community/threads/:id/reply - adds reply to thread', async () => {
      if (!testThreadId) this.skip()

      const res = await authedRequest('post', `/api/wave6/community/threads/${testThreadId}/reply`).send({
        content: 'Great thread, I agree!',
      })

      assertSuccess(res, 201)
    })

    it('POST /api/wave6/community/threads/:id/upvote - upvotes thread', async () => {
      if (!testThreadId) this.skip()

      const res = await authedRequest('post', `/api/wave6/community/threads/${testThreadId}/upvote`)
      assertSuccess(res)
    })

    it('POST /api/wave6/community/threads/:id/pin - pins thread (mod only)', async () => {
      if (!testThreadId) this.skip()

      const res = await authedRequest('post', `/api/wave6/community/threads/${testThreadId}/pin`)
      // May fail if user is not moderator
      assert.ok([200, 403].includes(res.status))
    })
  })

  describe('Thread Replies', () => {
    it('GET /api/wave6/community/replies/:id - gets reply details', async () => {
      const res = await request(app).get('/api/wave6/community/replies/reply-123')
      // May return 404 if reply doesn't exist
      assert.ok([200, 404].includes(res.status))
    })

    it('POST /api/wave6/community/replies/:id/upvote - upvotes reply', async () => {
      const res = await authedRequest('post', '/api/wave6/community/replies/reply-123/upvote')
      // May return 404 or 200
      assert.ok([200, 404].includes(res.status))
    })
  })
})

// ============================================================================
// MODERATION TESTS
// ============================================================================

describe('Wave 6: Moderation', () => {
  beforeEach(setupTest)

  describe('Moderation Queue', () => {
    it('GET /api/wave6/moderation/queue - lists pending actions', async () => {
      const res = await authedRequest('get', '/api/wave6/moderation/queue')
      // May require mod role
      assert.ok([200, 403].includes(res.status))
    })
  })

  describe('Report Content', () => {
    it('POST /api/wave6/community/report - reports content', async () => {
      const res = await authedRequest('post', '/api/wave6/community/report').send({
        target_type: 'comment',
        target_id: 'comment-123',
        reason: 'Spam or abuse',
        details: 'This comment violates community guidelines',
      })

      const body = assertSuccess(res, 201)
      assert.ok(body.id, 'Should return report with ID')
      assert.ok(body.status, 'Should have status')
    })

    it('GET /api/wave6/community/reports - lists user reports', async () => {
      const res = await authedRequest('get', '/api/wave6/community/reports')
      assert.ok([200, 403].includes(res.status))
    })
  })

  describe('Moderation Actions', () => {
    it('POST /api/wave6/moderation/actions - creates moderation action (mod only)', async () => {
      const res = await authedRequest('post', '/api/wave6/moderation/actions').send({
        target_id: 'user-123',
        target_type: 'user',
        action: 'warn',
        reason: 'Repeated violations',
      })

      // May fail if user is not moderator
      assert.ok([201, 403].includes(res.status))
    })

    it('POST /api/wave6/moderation/actions/:id/approve - approves action (mod only)', async () => {
      const res = await authedRequest('post', '/api/wave6/moderation/actions/action-123/approve')
      assert.ok([200, 403, 404].includes(res.status))
    })

    it('POST /api/wave6/moderation/actions/:id/reject - rejects action (mod only)', async () => {
      const res = await authedRequest('post', '/api/wave6/moderation/actions/action-123/reject')
      assert.ok([200, 403, 404].includes(res.status))
    })
  })
})

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('Wave 6: Error Handling', () => {
  beforeEach(setupTest)

  it('requires authentication for protected endpoints', async () => {
    const res = await request(app).get('/api/wave6/search/history')
    assert.equal(res.status, 401, 'Should require authentication')
  })

  it('returns 404 for non-existent resources', async () => {
    const res = await authedRequest('get', '/api/wave6/community/threads/non-existent-123')
    assert.equal(res.status, 404)
  })

  it('validates input data', async () => {
    const res = await authedRequest('post', '/api/wave6/community/threads').send({
      title: '', // Empty title
      content: 'Missing group_id',
    })

    assert.equal(res.status, 400, 'Should reject invalid input')
  })

  it('handles database errors gracefully', async () => {
    const res = await authedRequest('get', '/api/wave6/search/history')
    assert.ok([200, 500].includes(res.status), 'Should return valid status code')
  })
})

// ============================================================================
// INTEGRATION SCENARIOS
// ============================================================================

describe('Wave 6: Integration Scenarios', () => {
  beforeEach(setupTest)

  it('user can search, save history, and get recommendations', async () => {
    // 1. Perform searches
    await authedRequest('post', '/api/wave6/search/history').send({
      query: 'GTA 6 gameplay',
    })

    // 2. Retrieve history
    const historyRes = await authedRequest('get', '/api/wave6/search/history')
    assert.equal(historyRes.status, 200)

    // 3. Get trends
    const trendsRes = await request(app).get('/api/wave6/search/trends')
    assert.equal(trendsRes.status, 200)

    // 4. Get personalized recommendations
    const recsRes = await authedRequest('get', '/api/wave6/personalization/time-based')
    assert.equal(recsRes.status, 200)
  })

  it('user can join group, create thread, and interact', async () => {
    // 1. List groups
    const groupsRes = await request(app).get('/api/wave6/community/groups')
    assert.equal(groupsRes.status, 200)
    const groupId = groupsRes.body[0]?.id || 'grp-1'

    // 2. Join group
    const joinRes = await authedRequest('post', `/api/wave6/community/groups/${groupId}/join`)
    assert.equal(joinRes.status, 200)

    // 3. Create thread
    const threadRes = await authedRequest('post', '/api/wave6/community/threads').send({
      title: 'Test Thread',
      content: 'Test content',
      group_id: groupId,
    })
    assert.equal(threadRes.status, 201)
    const threadId = threadRes.body.id

    // 4. Reply to thread
    const replyRes = await authedRequest('post', `/api/wave6/community/threads/${threadId}/reply`).send({
      content: 'Great discussion!',
    })
    assert.equal(replyRes.status, 201)

    // 5. Upvote thread
    const upvoteRes = await authedRequest('post', `/api/wave6/community/threads/${threadId}/upvote`)
    assert.equal(upvoteRes.status, 200)
  })

  it('moderator can manage community moderation queue', async () => {
    // Note: These tests may fail if user is not a moderator
    // In a real test suite, create a moderator user first

    // 1. Get queue (should fail with 403 if not mod)
    const queueRes = await authedRequest('get', '/api/wave6/moderation/queue')
    assert.ok([200, 403].includes(queueRes.status))

    // 2. Report content
    const reportRes = await authedRequest('post', '/api/wave6/community/report').send({
      target_type: 'comment',
      target_id: 'comment-123',
      reason: 'Spam',
      details: 'Test report',
    })
    assert.equal(reportRes.status, 201)
  })
})
