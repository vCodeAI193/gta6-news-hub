/**
 * Search History Service
 * Manages cross-device search history synchronization for authenticated users
 */

export interface SearchHistoryEntry {
  id: string
  userId: string
  query: string
  timestamp: number
  resultsCount: number
  category?: string
}

class SearchHistoryService {
  private static readonly MAX_HISTORY = 100
  private static readonly DUPLICATE_WINDOW_MS = 60000 // 1 minute

  /**
   * Add a search query to user's history
   */
  async addSearchToHistory(
    userId: string,
    query: string,
    resultsCount: number,
    category?: string
  ): Promise<SearchHistoryEntry> {
    if (!userId || !query.trim()) {
      throw new Error('User ID and query are required')
    }

    const trimmedQuery = query.trim().toLowerCase()
    const recentSearches = await this.getRecentSearches(userId, 10)

    // Avoid duplicate within window
    const isDuplicate = recentSearches.some(
      s => s.query.toLowerCase() === trimmedQuery &&
           Date.now() - s.timestamp < SearchHistoryService.DUPLICATE_WINDOW_MS
    )

    if (isDuplicate) {
      return recentSearches[0]!
    }

    const entry: SearchHistoryEntry = {
      id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      query: trimmedQuery,
      timestamp: Date.now(),
      resultsCount,
      category,
    }

    // Store to backend
    await fetch('/api/users/search-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })

    return entry
  }

  /**
   * Get recent searches for autocomplete suggestions
   */
  async getRecentSearches(userId: string, limit: number = 10): Promise<SearchHistoryEntry[]> {
    try {
      const response = await fetch(`/api/users/search-history?limit=${limit}`)
      if (!response.ok) return []
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  /**
   * Get all search history for user (paginated)
   */
  async getAllSearchHistory(
    userId: string,
    page: number = 0,
    pageSize: number = 20
  ): Promise<{ entries: SearchHistoryEntry[]; total: number }> {
    try {
      const response = await fetch(
        `/api/users/search-history?page=${page}&pageSize=${pageSize}`
      )
      if (!response.ok) return { entries: [], total: 0 }
      const data = await response.json()
      return data
    } catch {
      return { entries: [], total: 0 }
    }
  }

  /**
   * Clear search history for user
   */
  async clearAllSearchHistory(userId: string): Promise<void> {
    await fetch('/api/users/search-history', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
  }

  /**
   * Remove specific search entry
   */
  async removeSearchEntry(entryId: string): Promise<void> {
    await fetch(`/api/users/search-history/${entryId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Get top trending searches (global)
   */
  async getTopSearches(limit: number = 20, timeRange: 'day' | 'week' | 'month' = 'week'): Promise<Array<{ query: string; count: number }>> {
    try {
      const response = await fetch(`/api/analytics/top-searches?limit=${limit}&range=${timeRange}`)
      if (!response.ok) return []
      return response.json()
    } catch {
      return []
    }
  }
}

export const searchHistoryService = new SearchHistoryService()
