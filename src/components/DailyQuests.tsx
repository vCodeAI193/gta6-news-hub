import { getDailyQuests, updateQuestProgress } from '../services/gamificationService'
import { useState } from 'react'

export function DailyQuests() {
  const [quests, setQuests] = useState(() => getDailyQuests())

  const complete = (id: string) => {
    const q = quests.find((q) => q.id === id)
    if (!q || q.progress >= q.target) return
    const updated = updateQuestProgress(id, q.target - q.progress)
    setQuests(updated)
  }

  return (
    <div className="daily-quests">
      <h3 className="daily-quests__title">Tagesquests</h3>
      <ul className="daily-quests__list">
        {quests.map((q) => {
          const done = q.progress >= q.target
          const pct = Math.min(100, Math.round((q.progress / q.target) * 100))
          return (
            <li key={q.id} className={`daily-quests__item${done ? ' daily-quests__item--done' : ''}`}>
              <div className="daily-quests__row">
                <span className="daily-quests__name">{q.title}</span>
                <span className="daily-quests__xp">+{q.xp} XP</span>
              </div>
              <p className="daily-quests__desc">{q.description}</p>
              <div className="daily-quests__progress">
                <div className="daily-quests__bar">
                  <div className="daily-quests__fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="daily-quests__count">{q.progress}/{q.target}</span>
              </div>
              {!done && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => complete(q.id)}
                  style={{ marginTop: '0.4rem', fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}
                >
                  Als erledigt markieren
                </button>
              )}
              {done && <span className="daily-quests__done">✓ Erledigt</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
