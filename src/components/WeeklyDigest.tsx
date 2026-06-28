import { useMemo } from 'react'
import { getHistory } from '../services/readingHistoryService'
import { getGoal, getProgress } from '../services/readingGoalsService'
import { useArticles } from '../hooks/useArticles'
import type { CategoryId } from '../types'

const CATEGORY_LABELS: Record<CategoryId, string> = {
  official: 'Offiziell',
  trailer: 'Trailer',
  leak: 'Leak',
  release: 'Release',
}

function startOfWeek(ts: number): number {
  const d = new Date(ts)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff).getTime()
}

export function WeeklyDigest() {
  const { articles } = useArticles()
  const history = useMemo(() => getHistory(), [])
  const weeklyGoal = getGoal('weekly')

  const weekStart = startOfWeek(Date.now())
  const weekHistory = history.filter((e) => e.readAt >= weekStart)
  const weekProgress = getProgress('weekly', history)

  const mostReadCategory = useMemo<CategoryId | null>(() => {
    if (weekHistory.length === 0) return null
    const articleMap = new Map(articles.map((a) => [a.id, a]))
    const counts: Partial<Record<CategoryId, number>> = {}
    for (const entry of weekHistory) {
      const article = articleMap.get(entry.articleId)
      if (article) {
        counts[article.category] = (counts[article.category] ?? 0) + 1
      }
    }
    const sorted = (Object.entries(counts) as [CategoryId, number][]).sort((a, b) => b[1] - a[1])
    return sorted[0]?.[0] ?? null
  }, [articles, weekHistory])

  const goalPct = weeklyGoal > 0 ? Math.min(100, Math.round((weekProgress / weeklyGoal) * 100)) : 0
  const goalMet = weekProgress >= weeklyGoal

  if (weekHistory.length === 0) {
    return (
      <div className="digest-card">
        <h3 className="digest-card__title">📋 Wochenrückblick</h3>
        <p className="digest-card__empty">Diese Woche noch keine Artikel gelesen. Leg los!</p>
      </div>
    )
  }

  return (
    <div className="digest-card">
      <h3 className="digest-card__title">📋 Wochenrückblick</h3>
      <ul className="digest-card__stats">
        <li>
          <strong>{weekProgress}</strong> Artikel diese Woche gelesen
        </li>
        {mostReadCategory && (
          <li>
            Lieblingsbereich: <strong>{CATEGORY_LABELS[mostReadCategory]}</strong>
          </li>
        )}
        <li>
          Wochenziel: {goalMet ? '✅ erreicht!' : `${weekProgress} / ${weeklyGoal}`}
        </li>
      </ul>

      <div
        className="streak-card__bar"
        role="progressbar"
        aria-valuenow={goalPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Wöchentlicher Fortschritt"
      >
        <div className="streak-card__fill" style={{ width: `${goalPct}%` }} />
      </div>
    </div>
  )
}
