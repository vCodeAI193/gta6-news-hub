# Wave 6 Test Coverage Targets

Comprehensive test coverage strategy and target metrics for Wave 6 feature implementation.

**Last Updated:** 2026-06-28  
**Version:** 1.0  
**Target Release:** Q3 2026

---

## Executive Summary

This document outlines the testing strategy for Wave 6, targeting **80%+ code coverage** across all feature areas, with emphasis on critical user paths and integration scenarios.

**Overall Coverage Goal:** 80%+
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

---

## Table of Contents

1. [Coverage Goals by Feature](#coverage-goals-by-feature)
2. [Critical Paths](#critical-paths)
3. [Integration Test Scenarios](#integration-test-scenarios)
4. [E2E Test Scenarios](#e2e-test-scenarios)
5. [Testing Strategy](#testing-strategy)
6. [Tools & Setup](#tools--setup)

---

## Coverage Goals by Feature

### 1. Search History (Target: 85%)

**Scope:** `src/lib/search.ts`, `server/search.mjs`

**Unit Tests:**
- [ ] Save search to history (3 tests)
  - [ ] Valid search query
  - [ ] Duplicate queries (should update timestamp)
  - [ ] Max history limit (100 items)
- [ ] Retrieve search history (3 tests)
  - [ ] Empty history
  - [ ] Return items in reverse chronological order
  - [ ] Pagination works (50 items per page)
- [ ] Delete history item (2 tests)
  - [ ] Delete existing item
  - [ ] Delete non-existent item (404)
- [ ] Clear all history (2 tests)
  - [ ] Clear non-empty history
  - [ ] Clear empty history

**Integration Tests:**
- [ ] API POST /api/wave6/search/history
- [ ] API GET /api/wave6/search/history
- [ ] API DELETE /api/wave6/search/history/:id
- [ ] API DELETE /api/wave6/search/history (clear all)

**Coverage Target:**
- Statements: 85%
- Branches: 80%
- Functions: 85%

---

### 2. Search Trends (Target: 80%)

**Scope:** `src/lib/trends.ts`, `server/trends.mjs`

**Unit Tests:**
- [ ] Calculate trend score (4 tests)
  - [ ] Score from search frequency
  - [ ] Score from growth rate
  - [ ] Edge case: new search (< 1 hour old)
  - [ ] Edge case: zero growth
- [ ] Calculate growth rate (3 tests)
  - [ ] Hour-over-hour growth
  - [ ] Day-over-day growth
  - [ ] Negative growth
- [ ] Filter trends by category (3 tests)
  - [ ] Valid category filter
  - [ ] Invalid category (returns empty)
  - [ ] No category specified (returns all)
- [ ] Get related queries (2 tests)
  - [ ] Find semantic relationships
  - [ ] No related queries (returns empty)

**Integration Tests:**
- [ ] API GET /api/wave6/search/trends
- [ ] API GET /api/wave6/search/trends?category=leaks
- [ ] API GET /api/wave6/search/trends/:query

**Coverage Target:**
- Statements: 80%
- Branches: 75%
- Functions: 80%

---

### 3. Video Search (Target: 75%)

**Scope:** `src/lib/videoSearch.ts`, `server/videoSearch.mjs`

**Unit Tests:**
- [ ] Search videos (3 tests)
  - [ ] Valid query returns results
  - [ ] Invalid query returns empty
  - [ ] Pagination works
- [ ] Fetch from YouTube API (2 tests)
  - [ ] Valid API response
  - [ ] API error handling
- [ ] Fetch from Twitch API (2 tests)
  - [ ] Valid API response
  - [ ] API error handling
- [ ] Transform API response (2 tests)
  - [ ] YouTube format conversion
  - [ ] Twitch format conversion

**Integration Tests:**
- [ ] API GET /api/wave6/search/videos?q=query
- [ ] API GET /api/wave6/search/videos/trending
- [ ] API POST /api/wave6/search/videos/:id/watch

**E2E Tests:**
- [ ] User can search videos from UI
- [ ] User can play video from results
- [ ] Video watch is recorded

**Coverage Target:**
- Statements: 75%
- Branches: 70%
- Functions: 75%

---

### 4. Time-Based Recommendations (Target: 82%)

**Scope:** `src/lib/timeBasedRecs.ts`, `server/recommendations.mjs`

**Unit Tests:**
- [ ] Get recommendations for time period (4 tests)
  - [ ] Morning recommendations
  - [ ] Afternoon recommendations
  - [ ] Evening recommendations
  - [ ] Wrong time period (returns empty)
- [ ] Calculate optimal time (3 tests)
  - [ ] Morning category articles
  - [ ] Evening category articles
  - [ ] Neutral articles
- [ ] Calculate confidence score (3 tests)
  - [ ] High confidence (recent, stable)
  - [ ] Low confidence (old, unstable)
  - [ ] Edge case: single data point
- [ ] Update time preferences (2 tests)
  - [ ] Valid preference object
  - [ ] Invalid preference (validation)

**Integration Tests:**
- [ ] API GET /api/wave6/personalization/time-based
- [ ] API GET /api/wave6/personalization/time-based?time=morning
- [ ] API POST /api/wave6/personalization/time-preferences

**E2E Tests:**
- [ ] User sees morning recommendations at 8 AM
- [ ] User sees evening recommendations at 6 PM
- [ ] User can adjust time preferences

**Coverage Target:**
- Statements: 82%
- Branches: 78%
- Functions: 82%

---

### 5. Emotion-Based Recommendations (Target: 80%)

**Scope:** `src/lib/emotionRecs.ts`, `server/personalization.mjs`

**Unit Tests:**
- [ ] Detect emotions from content (4 tests)
  - [ ] Action-heavy content → excitement
  - [ ] Mystery content → curiosity
  - [ ] Positive news → joy
  - [ ] Edge case: neutral content
- [ ] Score recommendations by emotion (3 tests)
  - [ ] High match (>80%)
  - [ ] Medium match (50-80%)
  - [ ] Low match (<50%)
- [ ] Analyze user sentiment (3 tests)
  - [ ] No reading history
  - [ ] Consistent sentiment
  - [ ] Mixed sentiment
- [ ] Update emotion profile (2 tests)
  - [ ] Valid emotions
  - [ ] Invalid emotions (validation)

**Integration Tests:**
- [ ] API GET /api/wave6/personalization/emotional
- [ ] API GET /api/wave6/personalization/emotional?mood=excited
- [ ] API POST /api/wave6/personalization/emotional-profile

**E2E Tests:**
- [ ] User receives emotion-matched recommendations
- [ ] Emotion profile updates after reading
- [ ] User can filter by mood

**Coverage Target:**
- Statements: 80%
- Branches: 75%
- Functions: 80%

---

### 6. Sentiment Analysis (Target: 78%)

**Scope:** `src/lib/sentiment.ts`, `server/sentiment.mjs`

**Unit Tests:**
- [ ] Calculate overall sentiment (3 tests)
  - [ ] Positive articles only
  - [ ] Negative articles only
  - [ ] Mixed articles
- [ ] Get emotion distribution (3 tests)
  - [ ] Single emotion
  - [ ] Multiple emotions
  - [ ] No emotions
- [ ] Analyze sentiment trend (3 tests)
  - [ ] Trending up
  - [ ] Trending down
  - [ ] Flat
- [ ] Compare to average user (2 tests)
  - [ ] Above average
  - [ ] Below average

**Integration Tests:**
- [ ] API GET /api/wave6/personalization/sentiment
- [ ] API GET /api/wave6/personalization/sentiment?days=30

**Coverage Target:**
- Statements: 78%
- Branches: 72%
- Functions: 78%

---

### 7. Community Groups (Target: 85%)

**Scope:** `src/components/CommunityGroups.tsx`, `server/groups.mjs`

**Unit Tests:**
- [ ] List groups (3 tests)
  - [ ] Public groups visible
  - [ ] Private groups not visible (unless member)
  - [ ] Pagination works
- [ ] Search groups (3 tests)
  - [ ] Search by name
  - [ ] Search by description
  - [ ] No results
- [ ] Create group (3 tests)
  - [ ] Valid group creation
  - [ ] Duplicate name (validation)
  - [ ] Missing required fields
- [ ] Join group (3 tests)
  - [ ] User not already member
  - [ ] User already member (error)
  - [ ] Private group (denied)
- [ ] Leave group (2 tests)
  - [ ] User is member
  - [ ] User not member (error)

**Component Tests:**
- [ ] Groups list renders
- [ ] Search box functional
- [ ] Category filter works
- [ ] Join/Leave buttons work
- [ ] Modal shows group details

**Integration Tests:**
- [ ] API GET /api/wave6/community/groups
- [ ] API POST /api/wave6/community/groups
- [ ] API GET /api/wave6/community/groups/:id
- [ ] API POST /api/wave6/community/groups/:id/join
- [ ] API POST /api/wave6/community/groups/:id/leave

**Coverage Target:**
- Statements: 85%
- Branches: 82%
- Functions: 85%

---

### 8. Community Threads (Target: 85%)

**Scope:** `src/components/CommunityThreads.tsx`, `server/threads.mjs`

**Unit Tests:**
- [ ] Create thread (4 tests)
  - [ ] Valid thread creation
  - [ ] Missing title (validation)
  - [ ] Missing content (validation)
  - [ ] Markdown parsing
- [ ] Get threads (3 tests)
  - [ ] By group ID
  - [ ] With pagination
  - [ ] Sort by recent/popular
- [ ] Update thread (3 tests)
  - [ ] Author can edit
  - [ ] Non-author can't edit
  - [ ] Preserves metadata
- [ ] Delete thread (2 tests)
  - [ ] Author can delete
  - [ ] Mod can delete
  - [ ] Non-author can't delete
- [ ] Upvote thread (3 tests)
  - [ ] Add upvote
  - [ ] Remove upvote
  - [ ] Count updates

**Component Tests:**
- [ ] Thread list renders
- [ ] Thread detail page loads
- [ ] Create button opens form
- [ ] Form validation works
- [ ] Upvote button works
- [ ] Delete button shows confirmation

**Integration Tests:**
- [ ] API GET /api/wave6/community/threads
- [ ] API POST /api/wave6/community/threads
- [ ] API GET /api/wave6/community/threads/:id
- [ ] API PUT /api/wave6/community/threads/:id
- [ ] API DELETE /api/wave6/community/threads/:id
- [ ] API POST /api/wave6/community/threads/:id/upvote

**Coverage Target:**
- Statements: 85%
- Branches: 82%
- Functions: 85%

---

### 9. Thread Replies (Target: 84%)

**Scope:** `src/components/ThreadReplies.tsx`, `server/replies.mjs`

**Unit Tests:**
- [ ] Create reply (3 tests)
  - [ ] Valid reply creation
  - [ ] Missing content (validation)
  - [ ] Thread doesn't exist (error)
- [ ] Get replies (3 tests)
  - [ ] By thread ID
  - [ ] Chronological order
  - [ ] Pagination
- [ ] Edit reply (3 tests)
  - [ ] Author can edit
  - [ ] Non-author can't edit
  - [ ] Edit timestamp updates
- [ ] Delete reply (2 tests)
  - [ ] Author can delete
  - [ ] Mod can delete
- [ ] Upvote reply (3 tests)
  - [ ] Add upvote
  - [ ] Remove upvote
  - [ ] Count updates

**Component Tests:**
- [ ] Reply list renders
- [ ] Reply form functional
- [ ] Reply count shows
- [ ] Upvote button works
- [ ] Nested replies (if supported)

**Integration Tests:**
- [ ] API GET /api/wave6/community/replies?threadId=x
- [ ] API POST /api/wave6/community/replies
- [ ] API PUT /api/wave6/community/replies/:id
- [ ] API DELETE /api/wave6/community/replies/:id
- [ ] API POST /api/wave6/community/replies/:id/upvote

**Coverage Target:**
- Statements: 84%
- Branches: 80%
- Functions: 84%

---

### 10. Moderation Queue (Target: 82%)

**Scope:** `src/components/ModerationQueue.tsx`, `server/moderation.mjs`

**Unit Tests:**
- [ ] Get pending actions (3 tests)
  - [ ] Filter by status (pending/approved/rejected)
  - [ ] Sort by severity/date
  - [ ] Pagination
- [ ] Approve action (2 tests)
  - [ ] Valid approval
  - [ ] Already approved (error)
- [ ] Reject action (2 tests)
  - [ ] Valid rejection
  - [ ] Already rejected (error)
- [ ] Create moderation action (3 tests)
  - [ ] Valid action (hide/delete/warn)
  - [ ] Invalid action type (validation)
  - [ ] Missing target (validation)

**Component Tests:**
- [ ] Queue renders for mods only
- [ ] Pending items show
- [ ] Approve button works
- [ ] Reject button works
- [ ] Detail view opens

**Integration Tests:**
- [ ] API GET /api/wave6/moderation/queue
- [ ] API POST /api/wave6/moderation/actions/:id/approve
- [ ] API POST /api/wave6/moderation/actions/:id/reject

**Coverage Target:**
- Statements: 82%
- Branches: 78%
- Functions: 82%

---

## Critical Paths

These are the most important user journeys that MUST be thoroughly tested:

### Path 1: Search & Discover
1. User searches for "GTA 6 leak"
2. Search history is saved
3. Trending searches show "GTA 6 leak"
4. User clicks video result
5. Video watch is recorded

**Test Coverage:** 95% (critical path)

### Path 2: Personalized Discovery
1. User reads articles (emotions detected)
2. User gets morning recommendations
3. User adjusts time preferences
4. Recommendations update
5. Sentiment analysis shows results

**Test Coverage:** 90% (critical path)

### Path 3: Community Engagement
1. User finds community group
2. User joins group
3. User creates thread
4. User replies to thread
5. User upvotes reply

**Test Coverage:** 92% (critical path)

### Path 4: Content Moderation
1. User reports inappropriate content
2. Moderator reviews report
3. Moderator approves action
4. Content is hidden/deleted
5. User is notified

**Test Coverage:** 88% (critical path)

---

## Integration Test Scenarios

### Scenario 1: Multi-Feature Discovery Flow

```
Given: User searches "GTA 6 gameplay"
When:  User views search history
Then:  History contains search
And:   Trends show "GTA 6 gameplay"
And:   Recommendations consider search context
```

**Tests:** 5
**Expected Coverage:** 85%

### Scenario 2: Personalization Learning

```
Given: User reads 10 articles about leaks
When:  System analyzes reading pattern
Then:  Time-based recommendations prioritize mornings
And:   Emotion-based recommendations show curiosity
And:   Sentiment analysis shows positive trend
```

**Tests:** 8
**Expected Coverage:** 88%

### Scenario 3: Community Moderation Workflow

```
Given: User posts inappropriate content
When:  Another user reports it
Then:  Item appears in moderation queue
And:   Moderator can view details
And:   Moderator can approve/reject action
And:   Action is applied or dismissed
```

**Tests:** 7
**Expected Coverage:** 86%

### Scenario 4: Multi-User Community Interaction

```
Given: User A creates thread
When:  User B replies to thread
Then:  Reply count updates for User A
And:   Thread appears in User B's profile
And:   Both users can upvote replies
And:   Moderation can action either user's content
```

**Tests:** 10
**Expected Coverage:** 89%

---

## E2E Test Scenarios

### E2E 1: Full Search & Personalization Journey

```gherkin
Feature: Search and get personalized recommendations

Scenario: User discovers content through trends and gets recommendations
  Given: User is logged in and on home page
  When:  User clicks "Trending Searches"
  Then:  Trending searches load with trend scores
  
  When:  User clicks on "GTA 6 leak" trend
  Then:  Search results load
  And:   Result count matches trend data
  
  When:  User navigates to recommendations
  Then:  Time-based recommendations show
  And:   Emotion-based recommendations show
  And:   Recommendations include articles from search context
```

**Files:** `e2e/search-personalization.spec.ts`
**Duration:** 30s
**Expected Pass Rate:** 99%

### E2E 2: Community Forum Moderation

```gherkin
Feature: Create, interact, and moderate community content

Scenario: User creates thread, others reply, moderator takes action
  Given: User is in community group
  When:  User creates new thread
  Then:  Thread appears in group
  
  When:  Other user replies to thread
  Then:  Reply count increments
  And:   Reply appears in thread
  
  When:  Moderator reports inappropriate reply
  Then:  Item appears in moderation queue
  And:   Moderator can approve/reject
  And:   Content is hidden if approved
```

**Files:** `e2e/community-moderation.spec.ts`
**Duration:** 45s
**Expected Pass Rate:** 98%

### E2E 3: Multi-Device Sync

```gherkin
Feature: User data syncs across devices

Scenario: Search and preferences sync
  Given: User on desktop searches "GTA 6"
  When:  User opens mobile app
  Then:  Search history includes desktop search
  And:   Time preferences are synchronized
  And:   Recommendations are consistent
```

**Files:** `e2e/multi-device-sync.spec.ts`
**Duration:** 60s
**Expected Pass Rate:** 95%

---

## Testing Strategy

### Unit Tests (40% of effort)

**Focus:** Business logic, utilities, pure functions

```bash
npm run test:coverage -- src/lib/
npm run test:coverage -- src/services/
```

**Targets:**
- Statements: 85%
- Branches: 80%
- Functions: 85%

### Integration Tests (35% of effort)

**Focus:** API endpoints, database interactions, feature interactions

```bash
npm run test:server -- server/tests/wave6-integration.test.mjs
```

**Targets:**
- All critical API routes tested
- Database state verified
- Error cases handled

### Component Tests (15% of effort)

**Focus:** React components, user interactions, accessibility

```bash
npm run test -- src/components/__tests__/
```

**Targets:**
- Render correctly
- Handle user interactions
- Accessible to assistive tech

### E2E Tests (10% of effort)

**Focus:** Full user journeys, multi-page workflows

```bash
npm run test:e2e
```

**Targets:**
- Critical paths work
- No flaky tests
- < 60s per scenario

---

## Tools & Setup

### Coverage Tools

```json
{
  "vitest": "^2.0.5",
  "@vitest/coverage-v8": "^2.1.9",
  "@testing-library/react": "^16.0.1",
  "@playwright/test": "^1.61.1",
  "supertest": "^7.2.2"
}
```

### Configuration

**vitest.config.ts:**
```typescript
test: {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'html', 'json'],
    include: [
      'src/lib/**/*.ts',
      'src/services/**/*.ts',
      'src/components/**/*.tsx'
    ],
    thresholds: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  }
}
```

### Coverage Commands

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html

# Watch mode for development
npm run test:watch
```

### CI Integration

Coverage reports are generated on every PR and committed to CI artifacts.

**Workflow:** `.github/workflows/test-wave6.yml`

---

## Success Criteria

- [ ] Overall coverage: 80%+
- [ ] All critical paths: 90%+
- [ ] No flaky tests
- [ ] All tests pass in CI
- [ ] Performance benchmarks met
- [ ] No P0 security issues
- [ ] QA sign-off obtained

---

## Timeline

| Phase | Duration | Target |
|-------|----------|--------|
| Unit Tests | Week 1-2 | 60% coverage |
| Integration Tests | Week 2-3 | 75% coverage |
| Component Tests | Week 3-4 | 80% coverage |
| E2E Tests | Week 4 | 82% coverage |
| Bug Fixes | Week 4-5 | 85%+ coverage |
| Final Validation | Week 5 | Release ready |

---

## References

- [QA Checklist](./QA-CHECKLIST-WAVE6.md)
- [CI/CD Pipeline](./.github/workflows/test-wave6.yml)
- [Test Utilities](../src/test/wave6-utils.ts)
- [Component Tests](../src/components/__tests__/Wave6Features.test.tsx)
