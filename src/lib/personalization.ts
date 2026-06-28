import type { Article, CategoryId } from '../types'
import { readJSON, writeJSON } from '../services/storage'

/**
 * Extended personalization features:
 * 1. Time-of-day aware recommendations (morning vs evening feed)
 * 2. Emotion-based feed filtering (mood slider from calm to exciting)
 * 3. User similarity recommendations (find users with matching interests)
 * 4. Smart push timing (learn when user is active)
 * 5. Read time prediction (estimate if user will finish article)
 */

// ============================================================================
// FEATURE 1: Time-of-Day Aware Recommendations
// ============================================================================

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

interface TimePreferences {
  morningTags: string[]
  afternoonTags: string[]
  eveningTags: string[]
  nightTags: string[]
}

/** Get current time of day based on local time. */
export function getCurrentTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

/** Score boost multiplier based on time of day alignment. */
export function getTimeAlignmentBoost(
  article: Article,
  timeOfDay: TimeOfDay,
  userPreferences?: TimePreferences,
): number {
  if (!userPreferences) return 0

  const preferences = {
    morning: userPreferences.morningTags,
    afternoon: userPreferences.afternoonTags,
    evening: userPreferences.eveningTags,
    night: userPreferences.nightTags,
  }

  const tagsForTime = preferences[timeOfDay]
  if (!tagsForTime || tagsForTime.length === 0) return 0

  const articleTagsStr = (article.tags ?? []).join(' ').toLowerCase()
  const matchCount = tagsForTime.filter(
    (tag) => articleTagsStr.includes(tag.toLowerCase()),
  ).length

  return matchCount * 1.5
}

// ============================================================================
// FEATURE 2: Emotion-Based Feed Filtering
// ============================================================================

export type MoodIntensity = number // 0 = calm, 100 = exciting

interface EmotionalProfile {
  baselineIntensity: MoodIntensity
  lastUpdated: string
  history: { timestamp: string; intensity: MoodIntensity }[]
}

/**
 * Score an article's emotional intensity.
 * Higher score = more exciting/intense content.
 * Returns 0-100.
 */
export function scoreArticleIntensity(article: Article): MoodIntensity {
  let intensity = 50 // baseline

  // Breaking news / featured = more intense
  if (article.featured) intensity += 15

  // Rumors and unconfirmed = more intense
  if (article.reliability === 'rumor' || article.reliability === 'unconfirmed') {
    intensity += 20
  }

  // Confirmed = calming
  if (article.reliability === 'confirmed') intensity -= 10

  // Official category = calming
  if (article.category === 'official') intensity -= 5

  // Leak category = more exciting
  if (article.category === 'leak') intensity += 15

  // Release news = moderate excitement
  if (article.category === 'release') intensity += 8

  // Longer articles = calmer (more substance)
  const wordCount = article.body.trim().split(/\s+/).length
  if (wordCount > 500) intensity -= 5

  return Math.max(0, Math.min(100, intensity))
}

/**
 * Filter articles by emotional intensity matching user mood.
 * userMood: 0 = want calm news, 100 = want exciting news.
 * tolerance: how much variation to allow (default 30).
 */
export function filterByEmotionalIntensity(
  articles: Article[],
  userMood: MoodIntensity,
  tolerance: number = 30,
): Article[] {
  return articles.filter((article) => {
    const intensity = scoreArticleIntensity(article)
    const difference = Math.abs(intensity - userMood)
    return difference <= tolerance
  })
}

/**
 * Get suggested mood based on user's reading history intensity.
 */
export function suggestMoodBasedOnHistory(
  history: Article[],
): MoodIntensity {
  if (history.length === 0) return 50

  const intensities = history.map((a) => scoreArticleIntensity(a))
  const sum = intensities.reduce((a, b) => a + b, 0)
  return Math.round(sum / intensities.length)
}

// ============================================================================
// FEATURE 3: User Similarity Recommendations
// ============================================================================

interface UserProfile {
  interests: CategoryId[]
  tags: string[]
  reliabilityPreference: 'rumor' | 'mixed' | 'confirmed'
  averageMood: MoodIntensity
}

/** Calculate similarity between two user profiles (0-1 scale). */
export function calculateUserSimilarity(
  user1: UserProfile,
  user2: UserProfile,
): number {
  let similarity = 0
  let factors = 0

  // Interest overlap
  const commonInterests = user1.interests.filter((i) =>
    user2.interests.includes(i),
  ).length
  const totalInterests = new Set([...user1.interests, ...user2.interests]).size
  if (totalInterests > 0) {
    similarity += (commonInterests / totalInterests) * 100
    factors++
  }

  // Tag overlap (at least 3-char tags)
  const longTags1 = user1.tags.filter((t) => t.length >= 3)
  const longTags2 = user2.tags.filter((t) => t.length >= 3)
  const commonTags = longTags1.filter((t) =>
    longTags2.some((t2) => t2.toLowerCase() === t.toLowerCase()),
  ).length
  const totalTags = new Set([...longTags1, ...longTags2]).size
  if (totalTags > 0) {
    similarity += (commonTags / totalTags) * 100
    factors++
  }

  // Reliability preference alignment
  const reliabilityMatch =
    user1.reliabilityPreference === user2.reliabilityPreference ? 100 : 25
  similarity += reliabilityMatch
  factors++

  // Mood alignment (within 20 points)
  const moodDifference = Math.abs(user1.averageMood - user2.averageMood)
  const moodMatch = Math.max(0, 100 - moodDifference * 2)
  similarity += moodMatch
  factors++

  return factors > 0 ? Math.round(similarity / factors) / 100 : 0
}

/**
 * Find articles liked by similar users that current user hasn't read.
 */
export function recommendFromSimilarUsers(
  currentUser: UserProfile,
  otherUsers: Array<{ profile: UserProfile; readArticles: Article[] }>,
  userReadArticles: Set<string>,
  minSimilarity: number = 0.5,
): Article[] {
  const recommendedArticles: Map<string, { article: Article; score: number }> =
    new Map()

  for (const other of otherUsers) {
    const similarity = calculateUserSimilarity(currentUser, other.profile)
    if (similarity < minSimilarity) continue

    // Articles read by similar user but not by current user
    for (const article of other.readArticles) {
      if (userReadArticles.has(article.id)) continue

      const key = article.id
      const scoreBoost = similarity * 20

      if (!recommendedArticles.has(key)) {
        recommendedArticles.set(key, { article, score: scoreBoost })
      } else {
        const existing = recommendedArticles.get(key)!
        existing.score = Math.max(existing.score, scoreBoost)
      }
    }
  }

  return [...recommendedArticles.values()]
    .sort((a, b) => b.score - a.score)
    .map((x) => x.article)
}

// ============================================================================
// FEATURE 4: Smart Push Timing (Activity Pattern Learning)
// ============================================================================

interface ActivityTimestamp {
  hour: number
  dayOfWeek: number // 0 = Sunday, 6 = Saturday
  minuteOfDay: number // 0-1440
}

interface ActivityPattern {
  engagementByHour: number[] // 24 slots, 0-100 score
  engagementByDayOfWeek: number[] // 7 slots
  peakHour: number
  peakDayOfWeek: number
  totalEvents: number
  lastUpdated: string
}

/** Log user activity (reading, scrolling, etc.). */
export function logUserActivity(): ActivityTimestamp {
  const now = new Date()
  return {
    hour: now.getHours(),
    dayOfWeek: now.getDay(),
    minuteOfDay: now.getHours() * 60 + now.getMinutes(),
  }
}

/**
 * Build activity pattern from timestamps.
 * Returns engagement score (0-100) for each hour and day.
 */
export function buildActivityPattern(
  timestamps: ActivityTimestamp[],
): ActivityPattern {
  const engagementByHour = Array(24).fill(0)
  const engagementByDayOfWeek = Array(7).fill(0)

  for (const ts of timestamps) {
    engagementByHour[ts.hour]++
    engagementByDayOfWeek[ts.dayOfWeek]++
  }

  // Normalize to 0-100
  const maxHourActivity = Math.max(...engagementByHour, 1)
  const maxDayActivity = Math.max(...engagementByDayOfWeek, 1)

  const normalizedHours = engagementByHour.map(
    (h) => Math.round((h / maxHourActivity) * 100),
  )
  const normalizedDays = engagementByDayOfWeek.map(
    (d) => Math.round((d / maxDayActivity) * 100),
  )

  const peakHour = normalizedHours.indexOf(Math.max(...normalizedHours))
  const peakDayOfWeek = normalizedDays.indexOf(Math.max(...normalizedDays))

  return {
    engagementByHour: normalizedHours,
    engagementByDayOfWeek: normalizedDays,
    peakHour,
    peakDayOfWeek,
    totalEvents: timestamps.length,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Suggest optimal time to send push notification based on learned pattern.
 * Returns hour of day (0-23) when user is most likely to engage.
 */
export function suggestOptimalPushTime(
  pattern: ActivityPattern,
): { hour: number; dayOfWeek?: number; confidence: number } {
  const peakHour = pattern.peakHour
  const confidence = pattern.engagementByHour[peakHour] / 100

  return {
    hour: peakHour,
    dayOfWeek: pattern.peakDayOfWeek,
    confidence: Math.min(1, confidence),
  }
}

/**
 * Score how well-timed a push would be (0-1 scale).
 */
export function scorePushTiming(
  pattern: ActivityPattern,
  hour: number,
  dayOfWeek?: number,
): number {
  let score = pattern.engagementByHour[hour] / 100

  if (dayOfWeek !== undefined) {
    const dayScore = pattern.engagementByDayOfWeek[dayOfWeek] / 100
    score = (score + dayScore) / 2
  }

  return Math.min(1, score)
}

// ============================================================================
// FEATURE 5: Read Time Prediction
// ============================================================================

interface ReadingSpeed {
  averageWordsPerMinute: number
  lastUpdated: string
  sampleSize: number
}

interface ReadTimeEstimate {
  estimatedMinutes: number
  confidence: number
  difficulty: 'easy' | 'medium' | 'hard'
}

/** Calculate reading time in minutes (~200 wpm average). */
export function calculateReadTime(
  body: string,
  wpm: number = 200,
): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / wpm))
}

/**
 * Estimate article complexity (affects whether user will finish).
 * Considers: word count, sentence length, special characters.
 * Returns 'easy', 'medium', or 'hard'.
 */
export function estimateArticleDifficulty(
  article: Article,
): 'easy' | 'medium' | 'hard' {
  const sentences = article.body.split(/[.!?]+/).filter(Boolean)
  const words = article.body.trim().split(/\s+/).filter(Boolean).length

  const avgWordPerSentence =
    sentences.length > 0 ? words / sentences.length : 0
  const bulletPoints = (article.body.match(/[-*•]/g) ?? []).length
  const hasCode = /`|```/.test(article.body)
  const hasHeadings = /#{1,6}/.test(article.body)

  // Easier to read if structured with headings, bullets, etc.
  let difficulty = 50

  // Sentence length indicator
  if (avgWordPerSentence > 20) difficulty += 30
  else if (avgWordPerSentence > 15) difficulty += 15
  else difficulty -= 10

  // Structured content reduces difficulty
  if (hasHeadings) difficulty -= 15
  if (bulletPoints > 0) difficulty -= 10
  if (hasCode) difficulty += 10

  if (difficulty <= 35) return 'easy'
  if (difficulty <= 65) return 'medium'
  return 'hard'
}

/**
 * Predict if user will complete reading this article based on:
 * - Their historical completion rates
 * - Article difficulty
 * - User's typical reading speed
 */
export function predictCompletionLikelihood(
  article: Article,
  userReadingSpeed: ReadingSpeed,
  userCompletionRate: { byDifficulty: Record<'easy' | 'medium' | 'hard', number> },
): number {
  const difficulty = estimateArticleDifficulty(article)
  const readTime = calculateReadTime(article.body, userReadingSpeed.averageWordsPerMinute)
  const baseCompletionRate = userCompletionRate.byDifficulty[difficulty]

  // Penalty if article takes very long
  let timePenalty = 0
  if (readTime > 10) timePenalty = 0.1
  else if (readTime > 15) timePenalty = 0.2
  else if (readTime > 20) timePenalty = 0.3

  return Math.max(0, Math.min(1, baseCompletionRate - timePenalty))
}

/**
 * Get read time estimate with confidence score.
 */
export function getReadTimeEstimate(
  article: Article,
  userReadingSpeed?: ReadingSpeed,
  userCompletionRate?: { byDifficulty: Record<'easy' | 'medium' | 'hard', number> },
): ReadTimeEstimate {
  const wpm = userReadingSpeed?.averageWordsPerMinute ?? 200
  const minutes = calculateReadTime(article.body, wpm)
  const difficulty = estimateArticleDifficulty(article)

  let confidence = 0.7 // baseline
  if (userReadingSpeed && userReadingSpeed.sampleSize > 10) {
    confidence = Math.min(1, 0.7 + userReadingSpeed.sampleSize / 100)
  }

  let completionLikelihood = 0.5
  if (userCompletionRate) {
    completionLikelihood = userCompletionRate.byDifficulty[difficulty] ?? 0.5
  }

  // Adjust confidence by completion likelihood
  confidence *= (0.5 + completionLikelihood / 2)

  return {
    estimatedMinutes: minutes,
    confidence: Math.round(confidence * 100) / 100,
    difficulty,
  }
}

/**
 * Track when user starts and finishes reading.
 * Update completion rate stats.
 */
export interface ReadingSession {
  articleId: string
  startTime: number
  endTime?: number
  difficulty: 'easy' | 'medium' | 'hard'
  completed: boolean
}

export function trackReadingSession(
  articleId: string,
  difficulty: 'easy' | 'medium' | 'hard',
): ReadingSession {
  return {
    articleId,
    startTime: Date.now(),
    difficulty,
    completed: false,
  }
}

/**
 * Update reading session when user finishes or leaves.
 */
export function endReadingSession(
  session: ReadingSession,
  completed: boolean = false,
): ReadingSession {
  return {
    ...session,
    endTime: Date.now(),
    completed,
  }
}

/**
 * Calculate user's completion rate by difficulty from sessions.
 */
export function calculateCompletionRateByDifficulty(
  sessions: ReadingSession[],
): { byDifficulty: Record<'easy' | 'medium' | 'hard', number> } {
  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard']
  const stats: Record<'easy' | 'medium' | 'hard', number> = {
    easy: 0.5,
    medium: 0.5,
    hard: 0.3,
  }

  for (const difficulty of difficulties) {
    const filtered = sessions.filter((s) => s.difficulty === difficulty)
    if (filtered.length > 0) {
      const completed = filtered.filter((s) => s.completed).length
      stats[difficulty] = completed / filtered.length
    }
  }

  return { byDifficulty: stats }
}

// ============================================================================
// Convenience: Load/Save preferences from localStorage
// ============================================================================

function getPersonalizationKey(name: string): string {
  return `personalization:${name}`
}

export function saveEmotionalProfile(profile: EmotionalProfile): void {
  writeJSON(getPersonalizationKey('emotional'), profile)
}

export function loadEmotionalProfile(): EmotionalProfile {
  return readJSON<EmotionalProfile>(getPersonalizationKey('emotional'), {
    baselineIntensity: 50,
    lastUpdated: new Date().toISOString(),
    history: [],
  })
}

export function saveActivityPattern(pattern: ActivityPattern): void {
  writeJSON(getPersonalizationKey('activity'), pattern)
}

export function loadActivityPattern(): ActivityPattern | null {
  return readJSON<ActivityPattern | null>(
    getPersonalizationKey('activity'),
    null,
  )
}

export function saveReadingSpeed(speed: ReadingSpeed): void {
  writeJSON(getPersonalizationKey('readingSpeed'), speed)
}

export function loadReadingSpeed(): ReadingSpeed {
  return readJSON<ReadingSpeed>(getPersonalizationKey('readingSpeed'), {
    averageWordsPerMinute: 200,
    lastUpdated: new Date().toISOString(),
    sampleSize: 0,
  })
}

export function saveCompletionRate(
  rate: { byDifficulty: Record<'easy' | 'medium' | 'hard', number> },
): void {
  writeJSON(getPersonalizationKey('completionRate'), rate)
}

export function loadCompletionRate(): { byDifficulty: Record<'easy' | 'medium' | 'hard', number> } {
  return readJSON<{ byDifficulty: Record<'easy' | 'medium' | 'hard', number> }>(
    getPersonalizationKey('completionRate'),
    {
      byDifficulty: { easy: 0.8, medium: 0.6, hard: 0.4 },
    },
  )
}

export function saveReadingSessions(sessions: ReadingSession[]): void {
  writeJSON(getPersonalizationKey('readingSessions'), sessions)
}

export function loadReadingSessions(): ReadingSession[] {
  return readJSON<ReadingSession[]>(getPersonalizationKey('readingSessions'), [])
}
