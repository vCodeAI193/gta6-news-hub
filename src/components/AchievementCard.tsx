import type { Achievement } from '../services/gamificationService'

interface AchievementCardProps {
  achievement: Achievement
  unlocked: boolean
}

export function AchievementCard({ achievement, unlocked }: AchievementCardProps) {
  return (
    <div className={`achievement-card${unlocked ? ' achievement-card--unlocked' : ' achievement-card--locked'}`}>
      <span className="achievement-card__icon" aria-hidden="true">
        {unlocked ? achievement.icon : '🔒'}
      </span>
      <div className="achievement-card__body">
        <strong className="achievement-card__title">{achievement.title}</strong>
        <p className="achievement-card__desc">{achievement.description}</p>
        {achievement.xp > 0 && (
          <span className="achievement-card__xp">+{achievement.xp} XP</span>
        )}
      </div>
      {unlocked && achievement.unlockedAt && (
        <span className="achievement-card__check" aria-label="Entsperrt">✓</span>
      )}
    </div>
  )
}
