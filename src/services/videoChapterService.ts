/**
 * Video Chapter Service
 * Automatic chapter detection, generation, and management
 */

export interface VideoChapter {
  id: string
  videoId: string
  title: string
  description?: string
  startTime: number // seconds
  endTime: number // seconds
  thumbnail?: string
  keyframes?: string[] // image URLs
}

export interface ChapterDetectionResult {
  chapters: VideoChapter[]
  confidence: number
  detectionMethod: 'ai' | 'manual' | 'transcript'
}

export interface TranscriptSegment {
  startTime: number
  endTime: number
  text: string
  speaker?: string
  confidence: number
}

class VideoChapterService {
  private static readonly MIN_CHAPTER_DURATION = 10 // seconds
  private static readonly CONFIDENCE_THRESHOLD = 0.7

  /**
   * Auto-detect chapters from video transcript
   */
  async detectChaptersFromTranscript(
    videoId: string,
    transcript: TranscriptSegment[]
  ): Promise<ChapterDetectionResult> {
    try {
      const chapters = this.analyzeTranscriptForChapters(transcript)

      return {
        chapters,
        confidence: this.calculateAverageConfidence(transcript),
        detectionMethod: 'transcript',
      }
    } catch {
      return {
        chapters: [],
        confidence: 0,
        detectionMethod: 'transcript',
      }
    }
  }

  /**
   * Auto-generate chapters using AI analysis
   */
  async generateChaptersWithAI(
    videoId: string,
    videoUrl: string,
    duration: number
  ): Promise<ChapterDetectionResult> {
    try {
      const response = await fetch('/api/videos/chapters/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          videoUrl,
          duration,
        }),
      })

      if (!response.ok) throw new Error('AI chapter generation failed')
      const result = await response.json()

      return {
        chapters: result.chapters,
        confidence: result.confidence,
        detectionMethod: 'ai',
      }
    } catch {
      return {
        chapters: [],
        confidence: 0,
        detectionMethod: 'ai',
      }
    }
  }

  /**
   * Save chapters for video
   */
  async saveChapters(videoId: string, chapters: VideoChapter[]): Promise<void> {
    const response = await fetch(`/api/videos/${videoId}/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapters }),
    })

    if (!response.ok) throw new Error('Failed to save chapters')
  }

  /**
   * Get chapters for video
   */
  async getChapters(videoId: string): Promise<VideoChapter[]> {
    try {
      const response = await fetch(`/api/videos/${videoId}/chapters`)
      if (!response.ok) return []
      return response.json()
    } catch {
      return []
    }
  }

  /**
   * Update chapter
   */
  async updateChapter(videoId: string, chapterId: string, updates: Partial<VideoChapter>): Promise<VideoChapter> {
    const response = await fetch(`/api/videos/${videoId}/chapters/${chapterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!response.ok) throw new Error('Failed to update chapter')
    return response.json()
  }

  /**
   * Delete chapter
   */
  async deleteChapter(videoId: string, chapterId: string): Promise<void> {
    const response = await fetch(`/api/videos/${videoId}/chapters/${chapterId}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to delete chapter')
  }

  /**
   * Extract keyframes from video
   */
  async extractKeyframes(
    videoId: string,
    videoUrl: string,
    interval: number = 5 // seconds
  ): Promise<string[]> {
    try {
      const response = await fetch('/api/videos/keyframes/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, videoUrl, interval }),
      })

      if (!response.ok) return []
      const result = await response.json()
      return result.keyframes || []
    } catch {
      return []
    }
  }

  /**
   * Generate chapter thumbnails
   */
  async generateChapterThumbnails(
    videoId: string,
    chapters: VideoChapter[]
  ): Promise<VideoChapter[]> {
    try {
      const response = await fetch(`/api/videos/${videoId}/chapters/thumbnails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapters }),
      })

      if (!response.ok) return chapters
      return response.json()
    } catch {
      return chapters
    }
  }

  /**
   * Format time for display
   */
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  private analyzeTranscriptForChapters(transcript: TranscriptSegment[]): VideoChapter[] {
    const chapters: VideoChapter[] = []
    let currentChapter: Partial<VideoChapter> | null = null

    for (const segment of transcript) {
      const isNewTopic = this.detectTopicChange(segment.text)

      if (isNewTopic && currentChapter) {
        if (currentChapter.startTime !== undefined && currentChapter.startTime + VideoChapterService.MIN_CHAPTER_DURATION <= segment.startTime) {
          chapters.push({
            id: `chapter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            videoId: '',
            title: this.generateChapterTitle(segment.text),
            description: segment.text.slice(0, 100),
            startTime: currentChapter.startTime,
            endTime: segment.startTime,
          })
        }
        currentChapter = { startTime: segment.startTime }
      } else if (!currentChapter) {
        currentChapter = { startTime: segment.startTime }
      }
    }

    return chapters
  }

  private detectTopicChange(text: string): boolean {
    const topicIndicators = [
      /^(now|next|let's talk about|moving on to|speaking of)/i,
      /^(introduction|overview|summary|conclusion)/i,
      /^(chapter|section|part)/i,
    ]

    return topicIndicators.some(pattern => pattern.test(text))
  }

  private generateChapterTitle(text: string): string {
    const firstSentence = text.split(/[.!?]/)[0] || 'Untitled Chapter'
    return firstSentence.slice(0, 50).trim()
  }

  private calculateAverageConfidence(transcript: TranscriptSegment[]): number {
    if (transcript.length === 0) return 0
    const sum = transcript.reduce((acc, segment) => acc + segment.confidence, 0)
    return sum / transcript.length
  }
}

export const videoChapterService = new VideoChapterService()
