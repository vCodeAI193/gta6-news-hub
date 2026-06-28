import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/I18nContext'

interface TrendData {
  query: string
  searchCount: number
  uniqueUsers: number
}

interface TrendTimeSeries {
  timestamps: string[]
  series: Array<{ name: string; data: number[] }>
}

interface SearchTrendsChartProps {
  days?: number
  limit?: number
  refreshInterval?: number
}

/**
 * Simple bar chart component for trends
 */
function TrendBarChart({ trends }: { trends: TrendData[] }) {
  if (trends.length === 0) return <div className="trends-chart__empty">No trend data available</div>

  const maxCount = Math.max(...trends.map((t) => t.searchCount))

  return (
    <div className="trends-chart__bars">
      {trends.map((trend) => (
        <div key={trend.query} className="trend-bar">
          <div className="trend-bar__label">{trend.query}</div>
          <div className="trend-bar__graph">
            <div
              className="trend-bar__fill"
              style={{
                width: `${(trend.searchCount / maxCount) * 100}%`,
              }}
              title={`${trend.searchCount} searches by ${trend.uniqueUsers} users`}
            />
          </div>
          <div className="trend-bar__value">
            {trend.searchCount}
            <span className="trend-bar__users">({trend.uniqueUsers})</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Line chart for trend time series
 */
function TrendLineChart({ data }: { data: TrendTimeSeries }) {
  if (data.series.length === 0 || data.timestamps.length === 0) {
    return <div className="trends-chart__empty">No time series data</div>
  }

  // Find max value for scaling
  const allValues = data.series.flatMap((s) => s.data)
  const maxValue = Math.max(...allValues, 1)

  // Simple SVG line chart
  const width = 600
  const height = 300
  const padding = 40
  const pointSpacing = (width - padding * 2) / (data.timestamps.length - 1 || 1)
  const yScale = (height - padding * 2) / maxValue

  const colors = ['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24']

  return (
    <div className="trends-chart__svg-container">
      <svg width={width} height={height} className="trends-chart__svg">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = height - padding - fraction * (height - padding * 2)
          return (
            <line
              key={`grid-${fraction}`}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          )
        })}

        {/* Series */}
        {data.series.map((series, seriesIdx) => {
          const points = series.data
            .map((value, idx) => {
              const x = padding + idx * pointSpacing
              const y = height - padding - value * yScale
              return `${x},${y}`
            })
            .join(' ')

          return (
            <g key={series.name}>
              <polyline points={points} fill="none" stroke={colors[seriesIdx % colors.length]} strokeWidth="2" />
              {series.data.map((value, idx) => {
                const x = padding + idx * pointSpacing
                const y = height - padding - value * yScale
                return (
                  <circle
                    key={`point-${idx}`}
                    cx={x}
                    cy={y}
                    r="3"
                    fill={colors[seriesIdx % colors.length]}
                    opacity={value > 0 ? 1 : 0.3}
                  />
                )
              })}
            </g>
          )
        })}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = height - padding - fraction * (height - padding * 2)
          const value = Math.round(fraction * maxValue)
          return (
            <text key={`y-label-${fraction}`} x={padding - 10} y={y + 4} textAnchor="end" fontSize="12">
              {value}
            </text>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="trends-chart__legend">
        {data.series.map((series, idx) => (
          <div key={series.name} className="trends-chart__legend-item">
            <span className="trends-chart__legend-color" style={{ backgroundColor: colors[idx % colors.length] }} />
            {series.name}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Component for displaying search trends
 */
export function SearchTrendsChart({ days = 7, limit = 10, refreshInterval = 300000 }: SearchTrendsChartProps) {
  const { t } = useI18n()
  const [trends, setTrends] = useState<TrendData[]>([])
  const [timeSeries, setTimeSeries] = useState<TrendTimeSeries>({ timestamps: [], series: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'top' | 'timeseries'>('top')

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true)
      setError('')

      try {
        // Fetch top trends
        const topResponse = await fetch(`/api/search/trends/top?days=${days}&limit=${limit}`)
        if (!topResponse.ok) throw new Error('Failed to fetch trends')
        const topData = await topResponse.json()
        setTrends(topData.trends || [])

        // Fetch time series
        const seriesResponse = await fetch(`/api/search/trends/timeseries?days=${days}&topN=${Math.min(limit, 5)}`)
        if (!seriesResponse.ok) throw new Error('Failed to fetch time series')
        const seriesData = await seriesResponse.json()
        setTimeSeries(seriesData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trends')
        console.error('Trends fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTrends()
    const interval = setInterval(fetchTrends, refreshInterval)
    return () => clearInterval(interval)
  }, [days, limit, refreshInterval])

  if (loading && trends.length === 0) {
    return <div className="trends-chart trends-chart--loading">{t('common.loading')}</div>
  }

  return (
    <div className="trends-chart">
      <div className="trends-chart__header">
        <h2 className="trends-chart__title">{t('search.trends') || 'Search Trends'}</h2>
        <div className="trends-chart__tabs">
          <button
            type="button"
            className={`trends-chart__tab ${activeTab === 'top' ? 'trends-chart__tab--active' : ''}`}
            onClick={() => setActiveTab('top')}
          >
            {t('search.topSearches') || 'Top Searches'}
          </button>
          <button
            type="button"
            className={`trends-chart__tab ${activeTab === 'timeseries' ? 'trends-chart__tab--active' : ''}`}
            onClick={() => setActiveTab('timeseries')}
          >
            {t('search.over') || 'Over Time'}
          </button>
        </div>
      </div>

      {error && <div className="trends-chart__error" role="alert">{error}</div>}

      {activeTab === 'top' && <TrendBarChart trends={trends} />}
      {activeTab === 'timeseries' && <TrendLineChart data={timeSeries} />}

      {!loading && trends.length === 0 && !error && (
        <div className="trends-chart__empty">{t('search.noData') || 'No trend data available'}</div>
      )}
    </div>
  )
}

/**
 * Trend velocity indicator (up/down/stable)
 */
export function TrendVelocityBadge({
  query,
  onVelocityLoad,
}: {
  query: string
  onVelocityLoad?: (velocity: number) => void
}) {
  const [velocity, setVelocity] = useState<{ percent: number; trending: 'up' | 'down' | 'stable' } | null>(null)

  useEffect(() => {
    if (!query) return

    const fetchVelocity = async () => {
      try {
        const response = await fetch(`/api/search/trends/velocity?query=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setVelocity(data)
          onVelocityLoad?.(data.percent)
        }
      } catch (err) {
        console.error('Failed to fetch trend velocity:', err)
      }
    }

    fetchVelocity()
  }, [query, onVelocityLoad])

  if (!velocity) return null

  const icon = velocity.trending === 'up' ? '📈' : velocity.trending === 'down' ? '📉' : '➡️'
  const label = `${icon} ${Math.abs(velocity.percent)}%`

  return (
    <span className={`trend-velocity trend-velocity--${velocity.trending}`} title={`Trending ${velocity.trending}`}>
      {label}
    </span>
  )
}
