# Wave 6 Testing - Quick Reference Card

**One-page guide for common testing tasks**

---

## 🚀 Common Commands

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Server tests
npm run test:server

# E2E tests
npm run test:e2e

# Lint
npm run lint
```

---

## 📦 Using Wave 6 Mocks

```typescript
import { setupWave6Mocks, createMockSearchHistory } from '../../test/wave6-utils'

// Setup in beforeEach
beforeEach(() => {
  mocks = setupWave6Mocks()
})

// Use fixtures
const history = createMockSearchHistory()

// Use mocks
await mocks.searchHistory.getHistory()
expect(mocks.searchHistory.getHistory).toHaveBeenCalled()
```

---

## 🧪 Unit Test Template

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from './myFunction'

describe('myFunction', () => {
  it('returns expected result', () => {
    const result = myFunction({ input: 'test' })
    expect(result).toEqual({ output: 'expected' })
  })

  it('handles edge case', () => {
    expect(() => myFunction(null)).toThrow()
  })
})
```

---

## ⚛️ Component Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders and handles interaction', async () => {
    const { getByRole } = renderWithProviders(<MyComponent />)
    
    const button = getByRole('button', { name: /click/i })
    await userEvent.click(button)
    
    expect(screen.getByText('Result')).toBeInTheDocument()
  })
})
```

---

## 🔌 Integration Test Template

```javascript
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../app.mjs'

let app, token

beforeEach(async () => {
  app = createApp({ dbPath: ':memory:' }).app
  // Get auth token for authenticated tests
})

describe('API Endpoint', () => {
  it('POST /api/endpoint creates resource', async () => {
    const res = await request(app)
      .post('/api/endpoint')
      .set('Authorization', `Bearer ${token}`)
      .send({ data: 'value' })
    
    assert.equal(res.status, 201)
    assert.ok(res.body.id)
  })
})
```

---

## 🎭 Component Query Cheatsheet

```typescript
// By role (preferred)
screen.getByRole('button', { name: /text/i })
screen.getAllByRole('link')

// By text
screen.getByText('Search')
screen.getByText(/search/i)

// By placeholder
screen.getByPlaceholderText('Enter...')

// By test ID
screen.getByTestId('my-element')

// By label
screen.getByLabelText('Username')

// Query vs Get
screen.getByText('x')     // throws if not found
screen.queryByText('x')   // returns null if not found
screen.findByText('x')    // waits for async content
```

---

## 👤 User Event Cheatsheet

```typescript
import userEvent from '@testing-library/user-event'
const user = userEvent.setup()

// Typing
await user.type(inputElement, 'text')
await user.type(input, '{Enter}')

// Clicking
await user.click(buttonElement)

// Selection
await user.selectOptions(selectElement, 'option-value')

// Tab navigation
await user.tab()
await user.tab({ shift: true })

// Keyboard
await user.keyboard('[Control>]a[/Control]') // Ctrl+A
```

---

## ✅ Common Assertions

```typescript
// Equality
expect(value).toBe(5)
expect(obj).toEqual({ name: 'test' })

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()

// Numbers
expect(num).toBeGreaterThan(5)
expect(num).toBeLessThan(10)
expect(num).toBeCloseTo(5.5)

// Strings
expect(text).toContain('GTA')
expect(text).toMatch(/gta/i)

// Arrays
expect(arr).toHaveLength(3)
expect(arr).toContain('item')

// DOM
expect(element).toBeInTheDocument()
expect(element).toHaveFocus()
expect(element).toBeVisible()

// Functions
expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledWith('arg')
expect(fn).toHaveBeenCalledTimes(2)

// Promises
expect(promise).resolves.toBe('value')
expect(promise).rejects.toThrow()
```

---

## 🔍 Debugging

```typescript
// Print rendered DOM
screen.debug()

// Find element without throwing
const el = screen.queryByText('text')

// Wait for async elements
const el = await screen.findByText('text')

// Check all roles
screen.logTestingPlaygroundURL()

// Playwright inspector
// PWDEBUG=1 npm run test:e2e
```

---

## 📊 Coverage Targets

```
Statements:  80%+
Branches:    75%+
Functions:   80%+
Lines:       80%+
```

View report: `npm run test:coverage` then `open coverage/index.html`

---

## 🎯 Wave 6 Features & Files

| Feature | Unit Tests | Component Tests | Integration |
|---------|-----------|-----------------|-------------|
| Search History | `src/lib/search.test.ts` | See template | `server/tests/wave6-integration.test.mjs` |
| Search Trends | `src/lib/trends.test.ts` | See template | ✓ |
| Video Search | `src/lib/videoSearch.test.ts` | See template | ✓ |
| Time-Based Recs | `src/lib/timeBasedRecs.test.ts` | See template | ✓ |
| Emotion-Based Recs | `src/lib/emotionRecs.test.ts` | See template | ✓ |
| Sentiment | `src/lib/sentiment.test.ts` | See template | ✓ |
| Groups | `src/components/__tests__/...` | See template | ✓ |
| Threads | `src/components/__tests__/...` | See template | ✓ |
| Replies | `src/components/__tests__/...` | See template | ✓ |
| Moderation | `src/components/__tests__/...` | See template | ✓ |

---

## 📚 Full Documentation

- **Setup & Installation:** `TESTING-GUIDE-WAVE6.md`
- **Testing Best Practices:** `TESTING-GUIDE-WAVE6.md`
- **Component Test Templates:** `src/components/__tests__/Wave6Features.test.tsx`
- **API Test Examples:** `server/tests/wave6-integration.test.mjs`
- **QA Manual Testing:** `QA-CHECKLIST-WAVE6.md`
- **Coverage Strategy:** `TEST-COVERAGE-TARGETS.md`
- **Framework Overview:** `WAVE6-TEST-FRAMEWORK-README.md`

---

## 🚨 Common Mistakes

```typescript
// ❌ Don't test implementation details
it('sets state to { loaded: true }')

// ✅ Test user-facing behavior
it('displays results after load')

// ❌ Don't create flaky async tests
it('data loads', () => {
  component.load()
  expect(data).toBe('value') // Too fast!
})

// ✅ Use proper async waiting
it('data loads', async () => {
  component.load()
  const element = await screen.findByText('loaded')
  expect(element).toBeInTheDocument()
})

// ❌ Don't forget to clear mocks
it('test 1', () => { mockFn() })
it('test 2', () => {
  expect(mockFn).not.toHaveBeenCalled() // FAILS!
})

// ✅ Clear between tests
beforeEach(() => { vi.clearAllMocks() })
```

---

## 🔗 Quick Links

- **Run Tests:** `npm test`
- **Watch Mode:** `npm run test:watch`
- **Coverage:** `npm run test:coverage`
- **View Report:** `open coverage/index.html`
- **CI Status:** GitHub Actions → Wave 6 Tests
- **Mock Utilities:** `src/test/wave6-utils.ts`
- **Test Templates:** `src/components/__tests__/Wave6Features.test.tsx`
- **Full Guide:** `TESTING-GUIDE-WAVE6.md`

---

## 📞 Need Help?

1. Check the relevant documentation above
2. Look for similar tests in the codebase: `grep -r "describe('search" src/**/*.test.ts`
3. Copy test templates from `Wave6Features.test.tsx`
4. Ask in team Slack or create an issue

---

**Last Updated:** 2026-06-28  
**Version:** 1.0
