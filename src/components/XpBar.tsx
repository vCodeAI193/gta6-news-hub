import { getLevel, getLevelTitle, getLevelThreshold, getNextLevelThreshold } from '../services/gamificationService'

interface XpBarProps {
  xp: number
  compact?: boolean
}

export function XpBar({ xp, compact = false }: XpBarProps) {
  const level = getLevel(xp)
  const title = getLevelTitle(level)
  const currentThreshold = getLevelThreshold(level)
  const nextThreshold = getNextLevelThreshold(level)
  const progress = nextThreshold > currentThreshold
    ? Math.min(100, Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
    : 100

  if (compact) {
    return (
      <div className="xpbar xpbar--compact">
        <span className="xpbar__level">Lvl {level}</span>
        <div className="xpbar__track">
          <div className="xpbar__fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="xpbar__xp">{xp} XP</span>
      </div>
    )
  }

  return (
    <div className="xpbar">
      <div className="xpbar__header">
        <span className="xpbar__badge">Level {level}</span>
        <span className="xpbar__title">{title}</span>
        <span className="xpbar__xp">{xp} / {nextThreshold} XP</span>
      </div>
      <div className="xpbar__track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="xpbar__fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="xpbar__labels">
        <span>{currentThreshold}</span>
        <span>{nextThreshold}</span>
      </div>
    </div>
  )
}
