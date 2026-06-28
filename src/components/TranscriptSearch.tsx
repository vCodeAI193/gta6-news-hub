import { useState, useRef, useEffect } from 'react'
import { transcriptSearchEngine, type TranscriptSegment } from '../lib/media'

interface SearchResult {
  segment: TranscriptSegment
  score: number
  matchIndices: number[]
}

interface Props {
  segments: TranscriptSegment[]
  onTimestampClick?: (time: number) => void
}

export function TranscriptSearch({ segments, onTimestampClick }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout>()

  useEffect(() => {
    transcriptSearchEngine.buildIndex(segments)
  }, [segments])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    debounceTimer.current = setTimeout(() => {
      const searchResults = transcriptSearchEngine.search(searchQuery, segments)
      setResults(searchResults)
      setIsSearching(false)
    }, 300)
  }

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="transcript-search">
      <div className="transcript-search__input-wrapper">
        <input
          type="text"
          placeholder="Search transcript..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          className="transcript-search__input"
          aria-label="Search transcript"
        />
        {isSearching && <div className="transcript-search__loading">Searching...</div>}
      </div>

      {results.length > 0 && (
        <div className="transcript-search__results">
          <p className="transcript-search__count">
            Found {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
          <ul className="transcript-search__list">
            {results.map((result, idx) => (
              <li key={idx} className="transcript-search__result-item">
                <button
                  className="transcript-search__timestamp"
                  onClick={() => onTimestampClick?.(result.startTime)}
                  title="Click to jump to timestamp"
                >
                  {formatTime(result.startTime)}
                </button>
                <p
                  className="transcript-search__text"
                  dangerouslySetInnerHTML={{ __html: result.highlightedText }}
                />
                <span className="transcript-search__relevance">
                  Relevance: {(result.relevanceScore * 100).toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {query.trim() && results.length === 0 && !isSearching && (
        <p className="transcript-search__no-results">
          No results found for "{query}"
        </p>
      )}

      <style jsx>{`
        .transcript-search {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background: var(--surface);
          border-radius: 8px;
        }

        .transcript-search__input-wrapper {
          position: relative;
        }

        .transcript-search__input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid var(--border-color);
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .transcript-search__input:focus {
          outline: none;
          border-color: var(--primary-color);
        }

        .transcript-search__loading {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .transcript-search__results {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .transcript-search__count {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .transcript-search__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .transcript-search__result-item {
          padding: 0.75rem;
          background: var(--background);
          border-left: 3px solid var(--primary-color);
          border-radius: 4px;
        }

        .transcript-search__timestamp {
          background: none;
          border: none;
          color: var(--primary-color);
          cursor: pointer;
          font-weight: 600;
          padding: 0;
          font-size: 0.875rem;
          text-decoration: underline;
        }

        .transcript-search__timestamp:hover {
          opacity: 0.8;
        }

        .transcript-search__text {
          margin: 0.5rem 0 0;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .transcript-search__text mark {
          background: yellow;
          padding: 0 2px;
          border-radius: 2px;
          font-weight: 600;
        }

        .transcript-search__relevance {
          display: inline-block;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .transcript-search__no-results {
          text-align: center;
          color: var(--text-muted);
          padding: 1rem 0;
          margin: 0;
        }
      `}</style>
    </div>
  )
}
