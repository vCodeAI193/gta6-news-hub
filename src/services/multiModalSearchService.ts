/**
 * Multi-Modal Search Service
 * Search across text, images, and video with unified results
 */

export interface SearchResult {
  id: string
  type: 'article' | 'video' | 'image' | 'user'
  title: string
  description?: string
  thumbnail?: string
  relevance: number // 0-1
  matchedFields: string[]
  metadata?: Record<string, unknown>
}

export interface MultiModalSearchQuery {
  query: string
  modalities: ('text' | 'image' | 'video')[]
  filters?: {
    dateRange?: { start: number; end: number }
    author?: string
    category?: string
    language?: string
  }
  limit?: number
  offset?: number
}

export interface ImageSearchRequest {
  imageUrl: string
  limit?: number
}

export interface VideoSearchRequest {
  videoUrl?: string
  audioTranscript?: string
  limit?: number
}

class MultiModalSearchService {
  /**
   * Perform multi-modal search across all content types
   */
  async search(query: MultiModalSearchQuery): Promise<{
    results: SearchResult[]
    total: number
    executionTime: number
  }> {
    const startTime = Date.now()

    try {
      const response = await fetch('/api/search/multi-modal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
      })

      if (!response.ok) {
        return { results: [], total: 0, executionTime: Date.now() - startTime }
      }

      const data = await response.json()
      return {
        ...data,
        executionTime: Date.now() - startTime,
      }
    } catch {
      return { results: [], total: 0, executionTime: Date.now() - startTime }
    }
  }

  /**
   * Search by image
   */
  async searchByImage(request: ImageSearchRequest): Promise<SearchResult[]> {
    try {
      const response = await fetch('/api/search/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) return []
      const data = await response.json()
      return data.results || []
    } catch {
      return []
    }
  }

  /**
   * Search by video
   */
  async searchByVideo(request: VideoSearchRequest): Promise<SearchResult[]> {
    try {
      const response = await fetch('/api/search/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) return []
      const data = await response.json()
      return data.results || []
    } catch {
      return []
    }
  }

  /**
   * Get search suggestions with multi-modal hints
   */
  async getSuggestions(prefix: string, limit: number = 10): Promise<Array<{
    text: string
    type: 'text' | 'image' | 'video'
    preview?: string
  }>> {
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(prefix)}&limit=${limit}`)
      if (!response.ok) return []
      const data = await response.json()
      return data.suggestions || []
    } catch {
      return []
    }
  }

  /**
   * Get trending searches across modalities
   */
  async getTrendingSearches(): Promise<Array<{
    query: string
    trend: number
    modalities: ('text' | 'image' | 'video')[]
  }>> {
    try {
      const response = await fetch('/api/search/trending')
      if (!response.ok) return []
      return response.json()
    } catch {
      return []
    }
  }

  /**
   * Combine and rank results from multiple modalities
   */
  rankResults(results: SearchResult[]): SearchResult[] {
    return results.sort((a, b) => {
      // Sort by relevance score
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance
      }
      // Then by type priority (text > video > image)
      const typePriority: Record<string, number> = {
        'article': 3,
        'video': 2,
        'image': 1,
        'user': 2,
      }
      return (typePriority[b.type] || 0) - (typePriority[a.type] || 0)
    })
  }

  /**
   * Apply filters to search results
   */
  filterResults(
    results: SearchResult[],
    filters: MultiModalSearchQuery['filters']
  ): SearchResult[] {
    if (!filters) return results

    return results.filter(result => {
      if (filters.dateRange && result.metadata?.timestamp) {
        const timestamp = result.metadata.timestamp as number
        if (timestamp < filters.dateRange.start || timestamp > filters.dateRange.end) {
          return false
        }
      }

      if (filters.author && result.metadata?.author !== filters.author) {
        return false
      }

      if (filters.category && result.metadata?.category !== filters.category) {
        return false
      }

      if (filters.language && result.metadata?.language !== filters.language) {
        return false
      }

      return true
    })
  }

  /**
   * Get modality statistics
   */
  getModalityStats(results: SearchResult[]): Record<string, number> {
    const stats: Record<string, number> = {
      article: 0,
      video: 0,
      image: 0,
      user: 0,
    }

    for (const result of results) {
      stats[result.type]++
    }

    return stats
  }

  /**
   * Save search history
   */
  async saveSearchToHistory(
    userId: string,
    query: string,
    modalities: string[]
  ): Promise<void> {
    try {
      await fetch(`/api/users/${userId}/search-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, modalities, timestamp: Date.now() }),
      })
    } catch {
      // Silent fail
    }
  }

  /**
   * Get AI-powered search insights
   */
  async getSearchInsights(query: string): Promise<{
    relatedTopics: string[]
    suggestedModalities: ('text' | 'image' | 'video')[]
    searchIntent: 'informational' | 'navigational' | 'transactional'
  }> {
    try {
      const response = await fetch(`/api/search/insights?q=${encodeURIComponent(query)}`)
      if (!response.ok) {
        return {
          relatedTopics: [],
          suggestedModalities: ['text'],
          searchIntent: 'informational',
        }
      }
      return response.json()
    } catch {
      return {
        relatedTopics: [],
        suggestedModalities: ['text'],
        searchIntent: 'informational',
      }
    }
  }
}

export const multiModalSearchService = new MultiModalSearchService()
