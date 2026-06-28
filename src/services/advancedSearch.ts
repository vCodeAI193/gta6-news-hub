/**
 * Advanced search service for handling complex query syntax and filtering
 */

interface AdvancedFilters {
  authors: string[]
  dateFrom?: string
  dateTo?: string
  ratingMin?: number
  ratingMax?: number
  categories: string[]
  reliability: string[]
  tags: string[]
  textTerms: string[]
}

/**
 * Parse advanced query string on the client side
 * Falls back to server parsing if needed
 */
export function parseAdvancedQuery(input: string): AdvancedFilters {
  const filters: AdvancedFilters = {
    authors: [],
    categories: [],
    reliability: [],
    tags: [],
    textTerms: [],
  }

  const authorPattern = /author:"([^"]+)"|author:([^\s]+)/gi
  const datePattern = /date:(>=?|<=?)?(\d{4}-\d{2}-\d{2})|date:(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})/gi
  // const ratingPattern = /rating:(>=?|<=?)?(\d+(?:\.\d+)?)/gi // TODO: implement rating filter
  const categoryPattern = /category:([^\s]+)/gi
  const reliabilityPattern = /reliability:(confirmed|rumor|unconfirmed)/gi
  const tagsPattern = /tags:([^\s]+)/gi

  let processedQuery = input

  // Extract authors
  let match
  while ((match = authorPattern.exec(input)) !== null) {
    const author = match[1] || match[2]
    if (author && !filters.authors.includes(author)) {
      filters.authors.push(author)
    }
    processedQuery = processedQuery.replace(match[0], '')
  }

  // Extract date filters
  datePattern.lastIndex = 0
  while ((match = datePattern.exec(input)) !== null) {
    const singleDate = match[2]
    const rangeFrom = match[3]
    const rangeTo = match[4]

    if (rangeFrom && rangeTo) {
      filters.dateFrom = rangeFrom
      filters.dateTo = rangeTo
    } else if (singleDate) {
      filters.dateFrom = singleDate
      filters.dateTo = singleDate
    }
    processedQuery = processedQuery.replace(match[0], '')
  }

  // Extract categories
  categoryPattern.lastIndex = 0
  while ((match = categoryPattern.exec(input)) !== null) {
    const cat = match[1].toLowerCase()
    if (!filters.categories.includes(cat)) {
      filters.categories.push(cat)
    }
    processedQuery = processedQuery.replace(match[0], '')
  }

  // Extract reliability
  reliabilityPattern.lastIndex = 0
  while ((match = reliabilityPattern.exec(input)) !== null) {
    const rel = match[1]
    if (!filters.reliability.includes(rel)) {
      filters.reliability.push(rel)
    }
    processedQuery = processedQuery.replace(match[0], '')
  }

  // Extract tags
  tagsPattern.lastIndex = 0
  while ((match = tagsPattern.exec(input)) !== null) {
    const tagStr = match[1]
    const tags = tagStr.split(',').map((t) => t.trim().toLowerCase())
    filters.tags = [...new Set([...filters.tags, ...tags])]
    processedQuery = processedQuery.replace(match[0], '')
  }

  // Remaining text is free-form search
  const remaining = processedQuery.replace(/\s+/g, ' ').trim()
  if (remaining) {
    filters.textTerms = remaining.split(/\s+/).filter(Boolean)
  }

  return filters
}

/**
 * Build query string from filters
 */
export function buildQueryString(filters: AdvancedFilters, textQuery = ''): string {
  const parts: string[] = []

  if (textQuery) parts.push(textQuery)
  filters.authors.forEach((a) => parts.push(`author:"${a}"`))

  if (filters.dateFrom || filters.dateTo) {
    if (filters.dateFrom === filters.dateTo) {
      parts.push(`date:${filters.dateFrom}`)
    } else if (filters.dateFrom && filters.dateTo) {
      parts.push(`date:${filters.dateFrom}..${filters.dateTo}`)
    } else if (filters.dateFrom) {
      parts.push(`date:>=${filters.dateFrom}`)
    } else if (filters.dateTo) {
      parts.push(`date:<=${filters.dateTo}`)
    }
  }

  filters.categories.forEach((c) => parts.push(`category:${c}`))
  filters.reliability.forEach((r) => parts.push(`reliability:${r}`))
  if (filters.tags.length > 0) parts.push(`tags:${filters.tags.join(',')}`)

  return parts.join(' ')
}

/**
 * Format filters for display to user
 */
export function formatFilterDescription(filters: AdvancedFilters): string {
  const parts: string[] = []

  if (filters.authors.length > 0) parts.push(`Author: ${filters.authors.join(', ')}`)
  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom || 'beginning'
    const to = filters.dateTo || 'today'
    parts.push(`Date: ${from} to ${to}`)
  }
  if (filters.categories.length > 0) parts.push(`Categories: ${filters.categories.join(', ')}`)
  if (filters.reliability.length > 0) parts.push(`Reliability: ${filters.reliability.join(', ')}`)
  if (filters.tags.length > 0) parts.push(`Tags: ${filters.tags.join(', ')}`)

  return parts.join(' | ')
}

/**
 * Perform advanced search on the server
 */
export async function performAdvancedSearch(
  query: string,
  filters: AdvancedFilters,
  options: { limit?: number; offset?: number } = {},
) {
  const searchQuery = buildQueryString(filters, query)
  const params = new URLSearchParams({
    q: searchQuery,
    limit: String(options.limit || 20),
    offset: String(options.offset || 0),
  })

  const response = await fetch(`/api/search?${params.toString()}`)
  if (!response.ok) throw new Error(`Search failed: ${response.statusText}`)

  return response.json()
}

/**
 * Get search suggestions for current filter state
 */
export async function getAdvancedSearchSuggestions(
  partialQuery: string,
  filters: AdvancedFilters,
): Promise<string[]> {
  try {
    const searchQuery = buildQueryString(filters, partialQuery)
    const response = await fetch(
      `/api/search/suggestions?q=${encodeURIComponent(searchQuery)}&limit=5`,
    )
    if (!response.ok) return []
    const data = await response.json()
    return data.suggestions || []
  } catch {
    return []
  }
}
