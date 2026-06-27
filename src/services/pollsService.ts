import { readJSON, writeJSON } from './storage'

export interface Poll {
  id: string
  question: string
  options: string[]
}

/** Community-Umfragen (statisch definiert, Stimmen lokal gespeichert). */
export const polls: Poll[] = [
  {
    id: 'platform',
    question: 'Auf welcher Plattform spielst du GTA 6 zuerst?',
    options: ['PlayStation 5', 'Xbox Series X|S', 'PC (später)'],
  },
  {
    id: 'hype',
    question: 'Wie hoch ist dein Hype-Level?',
    options: ['Maximal 🔥', 'Hoch', 'Abwartend'],
  },
]

interface PollState {
  counts: Record<string, Record<string, number>>
  mine: Record<string, string>
}

const KEY = 'polls'

function load(): PollState {
  return readJSON<PollState>(KEY, { counts: {}, mine: {} })
}

export function getPollResults(pollId: string): Record<string, number> {
  return load().counts[pollId] ?? {}
}

export function getMyPollChoice(pollId: string): string | undefined {
  return load().mine[pollId]
}

export function votePoll(pollId: string, option: string): PollState {
  const state = load()
  const counts = { ...(state.counts[pollId] ?? {}) }
  const previous = state.mine[pollId]
  if (previous === option) return state // bereits gewählt
  if (previous) counts[previous] = Math.max(0, (counts[previous] ?? 1) - 1)
  counts[option] = (counts[option] ?? 0) + 1
  state.counts[pollId] = counts
  state.mine[pollId] = option
  writeJSON(KEY, state)
  return state
}
