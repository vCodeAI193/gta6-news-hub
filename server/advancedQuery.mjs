/**
 * Feature 4: Advanced query syntax parser for metadata (author, date, rating).
 *
 * Parses advanced search syntax like:
 * - author:"John Smith"
 * - date:>2026-05-01
 * - rating:>=4
 * - category:leak
 * - Combined with basic text search
 */

/**
 * Parse advanced query syntax
 * Supported formats:
 * - author:"name" | author:name
 * - date:>YYYY-MM-DD | date:<YYYY-MM-DD | date:YYYY-MM-DD..YYYY-MM-DD
 * - rating:>=N | rating:<=N | rating:N
 * - category:name
 * - reliability:confirmed|rumor|unconfirmed
 * - tags:tag1,tag2
 * - text search (implicit)
 */
export function parseAdvancedQuery(input) {
  const query = String(input || '').trim()
  const filters = {
    authors: [],
    dateFrom: null,
    dateTo: null,
    ratingMin: null,
    ratingMax: null,
    categories: [],
    reliability: [],
    tags: [],
    textTerms: [],
  }

  // Regex patterns for metadata
  const authorPattern = /author:"([^"]+)"|author:([^\s]+)/gi
  const datePattern = /date:(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})|date:(>=?|<=?)?(\d{4}-\d{2}-\d{2})/gi
  const ratingPattern = /rating:(>=?|<=?)?(\d+(?:\.\d+)?)/gi
  const categoryPattern = /category:([^\s]+)/gi
  const reliabilityPattern = /reliability:(confirmed|rumor|unconfirmed)/gi
  const tagsPattern = /tags:([^\s]+)/gi

  let processedQuery = query

  // Extract authors
  let match
  while ((match = authorPattern.exec(query)) !== null) {
    const author = match[1] || match[2]
    if (author && !filters.authors.includes(author)) {
      filters.authors.push(author)
    }
    processedQuery = processedQuery.replace(match[0], '')
  }

  // Extract date filters
  datePattern.lastIndex = 0
  while ((match = datePattern.exec(query)) !== null) {
    // Pattern: date:YYYY-MM-DD..YYYY-MM-DD|date:(>=?|<=?)?YYYY-MM-DD
    const rangeFrom = match[1]
    const rangeTo = match[2]
    const operator = match[3] || '='
    const singleDate = match[4]

    if (rangeFrom && rangeTo) {
      filters.dateFrom = rangeFrom
      filters.dateTo = rangeTo
    } else if (singleDate) {
      if (operator === '>' || operator === '>=') {
        filters.dateFrom = singleDate
      } else if (operator === '<' || operator === '<=') {
        filters.dateTo = singleDate
      } else {
        filters.dateFrom = singleDate
        filters.dateTo = singleDate
      }
    }
    processedQuery = processedQuery.replace(match[0], '')
  }

  // Extract rating filters
  ratingPattern.lastIndex = 0
  while ((match = ratingPattern.exec(query)) !== null) {
    const operator = match[1] || '='
    const rating = parseFloat(match[2])

    if (operator === '>=' || operator === '=') {
      filters.ratingMin = Math.max(filters.ratingMin || 0, rating)
    }
    if (operator === '<=' || operator === '=') {
      filters.ratingMax = Math.min(filters.ratingMax || 5, rating)
    }
    if (operator === '>') {
      filters.ratingMin = Math.max(filters.ratingMin || 0, rating + 0.1)
    }
    if (operator === '<') {
      filters.ratingMax = Math.min(filters.ratingMax || 5, rating - 0.1)
    }

    processedQuery = processedQuery.replace(match[0], '')
  }

  // Extract categories
  categoryPattern.lastIndex = 0
  while ((match = categoryPattern.exec(query)) !== null) {
    const cat = match[1].toLowerCase()
    if (!filters.categories.includes(cat)) {
      filters.categories.push(cat)
    }
    processedQuery = processedQuery.replace(match[0], '')
  }

  // Extract reliability
  reliabilityPattern.lastIndex = 0
  while ((match = reliabilityPattern.exec(query)) !== null) {
    const rel = match[1]
    if (!filters.reliability.includes(rel)) {
      filters.reliability.push(rel)
    }
    processedQuery = processedQuery.replace(match[0], '')
  }

  // Extract tags
  tagsPattern.lastIndex = 0
  while ((match = tagsPattern.exec(query)) !== null) {
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
 * Build a filter predicate function from parsed filters
 */
export function buildFilterPredicate(filters) {
  return (article) => {
    // Author filter
    if (filters.authors.length > 0) {
      const articleAuthor = (article.author || '').toLowerCase()
      const matches = filters.authors.some((a) => articleAuthor.includes(a.toLowerCase()))
      if (!matches) return false
    }

    // Date range filter
    const articleDate = article.date
    if (filters.dateFrom && articleDate < filters.dateFrom) return false
    if (filters.dateTo && articleDate > filters.dateTo) return false

    // Category filter
    if (filters.categories.length > 0) {
      if (!filters.categories.includes(article.category)) return false
    }

    // Reliability filter
    if (filters.reliability.length > 0) {
      if (!filters.reliability.includes(article.reliability)) return false
    }

    // Tags filter (article must have at least one matching tag)
    if (filters.tags.length > 0) {
      const articleTags = (article.tags || []).map((t) => t.toLowerCase())
      const hasTag = filters.tags.some((t) => articleTags.includes(t))
      if (!hasTag) return false
    }

    // Text search across title, body, excerpt
    if (filters.textTerms.length > 0) {
      const searchText = `${article.title} ${article.excerpt || ''} ${article.body || ''}`.toLowerCase()
      const allTermsFound = filters.textTerms.every((term) => searchText.includes(term.toLowerCase()))
      if (!allTermsFound) return false
    }

    return true
  }
}

/**
 * Escape special characters in search terms
 */
export function escapeSearchTerm(term) {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Format filter description for UI
 */
export function formatFilterDescription(filters) {
  const parts = []

  if (filters.authors.length > 0) {
    parts.push(`Autor: ${filters.authors.join(', ')}`)
  }

  if (filters.dateFrom || filters.dateTo) {
    if (filters.dateFrom === filters.dateTo) {
      parts.push(`Datum: ${filters.dateFrom}`)
    } else {
      parts.push(`Zeitraum: ${filters.dateFrom || '∞'} bis ${filters.dateTo || 'heute'}`)
    }
  }

  if (filters.categories.length > 0) {
    parts.push(`Kategorien: ${filters.categories.join(', ')}`)
  }

  if (filters.reliability.length > 0) {
    parts.push(`Zuverlässigkeit: ${filters.reliability.join(', ')}`)
  }

  if (filters.tags.length > 0) {
    parts.push(`Tags: ${filters.tags.join(', ')}`)
  }

  return parts.join(' | ')
}

/**
 * Build search query string from filters for URL/API
 */
export function buildQueryString(filters, textQuery = '') {
  const parts = []

  if (textQuery) {
    parts.push(textQuery)
  }

  if (filters.authors.length > 0) {
    filters.authors.forEach((a) => {
      parts.push(`author:"${a}"`)
    })
  }

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

  if (filters.categories.length > 0) {
    filters.categories.forEach((c) => {
      parts.push(`category:${c}`)
    })
  }

  if (filters.reliability.length > 0) {
    filters.reliability.forEach((r) => {
      parts.push(`reliability:${r}`)
    })
  }

  if (filters.tags.length > 0) {
    parts.push(`tags:${filters.tags.join(',')}`)
  }

  return parts.join(' ')
}
