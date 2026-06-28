# Wave 6 Phase 2: Gamification Features API Documentation

## Overview

This document describes the API endpoints for Wave 6 Phase 2 gamification features:

1. **Seasonal Achievements** - Time-limited seasonal challenges with expiry dates
2. **Tier-Up Animations** - Particle effects, confetti, and sound when leveling up
3. **Battle Pass Premium Path** - Dual progression trees (free and paid)
4. **Social Achievements** - Rewards for group activities and collaboration
5. **Challenge Boss Quests** - Weekly mega-quests with progression bars

---

## 1. Seasonal Achievements API

### Get Active Seasonal Challenges

**Endpoint:** `GET /api/gamification/seasonal-achievements`

**Response:**
```json
{
  "seasons": [
    {
      "id": "winter2026",
      "name": "Winter Hunt 2026",
      "icon": "❄️",
      "expiresAt": 1743379200000,
      "challenges": [
        {
          "id": "ach-seasonal-read10",
          "title": "Winter Reader",
          "description": "Read 10 articles in Winter 2026",
          "icon": "📖",
          "xp": 50,
          "rarity": "common",
          "progress": 7,
          "unlocked": false
        }
      ]
    }
  ]
}
```

### Claim Seasonal Achievement

**Endpoint:** `POST /api/gamification/seasonal-achievements/:challengeId/claim`

**Request Body:**
```json
{
  "seasonId": "winter2026"
}
```

**Response:**
```json
{
  "success": true,
  "xpAwarded": 50,
  "achievement": {
    "id": "ach-seasonal-read10",
    "title": "Winter Reader",
    "unlockedAt": "2026-02-15T10:30:00Z"
  }
}
```

---

## 2. Tier-Up System API

### Get Current Tier Status

**Endpoint:** `GET /api/gamification/tier-status`

**Response:**
```json
{
  "currentTier": {
    "tier": 3,
    "name": "Journeyman",
    "reward": "Gold Badge",
    "minXp": 300
  },
  "nextTier": {
    "tier": 4,
    "name": "Expert",
    "reward": "Platinum Badge",
    "minXp": 700
  },
  "progress": 65,
  "xpToNext": 350,
  "xpInCurrent": 250
}
```

### Trigger Tier-Up Animation (Client-side)

**Frontend Component:** `TierUpAnimation`

**Props:**
```typescript
interface TierUpAnimationProps {
  isVisible: boolean
  fromTier: string
  toTier: string
  reward: string
  onComplete?: () => void
}
```

**Usage:**
```typescript
import { TierUpAnimation } from '@/components/TierUpAnimation'

<TierUpAnimation
  isVisible={tierUpDetected}
  fromTier="Journeyman"
  toTier="Expert"
  reward="Platinum Badge"
  onComplete={() => setTierUpDetected(false)}
/>
```

---

## 3. Battle Pass API

### Get Battle Pass Status

**Endpoint:** `GET /api/gamification/battle-pass`

**Response:**
```json
{
  "season": {
    "id": "season1",
    "name": "Vice City Awakening",
    "number": 1,
    "totalLevels": 100,
    "icon": "🎮"
  },
  "level": 25,
  "xp": 500,
  "hasPremium": false,
  "freeRewards": [
    {
      "level": 1,
      "reward": "Welcome Avatar Frame",
      "type": "cosmetic",
      "rarity": "common"
    }
  ],
  "premiumRewards": [],
  "nextMilestone": 50
}
```

### Add Battle Pass XP

**Endpoint:** `POST /api/gamification/battle-pass/add-xp`

**Request Body:**
```json
{
  "xpAmount": 100
}
```

**Response:**
```json
{
  "level": 26,
  "xp": 600,
  "leveledUp": false
}
```

### Purchase Premium Tier

**Endpoint:** `POST /api/gamification/battle-pass/purchase-premium`

**Request Body:**
```json
{
  "paymentToken": "tok_xxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "hasPremium": true,
  "premiumRewards": [
    {
      "level": 1,
      "reward": "Premium Avatar Frame (Glowing)",
      "type": "cosmetic",
      "rarity": "rare"
    }
  ]
}
```

### Claim Battle Pass Reward

**Endpoint:** `POST /api/gamification/battle-pass/claim-reward`

**Request Body:**
```json
{
  "level": 10,
  "isPremium": false
}
```

**Response:**
```json
{
  "success": true,
  "reward": {
    "level": 10,
    "reward": "Common Collectible Card",
    "type": "collectible",
    "rarity": "common"
  }
}
```

---

## 4. Social Achievements API

### Get Social Achievements Progress

**Endpoint:** `GET /api/gamification/social-achievements`

**Response:**
```json
{
  "achievements": [
    {
      "id": "soc-invite-friend",
      "title": "Friend Bringer",
      "description": "Invite 1 friend to the community",
      "icon": "👋",
      "xp": 30,
      "rarity": "common",
      "progress": {
        "current": 3,
        "target": 1,
        "unlocked": true
      }
    }
  ],
  "stats": {
    "friendCount": 5,
    "groupCount": 2,
    "totalXpEarned": 450
  }
}
```

### Invite Friend

**Endpoint:** `POST /api/gamification/social-achievements/invite-friend`

**Request Body:**
```json
{
  "friendUserId": "user_xyz"
}
```

**Response:**
```json
{
  "success": true,
  "friendshipCreated": true,
  "achievementProgress": {
    "id": "soc-invite-friend",
    "current": 1,
    "target": 1,
    "unlocked": true
  }
}
```

### Create Group

**Endpoint:** `POST /api/gamification/social-achievements/create-group`

**Request Body:**
```json
{
  "name": "GTA6 Enthusiasts",
  "description": "A group for GTA6 fans"
}
```

**Response:**
```json
{
  "groupId": "group_abc123",
  "name": "GTA6 Enthusiasts",
  "creatorId": "user_xyz",
  "createdAt": "2026-02-15T10:30:00Z"
}
```

### Join Group

**Endpoint:** `POST /api/gamification/social-achievements/join-group/:groupId`

**Response:**
```json
{
  "success": true,
  "groupMembership": {
    "groupId": "group_abc123",
    "role": "member",
    "joinedAt": "2026-02-15T10:30:00Z"
  }
}
```

### Create Collaborative Quest

**Endpoint:** `POST /api/gamification/social-achievements/collaborative-quest`

**Request Body:**
```json
{
  "title": "The Grand Hunt",
  "description": "Hunt for treasures together",
  "goalXp": 5000,
  "participantIds": ["user_1", "user_2", "user_3"]
}
```

**Response:**
```json
{
  "questId": "quest_def456",
  "title": "The Grand Hunt",
  "goalXp": 5000,
  "participants": 3,
  "createdAt": "2026-02-15T10:30:00Z"
}
```

---

## 5. Boss Quest API

### Get Current Boss Quest

**Endpoint:** `GET /api/gamification/boss-quest`

**Response:**
```json
{
  "quest": {
    "id": "boss-read-marathon",
    "name": "📖 The Historian",
    "description": "Read 50 articles this week",
    "icon": "📚",
    "difficulty": "hard",
    "baseReward": 500,
    "premiumBonus": 250,
    "progress": 23,
    "progressPercent": 46,
    "completed": false,
    "milestones": [
      {
        "progress": 0.25,
        "reward": 100,
        "title": "Quarter Done",
        "claimed": false
      }
    ],
    "schedule": {
      "startsAt": "2026-02-16T00:00:00Z",
      "endsAt": "2026-02-22T23:59:59Z",
      "weekNumber": 7
    }
  }
}
```

### Track Boss Quest Progress

**Endpoint:** `POST /api/gamification/boss-quest/progress`

**Request Body:**
```json
{
  "progressDelta": 5
}
```

**Response:**
```json
{
  "progress": 28,
  "progressPercent": 56,
  "milestoneClaimed": true,
  "milestoneReward": 100
}
```

### Claim Boss Quest Milestone

**Endpoint:** `POST /api/gamification/boss-quest/claim-milestone`

**Request Body:**
```json
{
  "milestoneProgress": 0.5
}
```

**Response:**
```json
{
  "success": true,
  "reward": 150,
  "milestone": {
    "progress": 0.5,
    "title": "Halfway There",
    "reward": 150
  }
}
```

### Get Boss Quest Leaderboard

**Endpoint:** `GET /api/gamification/boss-quest/leaderboard`

**Query Parameters:**
- `limit` (optional, default 10)

**Response:**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "username": "ProGamer99",
      "progress": 48,
      "progressPercent": 96,
      "milestonesCompleted": 4
    },
    {
      "rank": 2,
      "username": "GTAFanatic",
      "progress": 35,
      "progressPercent": 70,
      "milestonesCompleted": 3
    }
  ],
  "weekNumber": 7
}
```

### Get Boss Quest Stats

**Endpoint:** `GET /api/gamification/boss-quest/stats`

**Response:**
```json
{
  "stats": {
    "totalQuestsAttempted": 7,
    "totalQuestsCompleted": 5,
    "totalRewardsClaimed": 28,
    "completedQuests": [
      {
        "questId": "boss-read-marathon",
        "questName": "The Historian",
        "weekNumber": 1,
        "claimedMilestones": 4
      }
    ]
  }
}
```

---

## Frontend Components

All components are located in `/src/components/`:

### SeasonalAchievements
```typescript
<SeasonalAchievements
  seasons={seasons}
  onClaimReward={(challengeId) => {}}
/>
```

### TierUpAnimation
```typescript
<TierUpAnimation
  isVisible={tierUpDetected}
  fromTier="Journeyman"
  toTier="Expert"
  reward="Platinum Badge"
  onComplete={() => {}}
/>
```

### BattlePassDisplay
```typescript
<BattlePassDisplay
  battlePass={battlePassData}
  onPurchasePremium={() => {}}
  onClaimReward={(level, isPremium) => {}}
/>
```

### SocialAchievements
```typescript
<SocialAchievements
  achievements={achievements}
  onInviteFriend={() => {}}
  onJoinGroup={() => {}}
  onCreateGroup={() => {}}
/>
```

### BossQuestTracker
```typescript
<BossQuestTracker
  quest={questData}
  leaderboard={leaderboard}
  onClaimMilestone={(progress) => {}}
/>
```

---

## Database Schema Requirements

Ensure the following tables exist:

```sql
-- Achievements
CREATE TABLE user_achievements (
  user_id TEXT,
  achievement_id TEXT,
  unlocked_at TEXT,
  PRIMARY KEY(user_id, achievement_id)
);

CREATE TABLE user_milestones (
  user_id TEXT,
  milestone_id TEXT,
  data TEXT,
  created_at TEXT
);

-- Battle Pass
CREATE TABLE user_battle_pass (
  user_id TEXT,
  season_id TEXT,
  level INTEGER,
  xp INTEGER,
  premium INTEGER,
  PRIMARY KEY(user_id, season_id)
);

CREATE TABLE user_claimed_rewards (
  user_id TEXT,
  reward_id TEXT,
  reward_level INTEGER,
  is_premium INTEGER,
  claimed_at TEXT
);

-- Social
CREATE TABLE user_friends (
  user_id TEXT,
  friend_id TEXT,
  added_at TEXT,
  PRIMARY KEY(user_id, friend_id)
);

CREATE TABLE user_groups (
  id TEXT PRIMARY KEY,
  creator_id TEXT,
  name TEXT,
  description TEXT,
  created_at TEXT
);

CREATE TABLE group_members (
  group_id TEXT,
  user_id TEXT,
  role TEXT,
  joined_at TEXT,
  PRIMARY KEY(group_id, user_id)
);

CREATE TABLE user_activity_metrics (
  user_id TEXT,
  metric_name TEXT,
  value INTEGER,
  updated_at TEXT,
  PRIMARY KEY(user_id, metric_name)
);

-- Boss Quests
CREATE TABLE user_boss_quests (
  user_id TEXT,
  quest_id TEXT,
  week_number INTEGER,
  progress INTEGER,
  claimed_rewards TEXT,
  created_at TEXT,
  PRIMARY KEY(user_id, quest_id, week_number)
);
```

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "error": {
    "code": "ACHIEVEMENT_NOT_FOUND",
    "message": "The requested achievement does not exist",
    "status": 404
  }
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (e.g., already claimed)
- `500` - Server Error

---

## Testing

Run tests with:
```bash
npm test -- server/achievements.test.mjs
npm test -- server/battlePass.test.mjs
npm test -- server/socialAchievements.test.mjs
npm test -- server/bossQuests.test.mjs
```

All tests use Vitest and SQLite in-memory databases for isolation.
