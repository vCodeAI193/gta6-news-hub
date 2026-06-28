import { readJSON, writeJSON } from './storage'

export type GoalType = 'daily' | 'weekly'

const GOALS_KEY = 'readingGoals'

interface Goals {
  daily: number
  weekly: number
}

const DEFAULT_GOALS: Goals = { daily: 3, weekly: 15 }

export function setGoal(type: GoalType, count: number): void {
  const goals = readJSON<Goals>(GOALS_KEY, DEFAULT_GOALS)
  writeJSON(GOALS_KEY, { ...goals, [type]: count })
}

export function getGoal(type: GoalType): number {
  return readJSON<Goals>(GOALS_KEY, DEFAULT_GOALS)[type]
}

function startOfDay(ts: number): number {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function startOfWeek(ts: number): number {
  const d = new Date(ts)
  const day = d.getDay() // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1 // Monday-based
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff).getTime()
}

export function getProgress(
  type: GoalType,
  history: Array<{ readAt: number }>,
): number {
  const now = Date.now()
  const cutoff = type === 'daily' ? startOfDay(now) : startOfWeek(now)
  return history.filter((e) => e.readAt >= cutoff).length
}

export function getStreak(history: Array<{ readAt: number }>): number {
  if (history.length === 0) return 0

  const todayStart = startOfDay(Date.now())
  // Collect unique days that had at least one read
  const days = new Set(history.map((e) => startOfDay(e.readAt)))

  let streak = 0
  let current = todayStart

  // If today has no reads yet, check if yesterday started a streak
  if (!days.has(current)) {
    current -= 86_400_000
  }

  while (days.has(current)) {
    streak++
    current -= 86_400_000
  }

  return streak
}
