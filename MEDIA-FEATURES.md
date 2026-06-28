# 5 Media Features Implementation Guide

This document describes the implementation of 5 advanced media features for the GTA6 News Hub platform.

## Overview

The implementation includes:
1. **Transcript Search** - Full-text search over video transcripts with timestamp navigation
2. **Auto Chapter Generation** - AI-generated video chapters from transcripts
3. **Subtitle Editor** - In-browser subtitle creation/editing with VTT format support
4. **Live Streaming Integration** - Embed Twitch/YouTube streams
5. **Auto Quality Selection** - Intelligent bitrate/resolution selection based on bandwidth

## Architecture

### Frontend Components (`src/components/`)

#### TranscriptSearch.tsx
Full-text search interface for video transcripts with real-time results and timestamp navigation.

**Features:**
- Debounced search input
- Inverted index-based search engine
- Highlighted search results
- Relevance scoring
- Click-to-seek functionality

**Usage:**
```tsx
import { TranscriptSearch } from './TranscriptSearch'
import type { TranscriptSegment } from '../lib/media'

const segments: TranscriptSegment[] = [
  { id: 's1', text: 'Welcome to GTA 6', startTime: 0, endTime: 5 },
  // ...
]

function MyComponent() {
  return (
    <TranscriptSearch
      segments={segments}
      onTimestampClick={(time) => videoRef.current.currentTime = time}
    />
  )
}
```

#### ChapterGenerator.tsx
Generates video chapters from transcript analysis, with manual editing capabilities.

**Features:**
- Automatic chapter detection from transcript
- Confidence scoring
- Manual chapter addition/editing
- Chapter deletion
- Timestamp-based navigation

**Usage:**
```tsx
import { ChapterGenerator } from './ChapterGenerator'

function VideoPage() {
  return (
    <ChapterGenerator
      segments={transcriptSegments}
      onChaptersGenerated={(chapters) => saveChapters(chapters)}
      onChapterSelect={(chapter) => seekToChapter(chapter)}
    />
  )
}
```

#### SubtitleEditor.tsx
Complete subtitle editing interface with VTT format support.

**Features:**
- Visual subtitle editor
- VTT format import/export
- Timing validation
- Overlap detection
- Multi-language support
- File upload/download

**Usage:**
```tsx
import { SubtitleEditor } from './SubtitleEditor'

function SubtitlesPage() {
  return (
    <SubtitleEditor
      videoId="video-123"
      onSubtitlesSave={(subtitles) => saveSubtitles(subtitles)}
    />
  )
}
```

#### LiveStreamEmbed.tsx
Embed live streams from Twitch and YouTube platforms.

**Features:**
- Twitch stream embedding
- YouTube stream embedding
- Channel validation
- Responsive sizing
- Platform information display

**Usage:**
```tsx
import { LiveStreamEmbed } from './LiveStreamEmbed'

function StreamPage() {
  return (
    <LiveStreamEmbed
      platform="twitch"
      channelId="rockstargames"
      title="GTA 6 Live Stream"
      height={500}
    />
  )
}
```

#### AdaptiveVideoPlayer.tsx
Intelligent video player with automatic quality selection based on bandwidth.

**Features:**
- Bandwidth estimation
- Automatic quality switching
- Manual quality selection
- Real-time bandwidth monitoring
- Quality recommendations
- Network profile detection

**Usage:**
```tsx
import { AdaptiveVideoPlayer } from './AdaptiveVideoPlayer'

function VideoPage() {
  const qualities = [
    { resolution: '360p', bitrate: 500, fps: 30, codec: 'h264', url: 'url-360' },
    { resolution: '720p', bitrate: 2000, fps: 60, codec: 'h264', url: 'url-720' },
    { resolution: '1080p', bitrate: 5000, fps: 60, codec: 'h264', url: 'url-1080' },
  ]

  return (
    <AdaptiveVideoPlayer
      videoQualities={qualities}
      onQualityChange={(quality) => console.log(quality.resolution)}
    />
  )
}
```

### Backend Services (`server/media-services.mjs`)

#### Transcript Management
```javascript
// Get transcript
getTranscript(videoId)

// Save transcript
saveTranscript(videoId, segments)

// Search transcripts
searchTranscripts(query, videoIds)

// Get statistics
getTranscriptStats(videoId)
```

#### Chapter Management
```javascript
// Generate chapters
generateChapters(videoId)

// Get chapters
getChapters(videoId)

// Update chapter
updateChapter(videoId, chapterId, updates)

// Delete chapter
deleteChapter(videoId, chapterId)
```

#### Subtitle Management
```javascript
// Get subtitles
getSubtitles(videoId, language)

// Save subtitles
saveSubtitles(videoId, language, subtitleTrack)

// Parse VTT
parseVTT(vttContent)

// Generate VTT
generateVTT(subtitles)

// Validate subtitles
validateSubtitles(subtitles)

// Get subtitle languages
getSubtitleLanguages(videoId)

// Update subtitle
updateSubtitle(videoId, language, subtitleId, updates)
```

#### Live Streaming
```javascript
// Get streams
getLiveStreams(platform)

// Add stream
addLiveStream(stream)

// Update stream
updateLiveStream(streamId, updates)

// Remove stream
removeLiveStream(streamId)

// Validate channel
validateStreamChannel(platform, channelId)
```

#### Quality Management
```javascript
// Get quality profile
getQualityProfile(resolution)

// Get recommended quality
getRecommendedQuality(bandwidth)

// Generate ABR manifest
generateABRManifest(videoId, availableQualities)

// Estimate optimal quality
estimateOptimalQuality(clientBandwidth, videoId)
```

### API Routes (`server/media-api.mjs`)

#### Transcript Search API
```
GET    /api/transcripts/:videoId
POST   /api/transcripts/:videoId
GET    /api/transcripts/search/:query
GET    /api/transcripts/:videoId/stats
```

#### Chapter API
```
POST   /api/chapters/:videoId/generate
GET    /api/chapters/:videoId
PATCH  /api/chapters/:videoId/:chapterId
DELETE /api/chapters/:videoId/:chapterId
```

#### Subtitle API
```
GET    /api/subtitles/:videoId/:language
POST   /api/subtitles/:videoId/:language
POST   /api/subtitles/:videoId/:language/import-vtt
GET    /api/subtitles/:videoId/:language/export-vtt
GET    /api/subtitles/:videoId/languages
PATCH  /api/subtitles/:videoId/:language/:subtitleId
```

#### Live Streaming API
```
GET    /api/streams
POST   /api/streams
PATCH  /api/streams/:streamId
DELETE /api/streams/:streamId
```

#### Quality API
```
POST   /api/quality/recommend
GET    /api/quality/:resolution
POST   /api/quality/:videoId/manifest
POST   /api/quality/:videoId/optimal
```

## Data Structures

### TranscriptSegment
```typescript
interface TranscriptSegment {
  id: string
  text: string
  startTime: number
  endTime: number
  speaker?: string
}
```

### Chapter
```typescript
interface Chapter {
  id: string
  title: string
  startTime: number
  endTime?: number
  description?: string
  confidence: number
}
```

### Subtitle
```typescript
interface Subtitle {
  id: string
  startTime: number
  endTime: number
  text: string
  position?: 'top' | 'bottom'
}
```

### SubtitleTrack
```typescript
interface SubtitleTrack {
  id: string
  language: string
  label: string
  subtitles: Subtitle[]
  createdAt: number
  updatedAt: number
}
```

### LiveStream
```typescript
interface LiveStream {
  id: string
  platform: 'twitch' | 'youtube'
  channelId: string
  title: string
  isLive: boolean
  startedAt?: number
  endedAt?: number
  viewers?: number
  embedUrl: string
  thumbnail?: string
}
```

### VideoQuality
```typescript
interface VideoQuality {
  resolution: string
  bitrate: number
  fps: number
  codec: string
  url: string
}
```

## Library Functions (`src/lib/media.ts`)

### Transcript Search Engine
```typescript
class TranscriptSearchEngine {
  buildIndex(segments: TranscriptSegment[]): void
  search(query: string, segments: TranscriptSegment[]): TranscriptSearchResult[]
}

export const transcriptSearchEngine = new TranscriptSearchEngine()
```

### Chapter Generation
```typescript
export function generateChaptersFromTranscript(segments: TranscriptSegment[]): Chapter[]
```

### VTT Format Support
```typescript
export function parseVTT(vttContent: string): Subtitle[]
export function generateVTT(subtitles: Subtitle[]): string
export function validateSubtitles(subtitles: Subtitle[]): string[]
```

### Live Streaming Utilities
```typescript
export function generateStreamEmbedUrl(platform: StreamPlatform, channelId: string): string
export function validateStreamChannel(platform: StreamPlatform, channelId: string): boolean
```

### Quality Selection
```typescript
export async function estimateBandwidth(): Promise<number>
export function getRecommendedQuality(bandwidth: number, availableQualities: VideoQuality[]): VideoQuality | null
export function createBandwidthMonitor(onQualityChange: (quality: VideoQuality) => void, availableQualities: VideoQuality[]): () => void
```

## Testing

### Unit Tests (`src/lib/media.test.ts`)
- Transcript search functionality
- Chapter generation
- VTT parsing and generation
- Subtitle validation
- Live stream URL generation
- Quality selection algorithms

### Backend Tests (`server/media-services.test.mjs`)
- Transcript storage and retrieval
- Chapter CRUD operations
- Subtitle management
- Live stream operations
- Quality profile handling

### Running Tests
```bash
npm test                    # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test:server       # Server tests only
```

## Integration Examples

### Complete Video Player with All Features
```tsx
import { useState } from 'react'
import { VideoPlayer } from './VideoPlayer'
import { TranscriptSearch } from './TranscriptSearch'
import { ChapterGenerator } from './ChapterGenerator'
import { SubtitleEditor } from './SubtitleEditor'
import { AdaptiveVideoPlayer } from './AdaptiveVideoPlayer'
import type { TranscriptSegment } from '../lib/media'

export function FullMediaPage() {
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([])

  return (
    <div className="media-page">
      <AdaptiveVideoPlayer
        videoQualities={[
          { resolution: '360p', bitrate: 500, fps: 30, codec: 'h264', url: 'url-360' },
          { resolution: '720p', bitrate: 2000, fps: 60, codec: 'h264', url: 'url-720' },
          { resolution: '1080p', bitrate: 5000, fps: 60, codec: 'h264', url: 'url-1080' },
        ]}
      />

      <section className="media-features">
        <div className="feature-column">
          <TranscriptSearch
            segments={transcript}
            onTimestampClick={(time) => {
              // Seek video
            }}
          />

          <ChapterGenerator
            segments={transcript}
            onChaptersGenerated={(chapters) => {
              // Save chapters
            }}
          />
        </div>

        <div className="feature-column">
          <SubtitleEditor
            videoId="video-123"
            onSubtitlesSave={(subtitles) => {
              // Save subtitles
            }}
          />
        </div>
      </section>
    </div>
  )
}
```

### Server Integration
```javascript
import express from 'express'
import mediaAPI from './media-api.mjs'

const app = express()
app.use(express.json())

// Mount media API routes
app.use('/api', mediaAPI)

app.listen(3000, () => {
  console.log('Media API running on port 3000')
})
```

## Performance Considerations

### Transcript Search
- Uses inverted index for O(1) lookup
- Tokenization with word boundaries
- Relevance scoring based on term frequency
- Debounced search input

### Chapter Generation
- Single-pass transcript analysis
- Keyword matching with confidence scoring
- Minimum chapter duration (30 seconds)

### Subtitle Validation
- O(n) single-pass validation
- Overlap detection
- Timing consistency checks

### Quality Selection
- Non-blocking bandwidth estimation
- 5-second polling interval
- Smooth quality transitions
- Network profile detection

## Browser Compatibility

- **Transcript Search**: All modern browsers
- **Chapter Generation**: All modern browsers
- **Subtitle Editor**: All modern browsers
- **Live Streaming**: Requires iframe support (all modern browsers)
- **Adaptive Video**: Requires Media API (Chrome 23+, Firefox 25+, Safari 8+)

## Known Limitations

1. **Transcript Search**: Simple keyword-based search without stemming
2. **Chapter Generation**: Uses keyword heuristics, not semantic analysis
3. **Subtitle Editor**: Basic validation, no spell-checking
4. **Live Streaming**: Requires valid channel IDs
5. **Quality Selection**: Estimates bandwidth using Network Information API fallback

## Future Enhancements

1. AI-powered chapter title generation using NLP
2. Automatic subtitle generation using speech-to-text
3. Multi-language transcript search
4. Advanced quality metrics (latency, jitter)
5. Subtitle styling and positioning options
6. Closed caption customization
7. Stream analytics and metrics
8. Advanced search filters (speaker, sentiment, keywords)

## Files Created

- `/src/lib/media.ts` - Core media library
- `/src/lib/media.test.ts` - Library tests
- `/src/components/TranscriptSearch.tsx` - Search component
- `/src/components/ChapterGenerator.tsx` - Chapter component
- `/src/components/SubtitleEditor.tsx` - Subtitle editor
- `/src/components/LiveStreamEmbed.tsx` - Stream embedding
- `/src/components/AdaptiveVideoPlayer.tsx` - Quality player
- `/server/media-services.mjs` - Backend services
- `/server/media-services.test.mjs` - Service tests
- `/server/media-api.mjs` - API routes

## Contributing

When adding new media features:
1. Add corresponding library functions in `/src/lib/media.ts`
2. Create React components in `/src/components/`
3. Implement backend services in `/server/media-services.mjs`
4. Add API routes in `/server/media-api.mjs`
5. Write tests for all functionality
6. Update this documentation

## License

MIT License - See LICENSE file
