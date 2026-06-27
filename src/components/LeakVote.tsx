import { useState } from 'react'
import { castVote, getMyVote, getVotes, type Vote } from '../services/votesService'
import { useI18n } from '../i18n/I18nContext'

/** Glaubwürdigkeits-Voting, nur für Leak-Artikel sinnvoll. */
export function LeakVote({ articleId }: { articleId: string }) {
  const { t } = useI18n()
  const [counts, setCounts] = useState(() => getVotes(articleId))
  const [mine, setMine] = useState<Vote | undefined>(() => getMyVote(articleId))

  const total = counts.credible + counts.fake
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100))

  const handle = (vote: Vote) => {
    const state = castVote(articleId, vote)
    setCounts({ ...(state.counts[articleId] ?? { credible: 0, fake: 0 }) })
    setMine(state.mine[articleId])
  }

  return (
    <div className="leakvote">
      <p className="leakvote__q">{t('vote.question')}</p>
      <div className="leakvote__buttons">
        <button
          type="button"
          className={`btn btn--small${mine === 'credible' ? ' btn--active' : ' btn--ghost'}`}
          onClick={() => handle('credible')}
          aria-pressed={mine === 'credible'}
        >
          👍 {t('vote.credible')} · {pct(counts.credible)}%
        </button>
        <button
          type="button"
          className={`btn btn--small${mine === 'fake' ? ' btn--active' : ' btn--ghost'}`}
          onClick={() => handle('fake')}
          aria-pressed={mine === 'fake'}
        >
          👎 {t('vote.fake')} · {pct(counts.fake)}%
        </button>
      </div>
      <p className="leakvote__total">{total} Stimmen</p>
    </div>
  )
}
