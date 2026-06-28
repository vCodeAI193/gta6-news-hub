import React, { useEffect, useState } from 'react'
import { useI18n } from '../i18n/I18nContext'

interface VideoSegment {
  id: string
  videoId: string
  articleId: string
  videoUrl: string
  startTime: number
  endTime: number
  text: string
  keywords: string[]
  videoDuration: number
}

interface VideoSearchProps {
  query: string
  onSegmentSelect?: (segment: VideoSegment) => void
  limit?: number
}

/**
 * Format time in seconds to HH:MM:SS
 */
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return [h, m, s].map((v) => String(v).padStart(2, '0')).filter((_, i) => i > 0 || h > 0).join(':')
}

/**
 * Highlight search query in text
 */
function highlightText(text: string, query: string): JSX.Element {
  if (!query || query.length < 2) return <>{text}</>

  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i}>{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

/**
 * Component for searching within video content and jumping to timestamps
 */
export function VideoSearchResults({ query, onSegmentSelect, limit = 10 }: VideoSearchProps) {
  const { t } = useI18n()
  const [results, setResults] = useState<VideoSegment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([])
      return
    }

    const searchVideos = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`/api/search/videos?query=${encodeURIComponent(query)}&limit=${limit}`, {
          headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) throw new Error(`Search failed: ${response.statusText}`)

        const data = await response.json()
        setResults(data.segments || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Video search failed')
        console.error('Video search error:', err)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchVideos, 300)
    return () => clearTimeout(debounceTimer)
  }, [query, limit])

  if (loading) {
    return (
      <div className="video-search-results" role="status">
        <div className="video-search-results__loading">{t('common.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="video-search-results video-search-results--error" role="alert">
        {error}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="video-search-results video-search-results--empty">
        {query ? t('search.noResultsFound') || 'No video segments found' : t('search.enterQuery') || 'Enter a search term'}
      </div>
    )
  }

  return (
    <div className="video-search-results">
      <h3 className="video-search-results__title">{t('search.videoResults') || 'Video Results'}</h3>
      <ul className="video-search-results__list">
        {results.map((segment) => (
          <li key={segment.id} className="video-search-result">
            <button
              type="button"
              className="video-search-result__button"
              onClick={() => onSegmentSelect?.(segment)}
              title={`Jump to ${formatTime(segment.startTime)}`}
            >
              <div className="video-search-result__timestamp">
                <span className="video-search-result__time">{formatTime(segment.startTime)}</span>
                <span className="video-search-result__duration">/{formatTime(segment.videoDuration)}</span>
              </div>

              <div className="video-search-result__content">
                <p className="video-search-result__text">{highlightText(segment.text, query)}</p>

                {segment.keywords.length > 0 && (
                  <div className="video-search-result__keywords">
                    {segment.keywords.slice(0, 3).map((keyword) => (
                      <span key={keyword} className="video-search-result__keyword">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="video-search-result__range">
                <span className="video-search-result__range-label">
                  {formatTime(segment.endTime - segment.startTime)}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Video player component with integrated search
 */
export function VideoPlayer({ videoUrl, onTimeUpdate }: { videoUrl: string; onTimeUpdate?: (time: number) => void }) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [query, setQuery] = useState('')

  const handleSegmentSelect = (segment: VideoSegment) => {
    if (videoRef.current) {
      videoRef.current.currentTime = segment.startTime
      videoRef.current.play()
      onTimeUpdate?.(segment.startTime)
    }
  }

  return (
    <div className="video-player">
      <video ref={videoRef} src={videoUrl} controls width="100%">
        <track kind="captions" srcLang="en" label="English" />
      </video>

      <div className="video-player__search">
        <input
          type="search"
          placeholder="Search within video..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="video-player__search-input"
        />
        <VideoSearchResults query={query} onSegmentSelect={handleSegmentSelect} limit={5} />
      </div>
    </div>
  )
}
