/**
 * Gamification & Rewards Service — Wave 5
 * All persistence via localStorage. Deterministic where possible.
 */
import { readJSON, writeJSON } from './storage'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  xp: number
  unlockedAt?: number
}

export interface Quest {
  id: string
  title: string
  description: string
  xp: number
  progress: number
  target: number
  expiresAt: number
}

export interface UserStats {
  xp: number
  level: number
  streak: number
  achievements: string[]
  questsCompleted: number
}

export interface SeasonTier {
  level: number
  reward: string
  unlocked: boolean
}

export interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
}

export interface Collectible {
  id: string
  name: string
  rarity: 'common' | 'rare' | 'legendary'
  icon: string
  unlockedAt?: number
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'ach-first-read', title: 'Erstes Mal', description: 'Lese deinen ersten Artikel.', icon: '📖', xp: 10 },
  { id: 'ach-bookworm', title: 'Bücherwurm', description: '10 Artikel gelesen.', icon: '📚', xp: 25 },
  { id: 'ach-scholar', title: 'Gelehrter', description: '50 Artikel gelesen.', icon: '🎓', xp: 50 },
  { id: 'ach-first-comment', title: 'Erstes Wort', description: 'Ersten Kommentar gepostet.', icon: '💬', xp: 10 },
  { id: 'ach-chatterbox', title: 'Vielredner', description: '25 Kommentare gepostet.', icon: '🗣️', xp: 40 },
  { id: 'ach-debate', title: 'Debattierer', description: '100 Kommentare gepostet.', icon: '⚡', xp: 100 },
  { id: 'ach-liker', title: 'Daumen hoch', description: 'Ersten Artikel geliked.', icon: '👍', xp: 5 },
  { id: 'ach-bookmark', title: 'Sammelsurium', description: '5 Artikel gebookmarkt.', icon: '🔖', xp: 15 },
  { id: 'ach-streak-3', title: '3-Tage-Streak', description: '3 Tage in Folge aktiv.', icon: '🔥', xp: 20 },
  { id: 'ach-streak-7', title: 'Wochenwächter', description: '7 Tage in Folge aktiv.', icon: '🌟', xp: 50 },
  { id: 'ach-streak-30', title: 'Monatsfanatiker', description: '30 Tage in Folge aktiv.', icon: '💫', xp: 200 },
  { id: 'ach-quiz-master', title: 'Quiz-König', description: '10 Quiz-Fragen richtig beantwortet.', icon: '🧠', xp: 75 },
  { id: 'ach-bingo', title: 'Bingo!', description: 'Erstes Bingo beim Trailer.', icon: '🎯', xp: 30 },
  { id: 'ach-group-join', title: 'Teamplayer', description: 'Erster Gruppen-Beitritt.', icon: '👥', xp: 10 },
  { id: 'ach-group-create', title: 'Anführer', description: 'Erste eigene Gruppe erstellt.', icon: '🏴', xp: 25 },
  { id: 'ach-vote', title: 'Demokrat', description: 'Erste Community-Abstimmung.', icon: '🗳️', xp: 10 },
  { id: 'ach-collection', title: 'Kurator', description: 'Erste Sammlung geteilt.', icon: '🗂️', xp: 20 },
  { id: 'ach-invite', title: 'Einlader', description: 'Ersten Freund eingeladen.', icon: '📨', xp: 30 },
  { id: 'ach-level5', title: 'Aufsteiger', description: 'Level 5 erreicht.', icon: '🆙', xp: 0 },
  { id: 'ach-level10', title: 'Veteran', description: 'Level 10 erreicht.', icon: '🏆', xp: 0 },
  { id: 'ach-season1', title: 'Season 1 Held', description: 'Battle Pass Season 1 abgeschlossen.', icon: '🎖️', xp: 150 },
  { id: 'ach-collector', title: 'Sammler', description: '5 Sammelkarten entsperrt.', icon: '🃏', xp: 50 },
  { id: 'ach-legendary', title: 'Legendäre Karte', description: 'Erste legendäre Karte erhalten.', icon: '✨', xp: 100 },
  { id: 'ach-daily7', title: 'Wochenquest', description: '7 Tagesquests abgeschlossen.', icon: '📋', xp: 60 },
  { id: 'ach-birthday', title: 'Happy Birthday!', description: '1 Jahr dabei.', icon: '🎂', xp: 100 },
]

// ─── Levels ───────────────────────────────────────────────────────────────────

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000]
const LEVEL_TITLES = [
  'Neuling', 'Einsteiger', 'Regulärer', 'Kenner', 'Fan',
  'Enthusiast', 'Experte', 'Veteran', 'Elite', 'Legende',
]

export function getLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]
}

export function getLevelThreshold(level: number): number {
  return LEVEL_THRESHOLDS[Math.min(level - 1, LEVEL_THRESHOLDS.length - 1)] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
}

export function getNextLevelThreshold(level: number): number {
  return LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length - 1)] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
}

// ─── User Stats ───────────────────────────────────────────────────────────────

export function getUserStats(): UserStats {
  const stored = readJSON<Partial<UserStats>>('gamification:stats', {})
  const xp = stored.xp ?? 0
  return {
    xp,
    level: getLevel(xp),
    streak: stored.streak ?? 0,
    achievements: stored.achievements ?? [],
    questsCompleted: stored.questsCompleted ?? 0,
  }
}

export function addXp(amount: number, reason?: string): UserStats {
  void reason
  const stats = getUserStats()
  const newXp = stats.xp + amount
  const newStats: UserStats = {
    ...stats,
    xp: newXp,
    level: getLevel(newXp),
  }
  writeJSON('gamification:stats', newStats)
  checkAndUnlockAchievements(newStats)
  return newStats
}

export function checkAndUnlockAchievements(stats: UserStats): string[] {
  const toCheck: Array<{ id: string; condition: (s: UserStats) => boolean }> = [
    { id: 'ach-level5', condition: (s) => s.level >= 5 },
    { id: 'ach-level10', condition: (s) => s.level >= 10 },
    { id: 'ach-streak-3', condition: (s) => s.streak >= 3 },
    { id: 'ach-streak-7', condition: (s) => s.streak >= 7 },
    { id: 'ach-streak-30', condition: (s) => s.streak >= 30 },
    { id: 'ach-daily7', condition: (s) => s.questsCompleted >= 7 },
  ]

  const newlyUnlocked: string[] = []
  const current = readJSON<Partial<UserStats>>('gamification:stats', {})
  const unlocked = new Set(current.achievements ?? [])

  for (const { id, condition } of toCheck) {
    if (!unlocked.has(id) && condition(stats)) {
      unlocked.add(id)
      newlyUnlocked.push(id)
    }
  }

  if (newlyUnlocked.length > 0) {
    writeJSON('gamification:stats', { ...current, achievements: Array.from(unlocked) })
  }

  return newlyUnlocked
}

export function unlockAchievement(id: string): void {
  const stats = readJSON<Partial<UserStats>>('gamification:stats', {})
  const achievements = stats.achievements ?? []
  if (!achievements.includes(id)) {
    writeJSON('gamification:stats', { ...stats, achievements: [...achievements, id] })
  }
}

// ─── Daily Quests ─────────────────────────────────────────────────────────────

const QUEST_POOL = [
  { id: 'q-read3', title: '3 Artikel lesen', description: 'Lies heute 3 beliebige Artikel.', xp: 20, target: 3 },
  { id: 'q-comment1', title: 'Kommentar posten', description: 'Hinterlasse einen Kommentar.', xp: 15, target: 1 },
  { id: 'q-vote', title: 'Abstimmen', description: 'Nimm an einer Community-Abstimmung teil.', xp: 10, target: 1 },
  { id: 'q-bookmark', title: 'Artikel merken', description: 'Bookmark einen Artikel.', xp: 10, target: 1 },
  { id: 'q-share', title: 'Teilen', description: 'Teile einen Artikel.', xp: 15, target: 1 },
  { id: 'q-quiz', title: 'Quiz spielen', description: 'Beantworte 3 Quiz-Fragen richtig.', xp: 25, target: 3 },
  { id: 'q-react', title: 'Reagieren', description: 'Reagiere auf 3 Kommentare mit Emojis.', xp: 10, target: 3 },
  { id: 'q-streak', title: 'Tagesbesuch', description: 'Besuche den Hub heute.', xp: 5, target: 1 },
]

function dayIndex(date: string): number {
  return Math.floor(new Date(date).getTime() / (24 * 60 * 60 * 1000))
}

export function getDailyQuests(date = new Date().toISOString().slice(0, 10)): Quest[] {
  const idx = dayIndex(date)
  const progress = readJSON<Record<string, number>>('gamification:questProgress', {})
  const tomorrow = new Date(date)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const expiresAt = tomorrow.getTime()

  // Pick 3 quests deterministically
  const picks = [
    QUEST_POOL[idx % QUEST_POOL.length],
    QUEST_POOL[(idx + 3) % QUEST_POOL.length],
    QUEST_POOL[(idx + 5) % QUEST_POOL.length],
  ]

  return picks.map((q) => ({
    ...q,
    progress: progress[`${date}:${q.id}`] ?? 0,
    expiresAt,
  }))
}

export function updateQuestProgress(questId: string, delta: number): Quest[] {
  const date = new Date().toISOString().slice(0, 10)
  const progress = readJSON<Record<string, number>>('gamification:questProgress', {})
  const key = `${date}:${questId}`
  progress[key] = (progress[key] ?? 0) + delta
  writeJSON('gamification:questProgress', progress)

  // Check if completed and award XP
  const quests = getDailyQuests(date)
  const quest = quests.find((q) => q.id === questId)
  if (quest && progress[key] >= quest.target && progress[key] - delta < quest.target) {
    addXp(quest.xp, `Quest: ${quest.title}`)
    unlockAchievement('ach-daily7')
    const stats = readJSON<Partial<UserStats>>('gamification:stats', {})
    writeJSON('gamification:stats', { ...stats, questsCompleted: (stats.questsCompleted ?? 0) + 1 })
  }

  return getDailyQuests(date)
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

const DEMO_NAMES = [
  'Vice_Fan99', 'LeonaMiami', 'RockstarWatcher', 'TheoryMaster', 'MiamiMapper',
  'SoundtrackGuru', 'NightlifeKing', 'TrailerHawk', 'LeakDetector', 'GTA6Oracle',
  'PixelPatrol', 'NeonRider', 'ViceViper', 'CrimsonKeys', 'SunsetStriker',
  'OceanDrifter', 'GoldCoast99', 'NightCrawler', 'StormChaser', 'HeatWave42',
]

function deterministicXp(seed: number, base: number): number {
  return base - ((seed * 137 + seed * seed * 7) % (base / 2))
}

export function getLeaderboard(
  period: 'weekly' | 'monthly' | 'alltime',
): Array<{ rank: number; name: string; xp: number; level: number }> {
  const base = period === 'weekly' ? 500 : period === 'monthly' ? 3000 : 15000
  const myStats = getUserStats()

  const entries = DEMO_NAMES.slice(0, 15).map((name, i) => ({
    name,
    xp: Math.max(10, deterministicXp(i + 1, base)),
    level: 0,
  }))

  // Insert "me" with real XP
  entries.push({ name: 'Du', xp: myStats.xp, level: myStats.level })
  entries.sort((a, b) => b.xp - a.xp)

  return entries.map((e, i) => ({
    rank: i + 1,
    name: e.name,
    xp: e.xp,
    level: e.level || getLevel(e.xp),
  }))
}

// ─── Battle Pass ──────────────────────────────────────────────────────────────

const SEASON_REWARDS = [
  'Bronze-Abzeichen',
  'Kommentar-Flair „Season 1"',
  'Avatar-Rahmen: Vice Neon',
  'Profil-Skin: Miami Sunset',
  'Animiertes Abzeichen: Flammen',
  'Exklusive Sammelkarte: Lucia',
  'Rang-Insignie: Season-1-Held',
  'Lootbox: 3 Karten',
  'XP-Boost x2 (24h)',
  'Legendäre Karte: Erstes Motorrad',
]

export function getSeasonTiers(): SeasonTier[] {
  const stats = getUserStats()
  const seasonXp = stats.xp

  return SEASON_REWARDS.map((reward, i) => {
    const tierXp = (i + 1) * 200
    return {
      level: i + 1,
      reward,
      unlocked: seasonXp >= tierXp,
    }
  })
}

export function getSeasonProgress(): { level: number; xp: number; nextLevelXp: number } {
  const stats = getUserStats()
  const seasonXp = stats.xp
  const currentTier = Math.min(Math.floor(seasonXp / 200), SEASON_REWARDS.length - 1)
  return {
    level: currentTier,
    xp: seasonXp % 200,
    nextLevelXp: 200,
  }
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: 'In welcher Stadt spielt GTA VI hauptsächlich?',
    options: ['Liberty City', 'Los Santos', 'Vice City', 'Carcer City'],
    correctIndex: 2,
  },
  {
    question: 'Wie heißt die weibliche Hauptfigur in GTA VI?',
    options: ['Catalina', 'Lucia', 'Maria', 'Carmen'],
    correctIndex: 1,
  },
  {
    question: 'Wann wurde der erste offizielle GTA VI Trailer veröffentlicht?',
    options: ['2022', '2023', '2024', '2025'],
    correctIndex: 1,
  },
  {
    question: 'Welches Entwicklerstudio macht GTA VI?',
    options: ['CD Projekt Red', 'Naughty Dog', 'Rockstar Games', 'Ubisoft'],
    correctIndex: 2,
  },
  {
    question: 'Welches Bundesland/welcher US-Staat inspiriert Vice City?',
    options: ['Kalifornien', 'Texas', 'New York', 'Florida'],
    correctIndex: 3,
  },
  {
    question: 'GTA steht für …?',
    options: ['Grand Theft Automobile', 'Grand Theft Auto', 'Grand Tactical Action', 'Game Theft Arena'],
    correctIndex: 1,
  },
  {
    question: 'Welche GTA-VI-Figur taucht im ersten Trailer neben Lucia auf?',
    options: ['Trevor', 'Jason', 'Michael', 'Victor'],
    correctIndex: 1,
  },
  {
    question: 'Auf welcher Konsolen-Generation erscheint GTA VI zuerst?',
    options: ['PS4/Xbox One', 'PS5/Xbox Series X', 'PC only', 'Nintendo Switch'],
    correctIndex: 1,
  },
  {
    question: 'Welche reale Stadt dient als Hauptvorbild für Vice City in GTA VI?',
    options: ['Tampa', 'Orlando', 'Miami', 'Fort Lauderdale'],
    correctIndex: 2,
  },
  {
    question: 'In welchem Jahr fand das bisher größte GTA-VI-Leak statt?',
    options: ['2020', '2021', '2022', '2023'],
    correctIndex: 2,
  },
  {
    question: 'Welches Musikgenre prägt Vice City besonders?',
    options: ['Hip-Hop der 90er', 'Rock der 80er', 'Miami Bass & Synthwave', 'Country'],
    correctIndex: 2,
  },
  {
    question: 'Für welche Plattform wurde GTA VI zuerst angekündigt?',
    options: ['PC', 'iOS', 'Konsolen (PS5/XSX)', 'Stadia'],
    correctIndex: 2,
  },
]

export function getQuizQuestion(seed: number): QuizQuestion {
  return QUIZ_QUESTIONS[((seed % QUIZ_QUESTIONS.length) + QUIZ_QUESTIONS.length) % QUIZ_QUESTIONS.length]
}

// ─── Collectibles ─────────────────────────────────────────────────────────────

export const COLLECTIBLES: Collectible[] = [
  { id: 'c-lucia', name: 'Lucia', rarity: 'legendary', icon: '🌟' },
  { id: 'c-jason', name: 'Jason', rarity: 'rare', icon: '🔫' },
  { id: 'c-vice', name: 'Vice City Skyline', rarity: 'common', icon: '🌆' },
  { id: 'c-car1', name: 'Erstes Motorrad', rarity: 'legendary', icon: '🏍️' },
  { id: 'c-beach', name: 'Miami Beach', rarity: 'common', icon: '🏖️' },
  { id: 'c-heli', name: 'Polizei-Helikopter', rarity: 'rare', icon: '🚁' },
  { id: 'c-money', name: 'Geldkoffer', rarity: 'common', icon: '💼' },
  { id: 'c-crown', name: 'Season-1-Krone', rarity: 'legendary', icon: '👑' },
  { id: 'c-badge', name: 'Community-Abzeichen', rarity: 'rare', icon: '🏅' },
  { id: 'c-map', name: 'Vice City Karte', rarity: 'common', icon: '🗺️' },
]

export function getUserCollectibles(): string[] {
  return readJSON<string[]>('gamification:collectibles', [])
}

export function unlockCollectible(id: string): void {
  const owned = readJSON<string[]>('gamification:collectibles', [])
  if (!owned.includes(id)) {
    writeJSON('gamification:collectibles', [...owned, id])
    // Check achievement
    const newOwned = [...owned, id]
    if (newOwned.length >= 5) unlockAchievement('ach-collector')
    const legendary = COLLECTIBLES.filter((c) => c.rarity === 'legendary' && newOwned.includes(c.id))
    if (legendary.length >= 1) unlockAchievement('ach-legendary')
  }
}

export function openLootbox(): Collectible {
  // Weighted random using time as seed — not a pure function, but service ops are OK
  const ownedIds = getUserCollectibles()
  const unowned = COLLECTIBLES.filter((c) => !ownedIds.includes(c.id))
  if (unowned.length === 0) return COLLECTIBLES[0] // all unlocked

  // Rarity weights: common 60%, rare 30%, legendary 10%
  const weights = unowned.map((c) => (c.rarity === 'common' ? 6 : c.rarity === 'rare' ? 3 : 1))
  const total = weights.reduce((a, b) => a + b, 0)
  const seed = Date.now() % total
  let cumulative = 0
  for (let i = 0; i < unowned.length; i++) {
    cumulative += weights[i]
    if (seed < cumulative) {
      unlockCollectible(unowned[i].id)
      return unowned[i]
    }
  }
  unlockCollectible(unowned[0].id)
  return unowned[0]
}
