import { useState, useCallback } from 'react'
import { useI18n } from '../i18n/I18nContext'

interface AdvancedFilters {
  authors: string[]
  dateFrom?: string
  dateTo?: string
  categories: string[]
  reliability: string[]
  tags: string[]
}

interface AdvancedSearchFormProps {
  onSearch: (query: string, filters: AdvancedFilters) => void
  initialQuery?: string
  initialFilters?: AdvancedFilters
}

const CATEGORIES = ['all', 'trailer', 'leak', 'official', 'release', 'rumor']
const RELIABILITY_OPTIONS = ['confirmed', 'rumor', 'unconfirmed']

/**
 * Component for advanced search with metadata filters
 */
export function AdvancedSearchForm({ onSearch, initialQuery = '', initialFilters }: AdvancedSearchFormProps) {
  const { t } = useI18n()
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState<AdvancedFilters>(
    initialFilters || {
      authors: [],
      dateFrom: undefined,
      dateTo: undefined,
      categories: [],
      reliability: [],
      tags: [],
    },
  )
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query, filters)
  }

  const handleAuthorAdd = useCallback(() => {
    const input = prompt('Enter author name:')
    if (input?.trim()) {
      setFilters((prev) => ({
        ...prev,
        authors: [...new Set([...prev.authors, input.trim()])],
      }))
    }
  }, [])

  const handleAuthorRemove = (author: string) => {
    setFilters((prev) => ({
      ...prev,
      authors: prev.authors.filter((a) => a !== author),
    }))
  }

  const handleCategoryToggle = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }))
  }

  const handleReliabilityToggle = (rel: string) => {
    setFilters((prev) => ({
      ...prev,
      reliability: prev.reliability.includes(rel)
        ? prev.reliability.filter((r) => r !== rel)
        : [...prev.reliability, rel],
    }))
  }

  const handleTagAdd = useCallback(() => {
    const input = prompt('Enter tags (comma-separated):')
    if (input?.trim()) {
      const newTags = input.split(',').map((t) => t.trim().toLowerCase())
      setFilters((prev) => ({
        ...prev,
        tags: [...new Set([...prev.tags, ...newTags])],
      }))
    }
  }, [])

  const handleTagRemove = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const buildQueryString = () => {
    const parts: string[] = []

    if (query.trim()) {
      parts.push(query.trim())
    }

    filters.authors.forEach((a) => {
      parts.push(`author:"${a}"`)
    })

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

    filters.categories.forEach((c) => {
      parts.push(`category:${c}`)
    })

    filters.reliability.forEach((r) => {
      parts.push(`reliability:${r}`)
    })

    if (filters.tags.length > 0) {
      parts.push(`tags:${filters.tags.join(',')}`)
    }

    return parts.join(' ')
  }

  const hasFilters = filters.authors.length > 0 || filters.dateFrom || filters.dateTo || filters.categories.length > 0 ||
    filters.reliability.length > 0 || filters.tags.length > 0

  return (
    <form className="advanced-search-form" onSubmit={handleSubmit}>
      <div className="advanced-search-form__main">
        <input
          type="search"
          className="advanced-search-form__input"
          placeholder={t('search.placeholder') || 'Search articles...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search query"
        />
        <button type="submit" className="advanced-search-form__submit" aria-label="Search">
          {t('common.search') || 'Search'}
        </button>
        <button
          type="button"
          className={`advanced-search-form__toggle ${showAdvanced ? 'advanced-search-form__toggle--active' : ''}`}
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-label="Toggle advanced search"
          aria-expanded={showAdvanced}
        >
          ⚙️ {t('search.advanced') || 'Advanced'}
          {hasFilters && <span className="advanced-search-form__filter-count">{Object.values(filters).flat().length}</span>}
        </button>
      </div>

      {showAdvanced && (
        <div className="advanced-search-form__panel" role="region" aria-label="Advanced filters">
          {/* Authors */}
          <div className="advanced-search-form__section">
            <h3 className="advanced-search-form__section-title">{t('search.author') || 'Author'}</h3>
            <div className="advanced-search-form__chips">
              {filters.authors.map((author) => (
                <div key={author} className="advanced-search-form__chip">
                  {author}
                  <button
                    type="button"
                    onClick={() => handleAuthorRemove(author)}
                    className="advanced-search-form__chip-remove"
                    aria-label={`Remove ${author}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAuthorAdd}
                className="advanced-search-form__add-btn"
              >
                + Add Author
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div className="advanced-search-form__section">
            <h3 className="advanced-search-form__section-title">{t('search.dateRange') || 'Date Range'}</h3>
            <div className="advanced-search-form__date-range">
              <label>
                <span className="advanced-search-form__label">{t('search.from') || 'From'}:</span>
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value || undefined }))}
                  className="advanced-search-form__date-input"
                />
              </label>
              <label>
                <span className="advanced-search-form__label">{t('search.to') || 'To'}:</span>
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value || undefined }))}
                  className="advanced-search-form__date-input"
                />
              </label>
            </div>
          </div>

          {/* Categories */}
          <div className="advanced-search-form__section">
            <h3 className="advanced-search-form__section-title">{t('search.category') || 'Category'}</h3>
            <div className="advanced-search-form__checkboxes">
              {CATEGORIES.map((cat) => (
                <label key={cat} className="advanced-search-form__checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(cat)}
                    onChange={() => handleCategoryToggle(cat)}
                    className="advanced-search-form__checkbox"
                  />
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Reliability */}
          <div className="advanced-search-form__section">
            <h3 className="advanced-search-form__section-title">{t('search.reliability') || 'Reliability'}</h3>
            <div className="advanced-search-form__checkboxes">
              {RELIABILITY_OPTIONS.map((rel) => (
                <label key={rel} className="advanced-search-form__checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.reliability.includes(rel)}
                    onChange={() => handleReliabilityToggle(rel)}
                    className="advanced-search-form__checkbox"
                  />
                  {rel.charAt(0).toUpperCase() + rel.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="advanced-search-form__section">
            <h3 className="advanced-search-form__section-title">{t('search.tags') || 'Tags'}</h3>
            <div className="advanced-search-form__chips">
              {filters.tags.map((tag) => (
                <div key={tag} className="advanced-search-form__chip">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleTagRemove(tag)}
                    className="advanced-search-form__chip-remove"
                    aria-label={`Remove ${tag}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleTagAdd}
                className="advanced-search-form__add-btn"
              >
                + Add Tag
              </button>
            </div>
          </div>

          {/* Query Preview */}
          {hasFilters && (
            <div className="advanced-search-form__section">
              <h3 className="advanced-search-form__section-title">{t('search.query') || 'Query'}</h3>
              <div className="advanced-search-form__query-preview">
                <code>{buildQueryString()}</code>
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {hasFilters && (
            <button
              type="button"
              onClick={() =>
                setFilters({
                  authors: [],
                  dateFrom: undefined,
                  dateTo: undefined,
                  categories: [],
                  reliability: [],
                  tags: [],
                })
              }
              className="advanced-search-form__clear-btn"
            >
              {t('common.clear') || 'Clear Filters'}
            </button>
          )}
        </div>
      )}
    </form>
  )
}
