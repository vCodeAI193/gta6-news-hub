/**
 * Wave 6 Phase 2: Seasonal Achievements Component
 * Displays time-limited seasonal challenges with expiry dates
 */

import React, { useState } from 'react'

interface SeasonalChallenge {
  id: string
  title: string
  description: string
  icon: string
  xp: number
  rarity: 'common' | 'rare' | 'legendary'
  requirement: {
    type: string
    target: number
  }
  progress?: number
  unlocked?: boolean
}

interface Season {
  id: string
  name: string
  icon: string
  expiresAt: number
  challenges: SeasonalChallenge[]
}

interface SeasonalAchievementsProps {
  seasons?: Season[]
  onClaimReward?: (challengeId: string) => void
}

const ChallengeCard: React.FC<{
  challenge: SeasonalChallenge
  seasonExpiry: number
  onClaim: () => void
}> = ({ challenge, seasonExpiry, onClaim }) => {
  const daysRemaining = Math.ceil((seasonExpiry - Date.now()) / (1000 * 60 * 60 * 24))
  const rarityColors = {
    common: '#a0aec0',
    rare: '#3b82f6',
    legendary: '#fbbf24',
  }

  const progressPercent = Math.min(((challenge.progress ?? 0) / challenge.requirement.target) * 100, 100)

  return (
    <div
      className="challenge-card"
      style={{
        border: `2px solid ${rarityColors[challenge.rarity]}`,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
          <div style={{ fontSize: '32px' }}>{challenge.icon}</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
              {challenge.title}
            </h3>
            <p style={{ margin: '0 0 8px 0', color: '#cbd5e1', fontSize: '14px' }}>
              {challenge.description}
            </p>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
              <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>+{challenge.xp} XP</span>
              <span
                style={{
                  color: rarityColors[challenge.rarity],
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                }}
              >
                {challenge.rarity}
              </span>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', minWidth: '80px' }}>
          <div style={{ fontSize: '12px', color: '#e0e7ff', marginBottom: '4px' }}>
            {daysRemaining > 0 ? `${daysRemaining}d left` : 'Expired'}
          </div>
          {challenge.unlocked ? (
            <button
              onClick={onClaim}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Claim
            </button>
          ) : (
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>In Progress</div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'rgba(148, 163, 184, 0.2)',
          borderRadius: '3px',
          overflow: 'hidden',
          marginTop: '12px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: `linear-gradient(90deg, ${rarityColors[challenge.rarity]} 0%, ${rarityColors[challenge.rarity]}dd 100%)`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '6px', textAlign: 'right' }}>
        {challenge.progress ?? 0} / {challenge.requirement.target}
      </div>
    </div>
  )
}

export const SeasonalAchievements: React.FC<SeasonalAchievementsProps> = ({ seasons = [], onClaimReward }) => {
  const [expandedSeason, setExpandedSeason] = useState<string | null>(seasons[0]?.id || null)

  const activeSeason = seasons[0]

  return (
    <div
      className="seasonal-achievements-container"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: '#fff',
      }}
    >
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ fontSize: '48px' }}>{activeSeason?.icon || '❄️'}</div>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 'bold' }}>
            {activeSeason?.name || 'Seasonal Challenges'}
          </h2>
          <p style={{ margin: 0, color: '#cbd5e1', fontSize: '14px' }}>
            Time-limited challenges with special rewards
          </p>
        </div>
      </div>

      {/* Tabs for multiple seasons */}
      {seasons.length > 1 && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', paddingBottom: '12px' }}>
          {seasons.map(season => (
            <button
              key={season.id}
              onClick={() => setExpandedSeason(season.id)}
              style={{
                background: expandedSeason === season.id ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                color: expandedSeason === season.id ? '#60a5fa' : '#cbd5e1',
                border: expandedSeason === season.id ? '1px solid #60a5fa' : '1px solid transparent',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {season.icon} {season.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Challenge list */}
      <div>
        {expandedSeason && seasons.find(s => s.id === expandedSeason)?.challenges && (
          <div>
            {seasons
              .find(s => s.id === expandedSeason)
              ?.challenges.map(challenge => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  seasonExpiry={seasons.find(s => s.id === expandedSeason)?.expiresAt || 0}
                  onClaim={() => onClaimReward?.(challenge.id)}
                />
              ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {(!seasons || seasons.length === 0) && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌍</div>
          <p>No active seasonal challenges at the moment.</p>
          <p style={{ fontSize: '14px' }}>Check back soon for the next season!</p>
        </div>
      )}
    </div>
  )
}

export default SeasonalAchievements
