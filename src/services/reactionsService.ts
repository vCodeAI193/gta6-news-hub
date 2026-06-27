import { readJSON, writeJSON } from './storage'

/** Verfügbare Reaktions-Emojis. */
export const REACTIONS = ['👍', '🔥', '😮', '😂', '😢'] as const
export type ReactionEmoji = (typeof REACTIONS)[number]

type Counts = Record<string, number>
interface ReactionState {
  /** articleId -> emoji -> count */
  counts: Record<string, Counts>
  /** articleId -> vom Nutzer gewähltes Emoji */
  mine: Record<string, ReactionEmoji>
}

const KEY = 'reactions'

function load(): ReactionState {
  return readJSON<ReactionState>(KEY, { counts: {}, mine: {} })
}

export function getReactions(articleId: string): Counts {
  return load().counts[articleId] ?? {}
}

export function getMyReaction(articleId: string): ReactionEmoji | undefined {
  return load().mine[articleId]
}

/** Toggle: gleiche Reaktion entfernt sie, andere wechselt. */
export function toggleReaction(
  articleId: string,
  emoji: ReactionEmoji,
): ReactionState {
  const state = load()
  const counts = { ...(state.counts[articleId] ?? {}) }
  const previous = state.mine[articleId]

  if (previous === emoji) {
    counts[emoji] = Math.max(0, (counts[emoji] ?? 1) - 1)
    delete state.mine[articleId]
  } else {
    if (previous) counts[previous] = Math.max(0, (counts[previous] ?? 1) - 1)
    counts[emoji] = (counts[emoji] ?? 0) + 1
    state.mine[articleId] = emoji
  }

  state.counts[articleId] = counts
  writeJSON(KEY, state)
  return state
}
