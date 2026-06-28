import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  saveTranscript,
  getTranscript,
  searchTranscripts,
  getTranscriptStats,
  generateChapters,
  getChapters,
  saveChapters,
  updateChapter,
  deleteChapter,
  getSubtitles,
  saveSubtitles,
  parseVTT,
  generateVTT,
  validateSubtitles,
  getSubtitleLanguages,
  updateSubtitle,
  getLiveStreams,
  addLiveStream,
  updateLiveStream,
  removeLiveStream,
  validateStreamChannel,
  getRecommendedQuality,
  generateABRManifest,
} from './media-services.mjs'

describe('Transcript Services', () => {
  const testVideoId = 'test-video-123'
  const testSegments = [
    { id: 's1', text: 'Welcome to GTA 6', startTime: 0, endTime: 5 },
    { id: 's2', text: 'Release updates and news', startTime: 5, endTime: 10 },
    { id: 's3', text: 'Exciting features coming', startTime: 10, endTime: 15 },
  ]

  beforeEach(() => {
    // Clear transcripts before each test
  })

  it('saves and retrieves transcripts', () => {
    saveTranscript(testVideoId, testSegments)
    const transcript = getTranscript(testVideoId)

    expect(transcript).toBeDefined()
    expect(transcript.segments).toHaveLength(3)
    expect(transcript.fullText).toContain('Welcome')
  })

  it('searches transcripts by query', () => {
    saveTranscript(testVideoId, testSegments)
    const results = searchTranscripts('GTA 6', [testVideoId])

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].text).toContain('GTA 6')
    expect(results[0].startTime).toBe(0)
  })

  it('returns transcript statistics', () => {
    saveTranscript(testVideoId, testSegments)
    const stats = getTranscriptStats(testVideoId)

    expect(stats).toBeDefined()
    expect(stats.segmentCount).toBe(3)
    expect(stats.totalDuration).toBe(15)
    expect(stats.wordCount).toBeGreaterThan(0)
  })

  it('handles non-existent transcripts gracefully', () => {
    const transcript = getTranscript('non-existent')
    expect(transcript).toBeNull()

    const stats = getTranscriptStats('non-existent')
    expect(stats).toBeNull()
  })
})

describe('Auto Chapter Generation', () => {
  const testVideoId = 'chapter-test-video'
  const testSegments = [
    { id: 's1', text: 'Welcome and introduction to the episode', startTime: 0, endTime: 5 },
    { id: 's2', text: 'First topic we need to discuss', startTime: 5, endTime: 30 },
    { id: 's3', text: 'More details on the first topic', startTime: 30, endTime: 50 },
    { id: 's4', text: 'Now let\'s move to the next topic', startTime: 50, endTime: 55 },
    { id: 's5', text: 'Discussion of second topic', startTime: 55, endTime: 75 },
    { id: 's6', text: 'Conclusion and final thoughts', startTime: 75, endTime: 85 },
  ]

  it('generates chapters from transcript', () => {
    saveTranscript(testVideoId, testSegments)
    const chapters = generateChapters(testVideoId)

    expect(chapters.length).toBeGreaterThan(0)
    chapters.forEach(ch => {
      expect(ch.id).toBeDefined()
      expect(ch.title).toBeDefined()
      expect(ch.startTime).toBeDefined()
      expect(ch.confidence).toBeGreaterThan(0)
    })
  })

  it('saves and retrieves chapters', () => {
    saveTranscript(testVideoId, testSegments)
    generateChapters(testVideoId)
    const chapters = getChapters(testVideoId)

    expect(chapters.length).toBeGreaterThan(0)
  })

  it('updates chapter properties', () => {
    saveTranscript(testVideoId, testSegments)
    generateChapters(testVideoId)
    const chapters = getChapters(testVideoId)

    if (chapters.length > 0) {
      const updated = updateChapter(testVideoId, chapters[0].id, {
        title: 'Updated Title',
      })

      expect(updated).toBeDefined()
      expect(updated.title).toBe('Updated Title')
    }
  })

  it('deletes chapters', () => {
    saveTranscript(testVideoId, testSegments)
    generateChapters(testVideoId)
    let chapters = getChapters(testVideoId)
    const firstId = chapters[0].id

    deleteChapter(testVideoId, firstId)
    chapters = getChapters(testVideoId)

    expect(chapters.every(c => c.id !== firstId)).toBe(true)
  })
})

describe('Subtitle Management', () => {
  const testVideoId = 'subtitle-test-video'
  const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
Welcome to GTA 6 briefing

00:00:05.000 --> 00:00:10.000
We have exciting updates for you
`

  it('parses VTT format correctly', () => {
    const subtitles = parseVTT(vttContent)

    expect(subtitles).toHaveLength(2)
    expect(subtitles[0].text).toBe('Welcome to GTA 6 briefing')
    expect(subtitles[0].startTime).toBe(0)
    expect(subtitles[0].endTime).toBe(5)
  })

  it('generates valid VTT format', () => {
    const subtitles = parseVTT(vttContent)
    const generatedVTT = generateVTT(subtitles)

    expect(generatedVTT).toContain('WEBVTT')
    expect(generatedVTT).toContain('00:00:00.000')
    expect(generatedVTT).toContain('Welcome to GTA 6 briefing')
  })

  it('validates subtitle timing', () => {
    const validSubtitles = parseVTT(vttContent)
    const errors = validateSubtitles(validSubtitles)

    expect(errors).toHaveLength(0)
  })

  it('detects invalid subtitle timing', () => {
    const invalidSubtitles = [
      { id: 's1', startTime: 10, endTime: 5, text: 'Invalid timing' },
    ]
    const errors = validateSubtitles(invalidSubtitles)

    expect(errors.length).toBeGreaterThan(0)
  })

  it('saves and retrieves subtitles', () => {
    const subtitles = parseVTT(vttContent)
    const track = {
      id: 'track-1',
      language: 'en',
      label: 'English',
      subtitles,
      createdAt: Date.now(),
    }

    saveSubtitles(testVideoId, 'en', track)
    const retrieved = getSubtitles(testVideoId, 'en')

    expect(retrieved).toBeDefined()
    expect(retrieved.subtitles).toHaveLength(2)
  })

  it('updates individual subtitles', () => {
    const subtitles = parseVTT(vttContent)
    const track = {
      id: 'track-1',
      language: 'en',
      label: 'English',
      subtitles,
      createdAt: Date.now(),
    }

    saveSubtitles(testVideoId, 'en', track)
    const originalSubs = getSubtitles(testVideoId, 'en')

    if (originalSubs.subtitles.length > 0) {
      const updated = updateSubtitle(testVideoId, 'en', originalSubs.subtitles[0].id, {
        text: 'Updated text',
      })

      expect(updated.text).toBe('Updated text')
    }
  })

  it('tracks multiple subtitle languages', () => {
    const subtitles = parseVTT(vttContent)
    const track = {
      id: 'track-1',
      language: 'en',
      label: 'English',
      subtitles,
      createdAt: Date.now(),
    }

    saveSubtitles(testVideoId, 'en', track)
    saveSubtitles(testVideoId, 'de', { ...track, language: 'de', label: 'German' })
    saveSubtitles(testVideoId, 'fr', { ...track, language: 'fr', label: 'French' })

    const languages = getSubtitleLanguages(testVideoId)

    expect(languages).toContain('en')
    expect(languages).toContain('de')
    expect(languages).toContain('fr')
  })
})

describe('Live Streaming', () => {
  const testStream = {
    platform: 'twitch',
    channelId: 'rockstargames',
    title: 'GTA 6 Live Stream',
    isLive: true,
    embedUrl: 'https://twitch.tv/rockstargames',
  }

  it('adds live streams', () => {
    const stream = addLiveStream(testStream)

    expect(stream.id).toBeDefined()
    expect(stream.platform).toBe('twitch')
    expect(stream.channelId).toBe('rockstargames')
  })

  it('retrieves all live streams', () => {
    addLiveStream(testStream)
    const streams = getLiveStreams()

    expect(streams.length).toBeGreaterThan(0)
  })

  it('filters streams by platform', () => {
    addLiveStream(testStream)
    const twitchStreams = getLiveStreams('twitch')

    expect(twitchStreams.length).toBeGreaterThan(0)
    expect(twitchStreams.every(s => s.platform === 'twitch')).toBe(true)
  })

  it('updates stream information', () => {
    const stream = addLiveStream(testStream)
    const updated = updateLiveStream(stream.id, { isLive: false })

    expect(updated.isLive).toBe(false)
  })

  it('removes streams', () => {
    const stream = addLiveStream(testStream)
    removeLiveStream(stream.id)

    const streams = getLiveStreams()
    expect(streams.every(s => s.id !== stream.id)).toBe(true)
  })

  it('validates stream channels', () => {
    expect(validateStreamChannel('twitch', 'rockstargames')).toBe(true)
    expect(validateStreamChannel('twitch', 'a')).toBe(false)
    expect(validateStreamChannel('youtube', 'UCxxxxxxxxxxxxxxxxxxxxxx')).toBe(true)
    expect(validateStreamChannel('youtube', 'invalid')).toBe(false)
  })
})

describe('Adaptive Bitrate Management', () => {
  it('recommends quality based on bandwidth', () => {
    expect(getRecommendedQuality(300)).toBe('360p')
    expect(getRecommendedQuality(1000)).toBe('480p')
    expect(getRecommendedQuality(2500)).toBe('720p')
    expect(getRecommendedQuality(5000)).toBe('1080p')
  })

  it('generates ABR manifest', () => {
    const videoId = 'test-video'
    const qualities = [
      { resolution: '360p', bitrate: 500, fps: 30, codec: 'h264' },
      { resolution: '720p', bitrate: 2000, fps: 60, codec: 'h264' },
      { resolution: '1080p', bitrate: 5000, fps: 60, codec: 'h264' },
    ]

    const manifest = generateABRManifest(videoId, qualities)

    expect(manifest.version).toBe(3)
    expect(manifest.playlists).toHaveLength(3)
    expect(manifest.playlists[0].bandwidth).toBe(500000)
  })
})
