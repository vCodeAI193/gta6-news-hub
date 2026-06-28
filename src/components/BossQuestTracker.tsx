/**
 * Wave 6 Phase 2: Boss Quest Tracker Component
 * Weekly mega-quests with progression bars and special rewards
 */

import React, { useState, useEffect } from 'react'

interface BossQuestMilestone {
  progress: number
  reward: number
  title: string
  claimed?: boolean
}

interface BossQuest {
  id: string
  name: string
  description: string
  icon: string
  difficulty: 'easy' | 'moderate' | 'hard' | 'extreme'
  baseReward: number
  premiumBonus: number
  progress: number
  progressPercent: number
  completed: boolean
  milestones: BossQuestMilestone[]
  schedule: {
    startsAt: string
    endsAt: string
    weekNumber: number
  }
}

interface BossQuestTrackerProps {
  quest: BossQuest | null
  leaderboard?: Array<{ rank: number; username: string; progress: number; progressPercent: number }>
  onClaimMilestone?: (milestoneProgress: number) => void
}

const DifficultyBadge: React.FC<{ difficulty: string }> = ({ difficulty }) => {
  const colors = {
    easy: '#22c55e',
    moderate: '#3b82f6',
    hard: '#f59e0b',
    extreme: '#ef4444',
  }

  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor: `${colors[difficulty as keyof typeof colors]}20`,
        color: colors[difficulty as keyof typeof colors],
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        border: `1px solid ${colors[difficulty as keyof typeof colors]}`,
      }}
    >
      {difficulty}
    </span>
  )
}

export const BossQuestTracker: React.FC<BossQuestTrackerProps> = ({
  quest,
  leaderboard = [],
  onClaimMilestone,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  useEffect(() => {
    if (!quest) return

    const updateTimer = () => {
      const endTime = new Date(quest.schedule.endsAt).getTime()
      const now = Date.now()
      const remaining = endTime - now

      if (remaining <= 0) {
        setTimeRemaining('Quest ended')
        return
      }

      const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h left`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m left`)
      } else {
        setTimeRemaining(`${minutes}m left`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000)
    return () => clearInterval(interval)
  }, [quest])

  if (!quest) {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center',
          color: '#cbd5e1',
        }}
      >
        <p>Loading this week's Boss Quest...</p>
      </div>
    )
  }

  return (
    <div
      className="boss-quest-tracker"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: '#fff',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'start', marginBottom: '16px' }}>
          <div style={{ fontSize: '56px' }}>{quest.icon}</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>
              {quest.name}
            </h2>
            <p style={{ margin: '0 0 12px 0', color: '#cbd5e1', fontSize: '14px' }}>
              {quest.description}
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <DifficultyBadge difficulty={quest.difficulty} />
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                Week {quest.schedule.weekNumber}
              </span>
              <span style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 'bold' }}>
                ⏱️ {timeRemaining}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main progress section */}
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}
      >
        {/* Big progress bar */}
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '14px',
            }}
          >
            <span style={{ color: '#cbd5e1' }}>Overall Progress</span>
            <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>
              {quest.progress} / {quest.completed ? 'COMPLETE!' : '?'}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '12px',
              backgroundColor: 'rgba(148, 163, 184, 0.2)',
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${quest.progressPercent}%`,
                background: quest.completed
                  ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                transition: 'width 0.3s ease',
                boxShadow: quest.completed ? '0 0 20px rgba(16, 185, 129, 0.5)' : 'none',
              }}
            />
          </div>
        </div>

        {/* Status message */}
        <div style={{ textAlign: 'center' }}>
          {quest.completed ? (
            <div
              style={{
                color: '#10b981',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              ✓ Quest Completed!
            </div>
          ) : (
            <div style={{ color: '#cbd5e1', fontSize: '13px' }}>
              Keep grinding to complete this week's mega-quest
            </div>
          )}
        </div>
      </div>

      {/* Milestones */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
          Milestone Rewards
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
          }}
        >
          {quest.milestones.map((milestone, idx) => (
            <button
              key={idx}
              disabled={milestone.claimed}
              onClick={() => !milestone.claimed && onClaimMilestone?.(milestone.progress)}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement
                if (!milestone.claimed) {
                  el.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                  el.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.backgroundColor = milestone.claimed
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(255, 255, 255, 0.05)'
                el.style.transform = 'translateY(0)'
              }}
              style={{
                border: milestone.claimed ? '2px solid #10b981' : '2px solid #94a3b8',
                borderRadius: '10px',
                padding: '12px',
                backgroundColor: milestone.claimed
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(255, 255, 255, 0.05)',
                cursor: milestone.claimed ? 'default' : 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px', textAlign: 'center' }}>
                {milestone.progress * 100}%
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#cbd5e1',
                  marginBottom: '8px',
                  textAlign: 'center',
                  minHeight: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {milestone.title}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#fbbf24',
                  textAlign: 'center',
                  marginBottom: '8px',
                }}
              >
                +{milestone.reward} XP
              </div>
              {milestone.claimed && (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#10b981',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  ✓ Claimed
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reward info */}
      <div
        style={{
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid #fbbf24',
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#fbbf24',
        }}
      >
        <strong>Completion Rewards:</strong>
        <div>Base: +{quest.baseReward} XP</div>
        <div>Premium Bonus: +{quest.premiumBonus} XP</div>
      </div>

      {/* Leaderboard toggle */}
      <button
        onClick={() => setShowLeaderboard(!showLeaderboard)}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginTop: '4px',
          transition: 'opacity 0.2s ease',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.opacity = '0.9'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.opacity = '1'
        }}
      >
        {showLeaderboard ? 'Hide' : 'View'} Leaderboard
      </button>

      {/* Leaderboard */}
      {showLeaderboard && leaderboard.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
            Top Players This Week
          </h3>
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            {leaderboard.map((entry, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: idx < leaderboard.length - 1 ? '1px solid rgba(148, 163, 184, 0.2)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, hsl(${entry.rank * 40}, 70%, 60%) 0%, hsl(${entry.rank * 40 + 30}, 70%, 50%) 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: '#fff',
                    }}
                  >
                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                  </div>
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                    {entry.username}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#cbd5e1',
                      marginBottom: '4px',
                    }}
                  >
                    {entry.progressPercent}%
                  </div>
                  <div
                    style={{
                      width: '100px',
                      height: '4px',
                      backgroundColor: 'rgba(148, 163, 184, 0.2)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${entry.progressPercent}%`,
                        background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default BossQuestTracker
