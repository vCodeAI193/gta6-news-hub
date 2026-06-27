import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { isApiEnabled } from '../services/api'
import { communityApi, type Leader } from '../services/communityApi'

export function LeaderboardPage() {
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!isApiEnabled()) {
      setLoaded(true)
      return
    }
    communityApi.leaderboard().then(
      (l) => {
        setLeaders(l)
        setLoaded(true)
      },
      () => setLoaded(true),
    )
  }, [])

  const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`)

  return (
    <>
      <Seo title="Rangliste" path="/rangliste" />
      <header className="page-head">
        <h1 className="page-head__title">🏆 Community-Rangliste</h1>
        <p className="page-head__desc">Die aktivsten Mitglieder nach Reputation.</p>
      </header>

      {!isApiEnabled() ? (
        <div className="empty">
          <p className="empty__title">Backend erforderlich</p>
          <p>Die Rangliste ist nur mit laufendem Server verfügbar.</p>
        </div>
      ) : !loaded ? (
        <p className="comments__empty">Lade…</p>
      ) : leaders.length === 0 ? (
        <p className="comments__empty">Noch keine Mitglieder.</p>
      ) : (
        <ol className="leaderboard">
          {leaders.map((l) => (
            <li key={l.id}>
              <span className="leaderboard__rank">{medal(l.rank)}</span>
              <Link to={`/u/${l.id}`} className="leaderboard__name">
                {l.displayName}
              </Link>
              <span className="level-pill">{l.level}</span>
              <span className="leaderboard__count">{l.reputation} Rep</span>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}
