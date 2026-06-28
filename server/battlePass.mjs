/**
 * Wave 6 Phase 2: Battle Pass Premium Path System
 * Dual progression trees with free tier and premium paid tier.
 * Each tier has unique rewards, cosmetics, and XP boosts.
 */

// ─── Battle Pass Configuration ─────────────────────────────────────────────────

const BATTLE_PASS_SEASONS = {
  season1: {
    id: 'season1',
    name: 'Vice City Awakening',
    number: 1,
    startDate: '2026-01-15',
    endDate: '2026-04-14',
    totalLevels: 100,
    freeReward: 'unlock cosmetics on free tier',
    premiumPrice: 999, // in cents or game currency units
    icon: '🎮',
  },
  season2: {
    id: 'season2',
    name: 'The Streets Rise Up',
    number: 2,
    startDate: '2026-04-15',
    endDate: '2026-07-14',
    totalLevels: 100,
    freeReward: 'unlock cosmetics on free tier',
    premiumPrice: 999,
    icon: '🌆',
  },
}

// ─── Free Tier Rewards (accessible to all players) ────────────────────────────

const FREE_TIER_REWARDS = [
  { level: 1, reward: 'Welcome Avatar Frame', type: 'cosmetic', rarity: 'common' },
  { level: 5, reward: '50 XP Boost', type: 'boost', rarity: 'common' },
  { level: 10, reward: 'Common Collectible Card', type: 'collectible', rarity: 'common' },
  { level: 15, reward: 'Profile Banner: Basic', type: 'cosmetic', rarity: 'common' },
  { level: 20, reward: 'Comment Badge: Free Tier', type: 'cosmetic', rarity: 'common' },
  { level: 25, reward: '100 XP Boost', type: 'boost', rarity: 'common' },
  { level: 30, reward: 'Rare Collectible Card', type: 'collectible', rarity: 'rare' },
  { level: 40, reward: 'Profile Title: Traveler', type: 'cosmetic', rarity: 'common' },
  { level: 50, reward: '200 XP Boost', type: 'boost', rarity: 'rare' },
  { level: 60, reward: 'Avatar Frame: Neon', type: 'cosmetic', rarity: 'rare' },
  { level: 75, reward: 'Legendary Collectible Card', type: 'collectible', rarity: 'legendary' },
  { level: 100, reward: 'Season 1 Completion Badge', type: 'cosmetic', rarity: 'legendary' },
]

// ─── Premium Tier Rewards (paid tier exclusive) ────────────────────────────────

const PREMIUM_TIER_REWARDS = [
  { level: 1, reward: 'Premium Avatar Frame (Glowing)', type: 'cosmetic', rarity: 'rare' },
  { level: 2, reward: '2x XP Boost for 7 days', type: 'boost', rarity: 'rare' },
  { level: 3, reward: 'Premium Skin: Neon Nights', type: 'cosmetic', rarity: 'legendary' },
  { level: 5, reward: '500 Premium Currency', type: 'currency', rarity: 'legendary' },
  { level: 10, reward: 'Exclusive Title: Elite', type: 'cosmetic', rarity: 'legendary' },
  { level: 15, reward: '2x XP Boost for 7 days', type: 'boost', rarity: 'rare' },
  { level: 20, reward: 'Premium Comment Badge (Gold)', type: 'cosmetic', rarity: 'legendary' },
  { level: 25, reward: '1000 Premium Currency', type: 'currency', rarity: 'legendary' },
  { level: 30, reward: 'Exclusive Collectible: Vice King', type: 'collectible', rarity: 'legendary' },
  { level: 40, reward: 'Premium Profile Theme: Dark Mode Elite', type: 'cosmetic', rarity: 'legendary' },
  { level: 50, reward: '2000 Premium Currency', type: 'currency', rarity: 'legendary' },
  { level: 60, reward: 'Animated Avatar: Vice Neon', type: 'cosmetic', rarity: 'legendary' },
  { level: 75, reward: 'Exclusive Boss Quest Pass: 3 weeks', type: 'quest', rarity: 'legendary' },
  { level: 100, reward: 'Prestige Crown + 5000 Premium Currency', type: 'legendary', rarity: 'legendary' },
]

export function getActiveBattlePass(now = new Date()) {
  const nowStr = now.toISOString().split('T')[0]
  for (const [_key, season] of Object.entries(BATTLE_PASS_SEASONS)) {
    if (nowStr >= season.startDate && nowStr <= season.endDate) {
      return season
    }
  }
  return BATTLE_PASS_SEASONS.season1 // default to season 1
}

export function getBattlePassStatus(db, userId, seasonId = null) {
  const season = seasonId ? BATTLE_PASS_SEASONS[seasonId] : getActiveBattlePass()
  if (!season) return null

  try {
    const result = db.prepare(
      `SELECT level, xp, premium, season_id FROM user_battle_pass
       WHERE user_id = ? AND season_id = ?`
    ).get(userId, season.id)

    const level = result?.level ?? 1
    const xp = result?.xp ?? 0
    const hasPremium = result?.premium ?? false

    return {
      season,
      level,
      xp,
      hasPremium,
      freeRewards: getFreeRewardsUpToLevel(level),
      premiumRewards: hasPremium ? getPremiumRewardsUpToLevel(level) : [],
      nextMilestone: getNextMilestone(level),
    }
  } catch (e) {
    console.error('Error fetching battle pass status:', e)
    return null
  }
}

export function getFreeRewardsUpToLevel(level) {
  return FREE_TIER_REWARDS.filter(r => r.level <= level)
}

export function getPremiumRewardsUpToLevel(level) {
  return PREMIUM_TIER_REWARDS.filter(r => r.level <= level)
}

export function getNextMilestone(currentLevel) {
  const milestones = [5, 10, 25, 50, 75, 100]
  const next = milestones.find(m => m > currentLevel)
  return next || null
}

export function addBattlePassXp(db, userId, xpAmount, seasonId = null) {
  const season = seasonId ? BATTLE_PASS_SEASONS[seasonId] : getActiveBattlePass()
  if (!season) return null

  try {
    // Get current progress
    let result = db.prepare(
      `SELECT level, xp FROM user_battle_pass
       WHERE user_id = ? AND season_id = ?`
    ).get(userId, season.id)

    if (!result) {
      db.prepare(
        `INSERT INTO user_battle_pass (user_id, season_id, level, xp, premium)
         VALUES (?, ?, 1, ?, 0)`
      ).run(userId, season.id, xpAmount)
      result = { level: 1, xp: xpAmount }
    } else {
      const newXp = result.xp + xpAmount
      const newLevel = Math.min(Math.floor(newXp / 1000) + 1, season.totalLevels)
      db.prepare(
        `UPDATE user_battle_pass
         SET xp = ?, level = ? WHERE user_id = ? AND season_id = ?`
      ).run(newXp, newLevel, userId, season.id)
      result = { level: newLevel, xp: newXp % 1000 }
    }

    return result
  } catch (e) {
    console.error('Error adding battle pass XP:', e)
    return null
  }
}

export function purchasePremiumTier(db, userId, seasonId = null) {
  const season = seasonId ? BATTLE_PASS_SEASONS[seasonId] : getActiveBattlePass()
  if (!season) return false

  try {
    // In real implementation, integrate with payment processor
    db.prepare(
      `UPDATE user_battle_pass
       SET premium = 1 WHERE user_id = ? AND season_id = ?`
    ).run(userId, season.id)
    return true
  } catch (e) {
    console.error('Error purchasing premium tier:', e)
    return false
  }
}

export function claimBattlePassReward(db, userId, rewardLevel, isPremium = false) {
  const rewards = isPremium ? PREMIUM_TIER_REWARDS : FREE_TIER_REWARDS
  const reward = rewards.find(r => r.level === rewardLevel)

  if (!reward) return false

  try {
    db.prepare(
      `INSERT INTO user_claimed_rewards (user_id, reward_id, reward_level, is_premium, claimed_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(userId, `reward_${rewardLevel}`, rewardLevel, isPremium ? 1 : 0, new Date().toISOString())
    return true
  } catch (e) {
    console.error('Error claiming reward:', e)
    return false
  }
}

export function getClaimedRewards(db, userId, seasonId = null) {
  const season = seasonId ? BATTLE_PASS_SEASONS[seasonId] : getActiveBattlePass()
  if (!season) return []

  try {
    const results = db.prepare(
      `SELECT reward_level, is_premium, claimed_at FROM user_claimed_rewards
       WHERE user_id = ? ORDER BY claimed_at DESC LIMIT 50`
    ).all(userId)

    return results.map(r => ({
      level: r.reward_level,
      isPremium: !!r.is_premium,
      claimedAt: r.claimed_at,
    }))
  } catch (e) {
    console.error('Error fetching claimed rewards:', e)
    return []
  }
}

export default {
  getActiveBattlePass,
  getBattlePassStatus,
  getFreeRewardsUpToLevel,
  getPremiumRewardsUpToLevel,
  getNextMilestone,
  addBattlePassXp,
  purchasePremiumTier,
  claimBattlePassReward,
  getClaimedRewards,
  BATTLE_PASS_SEASONS,
  FREE_TIER_REWARDS,
  PREMIUM_TIER_REWARDS,
}
