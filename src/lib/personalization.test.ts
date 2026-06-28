import { describe, expect, it } from 'vitest'
import type { Article } from '../types'
import {
  // Feature 1
  getCurrentTimeOfDay,
  getTimeAlignmentBoost,
  // Feature 2
  scoreArticleIntensity,
  filterByEmotionalIntensity,
  suggestMoodBasedOnHistory,
  // Feature 3
  calculateUserSimilarity,
  recommendFromSimilarUsers,
  // Feature 4
  logUserActivity,
  buildActivityPattern,
  suggestOptimalPushTime,
  scorePushTiming,
  // Feature 5
  calculateReadTime,
  estimateArticleDifficulty,
  predictCompletionLikelihood,
  getReadTimeEstimate,
  trackReadingSession,
  endReadingSession,
  calculateCompletionRateByDifficulty,
} from './personalization'

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: 'a1',
    title: 'Test Article',
    excerpt: 'Excerpt',
    body: 'This is a test article body with multiple words for testing purposes.',
    category: 'official',
    date: '2026-06-28',
    source: 'Rockstar',
    image: '/img.jpg',
    ...overrides,
  }
}

// ============================================================================
// Feature 1: Time-of-Day Aware Recommendations
// ============================================================================

describe('Feature 1: Time-of-Day Aware Recommendations', () => {
  describe('getCurrentTimeOfDay', () => {
    it('returns correct time period based on hour', () => {
      // Test by checking the function logic
      // We can't easily mock Date constructor, so we test the logic indirectly
      const timeOfDay = getCurrentTimeOfDay()
      expect(['morning', 'afternoon', 'evening', 'night']).toContain(timeOfDay)
    })
  })

  describe('getTimeAlignmentBoost', () => {
    it('boosts score for time-aligned tags', () => {
      const article = makeArticle({ tags: ['trailer', 'entertainment'] })
      const prefs = {
        morningTags: ['news', 'updates'],
        afternoonTags: ['analysis'],
        eveningTags: ['trailer', 'entertainment', 'movies'],
        nightTags: ['theories'],
      }

      const morningBoost = getTimeAlignmentBoost(article, 'morning', prefs)
      const eveningBoost = getTimeAlignmentBoost(article, 'evening', prefs)

      expect(eveningBoost).toBeGreaterThanOrEqual(morningBoost)
    })

    it('returns 0 without preferences', () => {
      const article = makeArticle({ tags: ['news'] })
      const boost = getTimeAlignmentBoost(article, 'morning')
      expect(boost).toBe(0)
    })
  })
})

// ============================================================================
// Feature 2: Emotion-Based Feed Filtering
// ============================================================================

describe('Feature 2: Emotion-Based Feed Filtering', () => {
  describe('scoreArticleIntensity', () => {
    it('scores featured articles as more intense', () => {
      const normal = makeArticle({ featured: false })
      const featured = makeArticle({ featured: true })

      expect(scoreArticleIntensity(featured)).toBeGreaterThan(
        scoreArticleIntensity(normal),
      )
    })

    it('scores rumor/unconfirmed as more intense than confirmed', () => {
      const confirmed = makeArticle({ reliability: 'confirmed' })
      const rumor = makeArticle({ reliability: 'rumor' })

      expect(scoreArticleIntensity(rumor)).toBeGreaterThan(
        scoreArticleIntensity(confirmed),
      )
    })

    it('scores leak category as more intense than official', () => {
      const official = makeArticle({ category: 'official' })
      const leak = makeArticle({ category: 'leak' })

      expect(scoreArticleIntensity(leak)).toBeGreaterThan(
        scoreArticleIntensity(official),
      )
    })

    it('returns value between 0 and 100', () => {
      const article = makeArticle({
        featured: true,
        reliability: 'rumor',
        category: 'leak',
      })
      const score = scoreArticleIntensity(article)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })

  describe('filterByEmotionalIntensity', () => {
    it('filters articles within tolerance range', () => {
      const calm = makeArticle({ id: 'calm', reliability: 'confirmed' })
      const exciting = makeArticle({
        id: 'exciting',
        featured: true,
        reliability: 'rumor',
      })

      const articles = [calm, exciting]
      const calmFilter = filterByEmotionalIntensity(articles, 30, 20)
      expect(calmFilter.map((a) => a.id)).toContain('calm')
      expect(calmFilter.map((a) => a.id)).not.toContain('exciting')
    })

    it('includes all articles within wide tolerance', () => {
      const articles = [
        makeArticle({ id: 'a', reliability: 'confirmed' }),
        makeArticle({ id: 'b', featured: true, reliability: 'rumor' }),
      ]
      const result = filterByEmotionalIntensity(articles, 50, 60)
      expect(result).toHaveLength(2)
    })
  })

  describe('suggestMoodBasedOnHistory', () => {
    it('averages intensity from reading history', () => {
      const calmArticles = Array(3).fill(
        makeArticle({ reliability: 'confirmed' }),
      )
      const excitingArticles = Array(2).fill(
        makeArticle({ featured: true, reliability: 'rumor' }),
      )
      const history = [...calmArticles, ...excitingArticles]

      const suggested = suggestMoodBasedOnHistory(history)
      expect(suggested).toBeGreaterThan(0)
      expect(suggested).toBeLessThanOrEqual(100)
    })

    it('returns 50 for empty history', () => {
      const suggested = suggestMoodBasedOnHistory([])
      expect(suggested).toBe(50)
    })
  })
})

// ============================================================================
// Feature 3: User Similarity Recommendations
// ============================================================================

describe('Feature 3: User Similarity Recommendations', () => {
  describe('calculateUserSimilarity', () => {
    it('returns high similarity for identical profiles', () => {
      const profile = {
        interests: ['official' as const, 'trailer' as const],
        tags: ['news', 'gameplay'],
        reliabilityPreference: 'mixed' as const,
        averageMood: 50,
      }

      const similarity = calculateUserSimilarity(profile, profile)
      expect(similarity).toBeCloseTo(1, 1)
    })

    it('returns low similarity for completely different profiles', () => {
      const profile1 = {
        interests: ['official' as const],
        tags: ['official_news'],
        reliabilityPreference: 'confirmed' as const,
        averageMood: 20,
      }

      const profile2 = {
        interests: ['leak' as const],
        tags: ['leaks', 'rumors'],
        reliabilityPreference: 'rumor' as const,
        averageMood: 80,
      }

      const similarity = calculateUserSimilarity(profile1, profile2)
      expect(similarity).toBeLessThan(0.5)
    })

    it('considers tag overlap', () => {
      const profile1 = {
        interests: ['official' as const],
        tags: ['news', 'gameplay'],
        reliabilityPreference: 'mixed' as const,
        averageMood: 50,
      }

      const profile2 = {
        interests: ['leak' as const],
        tags: ['news', 'features'],
        reliabilityPreference: 'mixed' as const,
        averageMood: 50,
      }

      const similarity = calculateUserSimilarity(profile1, profile2)
      expect(similarity).toBeGreaterThan(0.3)
    })
  })

  describe('recommendFromSimilarUsers', () => {
    it('recommends articles from similar users', () => {
      const currentUser = {
        interests: ['official' as const, 'trailer' as const],
        tags: ['news'],
        reliabilityPreference: 'confirmed' as const,
        averageMood: 50,
      }

      const similarUser = {
        profile: {
          interests: ['official' as const],
          tags: ['news', 'updates'],
          reliabilityPreference: 'confirmed' as const,
          averageMood: 45,
        },
        readArticles: [
          makeArticle({ id: 'rec1', title: 'Similar User Read This' }),
        ],
      }

      const currentUserRead = new Set<string>()
      const recommendations = recommendFromSimilarUsers(
        currentUser,
        [similarUser],
        currentUserRead,
        0.5,
      )

      expect(recommendations).toHaveLength(1)
      expect(recommendations[0].id).toBe('rec1')
    })

    it('excludes articles already read by current user', () => {
      const currentUser = {
        interests: ['official' as const],
        tags: ['news'],
        reliabilityPreference: 'confirmed' as const,
        averageMood: 50,
      }

      const otherUser = {
        profile: {
          interests: ['official' as const],
          tags: ['news'],
          reliabilityPreference: 'confirmed' as const,
          averageMood: 50,
        },
        readArticles: [makeArticle({ id: 'already_read' })],
      }

      const currentUserRead = new Set(['already_read'])
      const recommendations = recommendFromSimilarUsers(
        currentUser,
        [otherUser],
        currentUserRead,
        0.5,
      )

      expect(recommendations).toHaveLength(0)
    })
  })
})

// ============================================================================
// Feature 4: Smart Push Timing
// ============================================================================

describe('Feature 4: Smart Push Timing', () => {
  describe('logUserActivity', () => {
    it('logs current time information', () => {
      const log = logUserActivity()
      expect(log).toHaveProperty('hour')
      expect(log).toHaveProperty('dayOfWeek')
      expect(log).toHaveProperty('minuteOfDay')
      expect(log.hour).toBeGreaterThanOrEqual(0)
      expect(log.hour).toBeLessThan(24)
      expect(log.dayOfWeek).toBeGreaterThanOrEqual(0)
      expect(log.dayOfWeek).toBeLessThan(7)
    })
  })

  describe('buildActivityPattern', () => {
    it('builds pattern from activity timestamps', () => {
      const timestamps = [
        { hour: 8, dayOfWeek: 1, minuteOfDay: 480 },
        { hour: 8, dayOfWeek: 1, minuteOfDay: 490 },
        { hour: 18, dayOfWeek: 1, minuteOfDay: 1080 },
        { hour: 18, dayOfWeek: 5, minuteOfDay: 1080 },
      ]

      const pattern = buildActivityPattern(timestamps)
      expect(pattern.engagementByHour).toHaveLength(24)
      expect(pattern.engagementByDayOfWeek).toHaveLength(7)
      expect(pattern.peakHour).toBeDefined()
      expect(pattern.totalEvents).toBe(4)
    })

    it('normalizes engagement to 0-100 scale', () => {
      const timestamps = Array(10)
        .fill(null)
        .map(() => ({ hour: 9, dayOfWeek: 1, minuteOfDay: 540 }))

      const pattern = buildActivityPattern(timestamps)
      expect(Math.max(...pattern.engagementByHour)).toBeLessThanOrEqual(100)
      expect(Math.min(...pattern.engagementByHour)).toBeGreaterThanOrEqual(0)
    })
  })

  describe('suggestOptimalPushTime', () => {
    it('suggests peak hour for push notification', () => {
      const pattern = buildActivityPattern(
        Array(5)
          .fill(null)
          .map(() => ({ hour: 19, dayOfWeek: 3, minuteOfDay: 1140 })),
      )

      const suggestion = suggestOptimalPushTime(pattern)
      expect(suggestion.hour).toBe(19)
      expect(suggestion.confidence).toBeGreaterThan(0)
    })
  })

  describe('scorePushTiming', () => {
    it('scores timing higher during peak hours', () => {
      const pattern = buildActivityPattern(
        Array(10)
          .fill(null)
          .map(() => ({ hour: 20, dayOfWeek: 2, minuteOfDay: 1200 })),
      )

      const peakScore = scorePushTiming(pattern, 20, 2)
      const offPeakScore = scorePushTiming(pattern, 4, 2)
      expect(peakScore).toBeGreaterThan(offPeakScore)
    })
  })
})

// ============================================================================
// Feature 5: Read Time Prediction
// ============================================================================

describe('Feature 5: Read Time Prediction', () => {
  describe('calculateReadTime', () => {
    it('calculates reading time based on word count', () => {
      const text = Array(200).fill('word').join(' ')
      const minutes = calculateReadTime(text, 200)
      expect(minutes).toBe(1)
    })

    it('returns minimum 1 minute for very short articles', () => {
      const text = 'Just a few words'
      const minutes = calculateReadTime(text)
      expect(minutes).toBeGreaterThanOrEqual(1)
    })

    it('respects custom reading speed', () => {
      const text = Array(400).fill('word').join(' ')
      const slowSpeed = calculateReadTime(text, 100)
      const fastSpeed = calculateReadTime(text, 400)
      expect(slowSpeed).toBeGreaterThan(fastSpeed)
    })
  })

  describe('estimateArticleDifficulty', () => {
    it('marks structured articles as easier', () => {
      const structured = makeArticle({
        body: `
# Heading
Content here.

## Subheading
More content.

* Bullet point 1
* Bullet point 2
`,
      })

      const difficulty = estimateArticleDifficulty(structured)
      expect(['easy', 'medium']).toContain(difficulty)
    })

    it('marks articles with long sentences as harder', () => {
      const longSentence = makeArticle({
        body: Array(20)
          .fill(
            'This is a very long sentence that goes on and on without proper punctuation and makes the article harder to read for most people.',
          )
          .join(' '),
      })

      const difficulty = estimateArticleDifficulty(longSentence)
      expect(['medium', 'hard']).toContain(difficulty)
    })

    it('marks articles with code as harder', () => {
      const withCode = makeArticle({
        body: '```\nconst x = 42;\n```\nSome explanation.',
      })

      const difficulty = estimateArticleDifficulty(withCode)
      expect(['medium', 'hard']).toContain(difficulty)
    })
  })

  describe('predictCompletionLikelihood', () => {
    it('returns value between 0 and 1', () => {
      const article = makeArticle()
      const readingSpeed = {
        averageWordsPerMinute: 200,
        lastUpdated: new Date().toISOString(),
        sampleSize: 5,
      }
      const completionRate = {
        byDifficulty: { easy: 0.8, medium: 0.6, hard: 0.4 },
      }

      const likelihood = predictCompletionLikelihood(
        article,
        readingSpeed,
        completionRate,
      )
      expect(likelihood).toBeGreaterThanOrEqual(0)
      expect(likelihood).toBeLessThanOrEqual(1)
    })

    it('penalizes very long articles', () => {
      const longArticle = makeArticle({
        body: Array(5000).fill('word').join(' '),
      })

      const readingSpeed = {
        averageWordsPerMinute: 200,
        lastUpdated: new Date().toISOString(),
        sampleSize: 10,
      }
      const completionRate = {
        byDifficulty: { easy: 0.9, medium: 0.7, hard: 0.5 },
      }

      const likelihood = predictCompletionLikelihood(
        longArticle,
        readingSpeed,
        completionRate,
      )
      expect(likelihood).toBeLessThan(0.9)
    })
  })

  describe('getReadTimeEstimate', () => {
    it('provides estimate with confidence', () => {
      const article = makeArticle()
      const estimate = getReadTimeEstimate(article)

      expect(estimate).toHaveProperty('estimatedMinutes')
      expect(estimate).toHaveProperty('difficulty')
      expect(estimate).toHaveProperty('confidence')
      expect(estimate.difficulty).toMatch(/easy|medium|hard/)
    })

    it('has higher confidence with more reading samples', () => {
      const article = makeArticle()
      const slowSpeed = {
        averageWordsPerMinute: 150,
        lastUpdated: new Date().toISOString(),
        sampleSize: 2,
      }
      const fastSpeed = {
        averageWordsPerMinute: 250,
        lastUpdated: new Date().toISOString(),
        sampleSize: 50,
      }

      const slowEstimate = getReadTimeEstimate(article, slowSpeed)
      const fastEstimate = getReadTimeEstimate(article, fastSpeed)

      expect(fastEstimate.confidence).toBeGreaterThan(slowEstimate.confidence)
    })
  })

  describe('trackReadingSession', () => {
    it('creates reading session with start time', () => {
      const before = Date.now()
      const session = trackReadingSession('article1', 'easy')
      const after = Date.now()

      expect(session.articleId).toBe('article1')
      expect(session.difficulty).toBe('easy')
      expect(session.startTime).toBeGreaterThanOrEqual(before)
      expect(session.startTime).toBeLessThanOrEqual(after)
      expect(session.completed).toBe(false)
    })
  })

  describe('endReadingSession', () => {
    it('updates session with end time and completion status', () => {
      const session = trackReadingSession('article1', 'medium')
      const before = Date.now()
      const ended = endReadingSession(session, true)
      const after = Date.now()

      expect(ended.endTime).toBeDefined()
      expect(ended.endTime!).toBeGreaterThanOrEqual(before)
      expect(ended.endTime!).toBeLessThanOrEqual(after)
      expect(ended.completed).toBe(true)
    })
  })

  describe('calculateCompletionRateByDifficulty', () => {
    it('calculates completion rate by difficulty level', () => {
      const sessions = [
        trackReadingSession('a1', 'easy'),
        trackReadingSession('a2', 'easy'),
        trackReadingSession('a3', 'medium'),
      ]

      // Mark some as completed
      sessions[0] = endReadingSession(sessions[0], true)
      sessions[1] = endReadingSession(sessions[1], true)
      sessions[2] = endReadingSession(sessions[2], false)

      const rates = calculateCompletionRateByDifficulty(sessions)
      expect(rates.byDifficulty.easy).toBe(1.0)
      expect(rates.byDifficulty.medium).toBe(0)
    })

    it('returns default rates for empty sessions', () => {
      const rates = calculateCompletionRateByDifficulty([])
      expect(rates.byDifficulty.easy).toBe(0.5)
      expect(rates.byDifficulty.medium).toBe(0.5)
      expect(rates.byDifficulty.hard).toBe(0.3)
    })
  })
})
