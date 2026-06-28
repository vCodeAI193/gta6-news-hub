# Search Features Implementation (FEATURES-5)

This document describes the implementation of 5 advanced search features for the GTA6 News Hub.

## Feature 1: Search History Sync Across Devices

### Overview
Syncs search history from client localStorage to backend database, enabling users to access their search history across devices.

### Backend Implementation
**File:** `server/searchHistory.mjs`

- **`createSearchHistoryTable(db)`**: Initializes database table for storing search history entries
- **`storeSearchHistory(db, {userId, query, resultsCount, filters, deviceId})`**: Stores a search query
  - Deduplicates entries by (user_id, query, device_id)
  - Updates existing entries instead of creating duplicates
- **`getSearchHistory(db, userId, {limit, offset})`**: Paginated retrieval of user's search history
- **`syncSearchHistory(db, userId, localHistory)`**: Batch syncs multiple entries from client
  - Returns {synced, skipped} count
- **`getSearchTrends(db, userId, {days, limit})`**: Gets user's trending searches
- **`getPopularSearches(db, {days, limit})`**: Gets trending searches across all users
- **`clearOldSearchHistory(db, userId, days)`**: Purges old history entries

### Frontend Implementation
**File:** `src/components/SearchHistorySync.tsx`

**Exported Functions:**
- **`addToSearchHistory(query, resultsCount, filters)`**: Adds search to localStorage
  - Auto-deduplicates and maintains 50-entry limit
  - Generates unique device ID on first use
- **`getLocalSearchHistory()`**: Retrieves history from localStorage
- **`clearLocalSearchHistory()`**: Clears all local history
- **`useSearchHistory()`**: React hook for managing search history
  - Returns: {history, addSearch, clear, getLocal}

**Components:**
- **`<SearchHistorySync />`**: Syncs local history to backend on demand
  - Props: userId, onSyncComplete, autoSync
  - Shows sync status and last sync time

### API Routes
```
POST /api/search/history/sync
  Body: {history: SearchHistoryEntry[]}
  Returns: {synced: number, skipped: number}

GET /api/search/history?limit=20&offset=0
  Returns: {items: SearchHistoryEntry[], total: number}

GET /api/search/trends?userId=X&days=30&limit=10
  Returns: [{query, count, lastSearched}, ...]
```

### Database Schema
```sql
CREATE TABLE search_history (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  filters TEXT DEFAULT '{}',
  device_id TEXT,
  created_at TEXT NOT NULL,
  synced_at TEXT,
  UNIQUE(user_id, query, device_id)
)
```

### Tests
**File:** `server/searchHistory.test.mjs`
- 7 tests covering storage, deduplication, pagination, sync, and trends
- ✅ All passing

---

## Feature 2: Video Content Search with Timestamps

### Overview
Enables searching within video transcripts and jumping to relevant timestamps.

### Backend Implementation
**File:** `server/videoSearch.mjs`

- **`createVideoSearchTable(db)`**: Initializes tables for video_content and video_segments
- **`registerVideo(db, {articleId, videoUrl, duration, transcript})`**: Registers a video
- **`addVideoSegment(db, videoId, {startTime, endTime, text, keywords})`**: Adds time-coded segment
- **`segmentTranscript(transcript, segmentDuration, videoDuration)`**: Auto-segments transcripts
  - Returns array of segments with extracted keywords
- **`searchVideoSegments(db, query)`**: Full-text search within video segments
  - Case-insensitive matching
  - Returns segments with article/video metadata and timestamps
- **`getVideoSegments(db, videoId)`**: Gets all segments for a video
- **`getArticleVideo(db, articleId)`**: Retrieves video metadata for an article
- **`batchAddSegments(db, videoId, segments)`**: Batch insert segments

### Frontend Implementation
**File:** `src/components/VideoSearchResults.tsx`

**Components:**
- **`<VideoSearchResults />`**: Displays video search results
  - Props: query, onSegmentSelect, limit
  - Features:
    - Highlights matching query text
    - Shows timestamp ranges and keywords
    - Debounced search (300ms)
    - Displays duration and jump-to-time functionality

- **`<VideoPlayer />`**: Video player with integrated search
  - Props: videoUrl, onTimeUpdate
  - Integrated search box with real-time results
  - Auto-jumps video to selected segment timestamp

**Helper Functions:**
- `formatTime(seconds)`: Converts seconds to HH:MM:SS format
- `highlightText(text, query)`: Highlights matching text in JSX

### API Routes
```
GET /api/search/videos?query=...&limit=10
  Returns: {segments: VideoSegment[]}

POST /api/videos/:articleId/register
  Body: {videoUrl, duration, transcript}
  Returns: {id, articleId, videoUrl, duration}

POST /api/videos/:videoId/segments
  Body: {startTime, endTime, text, keywords}
  Returns: VideoSegment

GET /api/videos/:videoId/segments
  Returns: VideoSegment[]
```

### Database Schema
```sql
CREATE TABLE video_content (
  id TEXT PRIMARY KEY,
  article_id TEXT UNIQUE,
  video_url TEXT NOT NULL,
  video_duration INTEGER,
  transcript TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (article_id) REFERENCES articles(id)
)

CREATE TABLE video_segments (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  text TEXT NOT NULL,
  keywords TEXT DEFAULT '[]',
  created_at TEXT NOT NULL,
  FOREIGN KEY (video_id) REFERENCES video_content(id)
)
```

### Tests
**File:** `server/videoSearch.test.mjs`
- 7 tests covering registration, segmentation, search, and batch operations
- ✅ All passing

---

## Feature 3: Search Trends Visualization

### Overview
Tracks search trends over time and provides data for visualization (charts, graphs).

### Backend Implementation
**File:** `server/searchTrends.mjs`

- **`createSearchTrendsTable(db)`**: Initializes search_trends table
- **`recordSearchEvent(db, {query, category, userId})`**: Records a search event
  - Aggregates by date automatically
  - Increments unique user count
- **`getTrendsByPeriod(db, {days, bucket, limit})`**: Gets trends grouped by time period
  - bucket: 'day' | 'week' | 'month'
  - Returns time-bucketed trend data
- **`getTopTrends(db, {days, limit})`**: Gets top N trending queries
- **`getTrendVelocity(db, query, {recentDays, compareDays})`**: Measures trend growth
  - Returns velocity percentage and trending direction (up/down/stable)
- **`getTrendTimeSeries(db, {days, topN})`**: Returns data structured for charting
  - Returns {timestamps, series} suitable for line charts
- **`getRelatedTrends(db, query, {days, limit})`**: Gets co-occurring trending queries
- **`clearOldTrends(db, days)`**: Purges old trend data

### Frontend Implementation
**File:** `src/components/SearchTrendsChart.tsx`

**Components:**
- **`<SearchTrendsChart />`**: Main trends visualization
  - Props: days, limit, refreshInterval
  - Features:
    - Tabbed interface (Top Searches / Over Time)
    - Auto-refreshing data
    - Error and loading states

- **`<TrendBarChart />`**: Simple bar chart for top trends
  - Visual representation of search counts
  - Hover information showing search count and unique users

- **`<TrendLineChart />`**: SVG line chart for time series
  - Shows trend evolution over time
  - Multiple series visualization
  - Grid lines and axis labels
  - Legend display

- **`<TrendVelocityBadge />`**: Inline trend velocity indicator
  - Props: query, onVelocityLoad
  - Shows 📈 (up), 📉 (down), or ➡️ (stable)
  - Color-coded styling

### API Routes
```
GET /api/search/trends/top?days=7&limit=10
  Returns: {trends: TrendData[]}

GET /api/search/trends/timeseries?days=30&topN=5
  Returns: {timestamps: [], series: []}

GET /api/search/trends/velocity?query=...
  Returns: {percent: number, trending: 'up'|'down'|'stable'}

GET /api/search/trends/period?days=30&bucket=day
  Returns: [{period, query, totalSearches, totalUsers}, ...]
```

### Database Schema
```sql
CREATE TABLE search_trends (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  search_date TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  unique_users INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(query, search_date)
)
```

### Tests
**File:** `server/searchTrends.test.mjs`
- 7 tests covering event recording, aggregation, velocity, and time series
- ✅ All passing

---

## Feature 4: Advanced Query Syntax Parser

### Overview
Parses advanced search syntax for filtering by metadata (author, date, rating, category, reliability, tags).

### Backend Implementation
**File:** `server/advancedQuery.mjs`

- **`parseAdvancedQuery(input)`**: Parses advanced syntax
  - Supported filters:
    - `author:"Name"` or `author:Name`
    - `date:>2026-05-01` or `date:<2026-05-01` or `date:2026-05-01..2026-06-01`
    - `rating:>=4` or `rating:<=3.5`
    - `category:leak` (can repeat)
    - `reliability:confirmed|rumor|unconfirmed`
    - `tags:tag1,tag2,tag3`
    - Free-form text search
  - Returns normalized filter object

- **`buildFilterPredicate(filters)`**: Creates a filter function
  - Applies all filters in conjunction (AND logic)
  - Filters articles based on parsed criteria

- **`formatFilterDescription(filters)`**: Human-readable filter summary
  - Used for UI display of applied filters

- **`buildQueryString(filters, textQuery)`**: Reconstructs query from filters
  - Converts back to query string format for URLs/storage

- **`escapeSearchTerm(term)`**: Escapes special regex characters

### Frontend Implementation
**File:** `src/services/advancedSearch.ts`

- **`parseAdvancedQuery(input)`**: Client-side query parser
  - Mirrors server implementation for validation
- **`buildQueryString(filters, textQuery)`**: Reconstructs query
- **`formatFilterDescription(filters)`**: Format filters for display
- **`performAdvancedSearch(query, filters, options)`**: Execute search
- **`getAdvancedSearchSuggestions(query, filters)`**: Get typeahead suggestions

**File:** `src/components/AdvancedSearchForm.tsx`

**Component:**
- **`<AdvancedSearchForm />`**: Advanced search UI
  - Props: onSearch, initialQuery, initialFilters
  - Features:
    - Collapsible advanced panel
    - Add/remove authors
    - Date range picker
    - Category checkboxes
    - Reliability filter options
    - Tag management (add/remove)
    - Live query preview
    - Clear filters button

### API Routes
```
GET /api/search?q=...&limit=20&offset=0
  (Uses advanced query syntax for q parameter)
  Returns: {results: Article[], facets, total}

GET /api/search/suggestions?q=...&limit=5
  Returns: {suggestions: string[]}
```

### Tests
**File:** `server/advancedQuery.test.mjs`
- 13 tests covering all filter types, predicate building, and query reconstruction
- ✅ All passing

---

## Feature 5: Similar Content Finder

### Overview
Finds similar articles using semantic similarity, temporal proximity, and metadata matching. Useful for identifying related rumors/leaks.

### Backend Implementation
**File:** `server/similarContent.mjs`

- **`calculateSimilarity(article1, article2, weights)`**: Calculates similarity score (0-1)
  - Content similarity: Jaccard index on word tokens
  - Tag similarity: Overlap of article tags
  - Temporal proximity: Closeness of dates
  - Author similarity: Same author match
  - Category similarity: Same category match
  - Weights: {contentWeight, tagsWeight, temporalWeight, authorWeight, categoryWeight}

- **`findSimilar(articles, targetArticle, {limit, minScore})`**: Finds N similar articles
  - Filters by minimum similarity threshold
  - Returns sorted by similarity score

- **`clusterArticles(articles, {minScore})`**: Groups similar articles into clusters
  - Transitive clustering
  - Returns clusters with seed article and members

- **`findDuplicates(articles, {minScore})`**: Identifies near-duplicate articles
  - High threshold (default 0.7)
  - Useful for content moderation

- **`findByTopic(articles, topic, {minScore})`**: Finds articles by topic keyword
  - Extracts topic tokens and matches
  - Returns ranked by relevance

- **`getTrendingTopics(articles, {limit, minFreq})`**: Extracts trending terms
  - Finds most common meaningful keywords
  - Filters by minimum frequency

- **`scoreForVerification(articles, rumor, {minScore})`**: Scores articles for rumor verification
  - Boosts official sources
  - Useful for fact-checking rumors/leaks

**Helper Functions:**
- `extractTokens(text)`: Tokenizes and filters stop words
- `jaccardSimilarity(setA, setB)`: Calculates Jaccard index
- `temporalScore(date1, date2, maxDaysDiff)`: Scores temporal proximity

### Frontend Implementation
**File:** `src/components/SimilarContentFinder.tsx`

**Components:**
- **`<SimilarContentFinder />`**: Finds and displays similar articles
  - Props: articleId, limit, onArticleSelect
  - Features:
    - Async loading of similar content
    - Similarity score badges (color-coded)
    - Article metadata display
    - Click to navigate to similar article

- **`<SimilarArticleCluster />`**: Groups related articles
  - Props: articles, onArticleSelect
  - Shows articles as cluster with average similarity
  - Useful for display on article pages

**Helper Components:**
- `<SimilarityBadge />`: Visual similarity score indicator
  - Color coding: Green (70+), Yellow (50+), Blue (<50)

### API Routes
```
GET /api/search/similar?articleId=...&limit=5
  Returns: {similar: SimilarArticle[]}

GET /api/search/duplicates?minScore=0.7
  Returns: {duplicates: DuplicateMatch[]}

GET /api/search/topics?limit=20&minFreq=2
  Returns: {topics: [{term, frequency}, ...]}

POST /api/search/verify-rumor
  Body: {rumor: Article}
  Returns: {verificationScores: ScoredArticle[]}
```

### Tests
**File:** `server/similarContent.test.mjs`
- 11 tests covering similarity calculation, clustering, deduplication, and verification
- ✅ All passing

---

## Integration Guide

### Backend Integration
1. Import feature modules in `server/app.mjs`:
   ```javascript
   import { 
     createSearchHistoryTable,
     storeSearchHistory,
     getSearchHistory,
   } from './searchHistory.mjs'
   
   import {
     createVideoSearchTable,
     registerVideo,
     searchVideoSegments,
   } from './videoSearch.mjs'
   // ... etc
   ```

2. Initialize tables in database creation:
   ```javascript
   createSearchHistoryTable(db)
   createVideoSearchTable(db)
   createSearchTrendsTable(db)
   ```

3. Add routes to Express app for each feature's API endpoints

### Frontend Integration
1. Import components in your pages:
   ```tsx
   import { SearchHistorySync, useSearchHistory } from '../components/SearchHistorySync'
   import { VideoSearchResults } from '../components/VideoSearchResults'
   import { SearchTrendsChart } from '../components/SearchTrendsChart'
   import { AdvancedSearchForm } from '../components/AdvancedSearchForm'
   import { SimilarContentFinder } from '../components/SimilarContentFinder'
   ```

2. Use hooks and components in your pages:
   ```tsx
   const { history, addSearch } = useSearchHistory()
   
   <SearchTrendsChart days={7} limit={10} />
   <AdvancedSearchForm onSearch={handleSearch} />
   <SimilarContentFinder articleId={id} />
   ```

---

## Testing

All features have comprehensive test suites:

```bash
# Run all search feature tests
node --test server/searchHistory.test.mjs \
                server/videoSearch.test.mjs \
                server/searchTrends.test.mjs \
                server/advancedQuery.test.mjs \
                server/similarContent.test.mjs

# Results: 43 tests, all passing
```

### Coverage
- Feature 1 (Search History): 7 tests
- Feature 2 (Video Search): 7 tests
- Feature 3 (Search Trends): 7 tests
- Feature 4 (Advanced Query): 13 tests
- Feature 5 (Similar Content): 11 tests

---

## Performance Considerations

1. **Search History**: Uses UNIQUE constraint for deduplication; periodic cleanup recommended
2. **Video Segments**: Indexed on text for faster searching; batch insertion recommended
3. **Search Trends**: Aggregated daily; old data should be purged regularly
4. **Advanced Queries**: Regex parsing on client-side; server-side validation required
5. **Similar Content**: Jaccard similarity is O(n²); limit dataset for clustering

---

## Future Enhancements

1. Add Elasticsearch/Meilisearch backend for production search
2. Implement faceted search UI
3. Add search analytics dashboard
4. Machine learning-based similarity scoring
5. Collaborative filtering for recommendations
6. Video segment thumbnails/previews
7. Search query suggestions from trending topics
8. Personalized search results based on reading history
