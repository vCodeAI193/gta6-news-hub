import { useEffect, useState } from 'react'
import { type Vote } from '../services/votesService'
import { castVote, loadVotes } from '../services/engagementRepo'
import { ApiError, isApiEnabled } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useI18n } from '../i18n/I18nContext'

/** Glaubwürdigkeits-Voting, nur für Leak-Artikel sinnvoll. */
export function LeakVote({ articleId }: { articleId: string }) {
  const { t } = useI18n()
  const { user } = useAuth()
  const { notify } = useToast()
  const [counts, setCounts] = useState({ credible: 0, fake: 0 })
  const [mine, setMine] = useState<Vote | undefined>()

  useEffect(() => {
    let active = true
    loadVotes(articleId).then((s) => {
      if (!active) return
      setCounts(s.counts)
      setMine(s.mine)
    })
    return () => {
      active = false
    }
  }, [articleId])

  const total = counts.credible + counts.fake
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100))

  const handle = async (vote: Vote) => {
    if (isApiEnabled() && !user) {
      notify('Bitte melde dich an, um abzustimmen.', 'info')
      return
    }
    try {
      const s = await castVote(articleId, vote)
      setCounts(s.counts)
      setMine(s.mine)
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Aktion fehlgeschlagen', 'error')
    }
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
