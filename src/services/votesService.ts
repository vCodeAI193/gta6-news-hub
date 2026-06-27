import { readJSON, writeJSON } from './storage'

/** Glaubwürdigkeits-Voting für Leaks. */
export type Vote = 'credible' | 'fake'

interface VoteState {
  counts: Record<string, { credible: number; fake: number }>
  mine: Record<string, Vote>
}

const KEY = 'votes'

function load(): VoteState {
  return readJSON<VoteState>(KEY, { counts: {}, mine: {} })
}

export function getVotes(articleId: string): { credible: number; fake: number } {
  return load().counts[articleId] ?? { credible: 0, fake: 0 }
}

export function getMyVote(articleId: string): Vote | undefined {
  return load().mine[articleId]
}

export function castVote(articleId: string, vote: Vote): VoteState {
  const state = load()
  const counts = { ...(state.counts[articleId] ?? { credible: 0, fake: 0 }) }
  const previous = state.mine[articleId]

  if (previous === vote) {
    counts[vote] = Math.max(0, counts[vote] - 1)
    delete state.mine[articleId]
  } else {
    if (previous) counts[previous] = Math.max(0, counts[previous] - 1)
    counts[vote] += 1
    state.mine[articleId] = vote
  }

  state.counts[articleId] = counts
  writeJSON(KEY, state)
  return state
}
