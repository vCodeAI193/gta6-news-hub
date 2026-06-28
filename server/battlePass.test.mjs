/**
 * Tests for Wave 6 Phase 2: Battle Pass System
 */

import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import * as battlePass from './battlePass.mjs'

let db

beforeEach(() => {
  db = new Database(':memory:')
  // Initialize minimal schema
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT);
    CREATE TABLE user_battle_pass (user_id TEXT, season_id TEXT, level INTEGER, xp INTEGER, premium INTEGER, PRIMARY KEY(user_id, season_id));
    CREATE TABLE user_claimed_rewards (user_id TEXT, reward_id TEXT, reward_level INTEGER, is_premium INTEGER, claimed_at TEXT);
  `)
  db.prepare('INSERT INTO users VALUES (?, ?)').run('user1', 'TestUser')
})

describe('battlePass - Season Management', () => {
  it('should get active battle pass', () => {
    const pass = battlePass.getActiveBattlePass(new Date('2026-02-15'))
    expect(pass).toBeDefined()
    expect(pass.totalLevels).toBe(100)
  })

  it('should return season 1 as default', () => {
    const pass = battlePass.getActiveBattlePass(new Date('2025-12-01'))
    expect(pass.id).toBe('season1')
  })

  it('should have valid season definitions', () => {
    for (const [key, season] of Object.entries(battlePass.BATTLE_PASS_SEASONS)) {
      expect(season).toHaveProperty('id')
      expect(season).toHaveProperty('name')
      expect(season).toHaveProperty('totalLevels')
      expect(season.totalLevels).toBe(100)
    }
  })
})

describe('battlePass - Tier Rewards', () => {
  it('should get free rewards up to level', () => {
    const rewards = battlePass.getFreeRewardsUpToLevel(10)
    expect(rewards.length).toBeGreaterThan(0)
    expect(rewards[0].level).toBeLessThanOrEqual(10)
  })

  it('should get premium rewards up to level', () => {
    const rewards = battlePass.getPremiumRewardsUpToLevel(10)
    expect(rewards.length).toBeGreaterThan(0)
    expect(rewards.every(r => r.level <= 10)).toBe(true)
  })

  it('should have more premium rewards than free', () => {
    const freeRewards = battlePass.FREE_TIER_REWARDS
    const premiumRewards = battlePass.PREMIUM_TIER_REWARDS
    expect(premiumRewards.length).toBeGreaterThanOrEqual(freeRewards.length)
  })

  it('should identify valid milestone levels', () => {
    const milestone = battlePass.getNextMilestone(5)
    expect(milestone).toBe(10)

    const nextAfter25 = battlePass.getNextMilestone(25)
    expect(nextAfter25).toBe(50)
  })

  it('should return null for milestone past max', () => {
    const milestone = battlePass.getNextMilestone(101)
    expect(milestone).toBeNull()
  })
})

describe('battlePass - Battle Pass Status', () => {
  it('should get initial battle pass status', () => {
    const status = battlePass.getBattlePassStatus(db, 'user1')
    expect(status).toBeDefined()
    expect(status.level).toBeGreaterThanOrEqual(1)
    expect(status.xp).toBe(0)
    expect(status.hasPremium).toBe(false)
  })

  it('should track XP accumulation', () => {
    battlePass.addBattlePassXp(db, 'user1', 500)
    const status = battlePass.getBattlePassStatus(db, 'user1')
    expect(status.xp).toBe(500)
  })

  it('should level up at 1000 XP', () => {
    battlePass.addBattlePassXp(db, 'user1', 1000)
    const status = battlePass.getBattlePassStatus(db, 'user1')
    expect(status.level).toBe(2)
    expect(status.xp).toBe(0)
  })

  it('should handle multiple level ups', () => {
    battlePass.addBattlePassXp(db, 'user1', 3500)
    const status = battlePass.getBattlePassStatus(db, 'user1')
    expect(status.level).toBe(4)
  })
})

describe('battlePass - Premium Tier', () => {
  it('should purchase premium tier', () => {
    const result = battlePass.purchasePremiumTier(db, 'user1')
    expect(result).toBe(true)

    const status = battlePass.getBattlePassStatus(db, 'user1')
    expect(status.hasPremium).toBe(true)
  })

  it('should get premium rewards after purchase', () => {
    battlePass.purchasePremiumTier(db, 'user1')
    battlePass.addBattlePassXp(db, 'user1', 500)
    const status = battlePass.getBattlePassStatus(db, 'user1')
    expect(status.premiumRewards.length).toBeGreaterThan(0)
  })
})

describe('battlePass - Reward Claiming', () => {
  it('should claim reward', () => {
    const result = battlePass.claimBattlePassReward(db, 'user1', 5, false)
    expect(result).toBe(true)
  })

  it('should prevent claiming invalid reward level', () => {
    const result = battlePass.claimBattlePassReward(db, 'user1', 999, false)
    expect(result).toBe(false)
  })

  it('should track claimed rewards', () => {
    battlePass.claimBattlePassReward(db, 'user1', 5, false)
    const claimed = battlePass.getClaimedRewards(db, 'user1')
    expect(claimed.length).toBeGreaterThan(0)
    expect(claimed[0].level).toBe(5)
  })
})

describe('battlePass - Reward Definitions', () => {
  it('should have reward at each tier level', () => {
    expect(battlePass.FREE_TIER_REWARDS.length).toBeGreaterThan(0)
    expect(battlePass.PREMIUM_TIER_REWARDS.length).toBeGreaterThan(0)
  })

  it('should have valid reward structures', () => {
    for (const reward of battlePass.FREE_TIER_REWARDS) {
      expect(reward).toHaveProperty('level')
      expect(reward).toHaveProperty('reward')
      expect(reward).toHaveProperty('type')
      expect(reward).toHaveProperty('rarity')
    }
  })

  it('should increase in rarity with level', () => {
    const low = battlePass.FREE_TIER_REWARDS[0]
    const high = battlePass.FREE_TIER_REWARDS[battlePass.FREE_TIER_REWARDS.length - 1]
    expect(high.level).toBeGreaterThan(low.level)
  })
})
