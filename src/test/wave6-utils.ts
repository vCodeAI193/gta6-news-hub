/**
 * Wave 6 Test Utilities
 *
 * Comprehensive mocking and fixture generation for Wave 6 features:
 * - Search & Discovery (history, trends, video search)
 * - Personalization (time-based, emotion-based recommendations)
 * - Community Features (groups, moderation, threads)
 */

import { vi } from 'vitest'

// ============================================================================
// SEARCH & DISCOVERY MOCKS
// ============================================================================

export interface SearchHistoryItem {
  id: string
  query: string
  timestamp: number
  results_count: number
  category?: string
}

export interface SearchTrend {
  id: string
  query: string
  trend_score: number
  growth_rate: number
  category: string
  peak_time: number
  related_queries: string[]
}

export interface VideoSearchResult {
  id: string
  title: string
  description: string
  source: 'youtube' | 'twitch' | 'internal'
  duration_seconds: number
  view_count: number
  published_at: number
  thumbnail_url: string
  url: string
}

/**
 * Mock helpers for search history
 */
export const createMockSearchHistory = (): SearchHistoryItem[] => [
  {
    id: 'sh-1',
    query: 'GTA 6 release date',
    timestamp: Date.now() - 3600000,
    results_count: 245,
    category: 'release',
  },
  {
    id: 'sh-2',
    query: 'GTA 6 map size',
    timestamp: Date.now() - 7200000,
    results_count: 189,
    category: 'gameplay',
  },
  {
    id: 'sh-3',
    query: 'GTA 6 characters',
    timestamp: Date.now() - 10800000,
    results_count: 412,
    category: 'story',
  },
]

export const mockSearchHistory = () => ({
  getHistory: vi.fn(async (): Promise<SearchHistoryItem[]> => createMockSearchHistory()),
  clearHistory: vi.fn(async (): Promise<void> => {}),
  addToHistory: vi.fn(async (query: string): Promise<SearchHistoryItem> => ({
    id: `sh-${Date.now()}`,
    query,
    timestamp: Date.now(),
    results_count: 0,
  })),
  removeFromHistory: vi.fn(async (): Promise<void> => {}),
})

/**
 * Mock helpers for search trends
 */
export const createMockSearchTrends = (): SearchTrend[] => [
  {
    id: 'trend-1',
    query: 'GTA 6 leak',
    trend_score: 9.8,
    growth_rate: 2.5,
    category: 'leaks',
    peak_time: Date.now() - 86400000,
    related_queries: ['GTA 6 screenshot', 'GTA 6 news', 'Rockstar announcement'],
  },
  {
    id: 'trend-2',
    query: 'GTA 6 physics engine',
    trend_score: 7.2,
    growth_rate: 1.8,
    category: 'gameplay',
    peak_time: Date.now() - 172800000,
    related_queries: ['GTA 6 graphics', 'GTA 6 performance', 'next-gen features'],
  },
  {
    id: 'trend-3',
    query: 'Vice City location',
    trend_score: 6.5,
    growth_rate: 0.9,
    category: 'story',
    peak_time: Date.now() - 259200000,
    related_queries: ['GTA 6 setting', 'Miami', 'expansion'],
  },
]

export const mockSearchTrends = () => ({
  getTrends: vi.fn(async (): Promise<SearchTrend[]> => createMockSearchTrends()),
  getTrendHistory: vi.fn(async (): Promise<SearchTrend[]> => createMockSearchTrends()),
  analyzeTrendGrowth: vi.fn(async (): Promise<{ score: number; growth: number }> => ({
    score: 8.5,
    growth: 2.1,
  })),
})

/**
 * Mock helpers for video search
 */
export const createMockVideoSearchResults = (): VideoSearchResult[] => [
  {
    id: 'vid-1',
    title: 'GTA 6 Official Announcement Trailer',
    description: 'The official announcement trailer for Grand Theft Auto VI.',
    source: 'youtube',
    duration_seconds: 180,
    view_count: 54000000,
    published_at: Date.now() - 2592000000,
    thumbnail_url: 'https://img.youtube.com/vi/xxxx/0.jpg',
    url: 'https://www.youtube.com/watch?v=xxxxx',
  },
  {
    id: 'vid-2',
    title: 'GTA 6 Gameplay Reveal - Full Walkthrough',
    description: 'Extended gameplay footage from the GTA 6 gameplay reveal event.',
    source: 'youtube',
    duration_seconds: 1200,
    view_count: 38000000,
    published_at: Date.now() - 2592000000,
    thumbnail_url: 'https://img.youtube.com/vi/yyyy/0.jpg',
    url: 'https://www.youtube.com/watch?v=yyyyy',
  },
  {
    id: 'vid-3',
    title: 'GTA 6 Live Stream - Community Q&A',
    description: 'Rockstar Games community Q&A session.',
    source: 'twitch',
    duration_seconds: 3600,
    view_count: 1200000,
    published_at: Date.now() - 604800000,
    thumbnail_url: 'https://static-cdn.jtvnw.net/xxxx.jpg',
    url: 'https://www.twitch.tv/rockstar_games',
  },
]

export const mockVideoSearch = () => ({
  searchVideos: vi.fn(async (): Promise<VideoSearchResult[]> => createMockVideoSearchResults()),
  getTrendingVideos: vi.fn(async (): Promise<VideoSearchResult[]> => createMockVideoSearchResults()),
  getVideoDetails: vi.fn(async (): Promise<VideoSearchResult | null> =>
    createMockVideoSearchResults()[0] || null
  ),
  saveVideoWatch: vi.fn(async (): Promise<void> => {}),
})

// ============================================================================
// PERSONALIZATION MOCKS
// ============================================================================

export interface TimeBasedRecommendation {
  id: string
  article_id: string
  title: string
  reason: string
  optimal_time: 'morning' | 'afternoon' | 'evening'
  confidence: number
  priority: number
}

export interface EmotionBasedRecommendation {
  id: string
  article_id: string
  title: string
  emotion_tags: string[]
  predicted_engagement: number
  sentiment_score: number
  match_score: number
}

/**
 * Mock helpers for time-based recommendations
 */
export const createMockTimeBasedRecommendations = (): TimeBasedRecommendation[] => [
  {
    id: 'tbr-1',
    article_id: 'art-123',
    title: 'GTA 6 Early Morning News Roundup',
    reason: 'Users typically engage with news summaries in the morning',
    optimal_time: 'morning',
    confidence: 0.92,
    priority: 1,
  },
  {
    id: 'tbr-2',
    article_id: 'art-456',
    title: 'GTA 6 Community Highlights - Week in Review',
    reason: 'Evening reading is ideal for longer-form content',
    optimal_time: 'evening',
    confidence: 0.87,
    priority: 2,
  },
  {
    id: 'tbr-3',
    article_id: 'art-789',
    title: 'Quick GTA 6 Tips for Your Lunch Break',
    reason: 'Short, digestible content performs well during afternoon breaks',
    optimal_time: 'afternoon',
    confidence: 0.78,
    priority: 3,
  },
]

export const mockTimeBasedRecommendations = () => ({
  getRecommendationsForTime: vi.fn(async (): Promise<TimeBasedRecommendation[]> =>
    createMockTimeBasedRecommendations()
  ),
  updateTimePreferences: vi.fn(async (): Promise<void> => {}),
  predictOptimalTime: vi.fn(async (): Promise<string> => 'evening'),
})

/**
 * Mock helpers for emotion-based recommendations
 */
export const createMockEmotionBasedRecommendations = (): EmotionBasedRecommendation[] => [
  {
    id: 'ebr-1',
    article_id: 'art-111',
    title: 'GTA 6 Exciting New Features Announced',
    emotion_tags: ['excitement', 'anticipation', 'joy'],
    predicted_engagement: 0.95,
    sentiment_score: 0.89,
    match_score: 0.91,
  },
  {
    id: 'ebr-2',
    article_id: 'art-222',
    title: 'GTA 6 Development Challenges: The Details',
    emotion_tags: ['curiosity', 'intrigue', 'interest'],
    predicted_engagement: 0.82,
    sentiment_score: 0.61,
    match_score: 0.78,
  },
  {
    id: 'ebr-3',
    article_id: 'art-333',
    title: 'Community Reactions to Latest GTA 6 News',
    emotion_tags: ['nostalgia', 'anticipation', 'connection'],
    predicted_engagement: 0.88,
    sentiment_score: 0.72,
    match_score: 0.84,
  },
]

export const mockEmotionBasedRecommendations = () => ({
  getEmotionalRecommendations: vi.fn(async (): Promise<EmotionBasedRecommendation[]> =>
    createMockEmotionBasedRecommendations()
  ),
  analyzeUserSentiment: vi.fn(async (): Promise<string[]> =>
    ['excitement', 'curiosity', 'anticipation']
  ),
  updateEmotionProfile: vi.fn(async (): Promise<void> => {}),
  recommendBasedOnMood: vi.fn(async (): Promise<EmotionBasedRecommendation[]> =>
    createMockEmotionBasedRecommendations()
  ),
})

// ============================================================================
// COMMUNITY FEATURES MOCKS
// ============================================================================

export interface CommunityGroup {
  id: string
  name: string
  description: string
  members_count: number
  created_at: number
  is_public: boolean
  moderators: string[]
  category: string
}

export interface CommunityThread {
  id: string
  group_id: string
  title: string
  content: string
  author_id: string
  author_name: string
  created_at: number
  reply_count: number
  upvote_count: number
  pinned: boolean
}

export interface ModerationAction {
  id: string
  target_id: string
  target_type: 'comment' | 'thread' | 'user'
  action: 'hide' | 'delete' | 'warn' | 'suspend'
  reason: string
  moderator_id: string
  created_at: number
  status: 'pending' | 'approved' | 'rejected'
}

/**
 * Mock helpers for community groups
 */
export const createMockCommunityGroups = (): CommunityGroup[] => [
  {
    id: 'grp-1',
    name: 'GTA 6 Leaks & Rumors',
    description: 'Discuss the latest leaks, rumors, and speculation about GTA 6.',
    members_count: 45000,
    created_at: Date.now() - 7776000000,
    is_public: true,
    moderators: ['mod-1', 'mod-2', 'mod-3'],
    category: 'discussion',
  },
  {
    id: 'grp-2',
    name: 'Speedrun Community',
    description: 'For speedrunners to share techniques and records.',
    members_count: 8200,
    created_at: Date.now() - 15552000000,
    is_public: true,
    moderators: ['mod-4', 'mod-5'],
    category: 'gaming',
  },
  {
    id: 'grp-3',
    name: 'GTA 6 Modding Workshop',
    description: 'Discuss modding, tools, and custom content (private group).',
    members_count: 3400,
    created_at: Date.now() - 10368000000,
    is_public: false,
    moderators: ['mod-6'],
    category: 'technical',
  },
]

export const mockCommunityGroups = () => ({
  getGroups: vi.fn(async (): Promise<CommunityGroup[]> => createMockCommunityGroups()),
  getGroupById: vi.fn(async (): Promise<CommunityGroup | null> => createMockCommunityGroups()[0] || null),
  createGroup: vi.fn(async (data: Partial<CommunityGroup>): Promise<CommunityGroup> => ({
    id: `grp-${Date.now()}`,
    name: 'New Group',
    description: '',
    members_count: 1,
    created_at: Date.now(),
    is_public: true,
    moderators: [],
    category: 'general',
    ...data,
  })),
  joinGroup: vi.fn(async (): Promise<void> => {}),
  leaveGroup: vi.fn(async (): Promise<void> => {}),
})

/**
 * Mock helpers for community threads
 */
export const createMockCommunityThreads = (): CommunityThread[] => [
  {
    id: 'thread-1',
    group_id: 'grp-1',
    title: 'New leak shows detailed map layout',
    content: 'Just found this screenshot showing what appears to be...',
    author_id: 'user-1',
    author_name: 'GTAFanatic92',
    created_at: Date.now() - 3600000,
    reply_count: 234,
    upvote_count: 1850,
    pinned: true,
  },
  {
    id: 'thread-2',
    group_id: 'grp-1',
    title: 'Release date predictions - your thoughts?',
    content: 'What are your best guesses for the release date?',
    author_id: 'user-2',
    author_name: 'ViceCity_Explorer',
    created_at: Date.now() - 7200000,
    reply_count: 487,
    upvote_count: 2340,
    pinned: false,
  },
  {
    id: 'thread-3',
    group_id: 'grp-2',
    title: 'New any% world record - 4:23:17',
    content: 'Finally got it! New world record for any% speedrun...',
    author_id: 'user-3',
    author_name: 'SpeedRunKing',
    created_at: Date.now() - 10800000,
    reply_count: 89,
    upvote_count: 956,
    pinned: false,
  },
]

export const mockCommunityThreads = () => ({
  getThreads: vi.fn(async (): Promise<CommunityThread[]> =>
    createMockCommunityThreads()
  ),
  getThreadById: vi.fn(async (): Promise<CommunityThread | null> => createMockCommunityThreads()[0] || null),
  createThread: vi.fn(async (groupId: string, data: Partial<CommunityThread>): Promise<CommunityThread> => ({
    id: `thread-${Date.now()}`,
    group_id: groupId,
    title: 'New Thread',
    content: '',
    author_id: 'current-user',
    author_name: 'Anonymous',
    created_at: Date.now(),
    reply_count: 0,
    upvote_count: 0,
    pinned: false,
    ...data,
  })),
  upvoteThread: vi.fn(async (): Promise<void> => {}),
  pinThread: vi.fn(async (): Promise<void> => {}),
})

/**
 * Mock helpers for moderation
 */
export const createMockModerationActions = (): ModerationAction[] => [
  {
    id: 'mod-action-1',
    target_id: 'comment-123',
    target_type: 'comment',
    action: 'hide',
    reason: 'Potential spam',
    moderator_id: 'mod-1',
    created_at: Date.now() - 3600000,
    status: 'approved',
  },
  {
    id: 'mod-action-2',
    target_id: 'user-999',
    target_type: 'user',
    action: 'warn',
    reason: 'Harassment and abuse',
    moderator_id: 'mod-2',
    created_at: Date.now() - 7200000,
    status: 'pending',
  },
  {
    id: 'mod-action-3',
    target_id: 'thread-456',
    target_type: 'thread',
    action: 'delete',
    reason: 'Off-topic and promotional content',
    moderator_id: 'mod-3',
    created_at: Date.now() - 10800000,
    status: 'approved',
  },
]

export const mockModeration = () => ({
  getPendingActions: vi.fn(async (): Promise<ModerationAction[]> =>
    createMockModerationActions().filter(a => a.status === 'pending')
  ),
  approveAction: vi.fn(async (): Promise<void> => {}),
  rejectAction: vi.fn(async (): Promise<void> => {}),
  createAction: vi.fn(async (data: Partial<ModerationAction>): Promise<ModerationAction> => ({
    id: `mod-action-${Date.now()}`,
    target_id: '',
    target_type: 'comment',
    action: 'hide',
    reason: '',
    moderator_id: '',
    created_at: Date.now(),
    status: 'pending',
    ...data,
  })),
  getActionHistory: vi.fn(async (): Promise<ModerationAction[]> =>
    createMockModerationActions()
  ),
})

// ============================================================================
// FIXTURE GENERATORS
// ============================================================================

/**
 * Create a complete set of test data for Wave 6
 */
export const createWave6Fixtures = () => ({
  searchHistory: createMockSearchHistory(),
  searchTrends: createMockSearchTrends(),
  videoResults: createMockVideoSearchResults(),
  timeBasedRecs: createMockTimeBasedRecommendations(),
  emotionBasedRecs: createMockEmotionBasedRecommendations(),
  communityGroups: createMockCommunityGroups(),
  communityThreads: createMockCommunityThreads(),
  moderationActions: createMockModerationActions(),
})

/**
 * Reset all mocks to default state
 */
export const resetWave6Mocks = (mocks: ReturnType<typeof setupWave6Mocks>) => {
  Object.values(mocks).forEach((mock) => {
    if (typeof mock === 'object' && mock !== null) {
      Object.values(mock).forEach((fn) => {
        if (typeof fn === 'function' && fn.mockClear) {
          fn.mockClear()
        }
      })
    }
  })
}

/**
 * Setup all Wave 6 mocks
 */
export const setupWave6Mocks = () => ({
  searchHistory: mockSearchHistory(),
  searchTrends: mockSearchTrends(),
  videoSearch: mockVideoSearch(),
  timeBasedRecs: mockTimeBasedRecommendations(),
  emotionBasedRecs: mockEmotionBasedRecommendations(),
  communityGroups: mockCommunityGroups(),
  communityThreads: mockCommunityThreads(),
  moderation: mockModeration(),
})
