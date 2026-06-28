/**
 * Wave 6 Phase 2: Battle Pass Display Component
 * Shows dual progression trees (free and premium tiers)
 */

import React, { useState } from 'react'

interface Reward {
  level: number
  reward: string
  type: string
  rarity: string
}

interface BattlePassTier {
  season: {
    id: string
    name: string
    number: number
    totalLevels: number
    icon: string
  }
  level: number
  xp: number
  hasPremium: boolean
  freeRewards: Reward[]
  premiumRewards: Reward[]
  nextMilestone: number | null
}

interface BattlePassDisplayProps {
  battlePass: BattlePassTier | null
  onPurchasePremium?: () => void
  onClaimReward?: (level: number, isPremium: boolean) => void
}

const RewardTier: React.FC<{
  level: number
  reward: Reward | undefined
  freeReward: Reward | undefined
  isPremiumUnlocked: boolean
  isClaimed: boolean
  onClick: () => void
}> = ({ level, reward, freeReward, isPremiumUnlocked, isClaimed, onClick }) => {
  const displayReward = isPremiumUnlocked ? reward : freeReward

  return (
    <button
      style={{
        textAlign: 'center',
        padding: '12px',
        borderRadius: '12px',
        border: `2px solid ${isClaimed ? '#10b981' : displayReward?.rarity === 'legendary' ? '#fbbf24' : displayReward?.rarity === 'rare' ? '#3b82f6' : '#94a3b8'}`,
        backgroundColor: isClaimed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
        cursor: isClaimed ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        minWidth: '120px',
        position: 'relative',
      }}
      onClick={onClick}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        if (!isClaimed) {
          el.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
          el.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.backgroundColor = isClaimed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Level indicator */}
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa', marginBottom: '8px' }}>
        {level}
      </div>

      {/* Reward icon and name */}
      <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '8px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ wordBreak: 'break-word', fontSize: '12px' }}>{displayReward?.reward || '—'}</span>
      </div>

      {/* Claimed badge */}
      {isClaimed && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            backgroundColor: '#10b981',
            color: '#fff',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
          }}
        >
          ✓
        </div>
      )}
    </button>
  )
}

export const BattlePassDisplay: React.FC<BattlePassDisplayProps> = ({
  battlePass,
  onPurchasePremium,
  onClaimReward,
}) => {
  const [showDetails, setShowDetails] = useState(false)

  if (!battlePass) {
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
        <p>Loading Battle Pass data...</p>
      </div>
    )
  }

  const progressPercent = (battlePass.level / battlePass.season.totalLevels) * 100

  return (
    <div
      className="battle-pass-display"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: '#fff',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '40px' }}>{battlePass.season.icon}</div>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 'bold' }}>
              {battlePass.season.name}
            </h2>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '14px' }}>
              Season {battlePass.season.number}
            </p>
          </div>
        </div>

        {/* Progress Section */}
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#cbd5e1', fontSize: '14px' }}>Level Progress</span>
            <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>
              {battlePass.level} / {battlePass.season.totalLevels}
            </span>
          </div>

          {/* Overall progress bar */}
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'rgba(148, 163, 184, 0.2)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {/* XP to next level */}
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            {battlePass.xp} / 1000 XP to next level
            {battlePass.nextMilestone && (
              <span style={{ marginLeft: '12px', color: '#fbbf24' }}>
                → Next milestone at level {battlePass.nextMilestone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Premium upgrade CTA */}
      {!battlePass.hasPremium && (
        <div
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>Unlock Premium Tier</h3>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
              Get exclusive cosmetics, boosts, and 2x rewards
            </p>
          </div>
          <button
            onClick={onPurchasePremium}
            style={{
              background: '#fff',
              color: '#d97706',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              marginLeft: '16px',
            }}
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Tier tabs */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
          paddingBottom: '12px',
        }}
      >
        <button
          style={{
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Free Tier
        </button>
        {battlePass.hasPremium && (
          <button
            style={{
              background: 'rgba(251, 191, 36, 0.2)',
              color: '#fbbf24',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Premium Tier
          </button>
        )}
      </div>

      {/* Reward grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
          maxHeight: showDetails ? 'none' : '300px',
          overflow: 'hidden',
        }}
      >
        {Array.from({ length: Math.min(20, battlePass.season.totalLevels) }).map((_, idx) => {
          const level = idx + 1
          const freeReward = battlePass.freeRewards.find(r => r.level === level)
          const premiumReward = battlePass.premiumRewards.find(r => r.level === level)
          const isClaimed = battlePass.freeRewards.length >= level

          return (
            <RewardTier
              key={level}
              level={level}
              reward={premiumReward}
              freeReward={freeReward}
              isPremiumUnlocked={battlePass.hasPremium}
              isClaimed={isClaimed}
              onClick={() => !isClaimed && onClaimReward?.(level, battlePass.hasPremium)}
            />
          )
        })}
      </div>

      {/* Show more button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          width: '100%',
          background: 'transparent',
          color: '#60a5fa',
          border: '1px solid #60a5fa',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        {showDetails ? 'Show Less' : `Show All ${battlePass.season.totalLevels} Rewards`}
      </button>
    </div>
  )
}

export default BattlePassDisplay
