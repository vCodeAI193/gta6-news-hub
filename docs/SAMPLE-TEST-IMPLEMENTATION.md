# Sample Test Implementation Guide

Complete working examples showing how to use the Wave 6 test framework for each test type.

---

## Example 1: Unit Test - Search History Logic

**File:** `src/lib/search.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { saveToHistory, getHistory, clearHistory } from './search'

describe('Search History', () => {
  let mockStorage: Map<string, string>

  beforeEach(() => {
    // Mock localStorage for testing
    mockStorage = new Map()
    global.localStorage = {
      getItem: (key: string) => mockStorage.get(key) || null,
      setItem: (key: string, value: string) => mockStorage.set(key, value),
      removeItem: (key: string) => mockStorage.delete(key),
      clear: () => mockStorage.clear(),
      length: mockStorage.size,
      key: (index: number) => Array.from(mockStorage.keys())[index] || null,
    } as Storage
  })

  describe('saveToHistory', () => {
    it('saves a new search query to history', () => {
      const query = 'GTA 6 leak'
      const item = saveToHistory(query)

      expect(item.id).toBeDefined()
      expect(item.query).toBe(query)
      expect(item.timestamp).toBeDefined()
      expect(item.results_count).toBeGreaterThanOrEqual(0)
    })

    it('updates existing query timestamp on duplicate', () => {
      const query = 'GTA 6 gameplay'

      const item1 = saveToHistory(query)
      const timestamp1 = item1.timestamp

      // Wait a bit and save again
      const item2 = saveToHistory(query)
      const timestamp2 = item2.timestamp

      // Same item (same query)
      expect(item2.id).toBe(item1.id)
      // Timestamp should be updated
      expect(timestamp2).toBeGreaterThanOrEqual(timestamp1)
    })

    it('enforces maximum 100 items in history', () => {
      // Add 101 items
      for (let i = 0; i < 101; i++) {
        saveToHistory(`query ${i}`)
      }

      const history = getHistory()
      expect(history).toHaveLength(100)
    })

    it('rejects empty queries', () => {
      expect(() => saveToHistory('')).toThrow('Query cannot be empty')
      expect(() => saveToHistory('  ')).toThrow('Query cannot be empty')
    })

    it('handles very long queries', () => {
      const longQuery = 'a'.repeat(500)
      const item = saveToHistory(longQuery)

      expect(item.query).toBe(longQuery)
    })
  })

  describe('getHistory', () => {
    it('returns empty array when no history exists', () => {
      const history = getHistory()
      expect(history).toEqual([])
    })

    it('returns history in reverse chronological order', () => {
      saveToHistory('first query')
      saveToHistory('second query')
      saveToHistory('third query')

      const history = getHistory()

      expect(history[0].query).toBe('third query')
      expect(history[1].query).toBe('second query')
      expect(history[2].query).toBe('first query')
    })

    it('returns all required fields for each item', () => {
      saveToHistory('test query')
      const history = getHistory()

      const item = history[0]
      expect(item).toHaveProperty('id')
      expect(item).toHaveProperty('query')
      expect(item).toHaveProperty('timestamp')
      expect(item).toHaveProperty('results_count')
    })
  })

  describe('clearHistory', () => {
    it('clears all history items', () => {
      saveToHistory('query 1')
      saveToHistory('query 2')
      saveToHistory('query 3')

      expect(getHistory()).toHaveLength(3)

      clearHistory()

      expect(getHistory()).toHaveLength(0)
    })

    it('handles clearing empty history', () => {
      expect(() => clearHistory()).not.toThrow()
      expect(getHistory()).toHaveLength(0)
    })
  })
})
```

---

## Example 2: Component Test - Search History UI

**File:** `src/components/__tests__/SearchHistory.test.tsx`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/utils'
import { SearchHistory } from '../SearchHistory'
import { createMockSearchHistory } from '../../test/wave6-utils'

describe('SearchHistory Component', () => {
  const mockHistory = createMockSearchHistory()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Display', () => {
    it('renders search history items', () => {
      renderWithProviders(<SearchHistory items={mockHistory} />)

      // Check all items are displayed
      expect(screen.getByText('GTA 6 release date')).toBeInTheDocument()
      expect(screen.getByText('GTA 6 map size')).toBeInTheDocument()
      expect(screen.getByText('GTA 6 characters')).toBeInTheDocument()
    })

    it('displays result count for each item', () => {
      renderWithProviders(<SearchHistory items={mockHistory} />)

      // First item has 245 results
      const firstItem = screen.getByText('GTA 6 release date').closest('li')
      expect(within(firstItem!).getByText(/245/)).toBeInTheDocument()
    })

    it('shows relative time (e.g., "2 hours ago")', () => {
      renderWithProviders(<SearchHistory items={mockHistory} />)

      const timeElements = screen.getAllByText(/ago/)
      expect(timeElements.length).toBeGreaterThan(0)
    })

    it('shows category badge for each item', () => {
      renderWithProviders(<SearchHistory items={mockHistory} />)

      expect(screen.getByText('release')).toBeInTheDocument()
      expect(screen.getByText('gameplay')).toBeInTheDocument()
      expect(screen.getByText('story')).toBeInTheDocument()
    })

    it('shows empty state when no history', () => {
      renderWithProviders(<SearchHistory items={[]} />)

      expect(screen.getByText(/no search history/i)).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('calls onSelect when clicking a history item', async () => {
      const handleSelect = vi.fn()
      const user = userEvent.setup()

      renderWithProviders(
        <SearchHistory items={mockHistory} onSelect={handleSelect} />
      )

      const firstItem = screen.getByText('GTA 6 release date')
      await user.click(firstItem)

      expect(handleSelect).toHaveBeenCalledWith('GTA 6 release date')
    })

    it('calls onDelete when delete button is clicked', async () => {
      const handleDelete = vi.fn()
      const user = userEvent.setup()

      const { container } = renderWithProviders(
        <SearchHistory items={mockHistory} onDelete={handleDelete} />
      )

      // Find delete button for first item
      const deleteButtons = container.querySelectorAll('[data-testid="delete-item"]')
      await user.click(deleteButtons[0])

      expect(handleDelete).toHaveBeenCalledWith('sh-1')
    })

    it('shows confirmation dialog before clearing all', async () => {
      const handleClearAll = vi.fn()
      const user = userEvent.setup()

      renderWithProviders(
        <SearchHistory items={mockHistory} onClearAll={handleClearAll} />
      )

      // Click clear all button
      const clearButton = screen.getByRole('button', { name: /clear all/i })
      await user.click(clearButton)

      // Dialog should appear
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)

      expect(handleClearAll).toHaveBeenCalled()
    })

    it('cancels clear all operation when user clicks cancel', async () => {
      const handleClearAll = vi.fn()
      const user = userEvent.setup()

      renderWithProviders(
        <SearchHistory items={mockHistory} onClearAll={handleClearAll} />
      )

      // Click clear all
      const clearButton = screen.getByRole('button', { name: /clear all/i })
      await user.click(clearButton)

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // onClearAll should not be called
      expect(handleClearAll).not.toHaveBeenCalled()

      // Dialog should close
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has accessible button labels', () => {
      const { container } = renderWithProviders(
        <SearchHistory items={mockHistory} />
      )

      const buttons = container.querySelectorAll('button')
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName()
      })
    })

    it('maintains proper heading hierarchy', () => {
      renderWithProviders(<SearchHistory items={mockHistory} />)

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent(/history/i)
    })

    it('keyboard navigation works correctly', async () => {
      const handleSelect = vi.fn()
      const user = userEvent.setup()

      renderWithProviders(
        <SearchHistory items={mockHistory} onSelect={handleSelect} />
      )

      // Tab to first item
      await user.tab()

      // First interactive element should have focus
      expect(document.activeElement).toBeInTheDocument()
    })
  })
})
```

---

## Example 3: Integration Test - Search API

**File:** `server/tests/wave6-integration.test.mjs`

```javascript
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../app.mjs'

describe('Wave 6: Search History API', () => {
  let app
  let token
  let userId

  beforeEach(async () => {
    // Create fresh app with in-memory database
    app = createApp({ dbPath: ':memory:' }).app

    // Register test user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'searcher@test.de',
        password: 'Test123!',
        displayName: 'Search Tester',
      })

    assert.equal(registerRes.status, 201)
    token = registerRes.body.token
    userId = registerRes.body.user.id
  })

  describe('POST /api/wave6/search/history', () => {
    it('creates new search history item', async () => {
      const res = await request(app)
        .post('/api/wave6/search/history')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'GTA 6 leak' })

      assert.equal(res.status, 201, 'Should return 201 Created')
      assert.ok(res.body.id, 'Should have ID')
      assert.equal(res.body.query, 'GTA 6 leak')
      assert.ok(res.body.timestamp, 'Should have timestamp')
      assert.ok(typeof res.body.results_count === 'number', 'Should have results count')
    })

    it('requires authentication', async () => {
      const res = await request(app)
        .post('/api/wave6/search/history')
        .send({ query: 'test' })

      assert.equal(res.status, 401, 'Should require authentication')
    })

    it('validates query parameter', async () => {
      const res = await request(app)
        .post('/api/wave6/search/history')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: '' })

      assert.equal(res.status, 400, 'Should validate empty query')
      assert.ok(res.body.error, 'Should return error message')
    })

    it('handles duplicate queries', async () => {
      // First request
      const res1 = await request(app)
        .post('/api/wave6/search/history')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'duplicate query' })

      assert.equal(res1.status, 201)
      const id1 = res1.body.id

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100))

      // Second request with same query
      const res2 = await request(app)
        .post('/api/wave6/search/history')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'duplicate query' })

      assert.equal(res2.status, 201)
      const id2 = res2.body.id

      // Should be the same item (updated, not duplicated)
      assert.equal(id1, id2, 'Should update timestamp instead of creating duplicate')
    })
  })

  describe('GET /api/wave6/search/history', () => {
    it('retrieves user search history', async () => {
      // Add some searches
      await request(app)
        .post('/api/wave6/search/history')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'first query' })

      await request(app)
        .post('/api/wave6/search/history')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'second query' })

      // Retrieve
      const res = await request(app)
        .get('/api/wave6/search/history')
        .set('Authorization', `Bearer ${token}`)

      assert.equal(res.status, 200)
      assert.ok(Array.isArray(res.body), 'Should return array')
      assert.equal(res.body.length, 2, 'Should have 2 items')
      assert.equal(res.body[0].query, 'second query', 'Should be reverse chronological')
    })

    it('returns empty array when no history', async () => {
      const res = await request(app)
        .get('/api/wave6/search/history')
        .set('Authorization', `Bearer ${token}`)

      assert.equal(res.status, 200)
      assert.deepEqual(res.body, [], 'Should return empty array')
    })

    it('requires authentication', async () => {
      const res = await request(app).get('/api/wave6/search/history')

      assert.equal(res.status, 401, 'Should require authentication')
    })

    it('paginates results when limit provided', async () => {
      // Add 5 items
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/wave6/search/history')
          .set('Authorization', `Bearer ${token}`)
          .send({ query: `query ${i}` })
      }

      // Request with limit
      const res = await request(app)
        .get('/api/wave6/search/history?limit=2')
        .set('Authorization', `Bearer ${token}`)

      assert.equal(res.status, 200)
      assert.equal(res.body.length, 2, 'Should respect limit')
    })
  })

  describe('DELETE /api/wave6/search/history/:id', () => {
    it('deletes specific history item', async () => {
      // Add item
      const addRes = await request(app)
        .post('/api/wave6/search/history')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'to delete' })

      const itemId = addRes.body.id

      // Delete it
      const delRes = await request(app)
        .delete(`/api/wave6/search/history/${itemId}`)
        .set('Authorization', `Bearer ${token}`)

      assert.equal(delRes.status, 200)

      // Verify it's deleted
      const listRes = await request(app)
        .get('/api/wave6/search/history')
        .set('Authorization', `Bearer ${token}`)

      assert.equal(listRes.body.length, 0, 'Item should be deleted')
    })

    it('returns 404 for non-existent item', async () => {
      const res = await request(app)
        .delete('/api/wave6/search/history/invalid-id')
        .set('Authorization', `Bearer ${token}`)

      assert.equal(res.status, 404)
    })
  })

  describe('DELETE /api/wave6/search/history (clear all)', () => {
    it('clears all history for user', async () => {
      // Add items
      await request(app)
        .post('/api/wave6/search/history')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'query 1' })

      await request(app)
        .post('/api/wave6/search/history')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'query 2' })

      // Clear all
      const delRes = await request(app)
        .delete('/api/wave6/search/history')
        .set('Authorization', `Bearer ${token}`)

      assert.equal(delRes.status, 200)

      // Verify cleared
      const listRes = await request(app)
        .get('/api/wave6/search/history')
        .set('Authorization', `Bearer ${token}`)

      assert.equal(listRes.body.length, 0, 'History should be empty')
    })

    it('handles clearing empty history', async () => {
      const res = await request(app)
        .delete('/api/wave6/search/history')
        .set('Authorization', `Bearer ${token}`)

      assert.equal(res.status, 200)
    })
  })
})
```

---

## Example 4: E2E Test - Complete Search Flow

**File:** `e2e/search-and-personalization.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Search and Personalization Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/')

    // Login (assuming you have a test user)
    await page.click('[data-testid="login-button"]')
    await page.fill('[data-testid="email-input"]', 'test@test.de')
    await page.fill('[data-testid="password-input"]', 'Test123!')
    await page.click('[data-testid="submit-button"]')

    // Wait for dashboard
    await expect(page).toHaveURL(/dashboard/)
  })

  test('user searches, views history, and gets personalized recommendations', async ({
    page,
  }) => {
    // 1. Navigate to search
    await page.click('[data-testid="search-nav"]')
    await expect(page).toHaveURL(/search/)

    // 2. Perform search
    const searchInput = page.locator('[data-testid="search-input"]')
    await searchInput.fill('GTA 6 leak')
    await page.click('[data-testid="search-button"]')

    // 3. Wait for results
    await expect(page.locator('[data-testid="result-item"]')).toHaveCount(1, {
      timeout: 5000,
    })

    // 4. Verify result content
    const firstResult = page.locator('[data-testid="result-item"]').first()
    await expect(firstResult).toContainText(/GTA 6/i)

    // 5. Check search history appears
    await page.click('[data-testid="search-history-button"]')
    const historyItem = page.locator('text=GTA 6 leak')
    await expect(historyItem).toBeVisible()

    // 6. View trending searches
    await page.click('[data-testid="trending-button"]')
    await expect(page.locator('[data-testid="trend-item"]')).toHaveCount(1, {
      timeout: 5000,
    })

    // 7. Go to dashboard
    await page.click('[data-testid="dashboard-nav"]')
    await expect(page).toHaveURL(/dashboard/)

    // 8. Check personalized recommendations loaded
    await expect(
      page.locator('[data-testid="recommendation-card"]'),
      'Should show recommendations'
    ).toHaveCount(1, { timeout: 5000 })

    // 9. Check time-based recommendations
    const timeRecs = page.locator('[data-testid="time-based-rec"]')
    await expect(timeRecs).toBeVisible()

    // 10. Update time preferences
    await page.click('[data-testid="settings-button"]')
    await expect(page).toHaveURL(/settings/)

    // Check morning preference
    await page.check('input[value="morning"]')

    // Save settings
    await page.click('[data-testid="save-settings"]')

    // Wait for toast confirmation
    await expect(page.locator('text=Settings saved')).toBeVisible()

    // 11. Check recommendations updated
    await page.click('[data-testid="dashboard-nav"]')
    const updatedRecs = page.locator('[data-testid="recommendation-card"]')
    await expect(updatedRecs).toHaveCount(1, { timeout: 5000 })
  })

  test('user can manage search history', async ({ page }) => {
    // Add multiple searches
    const searchInput = page.locator('[data-testid="search-input"]')

    await searchInput.fill('query 1')
    await page.click('[data-testid="search-button"]')
    await page.waitForNavigation()

    await page.goto('/')
    await searchInput.fill('query 2')
    await page.click('[data-testid="search-button"]')
    await page.waitForNavigation()

    // Open history
    await page.click('[data-testid="search-history-button"]')

    // Check both queries are there
    const historyItems = page.locator('[data-testid="history-item"]')
    await expect(historyItems).toHaveCount(2, { timeout: 5000 })

    // Delete first item
    const deleteButtons = page.locator('[data-testid="delete-history"]')
    await deleteButtons.first().click()

    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]')

    // Check only one remains
    await expect(historyItems).toHaveCount(1)

    // Clear all remaining
    await page.click('[data-testid="clear-all-button"]')
    await page.click('[data-testid="confirm-clear"]')

    // Check history is empty
    await expect(page.locator('text=/no history/i')).toBeVisible()
  })
})
```

---

## Running These Examples

```bash
# Run unit test
npm test -- src/lib/search.test.ts

# Run component test
npm test -- src/components/__tests__/SearchHistory.test.tsx

# Run integration test
npm run test:server -- server/tests/wave6-integration.test.mjs

# Run E2E test
npm run test:e2e -- e2e/search-and-personalization.spec.ts

# Run all Wave 6 tests
npm test -- --grep "Wave 6"
```

---

## Key Patterns Used

1. **Unit Tests:** Test functions with mocked dependencies
2. **Component Tests:** Use `renderWithProviders` for real context
3. **Integration Tests:** Use `supertest` for HTTP testing
4. **E2E Tests:** Full browser automation with real user flows

---

## Next Steps

1. Copy these examples to your actual test files
2. Customize for your specific implementations
3. Run tests: `npm test` or `npm run test:watch`
4. Check coverage: `npm run test:coverage`
5. Review coverage report: `open coverage/index.html`

---

**For more details, see:**
- `TESTING-GUIDE-WAVE6.md` - Complete testing guide
- `src/test/wave6-utils.ts` - Available mocks
- `Wave6Features.test.tsx` - Component test templates
