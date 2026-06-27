import { useState } from 'react'
import {
  getMyPollChoice,
  getPollResults,
  votePoll,
  type Poll as PollType,
} from '../services/pollsService'

export function Poll({ poll }: { poll: PollType }) {
  const [results, setResults] = useState(() => getPollResults(poll.id))
  const [mine, setMine] = useState<string | undefined>(() => getMyPollChoice(poll.id))

  const total = Object.values(results).reduce((a, b) => a + b, 0)
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100))

  const vote = (option: string) => {
    const state = votePoll(poll.id, option)
    setResults({ ...(state.counts[poll.id] ?? {}) })
    setMine(state.mine[poll.id])
  }

  return (
    <div className="poll">
      <p className="poll__q">{poll.question}</p>
      <ul className="poll__options">
        {poll.options.map((option) => {
          const count = results[option] ?? 0
          const chosen = mine === option
          return (
            <li key={option}>
              <button
                type="button"
                className={`poll__option${chosen ? ' poll__option--mine' : ''}`}
                onClick={() => vote(option)}
                aria-pressed={chosen}
              >
                <span className="poll__bar" style={{ width: `${mine ? pct(count) : 0}%` }} aria-hidden="true" />
                <span className="poll__label">{option}</span>
                {mine && <span className="poll__pct">{pct(count)}%</span>}
              </button>
            </li>
          )
        })}
      </ul>
      <p className="poll__total">{total} Stimmen{mine ? '' : ' · stimme ab, um Ergebnisse zu sehen'}</p>
    </div>
  )
}
