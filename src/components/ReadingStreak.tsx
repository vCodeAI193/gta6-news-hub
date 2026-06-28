interface Props {
  streak: number
  dailyGoal: number
  dailyProgress: number
}

export function ReadingStreak({ streak, dailyGoal, dailyProgress }: Props) {
  const pct = dailyGoal > 0 ? Math.min(100, Math.round((dailyProgress / dailyGoal) * 100)) : 0
  const goalMet = dailyProgress >= dailyGoal

  return (
    <div className="streak-card">
      <div className="streak-card__flame">
        🔥 <span className="streak-card__count">{streak}</span>
        <span className="streak-card__label">Tage-Streak</span>
      </div>

      <div className="streak-card__goal">
        <div className="streak-card__goal-label">
          Tagesziel: {dailyProgress} / {dailyGoal} Artikel
          {goalMet && <span className="streak-card__done"> ✓</span>}
        </div>
        <div className="streak-card__bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="streak-card__fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {streak === 0 && (
        <p className="streak-card__hint">Lies heute deinen ersten Artikel, um deinen Streak zu starten!</p>
      )}
      {streak >= 7 && (
        <p className="streak-card__hint">Super! 🎉 {streak} Tage am Stück — weiter so!</p>
      )}
    </div>
  )
}
