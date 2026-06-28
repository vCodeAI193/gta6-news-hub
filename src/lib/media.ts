/**
 * Enhanced Media Library with 5 Media Features:
 * 1. Transcript Search - Full-text search over video transcripts with timestamp navigation
 * 2. Auto Chapter Generation - AI-generated video chapters from transcripts
 * 3. Subtitle Editor - In-browser subtitle creation/editing with VTT format support
 * 4. Live Streaming Integration - Embed Twitch/YouTube streams
 * 5. Auto Quality Selection - Intelligent bitrate/resolution selection based on bandwidth
 */

// ============================================================================
// Feature 1: Transcript Search
// ============================================================================

export interface TranscriptSegment {
  id: string
  text: string
  startTime: number
  endTime: number
  speaker?: string
}

export interface TranscriptIndex {
  videoId: string
  segments: TranscriptSegment[]
  fullText: string
  createdAt: number
  updatedAt: number
}

export interface TranscriptSearchResult {
  segmentId: string
  text: string
  startTime: number
  endTime: number
  highlightedText: string
  relevanceScore: number
}

/**
 * Simple full-text search index for transcripts using inverted index
 */
class TranscriptSearchEngine {
  private index: Map<string, Set<string>> = new Map()

  /**
   * Build inverted index from transcript segments
   */
  buildIndex(segments: TranscriptSegment[]): void {
    this.index.clear()
    segments.forEach(segment => {
      const words = this.tokenize(segment.text)
      words.forEach(word => {
        if (!this.index.has(word)) {
          this.index.set(word, new Set())
        }
        this.index.get(word)!.add(segment.id)
      })
    })
  }

  /**
   * Search for terms in transcript
   */
  search(query: string, segments: TranscriptSegment[]): TranscriptSearchResult[] {
    const terms = this.tokenize(query.toLowerCase())
    if (terms.length === 0) return []

    // Find segments matching all terms
    let matchingSegmentIds: Set<string> | null = null
    for (const term of terms) {
      const segmentIds = this.index.get(term) || new Set()
      if (matchingSegmentIds === null) {
        matchingSegmentIds = new Set(segmentIds)
      } else {
        matchingSegmentIds = new Set([...matchingSegmentIds].filter(id => segmentIds.has(id)))
      }
    }

    const results: TranscriptSearchResult[] = []
    const segmentMap = new Map(segments.map(s => [s.id, s]))

    matchingSegmentIds?.forEach(segmentId => {
      const segment = segmentMap.get(segmentId)
      if (segment) {
        const highlighted = this.highlightMatches(segment.text, terms)
        const relevance = this.calculateRelevance(segment.text, terms)
        results.push({
          segmentId,
          text: segment.text,
          startTime: segment.startTime,
          endTime: segment.endTime,
          highlightedText: highlighted,
          relevanceScore: relevance,
        })
      }
    })

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
  }

  private highlightMatches(text: string, terms: string[]): string {
    let highlighted = text
    terms.forEach(term => {
      const regex = new RegExp(`\\b(${term})\\b`, 'gi')
      highlighted = highlighted.replace(regex, '<mark>$1</mark>')
    })
    return highlighted
  }

  private calculateRelevance(text: string, terms: string[]): number {
    const lowerText = text.toLowerCase()
    let score = 0
    terms.forEach(term => {
      const matches = (lowerText.match(new RegExp(term, 'g')) || []).length
      score += matches
    })
    return score / terms.length
  }
}

export const transcriptSearchEngine = new TranscriptSearchEngine()

// ============================================================================
// Feature 2: Auto Chapter Generation
// ============================================================================

export interface Chapter {
  id: string
  title: string
  startTime: number
  endTime?: number
  description?: string
  confidence: number
}

/**
 * Generate chapters from transcript using NLP heuristics
 */
export function generateChaptersFromTranscript(segments: TranscriptSegment[]): Chapter[] {
  const chapters: Chapter[] = []
  const chapterKeywords = [
    'introduction', 'welcome', 'today',
    'first', 'next', 'now let\'s',
    'moving on', 'topic', 'discuss',
    'question', 'asking', 'summary',
    'conclusion', 'final', 'wrapping up',
  ]

  let currentChapter: Chapter | null = null

  segments.forEach((segment) => {
    const text = segment.text.toLowerCase()
    const hasChapterMarker = chapterKeywords.some(kw => text.includes(kw))

    if (hasChapterMarker && (!currentChapter || segment.startTime - currentChapter.startTime > 30)) {
      // End previous chapter
      if (currentChapter) {
        currentChapter.endTime = segment.startTime
      }

      // Start new chapter
      const title = extractChapterTitle(segment.text)
      currentChapter = {
        id: `chapter-${Date.now()}-${Math.random()}`,
        title,
        startTime: segment.startTime,
        confidence: calculateConfidence(text, chapterKeywords),
        description: segment.text.substring(0, 100),
      }
      chapters.push(currentChapter)
    }
  })

  // Close last chapter
  if (currentChapter && segments.length > 0) {
    currentChapter.endTime = segments[segments.length - 1].endTime
  }

  return chapters
}

function calculateConfidence(text: string, keywords: string[]): number {
  const matches = keywords.filter(kw => text.includes(kw)).length
  return Math.min(0.95, (matches / keywords.length) * 0.8 + 0.2)
}

function extractChapterTitle(text: string): string {
  const sentences = text.split(/[.!?]/).filter(s => s.trim())
  const title = sentences[0]?.trim() || 'Chapter'
  return title.substring(0, 50)
}

// ============================================================================
// Feature 3: Subtitle Editor with VTT Support
// ============================================================================

export interface Subtitle {
  id: string
  startTime: number
  endTime: number
  text: string
  position?: 'top' | 'bottom'
}

export interface SubtitleTrack {
  id: string
  language: string
  label: string
  subtitles: Subtitle[]
  createdAt: number
  updatedAt: number
}

/**
 * Convert VTT format string to SubtitleTrack
 */
export function parseVTT(vttContent: string): Subtitle[] {
  const subtitles: Subtitle[] = []
  const lines = vttContent.split('\n')

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

    // Skip header and empty lines
    if (line === '' || line.startsWith('WEBVTT') || line.startsWith('NOTE')) {
      i++
      continue
    }

    // Look for timecode line
    if (line.includes('-->')) {
      const [startStr, endStr] = line.split('-->').map(s => s.trim())
      const startTime = parseVTTTimecode(startStr)
      const endTime = parseVTTTimecode(endStr)

      // Collect subtitle text from following lines
      i++
      const textLines: string[] = []
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
 * Convert SubtitleTrack to VTT format
 */
export function generateVTT(subtitles: Subtitle[]): string {
  let vtt = 'WEBVTT\n\n'

  subtitles.forEach(sub => {
    const startTime = formatVTTTimecode(sub.startTime)
    const endTime = formatVTTTimecode(sub.endTime)
    vtt += `${startTime} --> ${endTime}\n`
    vtt += `${sub.text}\n\n`
  })

  return vtt
}

function parseVTTTimecode(timeStr: string): number {
  const parts = timeStr.split(':')
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts.map(p => parseFloat(p))
    return hours * 3600 + minutes * 60 + seconds
  }
  return 0
}

function formatVTTTimecode(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(Math.floor(s)).padStart(2, '0')}.${String(Math.round((s % 1) * 1000)).padStart(3, '0')}`
}

/**
 * Validate subtitle timing
 */
export function validateSubtitles(subtitles: Subtitle[]): string[] {
  const errors: string[] = []

  subtitles.forEach((sub, i) => {
    if (sub.startTime >= sub.endTime) {
      errors.push(`Subtitle ${i + 1}: Start time must be before end time`)
    }

    if (sub.text.trim().length === 0) {
      errors.push(`Subtitle ${i + 1}: Text cannot be empty`)
    }

    if (i > 0 && sub.startTime < subtitles[i - 1].endTime) {
      errors.push(`Subtitle ${i + 1}: Overlaps with previous subtitle`)
    }
  })

  return errors
}

// ============================================================================
// Feature 4: Live Streaming Integration
// ============================================================================

export type StreamPlatform = 'twitch' | 'youtube'

export interface LiveStream {
  id: string
  platform: StreamPlatform
  channelId: string
  title: string
  isLive: boolean
  startedAt?: number
  endedAt?: number
  viewers?: number
  embedUrl: string
  thumbnail?: string
}

/**
 * Generate embed URL for live streams
 */
export function generateStreamEmbedUrl(platform: StreamPlatform, channelId: string): string {
  if (platform === 'twitch') {
    return `https://player.twitch.tv/?channel=${channelId}&parent=${window.location.hostname}`
  }
  if (platform === 'youtube') {
    return `https://www.youtube.com/embed/live/${channelId}?autoplay=0`
  }
  return ''
}

/**
 * Validate platform-specific channel identifiers
 */
export function validateStreamChannel(platform: StreamPlatform, channelId: string): boolean {
  if (platform === 'twitch') {
    return /^[a-z0-9_]{3,25}$/i.test(channelId)
  }
  if (platform === 'youtube') {
    return /^[A-Za-z0-9_-]{20,}$/.test(channelId) || /^UC[A-Za-z0-9_-]{20,}$/.test(channelId)
  }
  return false
}

// ============================================================================
// Feature 5: Auto Quality Selection
// ============================================================================

export interface VideoQuality {
  resolution: string
  bitrate: number
  fps: number
  codec: string
  url: string
}

export interface BandwidthProfile {
  name: string
  minBandwidth: number
  maxBandwidth: number
  recommendedQuality: string
}

export const BANDWIDTH_PROFILES: BandwidthProfile[] = [
  { name: 'Poor', minBandwidth: 0, maxBandwidth: 500, recommendedQuality: '360p' },
  { name: 'Fair', minBandwidth: 500, maxBandwidth: 1500, recommendedQuality: '480p' },
  { name: 'Good', minBandwidth: 1500, maxBandwidth: 3500, recommendedQuality: '720p' },
  { name: 'Excellent', minBandwidth: 3500, maxBandwidth: Infinity, recommendedQuality: '1080p' },
]

/**
 * Estimate network bandwidth in kbps
 */
export async function estimateBandwidth(): Promise<number> {
  try {
    if (!navigator.connection || !navigator.connection.downlink) {
      return 3000 // Default fallback
    }
    return navigator.connection.downlink * 1000
  } catch {
    return 3000
  }
}

/**
 * Get recommended quality based on bandwidth
 */
export function getRecommendedQuality(bandwidth: number, availableQualities: VideoQuality[]): VideoQuality | null {
  const profile = BANDWIDTH_PROFILES.find(
    p => bandwidth >= p.minBandwidth && bandwidth <= p.maxBandwidth
  ) || BANDWIDTH_PROFILES[BANDWIDTH_PROFILES.length - 1]

  return (
    availableQualities.find(q => q.resolution === profile.recommendedQuality) ||
    availableQualities[availableQualities.length - 1] ||
    null
  )
}

/**
 * Monitor bandwidth changes and auto-select quality
 */
export function createBandwidthMonitor(
  onQualityChange: (quality: VideoQuality) => void,
  availableQualities: VideoQuality[]
): () => void {
  let currentQuality = availableQualities[0]

  const updateQuality = async () => {
    const bandwidth = await estimateBandwidth()
    const recommended = getRecommendedQuality(bandwidth, availableQualities)

    if (recommended && recommended.resolution !== currentQuality.resolution) {
      currentQuality = recommended
      onQualityChange(recommended)
    }
  }

  // Check bandwidth every 5 seconds
  const interval = setInterval(updateQuality, 5000)

  // Return cleanup function
  return () => clearInterval(interval)
}
