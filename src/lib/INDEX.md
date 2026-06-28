# Personalization Module - API Index

This document lists all exported functions and types from the personalization system.

## Feature 1: Time-of-Day Aware Recommendations

### Types
```typescript
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'
```

### Functions
```typescript
getCurrentTimeOfDay(): TimeOfDay
// Get current time period based on local time
// Returns: 'morning', 'afternoon', 'evening', or 'night'

getTimeAlignmentBoost(
  article: Article,
  timeOfDay: TimeOfDay,
  userPreferences?: TimePreferences
): number
// Score boost for articles with time-relevant tags
// Returns: 0-50+ points to add to article score
```

---

## Feature 2: Emotion-Based Feed Filtering

### Types
```typescript
type MoodIntensity = number  // 0 = calm, 100 = exciting

interface EmotionalProfile {
  baselineIntensity: MoodIntensity
  lastUpdated: string
  history: { timestamp: string; intensity: MoodIntensity }[]
}
```

### Functions
```typescript
scoreArticleIntensity(article: Article): MoodIntensity
// Calculate emotional intensity of an article
// Returns: 0-100 (0=calm, 100=exciting)

filterByEmotionalIntensity(
  articles: Article[],
  userMood: MoodIntensity,
  tolerance?: number
): Article[]
// Filter articles matching user's emotional state
// tolerance: 0-100 (default 30, how much variation to allow)
// Returns: Filtered article array

suggestMoodBasedOnHistory(history: Article[]): MoodIntensity
// Suggest mood based on user's reading history
// Returns: 0-100 suggested mood intensity

loadEmotionalProfile(): EmotionalProfile
// Load emotional profile from localStorage
// Returns: EmotionalProfile with defaults if not set

saveEmotionalProfile(profile: EmotionalProfile): void
// Save emotional profile to localStorage
```

---

## Feature 3: User Similarity Recommendations

### Types
```typescript
interface UserProfile {
  interests: CategoryId[]
  tags: string[]
  reliabilityPreference: 'rumor' | 'mixed' | 'confirmed'
  averageMood: MoodIntensity
}

interface SimilarUser {
  userId: string
  similarityScore: number
  profile: UserProfile
}
```

### Functions
```typescript
calculateUserSimilarity(
  user1: UserProfile,
  user2: UserProfile
): number
// Calculate similarity between two users
// Returns: 0-1 (0=completely different, 1=identical)

recommendFromSimilarUsers(
  currentUser: UserProfile,
  otherUsers: Array<{ profile: UserProfile; readArticles: Article[] }>,
  userReadArticles: Set<string>,
  minSimilarity?: number
): Article[]
// Get articles from similar users that current user hasn't read
// minSimilarity: 0-1 threshold (default 0.5)
// Returns: Sorted article recommendations
```

---

## Feature 4: Smart Push Notification Timing

### Types
```typescript
interface ActivityTimestamp {
  hour: number           // 0-23
  dayOfWeek: number      // 0-6 (Sunday-Saturday)
  minuteOfDay: number    // 0-1440
}

interface ActivityPattern {
  engagementByHour: number[]          // 24 values (0-100)
  engagementByDayOfWeek: number[]     // 7 values (0-100)
  peakHour: number
  peakDayOfWeek: number
  totalEvents: number
  lastUpdated: string
}
```

### Functions
```typescript
logUserActivity(): ActivityTimestamp
// Log a user engagement event
// Returns: Current time information

buildActivityPattern(
  timestamps: ActivityTimestamp[]
): ActivityPattern
// Build engagement pattern from activity timestamps
// Returns: Pattern with normalized engagement scores (0-100)

suggestOptimalPushTime(
  pattern: ActivityPattern
): { hour: number; dayOfWeek?: number; confidence: number }
// Suggest best time to send push notification
// Returns: Suggested hour + confidence (0-1)

scorePushTiming(
  pattern: ActivityPattern,
  hour: number,
  dayOfWeek?: number
): number
// Score how well-timed a push would be
// Returns: 0-1 score

loadActivityPattern(): ActivityPattern | null
// Load activity pattern from localStorage
// Returns: Pattern or null if not set

saveActivityPattern(pattern: ActivityPattern): void
// Save activity pattern to localStorage
```

---

## Feature 5: Read Time Prediction

### Types
```typescript
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

interface ReadingSession {
  articleId: string
  startTime: number
  endTime?: number
  difficulty: 'easy' | 'medium' | 'hard'
  completed: boolean
}
```

### Functions
```typescript
calculateReadTime(
  body: string,
  wpm?: number
): number
// Calculate reading time in minutes
// wpm: Words per minute (default 200)
// Returns: Estimated minutes to read (minimum 1)

estimateArticleDifficulty(
  article: Article
): 'easy' | 'medium' | 'hard'
// Estimate article complexity
// Returns: Difficulty level based on content analysis

predictCompletionLikelihood(
  article: Article,
  userReadingSpeed: ReadingSpeed,
  userCompletionRate: { byDifficulty: Record<'easy' | 'medium' | 'hard', number> }
): number
// Predict if user will complete this article
// Returns: 0-1 probability

getReadTimeEstimate(
  article: Article,
  userReadingSpeed?: ReadingSpeed,
  userCompletionRate?: { byDifficulty: Record<'easy' | 'medium' | 'hard', number> }
): ReadTimeEstimate
// Get read time estimate with confidence
// Returns: EstimatedMinutes, difficulty, confidence (0-1)

trackReadingSession(
  articleId: string,
  difficulty: 'easy' | 'medium' | 'hard'
): ReadingSession
// Start tracking a reading session
// Returns: Session object (save for later endReadingSession call)

endReadingSession(
  session: ReadingSession,
  completed?: boolean
): ReadingSession
// End a reading session
// completed: User finished article (based on time/scroll)
// Returns: Updated session with endTime

calculateCompletionRateByDifficulty(
  sessions: ReadingSession[]
): { byDifficulty: Record<'easy' | 'medium' | 'hard', number> }
// Calculate user's completion rates by difficulty
// Returns: { easy: 0.8, medium: 0.6, hard: 0.4 } etc.

loadReadingSpeed(): ReadingSpeed
// Load reading speed profile from localStorage
// Returns: Profile with defaults if not set

loadCompletionRate(): { byDifficulty: Record<'easy' | 'medium' | 'hard', number> }
// Load completion rate from localStorage
// Returns: Rates with defaults if not set

loadReadingSessions(): ReadingSession[]
// Load reading sessions from localStorage
// Returns: Array of sessions (empty if not set)

saveReadingSpeed(speed: ReadingSpeed): void
// Save reading speed to localStorage

saveCompletionRate(rate: { byDifficulty: Record<'easy' | 'medium' | 'hard', number> }): void
// Save completion rates to localStorage

saveReadingSessions(sessions: ReadingSession[]): void
// Save reading sessions to localStorage
```

---

## Integration Helpers (personalization-integration.ts)

### Functions
```typescript
trackUserEngagement(): void
// Log current user engagement (call on every interaction)

scoreArticlePersonalized(...): {
  baseScore: number
  emotionMatch: number
  timeOfDayBoost: number
  completionLikelihood: number
  totalScore: number
}
// Score article using all 5 personalization dimensions
// Returns: Breakdown of scoring components

getPersonalizedFeed(
  articles: Article[],
  userInterests: CategoryId[],
  readHistory: Article[],
  currentMood: MoodIntensity,
  userProfile?: UserProfile,
  similarUsers?: Array<{ profile: UserProfile; readArticles: Article[] }>,
  maxResults?: number
): Article[]
// Generate personalized feed using all features
// Returns: Top N personalized articles

updateUserPreferencesAfterReading(
  session: ReadingSession,
  article: Article
): void
// Update user profiles after article completion
// Updates emotional, reading speed, and completion rates

suggestPushNotificationTiming(): {
  hour: number
  dayOfWeek?: number
  confidence: number
  message: string
}
// Suggest optimal push notification time
// Returns: Timing suggestion with human-readable message

getArticleReadabilityInfo(article: Article): {
  estimatedMinutes: number
  difficulty: 'easy' | 'medium' | 'hard'
  icon: string
  label: string
}
// Get UI-friendly readability info for article
// Returns: Info for display ("⚡ Quick read (~5 min)")

initializeReadingSession(article: Article): ReadingSession
// Start tracking when user opens article
// Returns: Session to save and later finalize

finalizeReadingSession(
  session: ReadingSession,
  timeSpentSeconds: number,
  scrollPercentage?: number
): ReadingSession
// Complete session when user leaves article
// Returns: Updated session with completion status

filterFeedByMood(
  articles: Article[],
  userMood: MoodIntensity,
  strictness?: 'relaxed' | 'normal' | 'strict'
): Article[]
// Quick filter by mood before personalization
// strictness: tolerance level for filtering
// Returns: Filtered articles

isPushTimingOptimal(
  currentHour: number,
  currentDay: number
): { isOptimal: boolean; score: number; suggestion: string }
// Check if current time is good for push notification
// Returns: Optimality check with explanation

updateActivityPattern(
  recentActivities: Array<{ hour: number; dayOfWeek: number; minuteOfDay: number }>
): ActivityPattern
// Periodically update activity pattern
// Returns: Updated pattern

buildUserProfile(
  interests: CategoryId[],
  readHistory: Article[]
): UserProfile
// Create user profile from history and subscriptions
// Returns: UserProfile for similarity calculations
```

---

## Data Persistence Keys

All data stored in localStorage with `gta6hub:personalization:` prefix:

```
gta6hub:personalization:emotional          → EmotionalProfile
gta6hub:personalization:activity           → ActivityPattern
gta6hub:personalization:readingSpeed       → ReadingSpeed
gta6hub:personalization:completionRate     → CompletionRate
gta6hub:personalization:readingSessions    → ReadingSession[]
```

Use provided load/save functions - never access directly.

---

## Example Usage

```typescript
// Import what you need
import {
  getCurrentTimeOfDay,
  filterByEmotionalIntensity,
  calculateUserSimilarity,
  suggestOptimalPushTime,
  getReadTimeEstimate,
} from '@/lib/personalization'

import {
  getPersonalizedFeed,
  getArticleReadabilityInfo,
  buildUserProfile,
} from '@/lib/personalization-integration'

// Build feed
const profile = buildUserProfile(interests, readHistory)
const feed = getPersonalizedFeed(
  articles,
  interests,
  readHistory,
  currentMood,
  profile
)

// Show readability
const readability = getArticleReadabilityInfo(article)
console.log(readability.label) // "⚡ Quick read (~5 min)"

// Get push timing
const timing = suggestOptimalPushTime(pattern)
console.log(timing.message) // "Best time to reach user: 6 PM on Friday..."
```

---

## Testing

All functions have comprehensive tests in `personalization.test.ts`:

```bash
npm test -- src/lib/personalization.test.ts

✓ 35 tests passing
✓ 100% feature coverage
✓ All types validated
```

---

## Files

- `src/lib/personalization.ts` - Core implementation (450+ lines)
- `src/lib/personalization.test.ts` - Tests (35 passing)
- `src/lib/personalization-integration.ts` - UI helpers (200+ lines)
- `src/lib/INDEX.md` - This file

---

## Next Steps

1. Import functions into React components
2. Add mood slider UI component
3. Track reading sessions with scroll/time
4. Update UI with read time estimates
5. Implement push notification batching
6. Create user preferences dashboard
