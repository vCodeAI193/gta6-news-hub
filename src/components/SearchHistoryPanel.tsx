import { useState, useEffect, useCallback } from 'react'
import { searchHistoryService, type SearchHistoryEntry } from '../services/searchHistoryService'

interface Props {
  userId: string
  onSelectSearch?: (query: string) => void
}

export function SearchHistoryPanel({ userId, onSelectSearch }: Props) {
  const [history, setHistory] = useState<SearchHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const loadHistory = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await searchHistoryService.getAllSearchHistory(userId, currentPage, 20)
      setHistory(result.entries)
      setTotalCount(result.total)
    } catch (error) {
      console.error('Failed to load search history:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, currentPage])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleClearHistory = async () => {
    if (window.confirm('Clear all search history?')) {
      try {
        await searchHistoryService.clearAllSearchHistory(userId)
        setHistory([])
        setTotalCount(0)
      } catch (error) {
        console.error('Failed to clear history:', error)
      }
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    try {
      await searchHistoryService.removeSearchEntry(entryId)
      setHistory(history.filter(h => h.id !== entryId))
      setTotalCount(totalCount - 1)
    } catch (error) {
      console.error('Failed to delete entry:', error)
    }
  }

  const handleSelectSearch = (query: string) => {
    onSelectSearch?.(query)
  }

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const pageSize = 20
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="search-history-panel">
      <div className="search-history-panel__header">
        <h3 className="search-history-panel__title">Search History</h3>
        {totalCount > 0 && (
          <button
            onClick={handleClearHistory}
            className="btn btn--sm btn--ghost"
            title="Clear all search history"
          >
            Clear All
          </button>
        )}
      </div>

      {totalCount === 0 && !isLoading && (
        <p className="search-history-panel__empty">No search history yet</p>
      )}

      {isLoading && (
        <div className="search-history-panel__loading">Loading...</div>
      )}

      {history.length > 0 && (
        <>
          <div className="search-history-panel__list">
            {history.map(entry => (
              <div key={entry.id} className="search-history-panel__item">
                <button
                  onClick={() => handleSelectSearch(entry.query)}
                  className="search-history-panel__query"
                  title={`${entry.resultsCount} results`}
                >
                  {entry.query}
                </button>
                <span className="search-history-panel__meta">
                  {entry.resultsCount} results
                </span>
                <span className="search-history-panel__time">
                  {formatTime(entry.timestamp)}
                </span>
                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="search-history-panel__delete"
                  title="Delete this search"
                  aria-label="Delete"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="search-history-panel__pagination">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="btn btn--sm btn--ghost"
              >
                ← Previous
              </button>
              <span className="search-history-panel__page-info">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
                className="btn btn--sm btn--ghost"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .search-history-panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background: var(--surface);
          border-radius: 8px;
        }

        .search-history-panel__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .search-history-panel__title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .search-history-panel__empty {
          text-align: center;
          color: var(--text-muted);
          padding: 1rem 0;
          margin: 0;
        }

        .search-history-panel__loading {
          text-align: center;
          color: var(--text-muted);
          padding: 1rem 0;
        }

        .search-history-panel__list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .search-history-panel__item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--background);
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .search-history-panel__query {
          flex: 1;
          background: none;
          border: none;
          color: var(--primary-color);
          cursor: pointer;
          text-align: left;
          font-weight: 500;
          padding: 0;
        }

        .search-history-panel__query:hover {
          text-decoration: underline;
        }

        .search-history-panel__meta {
          color: var(--text-muted);
          font-size: 0.75rem;
        }

        .search-history-panel__time {
          color: var(--text-muted);
          font-size: 0.75rem;
          white-space: nowrap;
        }

        .search-history-panel__delete {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-history-panel__delete:hover {
          color: var(--error-color);
        }

        .search-history-panel__pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .search-history-panel__page-info {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  )
}
