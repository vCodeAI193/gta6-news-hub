/**
 * Wave 6 Phase 2: Social Achievements Component
 * Displays rewards for group activities, friend invites, collaborative actions
 */

import React, { useState } from 'react'

interface SocialAchievement {
  id: string
  title: string
  description: string
  icon: string
  xp: number
  requirement: {
    type: string
    target: number
  }
  rarity: 'common' | 'rare' | 'legendary'
  progress?: {
    current: number
    target: number
    unlocked: boolean
  }
}

interface SocialAchievementsProps {
  achievements?: SocialAchievement[]
  onInviteFriend?: () => void
  onJoinGroup?: () => void
  onCreateGroup?: () => void
}

const AchievementBadge: React.FC<{
  achievement: SocialAchievement
  onAction?: () => void
}> = ({ achievement, onAction }) => {
  const progress = achievement.progress
  const isUnlocked = progress?.unlocked ?? false
  const progressPercent = progress ? (progress.current / progress.target) * 100 : 0

  const rarityColors = {
    common: '#cbd5e1',
    rare: '#3b82f6',
    legendary: '#fbbf24',
  }

  const rarityBg = {
    common: 'rgba(203, 213, 225, 0.1)',
    rare: 'rgba(59, 130, 246, 0.1)',
    legendary: 'rgba(251, 191, 36, 0.1)',
  }

  return (
    <div
      style={{
        border: `2px solid ${rarityColors[achievement.rarity]}`,
        borderRadius: '12px',
        padding: '16px',
        backgroundColor: rarityBg[achievement.rarity],
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        cursor: onAction ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        if (onAction) {
          el.style.transform = 'translateY(-4px)'
          el.style.boxShadow = `0 8px 16px rgba(${achievement.rarity === 'legendary' ? '251, 191, 36' : achievement.rarity === 'rare' ? '59, 130, 246' : '203, 213, 225'}, 0.3)`
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
    >
      {/* Unlocked badge */}
      {isUnlocked && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            zIndex: 10,
          }}
        >
          ✓
        </div>
      )}

      {/* Main content */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ fontSize: '48px' }}>{achievement.icon}</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
            {achievement.title}
          </h3>
          <p style={{ margin: '0 0 8px 0', color: '#cbd5e1', fontSize: '13px' }}>
            {achievement.description}
          </p>

          {/* XP reward */}
          <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 'bold', marginBottom: '8px' }}>
            +{achievement.xp} XP
          </div>

          {/* Progress bar */}
          {progress && (
            <div>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: 'rgba(148, 163, 184, 0.2)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  marginBottom: '4px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(progressPercent, 100)}%`,
                    background: `linear-gradient(90deg, ${rarityColors[achievement.rarity]} 0%, ${rarityColors[achievement.rarity]}dd 100%)`,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {progress.current} / {progress.target}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const SocialAchievements: React.FC<SocialAchievementsProps> = ({
  achievements = [],
  onInviteFriend,
  onJoinGroup,
  onCreateGroup,
}) => {
  const [filter, setFilter] = useState<'all' | 'friends' | 'groups' | 'collaboration'>('all')

  const filterMap = {
    all: achievements,
    friends: achievements.filter(a => a.requirement.type.includes('invite') || a.requirement.type.includes('mention')),
    groups: achievements.filter(a => a.requirement.type.includes('group')),
    collaboration: achievements.filter(a => a.requirement.type.includes('collaborative') || a.requirement.type.includes('quest')),
  }

  const filteredAchievements = filterMap[filter]
  const unlockedCount = filteredAchievements.filter(a => a.progress?.unlocked).length
  const totalXp = achievements
    .filter(a => a.progress?.unlocked)
    .reduce((sum, a) => sum + a.xp, 0)

  return (
    <div
      className="social-achievements-container"
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
          <div style={{ fontSize: '40px' }}>👥</div>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 'bold' }}>
              Social Achievements
            </h2>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '14px' }}>
              Earn rewards for collaboration and community engagement
            </p>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid #3b82f6',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>Unlocked</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>
              {unlockedCount}/{achievements.length}
            </div>
          </div>
          <div
            style={{
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>Total XP</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fbbf24' }}>+{totalXp}</div>
          </div>
        </div>
      </div>

      {/* Quick action buttons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <button
          onClick={onInviteFriend}
          style={{
            background: 'rgba(34, 197, 94, 0.2)',
            border: '1px solid #22c55e',
            color: '#22c55e',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(34, 197, 94, 0.3)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(34, 197, 94, 0.2)'
          }}
        >
          📨 Invite Friend
        </button>
        <button
          onClick={onJoinGroup}
          style={{
            background: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid #3b82f6',
            color: '#3b82f6',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(59, 130, 246, 0.3)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(59, 130, 246, 0.2)'
          }}
        >
          👥 Join Group
        </button>
        <button
          onClick={onCreateGroup}
          style={{
            background: 'rgba(251, 191, 36, 0.2)',
            border: '1px solid #fbbf24',
            color: '#fbbf24',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(251, 191, 36, 0.3)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(251, 191, 36, 0.2)'
          }}
        >
          🏢 Create Group
        </button>
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          overflowX: 'auto',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
        }}
      >
        {(['all', 'friends', 'groups', 'collaboration'] as const).map(filterType => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            style={{
              background: filter === filterType ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
              color: filter === filterType ? '#60a5fa' : '#cbd5e1',
              border: filter === filterType ? '1px solid #60a5fa' : '1px solid transparent',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {filterType === 'all' && 'All'}
            {filterType === 'friends' && '👋 Friends'}
            {filterType === 'groups' && '👥 Groups'}
            {filterType === 'collaboration' && '⚔️ Collaboration'}
          </button>
        ))}
      </div>

      {/* Achievement grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '16px',
        }}
      >
        {filteredAchievements.map(achievement => (
          <AchievementBadge key={achievement.id} achievement={achievement} />
        ))}
      </div>

      {/* Empty state */}
      {filteredAchievements.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤔</div>
          <p>No achievements in this category yet.</p>
        </div>
      )}
    </div>
  )
}

export default SocialAchievements
