import { useEffect, useState } from 'react'
import { REACTIONS, type ReactionEmoji } from '../services/reactionsService'
import { loadReactions, toggleReaction } from '../services/engagementRepo'
import { isApiEnabled, ApiError } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export function ReactionBar({ articleId }: { articleId: string }) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [mine, setMine] = useState<ReactionEmoji | undefined>()
  const { user } = useAuth()
  const { notify } = useToast()

  useEffect(() => {
    let active = true
    loadReactions(articleId).then((s) => {
      if (!active) return
      setCounts(s.counts)
      setMine(s.mine)
    })
    return () => {
      active = false
    }
  }, [articleId])

  const handle = async (emoji: ReactionEmoji) => {
    if (isApiEnabled() && !user) {
      notify('Bitte melde dich an, um zu reagieren.', 'info')
      return
    }
    try {
      const s = await toggleReaction(articleId, emoji)
      setCounts(s.counts)
      setMine(s.mine)
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Aktion fehlgeschlagen', 'error')
    }
  }

  return (
    <div className="reactions" role="group" aria-label="Reaktionen">
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className={`reaction${mine === emoji ? ' reaction--active' : ''}`}
          aria-pressed={mine === emoji}
          onClick={() => handle(emoji)}
        >
          <span aria-hidden="true">{emoji}</span>
          <span className="reaction__count">{counts[emoji] ?? 0}</span>
        </button>
      ))}
    </div>
  )
}
