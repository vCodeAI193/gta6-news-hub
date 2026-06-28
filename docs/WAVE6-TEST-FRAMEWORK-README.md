# Wave 6 Test Framework - Complete Overview

A comprehensive testing framework for the 15 Wave 6 features including search & discovery, personalization, and community features.

**Created:** 2026-06-28  
**Status:** Ready for Implementation  
**Coverage Target:** 80%+

---

## 📦 What's Included

This test framework provides complete testing infrastructure for Wave 6:

### 1. **Test Utilities** (`src/test/wave6-utils.ts`)

Complete mock and fixture generators for all Wave 6 features:

- **Search & Discovery Mocks**
  - `createMockSearchHistory()` - 3 sample search items
  - `mockSearchHistory()` - Mock functions for history operations
  - `createMockSearchTrends()` - 3 trending searches with metrics
  - `mockSearchTrends()` - Mock trend analysis functions
  - `createMockVideoSearchResults()` - 3 sample videos from YouTube/Twitch
  - `mockVideoSearch()` - Mock video search functions

- **Personalization Mocks**
  - `createMockTimeBasedRecommendations()` - Morning/afternoon/evening recommendations
  - `mockTimeBasedRecommendations()` - Mock time-based recommendation functions
  - `createMockEmotionBasedRecommendations()` - Emotion-tagged recommendations
  - `mockEmotionBasedRecommendations()` - Mock emotion analysis functions

- **Community Mocks**
  - `createMockCommunityGroups()` - 3 sample groups (public/private)
  - `mockCommunityGroups()` - Mock group management functions
  - `createMockCommunityThreads()` - 3 sample threads with stats
  - `mockCommunityThreads()` - Mock thread operations
  - `createMockModerationActions()` - 3 moderation queue items
  - `mockModeration()` - Mock moderation functions

- **Setup Helpers**
  - `setupWave6Mocks()` - Initialize all mocks for a test
  - `resetWave6Mocks()` - Clear mocks between tests
  - `createWave6Fixtures()` - Get all fixture data at once

**Usage:**
```typescript
import { setupWave6Mocks, createMockSearchHistory } from '../../test/wave6-utils'

describe('My Feature', () => {
  let mocks

  beforeEach(() => {
    mocks = setupWave6Mocks()
  })

  it('tests with mocks', async () => {
    const history = createMockSearchHistory()
    // test code
  })
})
```

### 2. **API Integration Tests** (`server/tests/wave6-integration.test.mjs`)

Comprehensive Node.js test suite for all Wave 6 API endpoints:

- **Search & Discovery Tests** (15 tests)
  - POST/GET/DELETE `/api/wave6/search/history`
  - GET `/api/wave6/search/trends` with filtering
  - GET `/api/wave6/search/videos` (search, trending, watch)

- **Personalization Tests** (10 tests)
  - GET `/api/wave6/personalization/time-based`
  - POST `/api/wave6/personalization/time-preferences`
  - GET `/api/wave6/personalization/emotional`
  - POST `/api/wave6/personalization/emotional-profile`
  - GET `/api/wave6/personalization/sentiment`

- **Community Tests** (20 tests)
  - GET/POST `/api/wave6/community/groups`
  - POST `/api/wave6/community/groups/:id/join|leave`
  - GET/POST `/api/wave6/community/threads`
  - POST `/api/wave6/community/threads/:id/reply|upvote|pin`

- **Moderation Tests** (10 tests)
  - GET `/api/wave6/moderation/queue`
  - POST `/api/wave6/community/report`
  - POST `/api/wave6/moderation/actions/:id/approve|reject`

- **Error Handling Tests** (8 tests)
  - Authentication requirements
  - 404 not found responses
  - Input validation
  - Database error recovery

- **Integration Scenarios** (4 scenario tests)
  - Complete search → personalization flow
  - Group creation → thread → reply workflow
  - Moderation queue handling

**Run Tests:**
```bash
npm run test:server -- server/tests/wave6-integration.test.mjs
```

### 3. **Component Test Templates** (`src/components/__tests__/Wave6Features.test.tsx`)

Ready-to-use test templates for React components:

- **Search & Discovery** (15 template tests)
  - Search History component (display, delete, clear)
  - Search Trends component (display, filter, related queries)
  - Video Search component (results, selection, source badges)

- **Personalization** (12 template tests)
  - Time-based recommendations (filter, confidence, preferences)
  - Emotion-based recommendations (emotions, filtering, mood)
  - Sentiment analysis component

- **Community** (20 template tests)
  - Community Groups (list, join, search, categories)
  - Community Threads (create, display, upvote, pin)
  - Thread Replies (reply, edit, upvote, delete)
  - Moderation Queue (pending actions, reporting)

- **Accessibility Tests** (8 template tests)
  - Keyboard navigation
  - Focus traps
  - ARIA labels
  - Semantic HTML
  - Color contrast
  - Screen reader support
  - Form accessibility

- **Performance Tests** (2 template tests)
  - Rendering performance
  - Re-render prevention

**Usage:** Copy relevant test templates and customize for your components.

### 4. **QA Testing Checklist** (`docs/QA-CHECKLIST-WAVE6.md`)

Comprehensive manual testing checklist for QA team:

- **15 Feature Checklists**
  - Each feature has functionality tests, edge cases, UI/UX tests
  - Search History (10 tests)
  - Search Trends (6 tests)
  - Video Search (7 tests)
  - Time-Based Recommendations (7 tests)
  - Emotion-Based Recommendations (8 tests)
  - Sentiment Analysis (8 tests)
  - Community Groups (10 tests)
  - Community Threads (12 tests)
  - Thread Replies (10 tests)
  - Moderation Queue (9 tests)
  - Error Handling (8 tests)
  - Accessibility Compliance (8 tests)
  - Performance Standards (10 tests)
  - Caching Strategy (5 tests)
  - Browser Compatibility (12 tests)

- **Pre-Release Validation** checklist
- **Sign-off section** for QA lead, PM, and release manager

### 5. **Test Coverage Targets** (`docs/TEST-COVERAGE-TARGETS.md`)

Detailed coverage strategy and metrics:

- **Target Coverage:** 80%+ overall
  - Statements: 80%
  - Branches: 75%
  - Functions: 80%
  - Lines: 80%

- **Per-Feature Coverage Goals** (10 features)
  - Search History: 85%
  - Search Trends: 80%
  - Video Search: 75%
  - Time-Based Recs: 82%
  - Emotion-Based Recs: 80%
  - Sentiment Analysis: 78%
  - Community Groups: 85%
  - Community Threads: 85%
  - Thread Replies: 84%
  - Moderation Queue: 82%

- **Critical Paths** (4 documented)
  - Search & Discover flow (95% coverage)
  - Personalized Discovery flow (90% coverage)
  - Community Engagement flow (92% coverage)
  - Content Moderation flow (88% coverage)

- **Integration Scenarios** (4 scenarios)
  - Multi-feature discovery flow
  - Personalization learning flow
  - Community moderation workflow
  - Multi-user interaction flow

- **E2E Test Scenarios** (3 scenarios)
  - Full search & personalization journey
  - Community forum moderation
  - Multi-device sync

- **Testing Strategy** breakdown
  - Unit Tests (40% of effort)
  - Integration Tests (35% of effort)
  - Component Tests (15% of effort)
  - E2E Tests (10% of effort)

### 6. **CI/CD Pipeline** (`.github/workflows/test-wave6.yml`)

Automated test execution in GitHub Actions:

- **Parallel Job Execution**
  - Unit & Integration Tests (20min, Node 20 & 22)
  - Performance Regression Detection (20min)
  - Code Quality Checks (15min)
  - Accessibility Tests (15min)
  - E2E Tests (30min, on main branch)
  - Test Reporting (10min)

- **Test Coverage**
  - Frontend tests on `src/lib`, `src/services`, `src/components`
  - Backend tests on `server/tests/`
  - Coverage upload to Codecov

- **Performance Checks**
  - Bundle size (max 5MB)
  - Lighthouse CI integration
  - Performance metrics tracking

- **Quality Checks**
  - ESLint linting
  - TypeScript type checking
  - Coverage threshold validation
  - Accessibility testing

- **Notifications**
  - Slack webhook on failure
  - PR comments with test summary
  - Artifact retention (30 days)

### 7. **Coverage Threshold Script** (`.github/scripts/check-coverage-thresholds.js`)

Node.js script to validate coverage meets targets:

- Reads coverage JSON report
- Compares against thresholds
- Reports per-metric status
- Exits with proper code for CI

**Usage:**
```bash
node .github/scripts/check-coverage-thresholds.js coverage-summary.json
```

### 8. **Testing Guide** (`docs/TESTING-GUIDE-WAVE6.md`)

Comprehensive guide for developers writing tests:

- **Getting Started**
  - Installation verification
  - Running tests (all, watch, coverage, E2E)
  - Folder structure overview

- **Test Types & Organization** (4 types)
  - Unit Tests: Business logic, pure functions
  - Component Tests: React components, interactions
  - Integration Tests: API endpoints, feature interactions
  - E2E Tests: Full user workflows

- **Using Test Utilities**
  - Setup/reset mocks
  - Using fixtures
  - Mock function assertions

- **Writing Unit Tests**
  - Template and example
  - Testing patterns
  - Edge case coverage

- **Writing Component Tests**
  - Template and example
  - Query methods (role, text, placeholder, etc.)
  - User interactions (type, click, keyboard)
  - Using `renderWithProviders`

- **Writing Integration Tests**
  - Node.js test runner setup
  - Authenticated requests
  - Database state verification

- **Writing E2E Tests**
  - Playwright templates
  - Page navigation
  - User workflow assertions

- **Best Practices** (7 practices)
  - Good test naming
  - Arrange-Act-Assert pattern
  - DRY test code
  - Test behavior, not implementation
  - Isolated tests
  - Comprehensive edge cases
  - Mock external dependencies

- **Troubleshooting** (5 scenarios)
  - Element not found
  - Cannot find module
  - Flaky tests
  - Mock not working
  - Dependency issues

---

## 🚀 Getting Started

### 1. Understand the Framework

Read in this order:
1. This file (overview)
2. `TESTING-GUIDE-WAVE6.md` (how to write tests)
3. `QA-CHECKLIST-WAVE6.md` (what to test)
4. `TEST-COVERAGE-TARGETS.md` (coverage strategy)

### 2. Use Mocks in Your Tests

```typescript
import { setupWave6Mocks, createMockSearchHistory } from '../../test/wave6-utils'

describe('Your Feature', () => {
  let mocks

  beforeEach(() => {
    mocks = setupWave6Mocks()
  })

  it('uses real mock data', () => {
    const history = createMockSearchHistory()
    // Use history in your test
  })
})
```

### 3. Copy Component Test Templates

The `src/components/__tests__/Wave6Features.test.tsx` file contains templates for every component type. Copy the relevant sections and customize:

```typescript
// Copy from TEMPLATE: displays search history items
it('TEMPLATE: displays search history items', async () => {
  // Uncomment and customize for your component
})
```

### 4. Run Tests in CI

All tests automatically run on:
- Every push to main/develop branches
- Every pull request to main/develop
- Changes to Wave 6 related files

View results: GitHub Actions → Wave 6 Tests workflow

### 5. Monitor Coverage

Coverage reports are generated on every PR:

```bash
# View locally
npm run test:coverage
open coverage/index.html
```

Commit-by-commit tracking available in Codecov.

---

## 📊 File Structure

```
gta6-news-hub/
├── src/
│   ├── test/
│   │   ├── setup.ts                    # Test environment setup
│   │   ├── utils.tsx                   # renderWithProviders helper
│   │   └── wave6-utils.ts              # ✨ Wave 6 mocks & fixtures
│   ├── lib/
│   │   ├── search.test.ts              # Unit tests for search logic
│   │   ├── trends.test.ts              # Unit tests for trends
│   │   └── ...test.ts                  # Other unit tests
│   ├── components/
│   │   └── __tests__/
│   │       └── Wave6Features.test.tsx   # ✨ Component test templates
│   └── services/
│       └── ...test.ts                  # Service layer tests
├── server/
│   ├── tests/
│   │   └── wave6-integration.test.mjs  # ✨ Integration test suite
│   ├── app.test.mjs                    # Server app tests
│   └── ...test.mjs                     # Other server tests
├── e2e/
│   └── *.spec.ts                       # Playwright E2E tests
├── .github/
│   ├── workflows/
│   │   └── test-wave6.yml              # ✨ CI/CD pipeline
│   └── scripts/
│       └── check-coverage-thresholds.js # ✨ Coverage validation
└── docs/
    ├── TESTING-GUIDE-WAVE6.md          # ✨ Developer guide
    ├── QA-CHECKLIST-WAVE6.md           # ✨ QA testing checklist
    ├── TEST-COVERAGE-TARGETS.md        # ✨ Coverage strategy
    └── WAVE6-TEST-FRAMEWORK-README.md  # ✨ This file
```

✨ = New files created for Wave 6

---

## 🎯 Key Metrics

### Test Coverage Targets

| Metric | Target | Baseline |
|--------|--------|----------|
| Statements | 80%+ | Current |
| Branches | 75%+ | Current |
| Functions | 80%+ | Current |
| Lines | 80%+ | Current |

### Test Count Targets

| Type | Count | Files |
|------|-------|-------|
| Unit Tests | 50+ | Various |
| Integration Tests | 60+ | wave6-integration.test.mjs |
| Component Tests | 40+ | Wave6Features.test.tsx |
| E2E Tests | 5+ | e2e/ |
| QA Checklist Items | 150+ | QA-CHECKLIST-WAVE6.md |
| **Total** | **250+** | **Across all** |

### Performance Targets

| Metric | Target |
|--------|--------|
| Bundle Size | < 5MB |
| Page Load | < 3s |
| Search Results | < 3s |
| Recommendations | < 2s |
| Lighthouse Score | > 80 |

---

## 📋 Checklist for Implementation

### Week 1: Setup
- [ ] Review test framework documentation
- [ ] Run existing tests: `npm test` and `npm run test:server`
- [ ] Verify CI pipeline with `npm run build`

### Week 2-3: Unit Tests
- [ ] Create search.ts unit tests
- [ ] Create trends.ts unit tests
- [ ] Create recommendation unit tests
- [ ] Target 60% coverage

### Week 3-4: Component Tests
- [ ] Create SearchHistory component tests
- [ ] Create CommunityGroups component tests
- [ ] Create PersonalizationPanel component tests
- [ ] Target 75% coverage

### Week 4-5: Integration Tests
- [ ] Implement API endpoint mocks
- [ ] Test search history endpoints
- [ ] Test recommendation endpoints
- [ ] Test community endpoints
- [ ] Target 80% coverage

### Week 5: E2E & QA
- [ ] Create E2E test scenarios
- [ ] Run QA checklist manually
- [ ] Fix issues found
- [ ] Achieve 80%+ coverage

### Pre-Release
- [ ] Coverage ≥ 80%
- [ ] All CI checks passing
- [ ] QA sign-off
- [ ] Performance benchmarks met

---

## 🔗 Quick Links

- **Run Tests:** `npm test` or `npm run test:watch`
- **Coverage Report:** `npm run test:coverage` then `open coverage/index.html`
- **Server Tests:** `npm run test:server`
- **E2E Tests:** `npm run test:e2e`
- **CI Status:** GitHub Actions → Wave 6 Tests workflow

---

## 💡 Tips & Tricks

### Quick Test Run
```bash
# Run specific test file
npm test -- src/lib/search.test.ts

# Run tests matching pattern
npm test -- --grep "search history"

# Run in watch mode
npm run test:watch
```

### Debug Tests
```bash
# Show DOM in test output
screen.debug()

# Use playwright inspector
PWDEBUG=1 npm run test:e2e

# Verbose test output
npm test -- --reporter=verbose
```

### Coverage Reports
```bash
# Generate coverage
npm run test:coverage

# View HTML report
open coverage/index.html

# Coverage by file
npm run test:coverage -- --reporter=json
```

---

## 📞 Support

- **Questions about testing?** See `TESTING-GUIDE-WAVE6.md`
- **Need test templates?** See `src/components/__tests__/Wave6Features.test.tsx`
- **CI/CD issues?** See `.github/workflows/test-wave6.yml`
- **QA guidelines?** See `QA-CHECKLIST-WAVE6.md`
- **Coverage goals?** See `TEST-COVERAGE-TARGETS.md`

---

## 📝 Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-06-28 | Initial framework release |

---

## ✅ Quality Standards

This framework provides:

- ✅ **Complete test utilities** for all Wave 6 features
- ✅ **Real-world test templates** ready to use
- ✅ **Comprehensive API test suite** (60+ tests)
- ✅ **Automated CI/CD pipeline** with parallel jobs
- ✅ **Detailed documentation** for developers and QA
- ✅ **Coverage tracking** and threshold validation
- ✅ **Accessibility testing** templates included
- ✅ **Performance testing** setup
- ✅ **QA checklist** for manual testing

**Target:** 80%+ code coverage across all Wave 6 features

---

**Framework Version:** 1.0  
**Last Updated:** 2026-06-28  
**Maintained By:** QA & Engineering Teams  
**Ready for:** Immediate Implementation
