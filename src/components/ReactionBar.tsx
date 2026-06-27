import { useState } from 'react'
import {
  getMyReaction,
  getReactions,
  REACTIONS,
  toggleReaction,
  type ReactionEmoji,
} from '../services/reactionsService'

export function ReactionBar({ articleId }: { articleId: string }) {
  const [counts, setCounts] = useState(() => getReactions(articleId))
  const [mine, setMine] = useState<ReactionEmoji | undefined>(() => getMyReaction(articleId))

  const handle = (emoji: ReactionEmoji) => {
    const state = toggleReaction(articleId, emoji)
    setCounts({ ...(state.counts[articleId] ?? {}) })
    setMine(state.mine[articleId])
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
