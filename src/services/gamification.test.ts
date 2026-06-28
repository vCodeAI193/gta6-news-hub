import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getLevel,
  getLevelTitle,
  getDailyQuests,
  getLeaderboard,
  ACHIEVEMENTS,
  QUIZ_QUESTIONS,
  getQuizQuestion,
} from './gamificationService'

// Mock localStorage so service functions work in tests
const store: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
})

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k])
})

describe('getLevel', () => {
  it('returns 1 at 0 XP', () => {
    expect(getLevel(0)).toBe(1)
  })

  it('returns 2 at exactly 100 XP', () => {
    expect(getLevel(100)).toBe(2)
  })

  it('returns higher level for more XP', () => {
    expect(getLevel(250)).toBe(3)
    expect(getLevel(500)).toBe(4)
    expect(getLevel(1000)).toBe(5)
  })

  it('caps at max level for huge XP', () => {
    expect(getLevel(100000)).toBeGreaterThanOrEqual(9)
  })
})

describe('getLevelTitle', () => {
  it('returns a string for level 1', () => {
    expect(typeof getLevelTitle(1)).toBe('string')
  })

  it('returns different titles for different levels', () => {
    expect(getLevelTitle(1)).not.toBe(getLevelTitle(5))
  })
})

describe('getDailyQuests', () => {
  it('returns exactly 3 quests', () => {
    const quests = getDailyQuests('2026-06-28')
    expect(quests).toHaveLength(3)
  })

  it('each quest has required fields', () => {
    const quests = getDailyQuests('2026-06-28')
    for (const q of quests) {
      expect(q.id).toBeTruthy()
      expect(q.title).toBeTruthy()
      expect(q.xp).toBeGreaterThan(0)
      expect(q.target).toBeGreaterThan(0)
      expect(q.expiresAt).toBeGreaterThan(0)
    }
  })

  it('returns deterministic quests for same date', () => {
    const a = getDailyQuests('2026-06-28')
    const b = getDailyQuests('2026-06-28')
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id))
  })

  it('returns different quests for different dates', () => {
    const a = getDailyQuests('2026-06-28')
    const b = getDailyQuests('2026-07-10')
    // Not strictly guaranteed but highly likely with our rotation
    const aIds = a.map((q) => q.id).join(',')
    const bIds = b.map((q) => q.id).join(',')
    expect(aIds).not.toBe(bIds)
  })
})

describe('getLeaderboard', () => {
  it('returns an array for weekly period', () => {
    const lb = getLeaderboard('weekly')
    expect(Array.isArray(lb)).toBe(true)
    expect(lb.length).toBeGreaterThan(0)
  })

  it('entries have required fields', () => {
    const lb = getLeaderboard('monthly')
    const first = lb[0]
    expect(first.rank).toBe(1)
    expect(typeof first.name).toBe('string')
    expect(typeof first.xp).toBe('number')
    expect(typeof first.level).toBe('number')
  })

  it('is sorted by XP descending', () => {
    const lb = getLeaderboard('alltime')
    for (let i = 1; i < lb.length; i++) {
      expect(lb[i - 1].xp).toBeGreaterThanOrEqual(lb[i].xp)
    }
  })
})

describe('ACHIEVEMENTS', () => {
  it('has at least 20 entries', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(20)
  })

  it('each achievement has required fields', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.id).toBeTruthy()
      expect(a.title).toBeTruthy()
      expect(a.icon).toBeTruthy()
    }
  })
})

describe('QUIZ_QUESTIONS / getQuizQuestion', () => {
  it('returns a valid question', () => {
    const q = getQuizQuestion(0)
    expect(q.question).toBeTruthy()
    expect(q.options).toHaveLength(4)
    expect(q.correctIndex).toBeGreaterThanOrEqual(0)
    expect(q.correctIndex).toBeLessThan(4)
  })

  it('cycles through all questions', () => {
    const seen = new Set<string>()
    for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
      seen.add(getQuizQuestion(i).question)
    }
    expect(seen.size).toBe(QUIZ_QUESTIONS.length)
  })
})
