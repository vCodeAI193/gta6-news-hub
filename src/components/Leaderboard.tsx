import { useState } from 'react'
import { getLeaderboard } from '../services/gamificationService'

type Period = 'weekly' | 'monthly' | 'alltime'

const PERIOD_LABELS: Record<Period, string> = {
  weekly: 'Woche',
  monthly: 'Monat',
  alltime: 'Allzeit',
}

export function Leaderboard() {
  const [period, setPeriod] = useState<Period>('weekly')
  const entries = getLeaderboard(period)

  const medal = (rank: number) =>
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`

  return (
    <div className="leaderboard-widget">
      <div className="leaderboard-widget__tabs">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            className={`tab${period === p ? ' tab--active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      <ol className="leaderboard-widget__list">
        {entries.map((e) => (
          <li
            key={`${e.rank}-${e.name}`}
            className={`leaderboard-widget__entry${e.name === 'Du' ? ' leaderboard-widget__entry--me' : ''}`}
          >
            <span className="leaderboard-widget__rank">{medal(e.rank)}</span>
            <span className="leaderboard-widget__name">{e.name}</span>
            <span className="level-pill">Lvl {e.level}</span>
            <span className="leaderboard-widget__xp">{e.xp} XP</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
