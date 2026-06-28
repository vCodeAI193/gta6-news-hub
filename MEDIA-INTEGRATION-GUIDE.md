# Media Features Integration Guide

## Quick Start

### 1. Setup Backend API

Add the media API to your Express server (`server/app.mjs`):

```javascript
import mediaAPI from './media-api.mjs'

// In your express app setup
app.use('/api/media', mediaAPI)
```

### 2. Use Components in Your Pages

#### Example: Video Page with All Features

```tsx
// src/routes/VideoPage.tsx
import { useState, useRef } from 'react'
import { AdaptiveVideoPlayer } from '../components/AdaptiveVideoPlayer'
import { TranscriptSearch } from '../components/TranscriptSearch'
import { ChapterGenerator } from '../components/ChapterGenerator'
import { SubtitleEditor } from '../components/SubtitleEditor'
import type { TranscriptSegment } from '../lib/media'

export function VideoPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([])

  const videoQualities = [
    { resolution: '360p', bitrate: 500, fps: 30, codec: 'h264', url: '/videos/gta6-360p.mp4' },
    { resolution: '720p', bitrate: 2000, fps: 60, codec: 'h264', url: '/videos/gta6-720p.mp4' },
    { resolution: '1080p', bitrate: 5000, fps: 60, codec: 'h264', url: '/videos/gta6-1080p.mp4' },
  ]

  return (
    <div className="video-page">
      <h1>GTA 6 Official Reveal Trailer</h1>

      <AdaptiveVideoPlayer
        videoQualities={videoQualities}
        title="Adaptive Quality Player"
        onQualityChange={(quality) => {
          console.log(`Switched to ${quality.resolution}`)
        }}
      />

      <div className="video-features">
        <aside className="sidebar">
          <TranscriptSearch
            segments={transcript}
            onTimestampClick={(time) => {
              if (videoRef.current) {
                videoRef.current.currentTime = time
                videoRef.current.play()
              }
            }}
          />

          <ChapterGenerator
            segments={transcript}
            onChaptersGenerated={(chapters) => {
              fetch(`/api/media/chapters/video-123`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(chapters),
              })
            }}
          />
        </aside>

        <main className="content">
          <SubtitleEditor
            videoId="video-123"
            onSubtitlesSave={(subtitles) => {
              fetch(`/api/media/subtitles/video-123/en`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subtitles }),
              })
            }}
          />
        </main>
      </div>
    </div>
  )
}
```

#### Example: Live Stream Page

```tsx
// src/routes/StreamPage.tsx
import { LiveStreamEmbed } from '../components/LiveStreamEmbed'

export function StreamPage() {
  return (
    <div className="stream-page">
      <h1>GTA 6 Live Coverage</h1>

      <div className="streams-grid">
        <LiveStreamEmbed
          platform="twitch"
          channelId="rockstargames"
          title="Official Rockstar Games Channel"
          height={500}
        />

        <LiveStreamEmbed
          platform="youtube"
          channelId="UCxxxxxxxxxxxxxx"
          title="GTA 6 Channel"
          height={500}
        />
      </div>
    </div>
  )
}
```

### 3. Client-Side Usage

#### Transcript Search

```typescript
import { transcriptSearchEngine } from '../lib/media'
import type { TranscriptSegment } from '../lib/media'

const segments: TranscriptSegment[] = [
  { id: 's1', text: 'Welcome to the presentation', startTime: 0, endTime: 5 },
  { id: 's2', text: 'Today we discuss GTA 6 features', startTime: 5, endTime: 10 },
]

// Build index
transcriptSearchEngine.buildIndex(segments)

// Search
const results = transcriptSearchEngine.search('GTA 6', segments)
results.forEach(result => {
  console.log(`Found at ${result.startTime}s: ${result.text}`)
})
```

#### Chapter Generation

```typescript
import { generateChaptersFromTranscript } from '../lib/media'

const chapters = generateChaptersFromTranscript(segments)
// Chapters have: id, title, startTime, endTime, description, confidence
```

#### VTT Format Handling

```typescript
import { parseVTT, generateVTT, validateSubtitles } from '../lib/media'

// Parse VTT file
const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
First subtitle

00:00:05.000 --> 00:00:10.000
Second subtitle`

const subtitles = parseVTT(vttContent)

// Validate
const errors = validateSubtitles(subtitles)
if (errors.length === 0) {
  // Generate and download
  const output = generateVTT(subtitles)
  const blob = new Blob([output], { type: 'text/vtt' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'subtitles.vtt'
  a.click()
}
```

#### Quality Selection

```typescript
import {
  estimateBandwidth,
  getRecommendedQuality,
  type VideoQuality,
} from '../lib/media'

const qualities: VideoQuality[] = [
  { resolution: '360p', bitrate: 500, fps: 30, codec: 'h264', url: 'url-360' },
  { resolution: '720p', bitrate: 2000, fps: 60, codec: 'h264', url: 'url-720' },
  { resolution: '1080p', bitrate: 5000, fps: 60, codec: 'h264', url: 'url-1080' },
]

// Estimate bandwidth
const bandwidth = await estimateBandwidth()

// Get recommendation
const recommended = getRecommendedQuality(bandwidth, qualities)
console.log(`Recommended: ${recommended.resolution}`)
```

### 4. Server-Side Usage

#### Save Transcript

```javascript
import { saveTranscript } from './media-services.mjs'

const segments = [
  { id: 's1', text: 'Welcome', startTime: 0, endTime: 5 },
]

saveTranscript('video-123', segments)
```

#### Search Transcripts

```javascript
import { searchTranscripts } from './media-services.mjs'

const results = searchTranscripts('GTA', ['video-123', 'video-456'])
```

#### Manage Subtitles

```javascript
import { saveSubtitles, getSubtitles, validateSubtitles } from './media-services.mjs'

const subtitleTrack = {
  id: 'track-1',
  language: 'en',
  label: 'English',
  subtitles: [
    { id: 's1', startTime: 0, endTime: 5, text: 'Welcome' },
  ],
  createdAt: Date.now(),
}

// Validate first
const errors = validateSubtitles(subtitleTrack.subtitles)
if (errors.length === 0) {
  saveSubtitles('video-123', 'en', subtitleTrack)
}

// Retrieve
const saved = getSubtitles('video-123', 'en')
```

#### Live Streaming

```javascript
import { addLiveStream, validateStreamChannel } from './media-services.mjs'

if (validateStreamChannel('twitch', 'rockstargames')) {
  const stream = addLiveStream({
    platform: 'twitch',
    channelId: 'rockstargames',
    title: 'GTA 6 Live',
    embedUrl: 'https://twitch.tv/rockstargames',
    isLive: true,
  })
}
```

## API Examples

### Search Transcripts

```bash
curl -X GET "http://localhost:3000/api/media/transcripts/search/GTA%206"
```

Response:
```json
[
  {
    "videoId": "video-123",
    "segmentId": "s1",
    "text": "Welcome to GTA 6",
    "startTime": 0,
    "endTime": 5
  }
]
```

### Generate Chapters

```bash
curl -X POST "http://localhost:3000/api/media/chapters/video-123/generate"
```

### Save Subtitles

```bash
curl -X POST "http://localhost:3000/api/media/subtitles/video-123/en" \
  -H "Content-Type: application/json" \
  -d '{
    "subtitles": [
      {
        "id": "s1",
        "startTime": 0,
        "endTime": 5,
        "text": "Welcome"
      }
    ]
  }'
```

### Get Quality Recommendation

```bash
curl -X POST "http://localhost:3000/api/media/quality/recommend" \
  -H "Content-Type: application/json" \
  -d '{"bandwidth": 2500}'
```

Response:
```json
{
  "recommended": "720p"
}
```

## File Storage

Media data is stored in JSON format:

```
transcripts.json          // Video transcripts
chapters.json             // Generated chapters
subtitles.json            // Subtitle tracks (multiple languages)
live_streams.json         // Live stream information
video_manifests.json      // ABR manifest data
```

## Styling

Components use CSS-in-JS with scoped styles. To customize:

```tsx
// In your CSS file or global styles
.transcript-search {
  --bg-color: #f5f5f5;
  --text-color: #333;
}

.chapter-generator {
  --highlight-color: #ff6b6b;
}
```

## Performance Tips

1. **Lazy load components**: Use React.lazy() for non-critical features
2. **Debounce search**: Already implemented (300ms)
3. **Batch updates**: Save multiple subtitles at once
4. **Cache transcripts**: Store in localStorage for quick access
5. **Monitor bandwidth**: Check every 5 seconds (configurable)

## Troubleshooting

### Search not working
- Ensure segments have valid text
- Check that startTime < endTime
- Rebuild index after adding segments

### Chapters not generating
- Verify transcript segments are present
- Check minimum duration requirements (30s between chapters)
- Review transcript keywords

### Subtitle validation failing
- Check timing: startTime must be < endTime
- No overlapping subtitles allowed
- All subtitles must have text content

### Quality switching issues
- Verify all video URLs are accessible
- Check browser supports Network Information API
- Ensure proper CORS headers for video streaming

### Live stream not showing
- Validate channel ID format for platform
- Check channel is currently live
- Verify iframe embedding permissions

## Next Steps

1. Integrate into your main video player
2. Set up database storage (optional)
3. Add analytics tracking
4. Implement user preferences
5. Create admin panel for management

## Support

For issues or questions about these features, refer to:
- `/src/lib/media.ts` - Core implementation
- `/src/components/` - Component code
- `/server/media-services.mjs` - Backend logic
- Tests files for usage examples

