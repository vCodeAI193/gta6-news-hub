/**
 * Backend Media Services - handles all 5 media features
 * 1. Transcript Search
 * 2. Auto Chapter Generation
 * 3. Subtitle Editor
 * 4. Live Streaming Integration
 * 5. Auto Quality Selection
 */

import { readJSON, writeJSON, existsSync } from './db.mjs'

// ============================================================================
// Feature 1: Transcript Management & Search
// ============================================================================

/**
 * Store and retrieve video transcripts
 */
export function getTranscript(videoId) {
  const transcripts = readJSON('transcripts', {})
  return transcripts[videoId] || null
}

export function saveTranscript(videoId, segments) {
  const transcripts = readJSON('transcripts', {})
  transcripts[videoId] = {
    segments,
    fullText: segments.map(s => s.text).join(' '),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  writeJSON('transcripts', transcripts)
  return transcripts[videoId]
}

/**
 * Full-text search over transcripts
 */
export function searchTranscripts(query, videoIds = null) {
  const transcripts = readJSON('transcripts', {})
  const queryLower = query.toLowerCase()
  const results = []

  const videoIdList = videoIds || Object.keys(transcripts)

  for (const videoId of videoIdList) {
    const transcript = transcripts[videoId]
    if (!transcript) continue

    const segments = transcript.segments || []
    segments.forEach(segment => {
      if (segment.text.toLowerCase().includes(queryLower)) {
        results.push({
          videoId,
          segmentId: segment.id,
          text: segment.text,
          startTime: segment.startTime,
          endTime: segment.endTime,
          speaker: segment.speaker,
        })
      }
    })
  }

  return results
}

/**
 * Get transcript statistics
 */
export function getTranscriptStats(videoId) {
  const transcript = getTranscript(videoId)
  if (!transcript) return null

  const segments = transcript.segments || []
  const totalDuration = segments.length > 0 ? segments[segments.length - 1].endTime : 0
  const wordCount = transcript.fullText.split(/\s+/).length

  return {
    videoId,
    segmentCount: segments.length,
    totalDuration,
    wordCount,
    wordsPerMinute: Math.round(wordCount / (totalDuration / 60)),
    createdAt: transcript.createdAt,
    updatedAt: transcript.updatedAt,
  }
}

// ============================================================================
// Feature 2: Auto Chapter Generation
// ============================================================================

const CHAPTER_KEYWORDS = [
  'introduction', 'welcome', 'today', 'episode',
  'first', 'next', 'now let', 'moving on',
  'topic', 'discuss', 'talking about',
  'question', 'asking', 'summary',
  'conclusion', 'final', 'wrapping up',
  'outro', 'goodbye', 'thank you',
]

/**
 * Generate chapters from transcript
 */
export function generateChapters(videoId) {
  const transcript = getTranscript(videoId)
  if (!transcript) return []

  const segments = transcript.segments || []
  const chapters = []
  let currentChapter = null

  segments.forEach((segment, index) => {
    const text = segment.text.toLowerCase()
    const hasMarker = CHAPTER_KEYWORDS.some(kw => text.includes(kw))

    if (hasMarker && (!currentChapter || segment.startTime - currentChapter.startTime > 30)) {
      if (currentChapter) {
        currentChapter.endTime = segment.startTime
      }

      const title = extractChapterTitle(segment.text)
      const confidence = calculateConfidence(text)

      currentChapter = {
        id: `chapter-${Date.now()}-${Math.random()}`,
        videoId,
        title,
        startTime: segment.startTime,
        endTime: segment.endTime,
        description: segment.text.substring(0, 100),
        confidence,
        generatedAt: Date.now(),
      }
      chapters.push(currentChapter)
    }
  })

  if (currentChapter && segments.length > 0) {
    currentChapter.endTime = segments[segments.length - 1].endTime
  }

  // Save generated chapters
  saveChapters(videoId, chapters)
  return chapters
}

export function getChapters(videoId) {
  const chapters = readJSON('chapters', {})
  return chapters[videoId] || []
}

export function saveChapters(videoId, chapters) {
  const allChapters = readJSON('chapters', {})
  allChapters[videoId] = chapters
  writeJSON('chapters', allChapters)
}

export function updateChapter(videoId, chapterId, updates) {
  const chapters = getChapters(videoId)
  const index = chapters.findIndex(c => c.id === chapterId)
  if (index !== -1) {
    chapters[index] = { ...chapters[index], ...updates, updatedAt: Date.now() }
    saveChapters(videoId, chapters)
    return chapters[index]
  }
  return null
}

export function deleteChapter(videoId, chapterId) {
  const chapters = getChapters(videoId).filter(c => c.id !== chapterId)
  saveChapters(videoId, chapters)
}

function extractChapterTitle(text) {
  const sentences = text.split(/[.!?]/).filter(s => s.trim())
  const title = sentences[0]?.trim() || 'Chapter'
  return title.substring(0, 50)
}

function calculateConfidence(text) {
  const matches = CHAPTER_KEYWORDS.filter(kw => text.includes(kw)).length
  return Math.min(0.95, (matches / CHAPTER_KEYWORDS.length) * 0.8 + 0.2)
}

// ============================================================================
// Feature 3: Subtitle Management
// ============================================================================

export function getSubtitles(videoId, language = 'en') {
  const subtitles = readJSON('subtitles', {})
  const key = `${videoId}:${language}`
  return subtitles[key] || null
}

export function saveSubtitles(videoId, language, subtitleTrack) {
  const subtitles = readJSON('subtitles', {})
  const key = `${videoId}:${language}`
  subtitles[key] = {
    ...subtitleTrack,
    updatedAt: Date.now(),
  }
  writeJSON('subtitles', subtitles)
  return subtitles[key]
}

/**
 * Parse VTT format
 */
export function parseVTT(vttContent) {
  const subtitles = []
  const lines = vttContent.split('\n')

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

    if (line === '' || line.startsWith('WEBVTT') || line.startsWith('NOTE')) {
      i++
      continue
    }

    if (line.includes('-->')) {
      const [startStr, endStr] = line.split('-->').map(s => s.trim())
      const startTime = parseVTTTimecode(startStr)
      const endTime = parseVTTTimecode(endStr)

      i++
      const textLines = []
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i])
        i++
      }

      if (textLines.length > 0) {
        subtitles.push({
          id: `sub-${Date.now()}-${Math.random()}`,
          startTime,
          endTime,
          text: textLines.join('\n'),
        })
      }
    }
    i++
  }

  return subtitles
}

/**
 * Generate VTT format from subtitles
 */
export function generateVTT(subtitles) {
  let vtt = 'WEBVTT\n\n'
  subtitles.forEach(sub => {
    const startTime = formatVTTTimecode(sub.startTime)
    const endTime = formatVTTTimecode(sub.endTime)
    vtt += `${startTime} --> ${endTime}\n`
    vtt += `${sub.text}\n\n`
  })
  return vtt
}

function parseVTTTimecode(timeStr) {
  const parts = timeStr.split(':')
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts.map(p => parseFloat(p))
    return hours * 3600 + minutes * 60 + seconds
  }
  return 0
}

function formatVTTTimecode(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${s.toFixed(3)}`
}

/**
 * Validate subtitle timing
 */
export function validateSubtitles(subtitles) {
  const errors = []

  subtitles.forEach((sub, i) => {
    if (sub.startTime >= sub.endTime) {
      errors.push(`Subtitle ${i + 1}: Start time must be before end time`)
    }

    if (!sub.text || sub.text.trim().length === 0) {
      errors.push(`Subtitle ${i + 1}: Text cannot be empty`)
    }

    if (i > 0 && sub.startTime < subtitles[i - 1].endTime) {
      errors.push(`Subtitle ${i + 1}: Overlaps with previous subtitle`)
    }
  })

  return errors
}

export function updateSubtitle(videoId, language, subtitleId, updates) {
  const track = getSubtitles(videoId, language)
  if (!track) return null

  const subs = track.subtitles || []
  const index = subs.findIndex(s => s.id === subtitleId)
  if (index !== -1) {
    subs[index] = { ...subs[index], ...updates }
    track.subtitles = subs
    saveSubtitles(videoId, language, track)
    return subs[index]
  }
  return null
}

export function getSubtitleLanguages(videoId) {
  const subtitles = readJSON('subtitles', {})
  const languages = []

  for (const key of Object.keys(subtitles)) {
    if (key.startsWith(videoId + ':')) {
      languages.push(key.split(':')[1])
    }
  }

  return languages
}

// ============================================================================
// Feature 4: Live Streaming
// ============================================================================

export function getLiveStreams(platform = null) {
  const streams = readJSON('live_streams', [])
  if (platform) {
    return streams.filter(s => s.platform === platform)
  }
  return streams
}

export function addLiveStream(stream) {
  const streams = getLiveStreams()
  const newStream = {
    ...stream,
    id: `stream-${Date.now()}`,
    createdAt: Date.now(),
  }
  writeJSON('live_streams', [...streams, newStream])
  return newStream
}

export function updateLiveStream(streamId, updates) {
  const streams = getLiveStreams()
  const index = streams.findIndex(s => s.id === streamId)
  if (index !== -1) {
    streams[index] = { ...streams[index], ...updates, updatedAt: Date.now() }
    writeJSON('live_streams', streams)
    return streams[index]
  }
  return null
}

export function removeLiveStream(streamId) {
  const streams = getLiveStreams().filter(s => s.id !== streamId)
  writeJSON('live_streams', streams)
}

export function validateStreamChannel(platform, channelId) {
  if (platform === 'twitch') {
    return /^[a-z0-9_]{3,25}$/i.test(channelId)
  }
  if (platform === 'youtube') {
    return /^[A-Za-z0-9_-]{20,}$/.test(channelId) || /^UC[A-Za-z0-9_-]{20,}$/.test(channelId)
  }
  return false
}

// ============================================================================
// Feature 5: Quality/Bitrate Management
// ============================================================================

export const QUALITY_PROFILES = [
  { resolution: '360p', bitrate: 500, fps: 30, codec: 'h264' },
  { resolution: '480p', bitrate: 1000, fps: 30, codec: 'h264' },
  { resolution: '720p', bitrate: 2000, fps: 60, codec: 'h264' },
  { resolution: '1080p', bitrate: 5000, fps: 60, codec: 'h264' },
]

export const BANDWIDTH_PROFILES = [
  { name: 'Poor', minBandwidth: 0, maxBandwidth: 500, recommendedQuality: '360p' },
  { name: 'Fair', minBandwidth: 500, maxBandwidth: 1500, recommendedQuality: '480p' },
  { name: 'Good', minBandwidth: 1500, maxBandwidth: 3500, recommendedQuality: '720p' },
  { name: 'Excellent', minBandwidth: 3500, maxBandwidth: Infinity, recommendedQuality: '1080p' },
]

export function getQualityProfile(resolution) {
  return QUALITY_PROFILES.find(q => q.resolution === resolution) || QUALITY_PROFILES[0]
}

export function getRecommendedQuality(bandwidth) {
  const profile = BANDWIDTH_PROFILES.find(
    p => bandwidth >= p.minBandwidth && bandwidth <= p.maxBandwidth
  ) || BANDWIDTH_PROFILES[BANDWIDTH_PROFILES.length - 1]
  return profile.recommendedQuality
}

export function getVideoManifest(videoId) {
  const manifest = readJSON('video_manifests', {})
  return manifest[videoId] || null
}

export function saveVideoManifest(videoId, manifestData) {
  const manifests = readJSON('video_manifests', {})
  manifests[videoId] = {
    ...manifestData,
    videoId,
    savedAt: Date.now(),
  }
  writeJSON('video_manifests', manifests)
  return manifests[videoId]
}

/**
 * Simulate adaptive bitrate streaming manifest (HLS-like)
 */
export function generateABRManifest(videoId, availableQualities) {
  const manifest = {
    version: 3,
    targetDuration: 10,
    mediaSequence: 0,
    playlists: availableQualities.map(q => ({
      bandwidth: q.bitrate * 1000,
      resolution: q.resolution,
      codec: q.codec,
      uri: `/stream/${videoId}/${q.resolution}.m3u8`,
    })),
    createdAt: Date.now(),
  }
  saveVideoManifest(videoId, manifest)
  return manifest
}

export function estimateOptimalQuality(clientBandwidth, videoId) {
  const manifest = getVideoManifest(videoId)
  if (!manifest) return null

  const playlists = manifest.playlists || []
  const optimal = playlists.reduce((best, current) => {
    if (current.bandwidth <= clientBandwidth) {
      return current.bandwidth > best.bandwidth ? current : best
    }
    return best
  }, playlists[0])

  return optimal
}
