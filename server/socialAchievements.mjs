/**
 * Wave 6 Phase 2: Social Achievements System
 * Rewards for group activities, friend invites, collaborative actions,
 * and community milestones.
 */

// ─── Social Achievement Definitions ────────────────────────────────────────────

export const SOCIAL_ACHIEVEMENTS = [
  {
    id: 'soc-invite-friend',
    title: 'Friend Bringer',
    description: 'Invite 1 friend to the community',
    icon: '👋',
    xp: 30,
    requirement: { type: 'friend_invites', target: 1 },
    rarity: 'common',
  },
  {
    id: 'soc-invite-5friends',
    title: 'Connector',
    description: 'Invite 5 friends to the community',
    icon: '🤝',
    xp: 100,
    requirement: { type: 'friend_invites', target: 5 },
    rarity: 'rare',
  },
  {
    id: 'soc-invite-10friends',
    title: 'Network Builder',
    description: 'Invite 10 friends to the community',
    icon: '🕸️',
    xp: 200,
    requirement: { type: 'friend_invites', target: 10 },
    rarity: 'legendary',
  },
  {
    id: 'soc-group-join',
    title: 'Group Explorer',
    description: 'Join your first group',
    icon: '👥',
    xp: 20,
    requirement: { type: 'groups_joined', target: 1 },
    rarity: 'common',
  },
  {
    id: 'soc-group-member5',
    title: 'Social Butterfly',
    description: 'Be member of 5 active groups',
    icon: '🦋',
    xp: 80,
    requirement: { type: 'groups_joined', target: 5 },
    rarity: 'rare',
  },
  {
    id: 'soc-collaborative-comment',
    title: 'Discussion Starter',
    description: 'Start a discussion thread with 5+ replies',
    icon: '💬',
    xp: 60,
    requirement: { type: 'discussion_replies', target: 5 },
    rarity: 'rare',
  },
  {
    id: 'soc-group-creator',
    title: 'Community Leader',
    description: 'Create a group and invite 3+ members',
    icon: '👨‍💼',
    xp: 150,
    requirement: { type: 'group_created_with_members', target: 3 },
    rarity: 'legendary',
  },
  {
    id: 'soc-helpful-votes',
    title: 'Trusted Voice',
    description: 'Receive 25 helpful votes from other users',
    icon: '👍',
    xp: 90,
    requirement: { type: 'helpful_votes', target: 25 },
    rarity: 'rare',
  },
  {
    id: 'soc-mention-5users',
    title: 'Name Dropper',
    description: 'Mention 5 different users in comments',
    icon: '📢',
    xp: 50,
    requirement: { type: 'user_mentions', target: 5 },
    rarity: 'common',
  },
  {
    id: 'soc-like-shared',
    title: 'Sharer Supporter',
    description: 'Like 10 posts shared by friends',
    icon: '💕',
    xp: 40,
    requirement: { type: 'friend_shares_liked', target: 10 },
    rarity: 'common',
  },
  {
    id: 'soc-collaborate-quest',
    title: 'Quest Companion',
    description: 'Complete a collaborative quest with 2+ others',
    icon: '⚔️',
    xp: 120,
    requirement: { type: 'collaborative_quests', target: 1 },
    rarity: 'rare',
  },
  {
    id: 'soc-team-achievement',
    title: 'Team Player',
    description: 'Contribute to group reaching 1000 XP milestone',
    icon: '🏆',
    xp: 200,
    requirement: { type: 'group_xp_milestone', target: 1000 },
    rarity: 'legendary',
  },
]

// ─── Friend Tracking ──────────────────────────────────────────────────────────

export function addFriend(db, userId, friendId) {
  try {
    db.prepare(
      `INSERT OR IGNORE INTO user_friends (user_id, friend_id, added_at)
       VALUES (?, ?, ?)`
    ).run(userId, friendId, new Date().toISOString())

    // Also add reverse friendship (following pattern)
    db.prepare(
      `INSERT OR IGNORE INTO user_friends (user_id, friend_id, added_at)
       VALUES (?, ?, ?)`
    ).run(friendId, userId, new Date().toISOString())

    return true
  } catch (e) {
    console.error('Error adding friend:', e)
    return false
  }
}

export function removeFriend(db, userId, friendId) {
  try {
    db.prepare('DELETE FROM user_friends WHERE user_id = ? AND friend_id = ?').run(
      userId,
      friendId,
    )
    db.prepare('DELETE FROM user_friends WHERE user_id = ? AND friend_id = ?').run(
      friendId,
      userId,
    )
    return true
  } catch (e) {
    console.error('Error removing friend:', e)
    return false
  }
}

export function getFriends(db, userId) {
  try {
    const results = db.prepare(
      `SELECT friend_id, added_at FROM user_friends WHERE user_id = ? ORDER BY added_at DESC`
    ).all(userId)
    return results.map(r => ({
      id: r.friend_id,
      addedAt: r.added_at,
    }))
  } catch (e) {
    console.error('Error fetching friends:', e)
    return []
  }
}

export function getFriendCount(db, userId) {
  try {
    const result = db.prepare(
      'SELECT COUNT(*) as count FROM user_friends WHERE user_id = ?'
    ).get(userId)
    return result?.count ?? 0
  } catch (e) {
    return 0
  }
}

// ─── Group Membership & Management ────────────────────────────────────────────

export function createGroup(db, userId, groupData) {
  try {
    const groupId = `group_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    db.prepare(
      `INSERT INTO user_groups (id, creator_id, name, description, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      groupId,
      userId,
      groupData.name,
      groupData.description || '',
      new Date().toISOString(),
    )

    // Add creator as member
    db.prepare(
      `INSERT INTO group_members (group_id, user_id, role, joined_at)
       VALUES (?, ?, ?, ?)`
    ).run(groupId, userId, 'creator', new Date().toISOString())

    return groupId
  } catch (e) {
    console.error('Error creating group:', e)
    return null
  }
}

export function joinGroup(db, userId, groupId) {
  try {
    db.prepare(
      `INSERT OR IGNORE INTO group_members (group_id, user_id, role, joined_at)
       VALUES (?, ?, ?, ?)`
    ).run(groupId, userId, 'member', new Date().toISOString())
    return true
  } catch (e) {
    console.error('Error joining group:', e)
    return false
  }
}

export function getGroupMembership(db, userId) {
  try {
    const results = db.prepare(
      `SELECT group_id, role, joined_at FROM group_members WHERE user_id = ? ORDER BY joined_at DESC`
    ).all(userId)
    return results.map(r => ({
      groupId: r.group_id,
      role: r.role,
      joinedAt: r.joined_at,
    }))
  } catch (e) {
    console.error('Error fetching group membership:', e)
    return []
  }
}

export function getGroupDetails(db, groupId) {
  try {
    const group = db.prepare(
      `SELECT id, creator_id, name, description, created_at FROM user_groups WHERE id = ?`
    ).get(groupId)

    if (!group) return null

    const members = db.prepare(
      `SELECT user_id, role FROM group_members WHERE group_id = ?`
    ).all(groupId)

    return {
      id: group.id,
      creatorId: group.creator_id,
      name: group.name,
      description: group.description,
      createdAt: group.created_at,
      memberCount: members.length,
      members: members.map(m => ({
        userId: m.user_id,
        role: m.role,
      })),
    }
  } catch (e) {
    console.error('Error fetching group details:', e)
    return null
  }
}

// ─── Collaborative Activities ──────────────────────────────────────────────────

export function trackCollaborativeComment(db, userId, commentId, mentionedUsers) {
  try {
    const mentionedCount = mentionedUsers?.length ?? 0
    db.prepare(
      `INSERT INTO user_activity_log (user_id, activity_type, data, created_at)
       VALUES (?, ?, ?, ?)`
    ).run(
      userId,
      'collaborative_comment',
      JSON.stringify({ commentId, mentionedCount, mentionedUsers }),
      new Date().toISOString(),
    )

    // Track mentions for achievement
    if (mentionedCount > 0) {
      const currentMentions = getActivityMetric(db, userId, 'total_mentions') || 0
      recordActivityMetric(db, userId, 'total_mentions', currentMentions + mentionedCount)
    }

    return true
  } catch (e) {
    console.error('Error tracking collaborative comment:', e)
    return false
  }
}

export function createCollaborativeQuest(db, questData, participantIds) {
  try {
    const questId = `quest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    db.prepare(
      `INSERT INTO collaborative_quests (id, title, description, created_at, goal_xp)
       VALUES (?, ?, ?, ?, ?)`
    ).run(questId, questData.title, questData.description, new Date().toISOString(), questData.goalXp)

    for (const participantId of participantIds) {
      db.prepare(
        `INSERT INTO quest_participants (quest_id, user_id, joined_at)
         VALUES (?, ?, ?)`
      ).run(questId, participantId, new Date().toISOString())
    }

    return questId
  } catch (e) {
    console.error('Error creating collaborative quest:', e)
    return null
  }
}

export function getCollaborativeQuests(db, userId) {
  try {
    const results = db.prepare(
      `SELECT q.id, q.title, q.description, q.goal_xp, q.created_at
       FROM collaborative_quests q
       JOIN quest_participants qp ON q.id = qp.quest_id
       WHERE qp.user_id = ? AND q.created_at > datetime('now', '-7 days')
       ORDER BY q.created_at DESC`
    ).all(userId)

    return results.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      goalXp: r.goal_xp,
      createdAt: r.created_at,
    }))
  } catch (e) {
    console.error('Error fetching collaborative quests:', e)
    return []
  }
}

// ─── Activity Metrics ──────────────────────────────────────────────────────────

export function recordActivityMetric(db, userId, metric, value) {
  try {
    db.prepare(
      `INSERT OR REPLACE INTO user_activity_metrics (user_id, metric_name, value, updated_at)
       VALUES (?, ?, ?, ?)`
    ).run(userId, metric, value, new Date().toISOString())
    return true
  } catch (e) {
    console.error('Error recording activity metric:', e)
    return false
  }
}

export function getActivityMetric(db, userId, metric) {
  try {
    const result = db.prepare(
      `SELECT value FROM user_activity_metrics WHERE user_id = ? AND metric_name = ?`
    ).get(userId, metric)
    return result?.value ?? 0
  } catch (e) {
    return 0
  }
}

export function getSocialAchievementProgress(db, userId) {
  const progress = {}

  for (const achievement of SOCIAL_ACHIEVEMENTS) {
    const req = achievement.requirement
    let currentProgress = 0

    if (req.type === 'friend_invites') {
      currentProgress = getActivityMetric(db, userId, 'friend_invites_sent') || 0
    } else if (req.type === 'groups_joined') {
      const groups = getGroupMembership(db, userId)
      currentProgress = groups.length
    } else if (req.type === 'discussion_replies') {
      currentProgress = getActivityMetric(db, userId, 'discussion_replies_received') || 0
    } else if (req.type === 'helpful_votes') {
      currentProgress = getActivityMetric(db, userId, 'helpful_votes_received') || 0
    } else if (req.type === 'user_mentions') {
      currentProgress = getActivityMetric(db, userId, 'total_mentions') || 0
    } else if (req.type === 'friend_shares_liked') {
      currentProgress = getActivityMetric(db, userId, 'friend_shares_liked') || 0
    }

    progress[achievement.id] = {
      current: Math.min(currentProgress, req.target),
      target: req.target,
      unlocked: currentProgress >= req.target,
    }
  }

  return progress
}

export default {
  SOCIAL_ACHIEVEMENTS,
  addFriend,
  removeFriend,
  getFriends,
  getFriendCount,
  createGroup,
  joinGroup,
  getGroupMembership,
  getGroupDetails,
  trackCollaborativeComment,
  createCollaborativeQuest,
  getCollaborativeQuests,
  recordActivityMetric,
  getActivityMetric,
  getSocialAchievementProgress,
}
