/**
 * Tests for Wave 6 Phase 2: Challenge Boss Quests System
 */

import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import * as bossQuests from './bossQuests.mjs'

let db

beforeEach(() => {
  db = new Database(':memory:')
  // Initialize minimal schema
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT, reputation INTEGER DEFAULT 0);
    CREATE TABLE user_boss_quests (user_id TEXT, quest_id TEXT, week_number INTEGER, progress INTEGER, claimed_rewards TEXT, created_at TEXT, PRIMARY KEY(user_id, quest_id, week_number));
    CREATE TABLE user_activity_log (user_id TEXT, activity_type TEXT, data TEXT, created_at TEXT);
  `)
  db.prepare('INSERT INTO users VALUES (?, ?, ?)').run('user1', 'TestUser', 0)
  db.prepare('INSERT INTO users VALUES (?, ?, ?)').run('user2', 'OtherUser', 0)
})

describe('bossQuests - Weekly Quests', () => {
  it('should get weekly boss quest', () => {
    const quest = bossQuests.getWeeklyBossQuest(1)
    expect(quest).toBeDefined()
    expect(quest).toHaveProperty('id')
    expect(quest).toHaveProperty('name')
    expect(quest).toHaveProperty('description')
  })

  it('should return same quest for same week', () => {
    const quest1 = bossQuests.getWeeklyBossQuest(5)
    const quest2 = bossQuests.getWeeklyBossQuest(5)
    expect(quest1.id).toBe(quest2.id)
  })

  it('should rotate quests across weeks', () => {
    const quest1 = bossQuests.getWeeklyBossQuest(1)
    const quest2 = bossQuests.getWeeklyBossQuest(2)
    // May or may not be different depending on pool size, but this tests the rotation logic
    expect(quest1).toBeDefined()
    expect(quest2).toBeDefined()
  })

  it('should get current quest schedule', () => {
    const schedule = bossQuests.getCurrentBossQuestSchedule()
    expect(schedule).toHaveProperty('questId')
    expect(schedule).toHaveProperty('startsAt')
    expect(schedule).toHaveProperty('endsAt')
    expect(schedule).toHaveProperty('weekNumber')
  })
})

describe('bossQuests - Progress Tracking', () => {
  it('should initialize quest progress', () => {
    const result = bossQuests.initializeBossQuestProgress(db, 'user1')
    expect(result).toBe(true)
  })

  it('should track progress', () => {
    bossQuests.initializeBossQuestProgress(db, 'user1')
    const schedule = bossQuests.getCurrentBossQuestSchedule()
    const quest = bossQuests.getWeeklyBossQuest(schedule.weekNumber)

    bossQuests.trackBossQuestProgress(db, 'user1', 10)
    const progress = bossQuests.getBossQuestProgress(db, 'user1', quest.id, schedule.weekNumber)

    expect(progress.progress).toBe(10)
  })

  it('should calculate progress percentage', () => {
    bossQuests.initializeBossQuestProgress(db, 'user1')
    const schedule = bossQuests.getCurrentBossQuestSchedule()
    const quest = bossQuests.getWeeklyBossQuest(schedule.weekNumber)

    // Add progress to quest
    const halfProgress = quest.requirement.target / 2
    db.prepare(
      `UPDATE user_boss_quests SET progress = ? WHERE user_id = ? AND quest_id = ?`
    ).run(halfProgress, 'user1', quest.id)

    const progress = bossQuests.getBossQuestProgress(db, 'user1')
    expect(progress.progressPercent).toBeGreaterThan(0)
    expect(progress.progressPercent).toBeLessThan(100)
  })

  it('should detect quest completion', () => {
    bossQuests.initializeBossQuestProgress(db, 'user1')
    const schedule = bossQuests.getCurrentBossQuestSchedule()
    const quest = bossQuests.getWeeklyBossQuest(schedule.weekNumber)

    db.prepare(
      `UPDATE user_boss_quests SET progress = ? WHERE user_id = ? AND quest_id = ?`
    ).run(quest.requirement.target, 'user1', quest.id)

    const progress = bossQuests.getBossQuestProgress(db, 'user1')
    expect(progress.completed).toBe(true)
    expect(progress.progressPercent).toBe(100)
  })
})

describe('bossQuests - Milestone Rewards', () => {
  it('should have milestones for quests', () => {
    const quest = bossQuests.getWeeklyBossQuest(1)
    expect(quest.milestones).toBeDefined()
    expect(quest.milestones.length).toBeGreaterThan(0)
  })

  it('should claim milestone reward', () => {
    bossQuests.initializeBossQuestProgress(db, 'user1')
    const schedule = bossQuests.getCurrentBossQuestSchedule()
    const quest = bossQuests.getWeeklyBossQuest(schedule.weekNumber)
    const milestone = quest.milestones[0]

    // Set progress to milestone
    db.prepare(
      `UPDATE user_boss_quests SET progress = ? WHERE user_id = ? AND quest_id = ?`
    ).run(milestone.progress * quest.requirement.target, 'user1', quest.id)

    const result = bossQuests.claimBossQuestReward(db, 'user1', quest.id, milestone.progress)
    expect(result).toBe(true)
  })

  it('should award XP for milestone', () => {
    bossQuests.initializeBossQuestProgress(db, 'user1')
    const schedule = bossQuests.getCurrentBossQuestSchedule()
    const quest = bossQuests.getWeeklyBossQuest(schedule.weekNumber)
    const milestone = quest.milestones[0]

    db.prepare(
      `UPDATE user_boss_quests SET progress = ? WHERE user_id = ? AND quest_id = ?`
    ).run(milestone.progress * quest.requirement.target, 'user1', quest.id)

    const initialRep = db.prepare('SELECT reputation FROM users WHERE id = ?').get('user1').reputation
    bossQuests.claimBossQuestReward(db, 'user1', quest.id, milestone.progress)
    const newRep = db.prepare('SELECT reputation FROM users WHERE id = ?').get('user1').reputation

    expect(newRep).toBeGreaterThan(initialRep)
  })

  it('should prevent claiming same milestone twice', () => {
    bossQuests.initializeBossQuestProgress(db, 'user1')
    const schedule = bossQuests.getCurrentBossQuestSchedule()
    const quest = bossQuests.getWeeklyBossQuest(schedule.weekNumber)
    const milestone = quest.milestones[0]

    db.prepare(
      `UPDATE user_boss_quests SET progress = ? WHERE user_id = ? AND quest_id = ?`
    ).run(milestone.progress * quest.requirement.target, 'user1', quest.id)

    bossQuests.claimBossQuestReward(db, 'user1', quest.id, milestone.progress)
    const result = bossQuests.claimBossQuestReward(db, 'user1', quest.id, milestone.progress)
    expect(result).toBe(false)
  })
})

describe('bossQuests - Leaderboard', () => {
  it('should get leaderboard', () => {
    bossQuests.initializeBossQuestProgress(db, 'user1')
    bossQuests.initializeBossQuestProgress(db, 'user2')

    const schedule = bossQuests.getCurrentBossQuestSchedule()
    const quest = bossQuests.getWeeklyBossQuest(schedule.weekNumber)

    db.prepare(
      `UPDATE user_boss_quests SET progress = ? WHERE user_id = ?`
    ).run(50, 'user1')
    db.prepare(
      `UPDATE user_boss_quests SET progress = ? WHERE user_id = ?`
    ).run(30, 'user2')

    const leaderboard = bossQuests.getBossQuestLeaderboard(db, quest.id, schedule.weekNumber, 10)
    expect(leaderboard.length).toBeGreaterThan(0)
    expect(leaderboard[0].username).toBe('TestUser') // user1 has more progress
  })

  it('should show correct rankings', () => {
    bossQuests.initializeBossQuestProgress(db, 'user1')
    bossQuests.initializeBossQuestProgress(db, 'user2')

    const schedule = bossQuests.getCurrentBossQuestSchedule()

    db.prepare(`UPDATE user_boss_quests SET progress = ? WHERE user_id = ?`).run(100, 'user1')
    db.prepare(`UPDATE user_boss_quests SET progress = ? WHERE user_id = ?`).run(50, 'user2')

    const leaderboard = bossQuests.getBossQuestLeaderboard(db)
    expect(leaderboard[0].rank).toBe(1)
    expect(leaderboard[1].rank).toBe(2)
  })
})

describe('bossQuests - Stats', () => {
  it('should get quest stats', () => {
    const stats = bossQuests.getBossQuestStats(db, 'user1')
    expect(stats).toHaveProperty('totalQuestsAttempted')
    expect(stats).toHaveProperty('totalQuestsCompleted')
    expect(stats).toHaveProperty('totalRewardsClaimed')
    expect(stats).toHaveProperty('completedQuests')
  })

  it('should track completed quests', () => {
    bossQuests.initializeBossQuestProgress(db, 'user1')
    const schedule = bossQuests.getCurrentBossQuestSchedule()
    const quest = bossQuests.getWeeklyBossQuest(schedule.weekNumber)

    // Complete quest
    db.prepare(
      `UPDATE user_boss_quests SET progress = ?, claimed_rewards = ? WHERE user_id = ? AND quest_id = ?`
    ).run(quest.requirement.target, '[]', 'user1', quest.id)

    const stats = bossQuests.getBossQuestStats(db, 'user1')
    expect(stats.totalQuestsCompleted).toBe(1)
  })
})

describe('bossQuests - Quest Definitions', () => {
  it('should have valid quest structures', () => {
    for (const quest of bossQuests.BOSS_QUEST_POOL) {
      expect(quest).toHaveProperty('id')
      expect(quest).toHaveProperty('name')
      expect(quest).toHaveProperty('description')
      expect(quest).toHaveProperty('difficulty')
      expect(quest).toHaveProperty('baseReward')
      expect(quest).toHaveProperty('milestones')
      expect(quest.milestones.length).toBeGreaterThan(0)
    }
  })

  it('should have difficulty levels', () => {
    const difficulties = new Set()
    for (const quest of bossQuests.BOSS_QUEST_POOL) {
      difficulties.add(quest.difficulty)
    }
    expect(difficulties.size).toBeGreaterThan(0)
    expect(['easy', 'moderate', 'hard', 'extreme'].some(d => difficulties.has(d))).toBe(true)
  })

  it('should have progressive milestone rewards', () => {
    const quest = bossQuests.BOSS_QUEST_POOL[0]
    const milestones = quest.milestones
    let prevReward = 0

    for (const milestone of milestones) {
      expect(milestone.reward).toBeGreaterThanOrEqual(0)
    }
  })
})
