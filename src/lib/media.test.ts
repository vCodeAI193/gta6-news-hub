import { describe, expect, it, beforeEach } from 'vitest'
import {
  parseVTT,
  generateVTT,
  validateSubtitles,
  generateChaptersFromTranscript,
  transcriptSearchEngine,
  generateStreamEmbedUrl,
  validateStreamChannel,
  estimateBandwidth,
  getRecommendedQuality,
  type TranscriptSegment,
  type Subtitle,
} from './media'

describe('Transcript Search', () => {
  let segments: TranscriptSegment[]

  beforeEach(() => {
    segments = [
      { id: 's1', text: 'Welcome to the GTA 6 news briefing today', startTime: 0, endTime: 5 },
      { id: 's2', text: 'We have exciting updates about the release', startTime: 5, endTime: 10 },
      { id: 's3', text: 'The development team is working hard', startTime: 10, endTime: 15 },
      { id: 's4', text: 'New features and improvements are coming', startTime: 15, endTime: 20 },
    ]
    transcriptSearchEngine.buildIndex(segments)
  })

  it('searches for keywords in transcript', () => {
    const results = transcriptSearchEngine.search('GTA 6', segments)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].startTime).toBe(0)
  })

  it('returns results sorted by relevance', () => {
    const results = transcriptSearchEngine.search('GTA', segments)
    expect(results).toHaveLength(1)
    expect(results[0].relevanceScore).toBeGreaterThan(0)
  })

  it('highlights matching terms', () => {
    const results = transcriptSearchEngine.search('news', segments)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].highlightedText).toContain('<mark>')
  })

  it('handles multi-word searches', () => {
    const results = transcriptSearchEngine.search('exciting updates', segments)
    expect(results.length).toBeGreaterThan(0)
  })
})

describe('Auto Chapter Generation', () => {
  let segments: TranscriptSegment[]

  beforeEach(() => {
    segments = [
      { id: 's1', text: 'Welcome and introduction to today\'s episode', startTime: 0, endTime: 5 },
      { id: 's2', text: 'First topic to discuss today', startTime: 5, endTime: 10 },
      { id: 's3', text: 'More details about the first topic', startTime: 10, endTime: 30 },
      { id: 's4', text: 'Now let\'s move to the next topic', startTime: 30, endTime: 35 },
      { id: 's5', text: 'Conclusion and final thoughts', startTime: 35, endTime: 40 },
    ]
  })

  it('generates chapters from transcript', () => {
    const chapters = generateChaptersFromTranscript(segments)
    expect(chapters.length).toBeGreaterThan(0)
  })

  it('assigns confidence scores', () => {
    const chapters = generateChaptersFromTranscript(segments)
    chapters.forEach(ch => {
      expect(ch.confidence).toBeGreaterThan(0)
      expect(ch.confidence).toBeLessThanOrEqual(1)
    })
  })

  it('sets proper start and end times', () => {
    const chapters = generateChaptersFromTranscript(segments)
    chapters.forEach(ch => {
      expect(ch.endTime).toBeGreaterThan(ch.startTime)
    })
  })
})

describe('Subtitle Editor - VTT Format', () => {
  const vttSample = `WEBVTT

00:00:00.000 --> 00:00:05.000
Welcome to GTA 6 news briefing

00:00:05.000 --> 00:00:10.000
We have exciting updates for you today
`

  it('parses VTT format correctly', () => {
    const subtitles = parseVTT(vttSample)
    expect(subtitles).toHaveLength(2)
    expect(subtitles[0].text).toContain('Welcome')
    expect(subtitles[0].startTime).toBe(0)
    expect(subtitles[0].endTime).toBe(5)
  })

  it('generates valid VTT format', () => {
    const subtitles: Subtitle[] = [
      { id: 's1', startTime: 0, endTime: 5, text: 'Test subtitle' },
      { id: 's2', startTime: 5, endTime: 10, text: 'Another subtitle' },
    ]
    const vtt = generateVTT(subtitles)
    expect(vtt).toContain('WEBVTT')
    expect(vtt).toContain('00:00:00.000 --> 00:00:05.000')
    expect(vtt).toContain('Test subtitle')
  })

  it('validates subtitle timing', () => {
    const validSubtitles: Subtitle[] = [
      { id: 's1', startTime: 0, endTime: 5, text: 'Valid' },
      { id: 's2', startTime: 5, endTime: 10, text: 'Also valid' },
    ]
    expect(validateSubtitles(validSubtitles)).toHaveLength(0)
  })

  it('detects invalid timing', () => {
    const invalidSubtitles: Subtitle[] = [
      { id: 's1', startTime: 10, endTime: 5, text: 'Invalid' },
    ]
    const errors = validateSubtitles(invalidSubtitles)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toContain('Start time must be before end time')
  })

  it('detects empty text', () => {
    const invalidSubtitles: Subtitle[] = [
      { id: 's1', startTime: 0, endTime: 5, text: '   ' },
    ]
    const errors = validateSubtitles(invalidSubtitles)
    expect(errors.some(e => e.includes('empty'))).toBe(true)
  })

  it('detects overlapping subtitles', () => {
    const invalidSubtitles: Subtitle[] = [
      { id: 's1', startTime: 0, endTime: 10, text: 'First' },
      { id: 's2', startTime: 5, endTime: 15, text: 'Overlapping' },
    ]
    const errors = validateSubtitles(invalidSubtitles)
    expect(errors.some(e => e.includes('Overlaps'))).toBe(true)
  })
})

describe('Live Streaming Integration', () => {
  it('generates Twitch embed URL', () => {
    const url = generateStreamEmbedUrl('twitch', 'rockstargames')
    expect(url).toContain('twitch.tv')
    expect(url).toContain('rockstargames')
  })

  it('generates YouTube embed URL', () => {
    const url = generateStreamEmbedUrl('youtube', 'UCxxxxxxxxxxxxxx')
    expect(url).toContain('youtube.com')
  })

  it('validates Twitch channel ID', () => {
    expect(validateStreamChannel('twitch', 'rockstargames')).toBe(true)
    expect(validateStreamChannel('twitch', 'a')).toBe(false)
  })

  it('validates YouTube channel ID', () => {
    expect(validateStreamChannel('youtube', 'UCxxxxxxxxxxxxxxxxxxxxxx')).toBe(true)
    expect(validateStreamChannel('youtube', 'invalid')).toBe(false)
  })
})

describe('Auto Quality Selection', () => {
  it('estimates bandwidth', async () => {
    const bandwidth = await estimateBandwidth()
    expect(bandwidth).toBeGreaterThan(0)
  })

  it('recommends quality based on bandwidth', () => {
    const qualities = [
      { resolution: '360p', bitrate: 500, fps: 30, codec: 'h264', url: 'url-360' },
      { resolution: '720p', bitrate: 2000, fps: 60, codec: 'h264', url: 'url-720' },
      { resolution: '1080p', bitrate: 5000, fps: 60, codec: 'h264', url: 'url-1080' },
    ]

    const quality360 = getRecommendedQuality(300, qualities)
    expect(quality360?.resolution).toBe('360p')

    const quality720 = getRecommendedQuality(2000, qualities)
    expect(quality720?.resolution).toBe('720p')

    const quality1080 = getRecommendedQuality(5000, qualities)
    expect(quality1080?.resolution).toBe('1080p')
  })

  it('handles unavailable qualities gracefully', () => {
    const qualities = [
      { resolution: '720p', bitrate: 2000, fps: 60, codec: 'h264', url: 'url-720' },
    ]
    const quality = getRecommendedQuality(500, qualities)
    expect(quality?.resolution).toBe('720p')
  })
})
