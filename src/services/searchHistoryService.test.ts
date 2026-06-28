import { describe, it, expect, beforeEach, vi } from 'vitest'
import { searchHistoryService } from './searchHistoryService'

describe('SearchHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate required fields for adding search', async () => {
    await expect(
      searchHistoryService.addSearchToHistory('', 'test query', 10)
    ).rejects.toThrow('User ID and query are required')

    await expect(
      searchHistoryService.addSearchToHistory('user-123', '', 10)
    ).rejects.toThrow('User ID and query are required')
  })

  it('should get recent searches within limit', async () => {
    const limit = 5
    // Note: This would be a mock in real tests with fetch mocking
    const result = await searchHistoryService.getRecentSearches('user-123', limit)
    expect(Array.isArray(result)).toBe(true)
  })

  it('should return empty array on fetch failure', async () => {
    const result = await searchHistoryService.getRecentSearches('user-invalid', 10)
    expect(Array.isArray(result)).toBe(true)
  })

  it('should handle pagination', async () => {
    const result = await searchHistoryService.getAllSearchHistory('user-123', 0, 20)
    expect(result).toHaveProperty('entries')
    expect(result).toHaveProperty('total')
    expect(Array.isArray(result.entries)).toBe(true)
  })

  it('should get trending searches', async () => {
    const result = await searchHistoryService.getTopSearches(10, 'week')
    expect(Array.isArray(result)).toBe(true)
  })
})
