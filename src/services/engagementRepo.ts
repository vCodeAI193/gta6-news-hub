import { api, isApiEnabled } from './api'
import { readJSON, writeJSON } from './storage'
import * as reactions from './reactionsService'
import * as votes from './votesService'
import type { ReactionEmoji } from './reactionsService'
import type { Vote } from './votesService'

/**
 * Reaktionen & Leak-Votes gegen das echte Backend (Zähler serverseitig), wenn
 * konfiguriert — sonst lokal. Die eigene Auswahl („mine") wird im API-Modus
 * clientseitig gespiegelt, da die Zähler-Endpunkte anonym sind.
 */
function mineMap(kind: string): Record<string, string> {
  return readJSON<Record<string, string>>(`engage:${kind}Mine`, {})
}
function getMine(kind: string, articleId: string): string | undefined {
  return mineMap(kind)[articleId]
}
function setMine(kind: string, articleId: string, value: string | null): void {
  const map = mineMap(kind)
  if (value == null) delete map[articleId]
  else map[articleId] = value
  writeJSON(`engage:${kind}Mine`, map)
}

// ------------------------------------------------------------- Reaktionen
export interface ReactionState {
  counts: Record<string, number>
  mine?: ReactionEmoji
}

export async function loadReactions(articleId: string): Promise<ReactionState> {
  if (isApiEnabled()) {
    const { counts } = await api<{ counts: Record<string, number> }>(`/api/articles/${articleId}/reactions`)
    return { counts, mine: getMine('reaction', articleId) as ReactionEmoji | undefined }
  }
  return { counts: reactions.getReactions(articleId), mine: reactions.getMyReaction(articleId) }
}

export async function toggleReaction(articleId: string, emoji: ReactionEmoji): Promise<ReactionState> {
  if (isApiEnabled()) {
    const { counts } = await api<{ counts: Record<string, number> }>(`/api/articles/${articleId}/reactions`, {
      method: 'POST',
      body: { emoji },
    })
    const prev = getMine('reaction', articleId)
    setMine('reaction', articleId, prev === emoji ? null : emoji)
    return { counts, mine: getMine('reaction', articleId) as ReactionEmoji | undefined }
  }
  const state = reactions.toggleReaction(articleId, emoji)
  return { counts: state.counts[articleId] ?? {}, mine: state.mine[articleId] }
}

// ------------------------------------------------------------------ Votes
export interface VoteState {
  counts: { credible: number; fake: number }
  mine?: Vote
}

export async function loadVotes(articleId: string): Promise<VoteState> {
  if (isApiEnabled()) {
    const { counts } = await api<{ counts: { credible: number; fake: number } }>(
      `/api/articles/${articleId}/votes`,
    )
    return { counts, mine: getMine('vote', articleId) as Vote | undefined }
  }
  return { counts: votes.getVotes(articleId), mine: votes.getMyVote(articleId) }
}

export async function castVote(articleId: string, vote: Vote): Promise<VoteState> {
  if (isApiEnabled()) {
    const { counts } = await api<{ counts: { credible: number; fake: number } }>(`/api/articles/${articleId}/votes`, {
      method: 'POST',
      body: { vote },
    })
    const prev = getMine('vote', articleId)
    setMine('vote', articleId, prev === vote ? null : vote)
    return { counts, mine: getMine('vote', articleId) as Vote | undefined }
  }
  const state = votes.castVote(articleId, vote)
  return { counts: state.counts[articleId] ?? { credible: 0, fake: 0 }, mine: state.mine[articleId] }
}
