/**
 * Tests for Wave 6 Phase 2: Social Achievements System
 */

import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import * as social from './socialAchievements.mjs'

let db

beforeEach(() => {
  db = new Database(':memory:')
  // Initialize minimal schema
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT);
    CREATE TABLE user_friends (user_id TEXT, friend_id TEXT, added_at TEXT, PRIMARY KEY(user_id, friend_id));
    CREATE TABLE user_groups (id TEXT PRIMARY KEY, creator_id TEXT, name TEXT, description TEXT, created_at TEXT);
    CREATE TABLE group_members (group_id TEXT, user_id TEXT, role TEXT, joined_at TEXT, PRIMARY KEY(group_id, user_id));
    CREATE TABLE user_activity_log (user_id TEXT, activity_type TEXT, data TEXT, created_at TEXT);
    CREATE TABLE user_activity_metrics (user_id TEXT, metric_name TEXT, value INTEGER, updated_at TEXT, PRIMARY KEY(user_id, metric_name));
    CREATE TABLE collaborative_quests (id TEXT PRIMARY KEY, title TEXT, description TEXT, created_at TEXT, goal_xp INTEGER);
    CREATE TABLE quest_participants (quest_id TEXT, user_id TEXT, joined_at TEXT);
  `)
  db.prepare('INSERT INTO users VALUES (?, ?)').run('user1', 'Alice')
  db.prepare('INSERT INTO users VALUES (?, ?)').run('user2', 'Bob')
})

describe('socialAchievements - Friend Management', () => {
  it('should add friend', () => {
    const result = social.addFriend(db, 'user1', 'user2')
    expect(result).toBe(true)

    const friends = social.getFriends(db, 'user1')
    expect(friends.some(f => f.id === 'user2')).toBe(true)
  })

  it('should create bidirectional friendship', () => {
    social.addFriend(db, 'user1', 'user2')

    const friends1 = social.getFriends(db, 'user1')
    const friends2 = social.getFriends(db, 'user2')

    expect(friends1.some(f => f.id === 'user2')).toBe(true)
    expect(friends2.some(f => f.id === 'user1')).toBe(true)
  })

  it('should remove friend', () => {
    social.addFriend(db, 'user1', 'user2')
    social.removeFriend(db, 'user1', 'user2')

    const friends = social.getFriends(db, 'user1')
    expect(friends.some(f => f.id === 'user2')).toBe(false)
  })

  it('should count friends', () => {
    social.addFriend(db, 'user1', 'user2')
    const count = social.getFriendCount(db, 'user1')
    expect(count).toBe(1)
  })
})

describe('socialAchievements - Group Management', () => {
  it('should create group', () => {
    const groupId = social.createGroup(db, 'user1', {
      name: 'GTA Enthusiasts',
      description: 'For GTA6 fans',
    })
    expect(groupId).toBeDefined()
    expect(typeof groupId).toBe('string')
  })

  it('should add creator to group', () => {
    const groupId = social.createGroup(db, 'user1', {
      name: 'Test Group',
    })
    const details = social.getGroupDetails(db, groupId)
    expect(details.members.some(m => m.userId === 'user1')).toBe(true)
  })

  it('should join group', () => {
    const groupId = social.createGroup(db, 'user1', { name: 'Test' })
    social.joinGroup(db, 'user2', groupId)

    const details = social.getGroupDetails(db, groupId)
    expect(details.memberCount).toBe(2)
  })

  it('should get group membership', () => {
    const groupId = social.createGroup(db, 'user1', { name: 'Test' })
    const membership = social.getGroupMembership(db, 'user1')
    expect(membership.length).toBeGreaterThan(0)
    expect(membership[0].groupId).toBe(groupId)
  })

  it('should retrieve group details', () => {
    const groupId = social.createGroup(db, 'user1', {
      name: 'Test Group',
      description: 'Test Description',
    })
    const details = social.getGroupDetails(db, groupId)
    expect(details.name).toBe('Test Group')
    expect(details.description).toBe('Test Description')
    expect(details.creatorId).toBe('user1')
  })
})

describe('socialAchievements - Collaborative Activities', () => {
  it('should track collaborative comment', () => {
    const result = social.trackCollaborativeComment(db, 'user1', 'comment1', ['user2', 'user3'])
    expect(result).toBe(true)
  })

  it('should create collaborative quest', () => {
    const questId = social.createCollaborativeQuest(db, {
      title: 'The Grand Hunt',
      description: 'Hunt for treasures',
      goalXp: 5000,
    }, ['user1', 'user2'])
    expect(questId).toBeDefined()
  })

  it('should get collaborative quests', () => {
    const questId = social.createCollaborativeQuest(db, {
      title: 'Test Quest',
      goalXp: 1000,
    }, ['user1', 'user2'])

    const quests = social.getCollaborativeQuests(db, 'user1')
    expect(quests.length).toBeGreaterThan(0)
    expect(quests[0].id).toBe(questId)
  })
})

describe('socialAchievements - Activity Metrics', () => {
  it('should record activity metric', () => {
    const result = social.recordActivityMetric(db, 'user1', 'friend_invites_sent', 5)
    expect(result).toBe(true)

    const value = social.getActivityMetric(db, 'user1', 'friend_invites_sent')
    expect(value).toBe(5)
  })

  it('should return 0 for non-existent metric', () => {
    const value = social.getActivityMetric(db, 'user1', 'nonexistent')
    expect(value).toBe(0)
  })

  it('should update metric values', () => {
    social.recordActivityMetric(db, 'user1', 'helpful_votes_received', 5)
    social.recordActivityMetric(db, 'user1', 'helpful_votes_received', 10)

    const value = social.getActivityMetric(db, 'user1', 'helpful_votes_received')
    expect(value).toBe(10)
  })
})

describe('socialAchievements - Achievement Progress', () => {
  it('should get social achievement progress', () => {
    social.addFriend(db, 'user1', 'user2')
    const progress = social.getSocialAchievementProgress(db, 'user1')

    expect(progress).toBeDefined()
    expect(Object.keys(progress).length).toBeGreaterThan(0)
  })

  it('should track friend invite progress', () => {
    social.recordActivityMetric(db, 'user1', 'friend_invites_sent', 3)
    const progress = social.getSocialAchievementProgress(db, 'user1')

    const inviteFriend = progress['soc-invite-friend']
    expect(inviteFriend).toBeDefined()
  })

  it('should track group membership progress', () => {
    const groupId = social.createGroup(db, 'user1', { name: 'G1' })
    social.joinGroup(db, 'user2', groupId)

    const progress = social.getSocialAchievementProgress(db, 'user2')
    expect(progress).toBeDefined()
  })
})

describe('socialAchievements - Achievement Definitions', () => {
  it('should have valid social achievements', () => {
    const achievements = social.SOCIAL_ACHIEVEMENTS
    expect(achievements.length).toBeGreaterThan(0)

    for (const achievement of achievements) {
      expect(achievement).toHaveProperty('id')
      expect(achievement).toHaveProperty('title')
      expect(achievement).toHaveProperty('icon')
      expect(achievement).toHaveProperty('xp')
      expect(achievement).toHaveProperty('requirement')
      expect(['common', 'rare', 'legendary']).toContain(achievement.rarity)
    }
  })

  it('should have diverse requirement types', () => {
    const types = new Set()
    for (const achievement of social.SOCIAL_ACHIEVEMENTS) {
      types.add(achievement.requirement.type)
    }
    expect(types.size).toBeGreaterThan(1)
  })
})
