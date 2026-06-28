/**
 * Wave 6 Phase 2: Seasonal Achievements & Tier-Up System
 * Manages time-limited seasonal challenges with expiry dates,
 * and tier progression with unlock rewards.
 */

import { readJSON, writeJSON } from '../src/services/storage.js'

// ─── Seasonal Achievement Definitions ──────────────────────────────────────

const SEASONS = {
  winter2026: {
    id: 'winter2026',
    name: 'Winter Hunt 2026',
    icon: '❄️',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    challenges: [
      {
        id: 'ach-seasonal-read10',
        title: 'Winter Reader',
        description: 'Read 10 articles in Winter 2026',
        icon: '📖',
        xp: 50,
        requirement: { type: 'articles_read', target: 10 },
        rarity: 'common',
      },
      {
        id: 'ach-seasonal-comment15',
        title: 'Frostbite Conversationalist',
        description: 'Post 15 comments during Winter season',
        icon: '🧊',
        xp: 75,
        requirement: { type: 'comments_posted', target: 15 },
        rarity: 'rare',
      },
      {
        id: 'ach-seasonal-streak7',
        title: 'Seven Day Winter Warrior',
        description: 'Maintain 7-day streak in Winter',
        icon: '⛄',
        xp: 100,
        requirement: { type: 'consecutive_days', target: 7 },
        rarity: 'rare',
      },
      {
        id: 'ach-seasonal-perfect-quiz',
        title: 'Winter Trivia Master',
        description: 'Score 100% on 5 Winter season quizzes',
        icon: '🏔️',
        xp: 150,
        requirement: { type: 'perfect_quizzes', target: 5 },
        rarity: 'legendary',
      },
    ],
  },
  spring2026: {
    id: 'spring2026',
    name: 'Spring Bloom 2026',
    icon: '🌸',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    challenges: [
      {
        id: 'ach-seasonal-spring-read10',
        title: 'Spring Reader',
        description: 'Read 10 articles in Spring 2026',
        icon: '🌿',
        xp: 50,
        requirement: { type: 'articles_read', target: 10 },
        rarity: 'common',
      },
      {
        id: 'ach-seasonal-spring-collaborate',
        title: 'Pollinator',
        description: 'Collaborate on 5 discussions in Spring',
        icon: '🌺',
        xp: 100,
        requirement: { type: 'collaborative_comments', target: 5 },
        rarity: 'rare',
      },
      {
        id: 'ach-seasonal-spring-legendary',
        title: 'Spring Blossom',
        description: 'Unlock 3 legendary collectibles in Spring',
        icon: '🌹',
        xp: 200,
        requirement: { type: 'legendary_unlocks', target: 3 },
        rarity: 'legendary',
      },
    ],
  },
}

export function getActiveSeasons(now = new Date()) {
  const active = []
  const nowStr = now.toISOString().split('T')[0]

  for (const [_key, season] of Object.entries(SEASONS)) {
    if (nowStr >= season.startDate && nowStr <= season.endDate) {
      active.push(season)
    }
  }
  return active
}

export function getSeasonalChallenges(seasonId) {
  const season = SEASONS[seasonId]
  if (!season) return []
  return season.challenges
}

export function trackSeasonalProgress(db, userId) {
  const active = getActiveSeasons()
  const progress = {}

  for (const season of active) {
    progress[season.id] = {
      season: season.name,
      icon: season.icon,
      expiresAt: new Date(season.endDate).getTime(),
      challenges: season.challenges.map(challenge => ({
        id: challenge.id,
        title: challenge.title,
        icon: challenge.icon,
        xp: challenge.xp,
        rarity: challenge.rarity,
        unlocked: isAchievementUnlocked(db, userId, challenge.id),
      })),
    }
  }

  return progress
}

export function isAchievementUnlocked(db, userId, achievementId) {
  try {
    const result = db.prepare(
      'SELECT 1 FROM user_achievements WHERE user_id = ? AND achievement_id = ?'
    ).get(userId, achievementId)
    return !!result
  } catch (e) {
    return false
  }
}

export function unlockAchievement(db, userId, achievementId, xpReward = 0) {
  try {
    db.prepare(
      'INSERT OR IGNORE INTO user_achievements (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?)'
    ).run(userId, achievementId, new Date().toISOString())

    if (xpReward > 0) {
      db.prepare('UPDATE users SET reputation = reputation + ? WHERE id = ?').run(xpReward, userId)
    }
    return true
  } catch (e) {
    console.error('Error unlocking achievement:', e)
    return false
  }
}

// ─── Tier-Up System ───────────────────────────────────────────────────────────

const TIER_DEFINITIONS = [
  { tier: 1, minXp: 0, name: 'Novice', reward: 'Bronze Badge', milestone: 'XP 0+' },
  { tier: 2, minXp: 100, name: 'Apprentice', reward: 'Silver Badge', milestone: 'XP 100+' },
  { tier: 3, minXp: 300, name: 'Journeyman', reward: 'Gold Badge', milestone: 'XP 300+' },
  { tier: 4, minXp: 700, name: 'Expert', reward: 'Platinum Badge', milestone: 'XP 700+' },
  { tier: 5, minXp: 1500, name: 'Master', reward: 'Diamond Badge', milestone: 'XP 1500+' },
  { tier: 6, minXp: 3000, name: 'Grandmaster', reward: 'Crown Badge', milestone: 'XP 3000+' },
]

export function getCurrentTier(xp) {
  for (let i = TIER_DEFINITIONS.length - 1; i >= 0; i--) {
    if (xp >= TIER_DEFINITIONS[i].minXp) {
      return TIER_DEFINITIONS[i]
    }
  }
  return TIER_DEFINITIONS[0]
}

export function getNextTier(xp) {
  for (const tier of TIER_DEFINITIONS) {
    if (xp < tier.minXp) {
      return tier
    }
  }
  return null
}

export function getTierProgress(xp) {
  const current = getCurrentTier(xp)
  const next = getNextTier(xp)

  if (!next) {
    return {
      currentTier: current,
      progress: 100,
      xpForNext: 0,
      xpInCurrent: xp - current.minXp,
    }
  }

  const xpInCurrent = xp - current.minXp
  const xpForCurrent = next.minXp - current.minXp
  const progress = Math.round((xpInCurrent / xpForCurrent) * 100)

  return {
    currentTier: current,
    nextTier: next,
    progress,
    xpForNext: next.minXp - xp,
    xpInCurrent,
  }
}

export function detectTierUp(db, userId, previousXp, currentXp) {
  const prevTier = getCurrentTier(previousXp)
  const currTier = getCurrentTier(currentXp)

  if (currTier.tier > prevTier.tier) {
    return {
      tierUp: true,
      from: prevTier,
      to: currTier,
      timestamp: new Date().toISOString(),
    }
  }

  return null
}

// ─── Milestone Tracking ────────────────────────────────────────────────────────

export function recordMilestone(db, userId, milestoneId, data = {}) {
  try {
    db.prepare(
      `INSERT INTO user_milestones (user_id, milestone_id, data, created_at)
       VALUES (?, ?, ?, ?)`
    ).run(userId, milestoneId, JSON.stringify(data), new Date().toISOString())
    return true
  } catch (e) {
    console.error('Error recording milestone:', e)
    return false
  }
}

export function getMilestones(db, userId) {
  try {
    const results = db.prepare(
      'SELECT milestone_id, data, created_at FROM user_milestones WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId)
    return results.map(r => ({
      id: r.milestone_id,
      data: JSON.parse(r.data || '{}'),
      createdAt: r.created_at,
    }))
  } catch (e) {
    console.error('Error fetching milestones:', e)
    return []
  }
}

export default {
  getActiveSeasons,
  getSeasonalChallenges,
  trackSeasonalProgress,
  isAchievementUnlocked,
  unlockAchievement,
  getCurrentTier,
  getNextTier,
  getTierProgress,
  detectTierUp,
  recordMilestone,
  getMilestones,
  TIER_DEFINITIONS,
  SEASONS,
}
