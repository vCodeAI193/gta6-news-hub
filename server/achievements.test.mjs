/**
 * Tests for Wave 6 Phase 2: Seasonal Achievements & Tier-Up System
 */

import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import * as achievements from './achievements.mjs'

let db

beforeEach(() => {
  db = new Database(':memory:')
  // Initialize minimal schema
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT, reputation INTEGER DEFAULT 0);
    CREATE TABLE user_achievements (user_id TEXT, achievement_id TEXT, unlocked_at TEXT, PRIMARY KEY(user_id, achievement_id));
    CREATE TABLE user_milestones (user_id TEXT, milestone_id TEXT, data TEXT, created_at TEXT);
  `)
  db.prepare('INSERT INTO users VALUES (?, ?, ?)').run('user1', 'TestUser', 0)
})

describe('achievements - Seasonal Challenges', () => {
  it('should get active seasons', () => {
    const now = new Date('2026-02-15') // Mid-winter
    const active = achievements.getActiveSeasons(now)
    expect(active.length).toBeGreaterThan(0)
    expect(active[0].id).toBe('winter2026')
  })

  it('should return empty array for off-season date', () => {
    const offSeason = new Date('2025-12-15') // Before any season
    const active = achievements.getActiveSeasons(offSeason)
    expect(active.length).toBe(0)
  })

  it('should get seasonal challenges for active season', () => {
    const challenges = achievements.getSeasonalChallenges('winter2026')
    expect(challenges.length).toBeGreaterThan(0)
    expect(challenges[0]).toHaveProperty('title')
    expect(challenges[0]).toHaveProperty('requirement')
  })

  it('should track seasonal progress', () => {
    const progress = achievements.trackSeasonalProgress(db, 'user1')
    expect(progress).toBeDefined()
    expect(Object.keys(progress).length).toBeGreaterThan(0)
  })
})

describe('achievements - Tier System', () => {
  it('should get correct tier for XP amount', () => {
    const tier1 = achievements.getCurrentTier(50)
    expect(tier1.tier).toBe(1)

    const tier3 = achievements.getCurrentTier(400)
    expect(tier3.tier).toBe(3)

    const tier6 = achievements.getCurrentTier(3500)
    expect(tier6.tier).toBe(6)
  })

  it('should get next tier progression', () => {
    const nextTier = achievements.getNextTier(500)
    expect(nextTier).toBeDefined()
    expect(nextTier.minXp).toBeGreaterThan(500)
  })

  it('should return null for next tier at max', () => {
    const nextTier = achievements.getNextTier(10000)
    expect(nextTier).toBeNull()
  })

  it('should calculate tier progress correctly', () => {
    const progress = achievements.getTierProgress(350)
    expect(progress.currentTier.tier).toBe(3)
    expect(progress.progress).toBeGreaterThan(0)
    expect(progress.progress).toBeLessThanOrEqual(100)
  })

  it('should detect tier ups', () => {
    const tierUp = achievements.detectTierUp(db, 'user1', 200, 400)
    expect(tierUp).toBeDefined()
    expect(tierUp.tierUp).toBe(true)
    expect(tierUp.from.tier).toBe(2)
    expect(tierUp.to.tier).toBe(3)
  })

  it('should not detect tier up for same tier', () => {
    const noTierUp = achievements.detectTierUp(db, 'user1', 350, 450)
    expect(noTierUp).toBeNull()
  })
})

describe('achievements - Unlocking', () => {
  it('should unlock achievement', () => {
    const result = achievements.unlockAchievement(db, 'user1', 'ach-seasonal-read10', 50)
    expect(result).toBe(true)

    const unlocked = achievements.isAchievementUnlocked(db, 'user1', 'ach-seasonal-read10')
    expect(unlocked).toBe(true)
  })

  it('should not unlock same achievement twice', () => {
    achievements.unlockAchievement(db, 'user1', 'ach-seasonal-read10', 50)
    const result = achievements.unlockAchievement(db, 'user1', 'ach-seasonal-read10', 50)
    expect(result).toBe(true) // Operation succeeds but doesn't duplicate

    const unlocked = achievements.isAchievementUnlocked(db, 'user1', 'ach-seasonal-read10')
    expect(unlocked).toBe(true)
  })

  it('should award XP when unlocking achievement', () => {
    achievements.unlockAchievement(db, 'user1', 'ach-seasonal-read10', 100)
    const user = db.prepare('SELECT reputation FROM users WHERE id = ?').get('user1')
    expect(user.reputation).toBe(100)
  })
})

describe('achievements - Milestones', () => {
  it('should record milestone', () => {
    const result = achievements.recordMilestone(db, 'user1', 'milestone-tier3', {
      tier: 3,
      reward: 'Gold Badge',
    })
    expect(result).toBe(true)
  })

  it('should retrieve milestones', () => {
    achievements.recordMilestone(db, 'user1', 'milestone-tier3', { tier: 3 })
    const milestones = achievements.getMilestones(db, 'user1')
    expect(milestones.length).toBe(1)
    expect(milestones[0].id).toBe('milestone-tier3')
  })

  it('should return empty array for user with no milestones', () => {
    const milestones = achievements.getMilestones(db, 'user1')
    expect(milestones).toEqual([])
  })
})

describe('achievements - Season definitions', () => {
  it('should have valid season structures', () => {
    for (const [key, season] of Object.entries(achievements.SEASONS)) {
      expect(season).toHaveProperty('id')
      expect(season).toHaveProperty('name')
      expect(season).toHaveProperty('startDate')
      expect(season).toHaveProperty('endDate')
      expect(season).toHaveProperty('challenges')
      expect(Array.isArray(season.challenges)).toBe(true)
    }
  })

  it('should have valid challenge structures', () => {
    const season = achievements.SEASONS.winter2026
    for (const challenge of season.challenges) {
      expect(challenge).toHaveProperty('id')
      expect(challenge).toHaveProperty('title')
      expect(challenge).toHaveProperty('icon')
      expect(challenge).toHaveProperty('xp')
      expect(challenge).toHaveProperty('requirement')
      expect(['common', 'rare', 'legendary']).toContain(challenge.rarity)
    }
  })
})

describe('achievements - Tier definitions', () => {
  it('should have valid tier definitions', () => {
    const tiers = achievements.TIER_DEFINITIONS
    expect(tiers.length).toBeGreaterThan(0)

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i]
      expect(tier).toHaveProperty('tier')
      expect(tier).toHaveProperty('minXp')
      expect(tier).toHaveProperty('name')
      expect(tier).toHaveProperty('reward')

      // XP thresholds should be increasing
      if (i > 0) {
        expect(tier.minXp).toBeGreaterThan(tiers[i - 1].minXp)
      }
    }
  })

  it('should cover reasonable XP range', () => {
    const tiers = achievements.TIER_DEFINITIONS
    expect(tiers[0].minXp).toBe(0)
    expect(tiers[tiers.length - 1].minXp).toBeGreaterThan(1000)
  })
})
