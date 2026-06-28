/**
 * Integration guide for the 5 personalization features.
 *
 * This module demonstrates how to use all personalization features together
 * in a real application context, building on the existing recommendation service.
 */

import type { Article, CategoryId } from '../types'
import type { ReadingSession } from './personalization'
import {
  // Feature 1: Time-of-Day
  getCurrentTimeOfDay,
  getTimeAlignmentBoost,
  // Feature 2: Emotion
  scoreArticleIntensity,
  filterByEmotionalIntensity,
  suggestMoodBasedOnHistory,
  loadEmotionalProfile,
  saveEmotionalProfile,
  // Feature 3: User Similarity
  recommendFromSimilarUsers,
  // Feature 4: Smart Push Timing
  logUserActivity,
  buildActivityPattern,
  suggestOptimalPushTime,
  scorePushTiming,
  loadActivityPattern,
  saveActivityPattern,
  // Feature 5: Read Time Prediction
  calculateReadTime,
  estimateArticleDifficulty,
  getReadTimeEstimate,
  trackReadingSession,
  endReadingSession,
  calculateCompletionRateByDifficulty,
  loadReadingSpeed,
  loadCompletionRate,
  loadReadingSessions,
  saveReadingSessions,
  saveCompletionRate,
  type ActivityPattern,
  type TimeOfDay,
  type MoodIntensity,
  type UserProfile,
} from './personalization'
import { scoreArticle } from './recommendation'

/**
 * STEP 1: Log user activity whenever they interact with the app.
 * Call this on:
 * - Feed views
 * - Article clicks
 * - Scroll events
 * - Any engagement action
 */
export function trackUserEngagement(): void {
  const timestamp = logUserActivity()
  console.debug('[Personalization] Logged activity:', timestamp)
  // In a real app, batch these and periodically update the pattern
}

/**
 * STEP 2: Score articles using ALL personalization dimensions.
 * Returns a combined personalization score.
 */
export function scoreArticlePersonalized(
  article: Article,
  userInterests: CategoryId[],
  readHistory: Article[],
  currentMood: MoodIntensity,
  timeOfDay: TimeOfDay,
  userProfile?: UserProfile,
  readingSpeed?: { averageWordsPerMinute: number; sampleSize: number },
): {
  baseScore: number
  emotionMatch: number
  timeOfDayBoost: number
  completionLikelihood: number
  totalScore: number
} {
  // Base recommendation score (from existing recommendation.ts)
  const baseScore = scoreArticle(article, userInterests, readHistory.map(a => ({ articleId: a.id })), [], [])

  // Feature 2: Emotion match (0-1 scale, multiply by 100 for comparison)
  const intensity = scoreArticleIntensity(article)
  const intensityDiff = Math.abs(intensity - currentMood)
  const emotionMatch = Math.max(0, 100 - intensityDiff * 0.5)

  // Feature 1: Time-of-day alignment boost
  const timeOfDayBoost = userProfile
    ? getTimeAlignmentBoost(article, timeOfDay, {
        morningTags: ['news', 'updates', 'official'],
        afternoonTags: ['analysis', 'features', 'leaks'],
        eveningTags: ['entertainment', 'trailers', 'videos'],
        nightTags: ['theories', 'discussion', 'rumors'],
      })
    : 0

  // Feature 5: Predict if user will finish this article
  const completionRate = loadCompletionRate()
  const estimate = getReadTimeEstimate(article, readingSpeed, completionRate)
  const completionLikelihood = estimate.confidence * 100

  // Weighted combination
  const totalScore =
    baseScore * 0.4 + // Base recommendation importance
    emotionMatch * 0.25 + // Emotion fit
    timeOfDayBoost * 0.2 + // Time-of-day boost
    completionLikelihood * 0.15 // Completion likelihood

  return {
    baseScore,
    emotionMatch,
    timeOfDayBoost,
    completionLikelihood,
    totalScore,
  }
}

/**
 * STEP 3: Generate a personalized feed using all features.
 * This is the main entry point for the recommendation engine.
 */
export function getPersonalizedFeed(
  articles: Article[],
  userInterests: CategoryId[],
  readHistory: Article[],
  currentMood: MoodIntensity,
  userProfile?: UserProfile,
  similarUsers?: Array<{ profile: UserProfile; readArticles: Article[] }>,
  maxResults: number = 20,
): Article[] {
  const timeOfDay = getCurrentTimeOfDay()
  const readingSpeed = loadReadingSpeed()
  const userReadSet = new Set(readHistory.map(a => a.id))

  // Score all articles
  const scoredArticles = articles.map(article => ({
    article,
    score: scoreArticlePersonalized(
      article,
      userInterests,
      readHistory,
      currentMood,
      timeOfDay,
      userProfile,
      readingSpeed,
    ),
  }))

  // Add collaborative recommendations if similar users available
  let recommendations: Article[] = scoredArticles
    .filter(x => x.score.totalScore > 0)
    .sort((a, b) => b.score.totalScore - a.score.totalScore)
    .map(x => x.article)

  if (userProfile && similarUsers && similarUsers.length > 0) {
    const collaborativeRecs = recommendFromSimilarUsers(
      userProfile,
      similarUsers,
      userReadSet,
      0.5,
    )
    // Merge collaborative recommendations
    const colabSet = new Set(collaborativeRecs.map(a => a.id))
    recommendations = [
      ...recommendations.filter(a => !colabSet.has(a.id)),
      ...collaborativeRecs.slice(0, 5), // Include top 5 from similar users
    ]
  }

  return recommendations.slice(0, maxResults)
}

/**
 * STEP 4: Update user preference profiles based on reading behavior.
 * Call this when user finishes reading an article.
 */
export function updateUserPreferencesAfterReading(
  session: ReadingSession,
  article: Article,
): void {
  // Update emotional profile
  const emotionalProfile = loadEmotionalProfile()
  const intensity = scoreArticleIntensity(article)
  emotionalProfile.history.push({
    timestamp: new Date().toISOString(),
    intensity,
  })
  emotionalProfile.baselineIntensity = suggestMoodBasedOnHistory([article])
  emotionalProfile.lastUpdated = new Date().toISOString()
  saveEmotionalProfile(emotionalProfile)

  // Update reading sessions and completion rates
  const sessions = loadReadingSessions()
  sessions.push(session)
  saveReadingSessions(sessions)

  const completionRate = calculateCompletionRateByDifficulty(sessions)
  saveCompletionRate(completionRate)

  console.debug('[Personalization] Updated user preferences after reading')
}

/**
 * STEP 5: Suggest optimal time for push notifications.
 * Call this when deciding when to send push notifications.
 */
export function suggestPushNotificationTiming(): {
  hour: number
  dayOfWeek?: number
  confidence: number
  message: string
} {
  const pattern = loadActivityPattern()
  if (!pattern) {
    return {
      hour: 9,
      confidence: 0,
      message: 'No activity pattern yet. Suggesting default 9 AM.',
    }
  }

  const suggestion = suggestOptimalPushTime(pattern)
  const hourNames = [
    '12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM',
    '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
    '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM',
    '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM',
  ]

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const time = hourNames[suggestion.hour]
  const day = suggestion.dayOfWeek !== undefined ? dayNames[suggestion.dayOfWeek] : 'any day'

  return {
    ...suggestion,
    message: `Best time to reach user: ${time} on ${day} (${Math.round(suggestion.confidence * 100)}% confidence)`,
  }
}

/**
 * STEP 6: Score article reading time and difficulty.
 * Show this in the UI as "~ 5 min read (Easy)".
 */
export function getArticleReadabilityInfo(article: Article): {
  estimatedMinutes: number
  difficulty: 'easy' | 'medium' | 'hard'
  icon: string
  label: string
} {
  const readTime = calculateReadTime(article.body)
  const difficulty = estimateArticleDifficulty(article)
  const icons = {
    easy: '⚡',
    medium: '📖',
    hard: '🧠',
  }
  const labels = {
    easy: 'Quick read',
    medium: 'Average read',
    hard: 'Deep dive',
  }

  return {
    estimatedMinutes: readTime,
    difficulty,
    icon: icons[difficulty],
    label: `${labels[difficulty]} (~${readTime} min)`,
  }
}

/**
 * STEP 7: Start tracking a reading session when user opens article.
 * Return the session to track completion.
 */
export function initializeReadingSession(article: Article): ReadingSession {
  const difficulty = estimateArticleDifficulty(article)
  return trackReadingSession(article.id, difficulty)
}

/**
 * STEP 8: Complete reading session when user leaves article.
 * Determines if user completed the article based on time spent.
 */
export function finalizeReadingSession(
  session: ReadingSession,
  timeSpentSeconds: number,
  scrollPercentage: number = 0,
): ReadingSession {
  const readTime = calculateReadTime(
    'dummy', // We'd have article body here in real implementation
  )
  const estimatedTimeMs = readTime * 60 * 1000

  // Consider "completed" if user spent significant time and scrolled far
  const completed = timeSpentSeconds >= estimatedTimeMs * 0.5 && scrollPercentage >= 50

  return endReadingSession(session, completed)
}

/**
 * STEP 9: Filter feed by current mood preference.
 * This is a quick filter before personalization scoring.
 */
export function filterFeedByMood(
  articles: Article[],
  userMood: MoodIntensity,
  strictness: 'relaxed' | 'normal' | 'strict' = 'normal',
): Article[] {
  const tolerance = strictness === 'relaxed' ? 50 : strictness === 'strict' ? 15 : 30

  return filterByEmotionalIntensity(articles, userMood, tolerance)
}

/**
 * STEP 10: Check if a push notification time is well-timed.
 * Use this to batch notifications and send at optimal times.
 */
export function isPushTimingOptimal(currentHour: number, currentDay: number): {
  isOptimal: boolean
  score: number
  suggestion: string
} {
  const pattern = loadActivityPattern()
  if (!pattern) {
    return {
      isOptimal: false,
      score: 0.5,
      suggestion: 'No activity data yet.',
    }
  }

  const score = scorePushTiming(pattern, currentHour, currentDay)
  const isOptimal = score > 0.6

  return {
    isOptimal,
    score,
    suggestion: isOptimal
      ? 'Great time to send notification!'
      : `User typically less active at this time. Consider waiting.`,
  }
}

/**
 * STEP 11: Periodically update activity patterns.
 * Call this on a timer (e.g., every 1 hour) to keep pattern fresh.
 */
export function updateActivityPattern(
  recentActivities: Array<{ hour: number; dayOfWeek: number; minuteOfDay: number }>,
): ActivityPattern {
  const pattern = buildActivityPattern(recentActivities)
  saveActivityPattern(pattern)
  console.debug('[Personalization] Updated activity pattern')
  return pattern
}

/**
 * Helper: Create a user profile from their reading history and subscriptions.
 */
export function buildUserProfile(
  interests: CategoryId[],
  readHistory: Article[],
): UserProfile {
  // Extract unique tags from read articles
  const allTags = new Set<string>()
  readHistory.forEach(article => {
    article.tags?.forEach(tag => {
      if (tag.length >= 3) allTags.add(tag)
    })
  })

  // Determine reliability preference
  const reliabilityCount = { confirmed: 0, rumor: 0, unconfirmed: 0 }
  readHistory.forEach(article => {
    const rel = article.reliability ?? 'rumor'
    reliabilityCount[rel]++
  })
  const preferredReliability = Object.entries(reliabilityCount)
    .sort(([, a], [, b]) => b - a)[0][0] as 'confirmed' | 'rumor' | 'unconfirmed'
  const reliabilityPref = preferredReliability === 'confirmed' ? 'confirmed' : 'mixed'

  // Average mood from history
  const emotionalProfile = loadEmotionalProfile()

  return {
    interests,
    tags: Array.from(allTags),
    reliabilityPreference: reliabilityPref,
    averageMood: emotionalProfile.baselineIntensity,
  }
}
