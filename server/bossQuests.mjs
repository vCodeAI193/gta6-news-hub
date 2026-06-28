/**
 * Wave 6 Phase 2: Challenge Boss Quests System
 * Weekly mega-quests with progression bars, special rewards,
 * and leaderboard standings.
 */

// ─── Boss Quest Definitions ────────────────────────────────────────────────────

const BOSS_QUEST_POOL = [
  {
    id: 'boss-read-marathon',
    name: '📖 The Historian',
    description: 'Read 50 articles this week',
    difficulty: 'hard',
    baseReward: 500,
    premiumBonus: 250,
    icon: '📚',
    requirement: { type: 'articles_read', target: 50 },
    milestones: [
      { progress: 0.25, reward: 100, title: 'Quarter Done' },
      { progress: 0.5, reward: 150, title: 'Halfway There' },
      { progress: 0.75, reward: 200, title: 'Almost Finished' },
      { progress: 1.0, reward: 50, title: 'Completed' },
    ],
  },
  {
    id: 'boss-comment-warrior',
    name: '💬 The Debater',
    description: 'Post 75 meaningful comments',
    difficulty: 'extreme',
    baseReward: 600,
    premiumBonus: 300,
    icon: '🗣️',
    requirement: { type: 'comments_posted', target: 75 },
    milestones: [
      { progress: 0.25, reward: 150, title: 'Getting Started' },
      { progress: 0.5, reward: 150, title: 'Momentum' },
      { progress: 0.75, reward: 150, title: 'Unstoppable' },
      { progress: 1.0, reward: 150, title: 'Legendary Voice' },
    ],
  },
  {
    id: 'boss-quiz-savant',
    name: '🧠 The Quiz Master',
    description: 'Score 90%+ on 20 quizzes',
    difficulty: 'hard',
    baseReward: 550,
    premiumBonus: 275,
    icon: '🎯',
    requirement: { type: 'high_score_quizzes', target: 20, minScore: 90 },
    milestones: [
      { progress: 0.25, reward: 130, title: 'Getting Warmed Up' },
      { progress: 0.5, reward: 130, title: 'On a Roll' },
      { progress: 0.75, reward: 140, title: 'Nearly There' },
      { progress: 1.0, reward: 150, title: 'Quiz Genius' },
    ],
  },
  {
    id: 'boss-social-butterfly',
    name: '👥 The Connector',
    description: 'Collaborate with 10 different users on quests',
    difficulty: 'moderate',
    baseReward: 450,
    premiumBonus: 225,
    icon: '🤝',
    requirement: { type: 'collaborative_partners', target: 10 },
    milestones: [
      { progress: 0.25, reward: 100, title: 'Building Bonds' },
      { progress: 0.5, reward: 100, title: 'Network Growing' },
      { progress: 0.75, reward: 125, title: 'Well Connected' },
      { progress: 1.0, reward: 125, title: 'Social Master' },
    ],
  },
  {
    id: 'boss-collector-quest',
    name: '🃏 The Collector',
    description: 'Unlock 5 new collectible cards',
    difficulty: 'moderate',
    baseReward: 400,
    premiumBonus: 200,
    icon: '✨',
    requirement: { type: 'collectibles_unlocked', target: 5 },
    milestones: [
      { progress: 0.2, reward: 80, title: 'First Card' },
      { progress: 0.4, reward: 80, title: 'Building Collection' },
      { progress: 0.6, reward: 80, title: 'Impressive Haul' },
      { progress: 0.8, reward: 80, title: 'Almost Complete' },
      { progress: 1.0, reward: 100, title: 'Collection Curator' },
    ],
  },
  {
    id: 'boss-legend-slayer',
    name: '⚔️ The Legend Slayer',
    description: 'Earn 2000 XP in daily activities',
    difficulty: 'hard',
    baseReward: 700,
    premiumBonus: 350,
    icon: '👑',
    requirement: { type: 'total_xp', target: 2000 },
    milestones: [
      { progress: 0.25, reward: 175, title: 'Getting Momentum' },
      { progress: 0.5, reward: 175, title: 'Halfway To Glory' },
      { progress: 0.75, reward: 175, title: 'Almost Legendary' },
      { progress: 1.0, reward: 175, title: 'True Legend' },
    ],
  },
]

// ─── Boss Quest Management ─────────────────────────────────────────────────────

export function getWeeklyBossQuest(weekNumber = null) {
  const now = new Date()
  const week =
    weekNumber ?? Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
  const questIndex = week % BOSS_QUEST_POOL.length
  return BOSS_QUEST_POOL[questIndex]
}

export function getCurrentBossQuestSchedule(now = new Date()) {
  // Quests rotate weekly, starting Monday
  const monday = new Date(now)
  monday.setDate(monday.getDate() - monday.getDay() + 1)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const weekNumber = Math.floor(
    (monday.getTime() - new Date(monday.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000),
  )

  return {
    questId: getWeeklyBossQuest(weekNumber).id,
    startsAt: monday.toISOString(),
    endsAt: sunday.toISOString(),
    weekNumber,
  }
}

export function initializeBossQuestProgress(db, userId) {
  const schedule = getCurrentBossQuestSchedule()
  const quest = getWeeklyBossQuest(schedule.weekNumber)

  try {
    const existing = db.prepare(
      `SELECT id FROM user_boss_quests WHERE user_id = ? AND quest_id = ? AND week_number = ?`
    ).get(userId, quest.id, schedule.weekNumber)

    if (!existing) {
      db.prepare(
        `INSERT INTO user_boss_quests (user_id, quest_id, week_number, progress, claimed_rewards, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(userId, quest.id, schedule.weekNumber, 0, '[]', new Date().toISOString())
    }

    return true
  } catch (e) {
    console.error('Error initializing boss quest progress:', e)
    return false
  }
}

export function trackBossQuestProgress(db, userId, progressAmount) {
  const schedule = getCurrentBossQuestSchedule()
  const quest = getWeeklyBossQuest(schedule.weekNumber)

  try {
    db.prepare(
      `UPDATE user_boss_quests
       SET progress = progress + ? WHERE user_id = ? AND quest_id = ? AND week_number = ?`
    ).run(progressAmount, userId, quest.id, schedule.weekNumber)

    return getBossQuestProgress(db, userId, quest.id, schedule.weekNumber)
  } catch (e) {
    console.error('Error tracking boss quest progress:', e)
    return null
  }
}

export function getBossQuestProgress(db, userId, questId = null, weekNumber = null) {
  let quest, schedule

  if (questId && weekNumber !== null) {
    quest = BOSS_QUEST_POOL.find(q => q.id === questId)
    schedule = { questId, weekNumber }
  } else {
    schedule = getCurrentBossQuestSchedule()
    quest = getWeeklyBossQuest(schedule.weekNumber)
  }

  if (!quest) return null

  try {
    const result = db.prepare(
      `SELECT progress, claimed_rewards FROM user_boss_quests
       WHERE user_id = ? AND quest_id = ? AND week_number = ?`
    ).get(userId, quest.id, schedule.weekNumber)

    if (!result) {
      return {
        quest,
        progress: 0,
        progressPercent: 0,
        milestones: quest.milestones.map(m => ({
          ...m,
          claimed: false,
        })),
        completed: false,
        claimedMilestones: [],
        schedule,
      }
    }

    const progress = result.progress
    const progressPercent = Math.min((progress / quest.requirement.target) * 100, 100)
    const claimedRewards = JSON.parse(result.claimed_rewards || '[]')

    return {
      quest,
      progress,
      progressPercent: Math.round(progressPercent),
      milestones: quest.milestones.map(m => ({
        ...m,
        claimed: claimedRewards.includes(m.progress),
      })),
      completed: progress >= quest.requirement.target,
      claimedMilestones: claimedRewards,
      schedule,
    }
  } catch (e) {
    console.error('Error getting boss quest progress:', e)
    return null
  }
}

export function claimBossQuestReward(db, userId, questId, milestoneProgress, hasPremium = false) {
  const schedule = getCurrentBossQuestSchedule()
  const quest = BOSS_QUEST_POOL.find(q => q.id === questId)

  if (!quest) return false

  const milestone = quest.milestones.find(m => m.progress === milestoneProgress)
  if (!milestone) return false

  try {
    const result = db.prepare(
      `SELECT claimed_rewards FROM user_boss_quests
       WHERE user_id = ? AND quest_id = ? AND week_number = ?`
    ).get(userId, questId, schedule.weekNumber)

    const claimedRewards = JSON.parse(result?.claimed_rewards || '[]')
    if (claimedRewards.includes(milestoneProgress)) {
      return false // Already claimed
    }

    claimedRewards.push(milestoneProgress)
    const totalReward = milestone.reward + (hasPremium ? Math.floor(milestone.reward * 0.5) : 0)

    db.prepare(
      `UPDATE user_boss_quests
       SET claimed_rewards = ? WHERE user_id = ? AND quest_id = ? AND week_number = ?`
    ).run(JSON.stringify(claimedRewards), userId, questId, schedule.weekNumber)

    // Award reputation/XP
    db.prepare('UPDATE users SET reputation = reputation + ? WHERE id = ?').run(totalReward, userId)

    // Record in activity log
    db.prepare(
      `INSERT INTO user_activity_log (user_id, activity_type, data, created_at)
       VALUES (?, ?, ?, ?)`
    ).run(
      userId,
      'boss_quest_milestone',
      JSON.stringify({
        questId,
        milestone: milestone.title,
        reward: totalReward,
        weekNumber: schedule.weekNumber,
      }),
      new Date().toISOString(),
    )

    return true
  } catch (e) {
    console.error('Error claiming boss quest reward:', e)
    return false
  }
}

// ─── Boss Quest Leaderboard ────────────────────────────────────────────────────

export function getBossQuestLeaderboard(db, questId = null, weekNumber = null, limit = 10) {
  let schedule, quest

  if (questId && weekNumber !== null) {
    schedule = { questId, weekNumber }
    quest = BOSS_QUEST_POOL.find(q => q.id === questId)
  } else {
    schedule = getCurrentBossQuestSchedule()
    quest = getWeeklyBossQuest(schedule.weekNumber)
  }

  if (!quest) return []

  try {
    const results = db.prepare(
      `SELECT u.username, ubq.progress, ubq.claimed_rewards
       FROM user_boss_quests ubq
       JOIN users u ON ubq.user_id = u.id
       WHERE ubq.quest_id = ? AND ubq.week_number = ?
       ORDER BY ubq.progress DESC, ubq.created_at ASC
       LIMIT ?`
    ).all(quest.id, schedule.weekNumber, limit)

    return results.map((r, idx) => ({
      rank: idx + 1,
      username: r.username,
      progress: r.progress,
      progressPercent: Math.min((r.progress / quest.requirement.target) * 100, 100),
      milestonesCompleted: JSON.parse(r.claimed_rewards || '[]').length,
    }))
  } catch (e) {
    console.error('Error fetching boss quest leaderboard:', e)
    return []
  }
}

export function getBossQuestStats(db, userId) {
  try {
    const results = db.prepare(
      `SELECT quest_id, week_number, progress, claimed_rewards
       FROM user_boss_quests
       WHERE user_id = ? ORDER BY week_number DESC LIMIT 12`
    ).all(userId)

    const stats = {
      totalQuestsAttempted: results.length,
      totalQuestsCompleted: 0,
      totalRewardsClaimed: 0,
      completedQuests: [],
    }

    for (const row of results) {
      const quest = BOSS_QUEST_POOL.find(q => q.id === row.quest_id)
      if (!quest) continue

      const claimedRewards = JSON.parse(row.claimed_rewards || '[]')
      const isCompleted = row.progress >= quest.requirement.target

      if (isCompleted) {
        stats.totalQuestsCompleted++
        stats.completedQuests.push({
          questId: row.quest_id,
          questName: quest.name,
          weekNumber: row.week_number,
          claimedMilestones: claimedRewards.length,
        })
      }

      stats.totalRewardsClaimed += claimedRewards.length
    }

    return stats
  } catch (e) {
    console.error('Error fetching boss quest stats:', e)
    return {
      totalQuestsAttempted: 0,
      totalQuestsCompleted: 0,
      totalRewardsClaimed: 0,
      completedQuests: [],
    }
  }
}

export default {
  getWeeklyBossQuest,
  getCurrentBossQuestSchedule,
  initializeBossQuestProgress,
  trackBossQuestProgress,
  getBossQuestProgress,
  claimBossQuestReward,
  getBossQuestLeaderboard,
  getBossQuestStats,
  BOSS_QUEST_POOL,
}
