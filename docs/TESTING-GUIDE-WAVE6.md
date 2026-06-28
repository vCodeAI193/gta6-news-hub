# Wave 6 Testing Guide

Comprehensive guide for writing, running, and maintaining tests for Wave 6 features.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Test Types & Organization](#test-types--organization)
3. [Using Test Utilities](#using-test-utilities)
4. [Writing Unit Tests](#writing-unit-tests)
5. [Writing Component Tests](#writing-component-tests)
6. [Writing Integration Tests](#writing-integration-tests)
7. [Writing E2E Tests](#writing-e2e-tests)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

Test dependencies are already installed. Verify with:

```bash
npm ls vitest @testing-library/react @playwright/test
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm run test:watch

# Frontend tests only
npm test -- src/

# Backend tests only
npm run test:server

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Folder Structure

```
gta6-news-hub/
├── src/
│   ├── lib/                    # Utilities and logic
│   │   ├── search.ts
│   │   ├── trends.ts
│   │   └── *.test.ts          # Unit tests
│   ├── services/              # Business logic
│   │   └── *.test.ts          # Unit tests
│   ├── components/            # React components
│   │   ├── SearchBar.tsx
│   │   └── __tests__/         # Component tests
│   │       └── Wave6Features.test.tsx
│   └── test/
│       ├── setup.ts           # Test setup
│       ├── utils.tsx          # Test helpers
│       └── wave6-utils.ts     # Wave 6 mocks and fixtures
├── server/
│   ├── *.mjs                  # Backend code
│   └── tests/
│       └── wave6-integration.test.mjs
├── e2e/
│   └── *.spec.ts              # Playwright E2E tests
└── docs/
    ├── TESTING-GUIDE-WAVE6.md (this file)
    ├── QA-CHECKLIST-WAVE6.md  # QA testing checklist
    └── TEST-COVERAGE-TARGETS.md
```

---

## Test Types & Organization

### Unit Tests (40% of effort)

**Purpose:** Test individual functions in isolation

**Where:** `src/lib/**/*.test.ts`, `src/services/**/*.test.ts`

**Example:**
```typescript
describe('calculateTrendScore', () => {
  it('returns high score for rapidly trending query', () => {
    const score = calculateTrendScore({ 
      searches: 1000, 
      growthRate: 0.5 
    })
    expect(score).toBeGreaterThan(8)
  })
})
```

### Component Tests (15% of effort)

**Purpose:** Test React components in isolation

**Where:** `src/components/__tests__/**/*.test.tsx`

**Example:**
```typescript
describe('SearchHistory', () => {
  it('displays list of searches', () => {
    const { getByText } = renderWithProviders(
      <SearchHistory items={mockHistory} />
    )
    expect(getByText('GTA 6 leak')).toBeInTheDocument()
  })
})
```

### Integration Tests (35% of effort)

**Purpose:** Test multiple components working together, API endpoints

**Where:** `server/tests/**/*.test.mjs`

**Example:**
```javascript
describe('Wave 6 API', () => {
  it('POST /api/wave6/search/history saves and retrieves search', async () => {
    const res = await request(app)
      .post('/api/wave6/search/history')
      .send({ query: 'test' })
    expect(res.status).toBe(201)
  })
})
```

### E2E Tests (10% of effort)

**Purpose:** Test full user workflows

**Where:** `e2e/**/*.spec.ts`

**Example:**
```typescript
test('user can search and view personalized recommendations', async ({ page }) => {
  await page.goto('/')
  await page.fill('[data-testid="search"]', 'GTA 6 leak')
  await page.click('[data-testid="search-button"]')
  await expect(page).toHaveURL(/results/)
})
```

---

## Using Test Utilities

### Wave 6 Mock Helpers

The `src/test/wave6-utils.ts` file provides comprehensive mocks for all Wave 6 features.

#### Setup Mocks

```typescript
import { setupWave6Mocks, resetWave6Mocks } from '../../test/wave6-utils'

describe('My Feature', () => {
  let mocks

  beforeEach(() => {
    mocks = setupWave6Mocks()
  })

  afterEach(() => {
    resetWave6Mocks(mocks)
  })

  it('uses search history mock', async () => {
    const history = await mocks.searchHistory.getHistory()
    expect(history).toHaveLength(3)
  })
})
```

#### Using Fixtures

```typescript
import {
  createMockSearchHistory,
  createMockCommunityGroups,
  createWave6Fixtures,
} from '../../test/wave6-utils'

describe('Search', () => {
  it('displays history items', () => {
    const history = createMockSearchHistory()
    // history[0] = { id: 'sh-1', query: 'GTA 6 release date', ... }
  })
})
```

#### Mock Functions

Each mock returns Vitest `vi.fn()` stubs that track calls:

```typescript
const mocks = setupWave6Mocks()

// Call the mock
await mocks.searchHistory.getHistory()

// Assert it was called
expect(mocks.searchHistory.getHistory).toHaveBeenCalled()

// Assert call arguments
expect(mocks.searchHistory.addToHistory).toHaveBeenCalledWith('test query')

// Check call count
expect(mocks.moderation.approveAction).toHaveBeenCalledTimes(1)
```

---

## Writing Unit Tests

### Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { myFunction } from './myModule'

describe('myFunction', () => {
  beforeEach(() => {
    // Setup before each test
  })

  it('should return correct result for valid input', () => {
    const result = myFunction({ input: 'value' })
    expect(result).toEqual({ expected: 'output' })
  })

  it('should handle edge case', () => {
    const result = myFunction({ input: null })
    expect(result).toBeNull()
  })

  it('should throw for invalid input', () => {
    expect(() => myFunction({ invalid: true })).toThrow()
  })
})
```

### Example: Testing Search Trends

```typescript
import { describe, it, expect } from 'vitest'
import { calculateTrendScore, filterTrends } from '../lib/trends'

describe('Trend Calculations', () => {
  describe('calculateTrendScore', () => {
    it('returns 0-10 score based on search volume and growth', () => {
      const score = calculateTrendScore({
        searches: 5000,
        growthRate: 2.5,
        historicalAverage: 1000,
      })
      
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(10)
    })

    it('returns higher score for higher growth rate', () => {
      const baseData = { searches: 1000, historicalAverage: 100 }
      const lowGrowth = calculateTrendScore({ ...baseData, growthRate: 1.1 })
      const highGrowth = calculateTrendScore({ ...baseData, growthRate: 5.0 })
      
      expect(highGrowth).toBeGreaterThan(lowGrowth)
    })

    it('handles zero historical data gracefully', () => {
      const score = calculateTrendScore({
        searches: 100,
        growthRate: 1.0,
        historicalAverage: 0,
      })
      
      expect(score).toBeGreaterThanOrEqual(0)
    })
  })

  describe('filterTrends', () => {
    it('filters trends by category', () => {
      const trends = [
        { id: '1', category: 'leaks', query: 'leak1' },
        { id: '2', category: 'gameplay', query: 'game1' },
      ]
      
      const filtered = filterTrends(trends, 'leaks')
      expect(filtered).toHaveLength(1)
      expect(filtered[0].category).toBe('leaks')
    })
  })
})
```

### Assertion Patterns

```typescript
// Equality
expect(value).toBe(5)
expect(value).toEqual({ name: 'test' })

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()

// Numbers
expect(score).toBeGreaterThan(5)
expect(score).toBeLessThan(10)
expect(score).toBeCloseTo(5.5, 1)

// Strings
expect(text).toContain('GTA')
expect(text).toMatch(/gta/i)

// Arrays
expect(array).toHaveLength(3)
expect(array).toContain('item')
expect(array).toEqual(['a', 'b', 'c'])

// Objects
expect(obj).toHaveProperty('name')
expect(obj).toMatchObject({ name: 'test' })

// Functions
expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledWith('arg')
expect(fn).toHaveBeenCalledTimes(2)

// Promises
expect(promise).resolves.toBe('value')
expect(promise).rejects.toThrow()

// Async
await expect(asyncFn()).resolves.toBe('value')
```

---

## Writing Component Tests

### Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/utils'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    const { getByText } = renderWithProviders(<MyComponent />)
    expect(getByText('Expected Text')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    const handleClick = vi.fn()
    const { getByRole } = renderWithProviders(
      <MyComponent onClick={handleClick} />
    )
    
    const button = getByRole('button')
    await userEvent.click(button)
    
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### Example: Testing Search History Component

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/utils'
import { SearchHistory } from '../SearchHistory'
import { createMockSearchHistory } from '../../test/wave6-utils'

describe('SearchHistory Component', () => {
  it('displays search history items', () => {
    const history = createMockSearchHistory()
    
    renderWithProviders(<SearchHistory items={history} />)
    
    expect(screen.getByText('GTA 6 release date')).toBeInTheDocument()
    expect(screen.getByText('GTA 6 map size')).toBeInTheDocument()
  })

  it('shows timestamp for each item', () => {
    const history = createMockSearchHistory()
    
    renderWithProviders(<SearchHistory items={history} />)
    
    // Assuming timestamps are formatted as relative time
    const timeElements = screen.getAllByText(/ago|minutes/)
    expect(timeElements.length).toBeGreaterThan(0)
  })

  it('calls onSelect when clicking item', async () => {
    const handleSelect = vi.fn()
    const history = createMockSearchHistory()
    
    renderWithProviders(
      <SearchHistory items={history} onSelect={handleSelect} />
    )
    
    const firstItem = screen.getByText('GTA 6 release date')
    await userEvent.click(firstItem)
    
    expect(handleSelect).toHaveBeenCalledWith('GTA 6 release date')
  })

  it('deletes item when delete button clicked', async () => {
    const handleDelete = vi.fn()
    const history = createMockSearchHistory()
    
    const { container } = renderWithProviders(
      <SearchHistory items={history} onDelete={handleDelete} />
    )
    
    const deleteButtons = container.querySelectorAll('[data-testid="delete"]')
    await userEvent.click(deleteButtons[0])
    
    expect(handleDelete).toHaveBeenCalledWith('sh-1')
  })

  it('shows empty state when no history', () => {
    renderWithProviders(<SearchHistory items={[]} />)
    
    expect(screen.getByText(/no search history/i)).toBeInTheDocument()
  })

  it('clears all history on confirmation', async () => {
    const handleClearAll = vi.fn()
    const history = createMockSearchHistory()
    
    renderWithProviders(
      <SearchHistory items={history} onClearAll={handleClearAll} />
    )
    
    const clearButton = screen.getByRole('button', { name: /clear all/i })
    await userEvent.click(clearButton)
    
    // Confirm in dialog
    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    await userEvent.click(confirmButton)
    
    expect(handleClearAll).toHaveBeenCalled()
  })
})
```

### Using `renderWithProviders`

```typescript
import { renderWithProviders } from '../../test/utils'

// Basic rendering with all app providers
const { getByText } = renderWithProviders(<Component />)

// With custom route
const { getByText } = renderWithProviders(<Component />, {
  route: '/community/groups'
})

// Component receives all context providers:
// - Theme
// - Preferences
// - Auth
// - Toast
// - Realtime
// - Feature Flags
// - Router
```

### Querying Elements

```typescript
import { screen } from '@testing-library/react'

// By role (preferred)
screen.getByRole('button', { name: /click me/i })
screen.getAllByRole('link')
screen.queryByRole('button') // returns null if not found

// By text
screen.getByText('Search')
screen.getByText(/search/i) // regex

// By placeholder
screen.getByPlaceholderText('Enter query...')

// By test ID
screen.getByTestId('my-element')

// By label text
screen.getByLabelText('Username')
```

### User Interactions

```typescript
import userEvent from '@testing-library/user-event'

const user = userEvent.setup()

// Typing
await user.type(inputElement, 'text to type')

// Clicking
await user.click(buttonElement)

// Keyboard
await user.keyboard('[ArrowDown]')

// Select
await user.selectOptions(selectElement, 'option-value')

// Tab navigation
await user.tab()

// Type special characters
await user.type(input, '{Enter}')
await user.type(input, '{Control>}a{/Control}') // Ctrl+A
```

---

## Writing Integration Tests

### Template (Node.js Test Runner)

```javascript
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../app.mjs'

let app
let token

beforeEach(() => {
  app = createApp({ dbPath: ':memory:' }).app
  // Setup test user, get token, etc.
})

describe('API Feature', () => {
  it('POST endpoint creates resource', async () => {
    const res = await request(app)
      .post('/api/endpoint')
      .set('Authorization', `Bearer ${token}`)
      .send({ data: 'value' })
    
    assert.equal(res.status, 201)
    assert.ok(res.body.id)
  })
})
```

### Example: Testing Wave 6 Endpoints

```javascript
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../app.mjs'

describe('Wave 6: Search History', () => {
  let app, token

  beforeEach(async () => {
    app = createApp({ dbPath: ':memory:' }).app
    
    // Register test user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@test.de',
        password: 'Test123!',
        displayName: 'Tester'
      })
    
    token = registerRes.body.token
  })

  it('saves search to history', async () => {
    const res = await request(app)
      .post('/api/wave6/search/history')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'GTA 6 leak' })
    
    assert.equal(res.status, 201)
    assert.equal(res.body.query, 'GTA 6 leak')
    assert.ok(res.body.id)
    assert.ok(res.body.timestamp)
  })

  it('retrieves search history', async () => {
    // Add searches
    await request(app)
      .post('/api/wave6/search/history')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'query 1' })
    
    await request(app)
      .post('/api/wave6/search/history')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'query 2' })
    
    // Retrieve
    const res = await request(app)
      .get('/api/wave6/search/history')
      .set('Authorization', `Bearer ${token}`)
    
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body))
    assert.equal(res.body.length, 2)
  })

  it('requires authentication', async () => {
    const res = await request(app)
      .get('/api/wave6/search/history')
    
    assert.equal(res.status, 401)
  })
})
```

### Testing Helper

```javascript
function authedRequest(method, path) {
  return request(app)[method](path)
    .set('Authorization', `Bearer ${token}`)
}

// Usage
const res = await authedRequest('get', '/api/wave6/search/history')
```

---

## Writing E2E Tests

### Template (Playwright)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('user can complete workflow', async ({ page }) => {
    // Navigate
    await page.goto('/search')
    
    // Interact
    await page.fill('[data-testid="search"]', 'query')
    await page.click('button:has-text("Search")')
    
    // Assert
    await expect(page).toHaveURL(/results/)
    await expect(page.locator('[data-testid="result"]')).toBeVisible()
  })
})
```

### Example: Search & Personalization Journey

```typescript
import { test, expect } from '@playwright/test'

test('user discovers content and gets personalized recommendations', async ({ page, context }) => {
  // 1. User searches for content
  await page.goto('/')
  await page.fill('[data-testid="search-input"]', 'GTA 6 leak')
  await page.click('button:has-text("Search")')
  
  await expect(page).toHaveURL(/\/search/)
  await expect(page.locator('[data-testid="search-result"]')).not.toHaveCount(0)
  
  // 2. User checks search history
  await page.click('[data-testid="search-history-button"]')
  await expect(page.locator('text=GTA 6 leak')).toBeVisible()
  
  // 3. User checks trending searches
  await page.goto('/discover')
  await expect(page.locator('[data-testid="trending-item"]')).not.toHaveCount(0)
  
  // 4. User views recommendations
  await page.goto('/dashboard')
  await expect(page.locator('[data-testid="recommendation"]')).not.toHaveCount(0)
  
  // 5. User updates time preferences
  await page.click('[data-testid="settings-button"]')
  await page.check('input[value="morning"]')
  await page.click('button:has-text("Save")')
  
  // 6. Recommendations update
  await page.goto('/dashboard')
  await page.waitForTimeout(500) // Wait for update
  await expect(page.locator('[data-testid="recommendation"]')).not.toHaveCount(0)
})
```

---

## Best Practices

### 1. Test Naming

```typescript
// ✅ Good: Describes what is being tested and expected outcome
it('returns high score when search volume doubles')

// ❌ Bad: Vague or implementation-focused
it('calculates correctly')
it('test case 1')
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should update search history', () => {
  // Arrange: Set up test data
  const mockHistory = createMockSearchHistory()
  
  // Act: Perform action
  const result = addToHistory(mockHistory, 'new query')
  
  // Assert: Verify outcome
  expect(result).toHaveLength(mockHistory.length + 1)
  expect(result[0].query).toBe('new query')
})
```

### 3. DRY Up Tests

```typescript
// ❌ Repeated setup
describe('SearchHistory', () => {
  it('test 1', () => {
    const items = createMockSearchHistory()
    // test logic
  })
  
  it('test 2', () => {
    const items = createMockSearchHistory()
    // test logic
  })
})

// ✅ Use beforeEach
describe('SearchHistory', () => {
  let items
  
  beforeEach(() => {
    items = createMockSearchHistory()
  })
  
  it('test 1', () => {
    // use items
  })
  
  it('test 2', () => {
    // use items
  })
})
```

### 4. Test Behavior, Not Implementation

```typescript
// ❌ Testing implementation details
it('sets state to { loaded: true }', () => {
  // ...
})

// ✅ Testing user-facing behavior
it('displays results after search', async () => {
  await userEvent.type(input, 'query')
  await userEvent.click(button)
  expect(screen.getByText('Results')).toBeVisible()
})
```

### 5. Keep Tests Isolated

```typescript
// ❌ Tests depend on each other
describe('Search', () => {
  let results
  
  it('search returns results', () => {
    results = search('query')
    expect(results).toBeDefined()
  })
  
  it('uses results from previous test', () => {
    // Relies on results from previous test
  })
})

// ✅ Each test is independent
describe('Search', () => {
  it('search returns results', () => {
    const results = search('query')
    expect(results).toBeDefined()
  })
  
  it('search filters results correctly', () => {
    const results = search('query')
    expect(results.length).toBeGreaterThan(0)
  })
})
```

### 6. Cover Happy Path + Edge Cases

```typescript
describe('calculateTrendScore', () => {
  // Happy path
  it('calculates score for normal data', () => { })
  
  // Edge cases
  it('handles zero searches', () => { })
  it('handles negative growth', () => { })
  it('handles very large numbers', () => { })
  it('handles null input', () => { })
})
```

### 7. Mock External Dependencies

```typescript
import { vi } from 'vitest'

// ✅ Mock API calls
const mockFetch = vi.fn().mockResolvedValue({
  json: async () => ({ data: 'value' })
})
global.fetch = mockFetch

// ❌ Don't make real API calls in tests
const response = await fetch('https://api.example.com/data')
```

---

## Troubleshooting

### Test Fails: "Element not found"

```typescript
// Problem
expect(screen.getByText('Search')).toBeInTheDocument()
// Error: Unable to find an element with the text: Search

// Solution 1: Check if element exists differently
const element = screen.queryByText('Search')
if (element) { /* ... */ }

// Solution 2: Use findBy for async content
const element = await screen.findByText('Search')

// Solution 3: Debug what's actually rendered
screen.debug() // prints DOM
```

### Test Fails: "Cannot find module"

```typescript
// Problem
import { myFunction } from './myModule'
// Error: Cannot find module

// Solution 1: Check file path
import { myFunction } from '../lib/myModule' // Correct path

// Solution 2: Check export
export const myFunction = () => {} // Must be exported
```

### Test Flakes Intermittently

```typescript
// Problem: Race condition in async code
it('loads data', async () => {
  component.loadData() // async
  expect(component.data).toBe('value') // too fast!
})

// Solution: Use proper async waiting
it('loads data', async () => {
  component.loadData()
  const data = await screen.findByText('loaded')
  expect(data).toBeInTheDocument()
})
```

### Mock Not Working

```typescript
// Problem: Mock cleared between tests
import { vi } from 'vitest'

const mockFn = vi.fn()

it('test 1', () => {
  mockFn()
  expect(mockFn).toHaveBeenCalled()
})

it('test 2', () => {
  expect(mockFn).not.toHaveBeenCalled() // Fails! Mock carries over
})

// Solution: Clear in beforeEach
beforeEach(() => {
  vi.clearAllMocks()
})
```

### "Cannot find module '@testing-library/react'"

```bash
# Reinstall dependencies
npm ci

# Or specific package
npm install --save-dev @testing-library/react
```

---

## Resources

- [Vitest Docs](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Playwright Docs](https://playwright.dev/)
- [Supertest Docs](https://github.com/visionmedia/supertest)

---

## Getting Help

If you need help:

1. Check the test file examples in this directory
2. Look at existing tests: `grep -r "describe('.*" src/**/*.test.ts`
3. Review test utilities: `src/test/wave6-utils.ts`
4. Ask in team Slack or create an issue

---

**Last Updated:** 2026-06-28  
**Maintained By:** QA Team  
**Version:** 1.0
