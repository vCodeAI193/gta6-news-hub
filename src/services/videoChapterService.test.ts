import { describe, it, expect, vi, beforeEach } from 'vitest'
import { videoChapterService } from './videoChapterService'
import type { TranscriptSegment } from './videoChapterService'

global.fetch = vi.fn()

describe('VideoChapterService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('detectChaptersFromTranscript', () => {
    it('should detect chapters from transcript', async () => {
      const transcript: TranscriptSegment[] = [
        {
          startTime: 0,
          endTime: 10,
          text: 'Introduction to GTA6',
          confidence: 0.95,
        },
        {
          startTime: 10,
          endTime: 20,
          text: 'Now lets talk about gameplay features',
          confidence: 0.92,
        },
      ]

      const result = await videoChapterService.detectChaptersFromTranscript('video-1', transcript)
      expect(result.detectionMethod).toBe('transcript')
      expect(result.confidence).toBeGreaterThan(0)
    })
  })

  describe('generateChaptersWithAI', () => {
    it('should call AI chapter generation endpoint', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          chapters: [],
          confidence: 0.85,
        }),
      } as Response)

      const result = await videoChapterService.generateChaptersWithAI(
        'video-1',
        'https://example.com/video.mp4',
        300
      )

      expect(result.detectionMethod).toBe('ai')
      expect(fetch).toHaveBeenCalledWith(
        '/api/videos/chapters/generate',
        expect.any(Object)
      )
    })
  })

  describe('saveChapters', () => {
    it('should save chapters for video', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response)

      const chapters = [
        {
          id: 'ch-1',
          videoId: 'video-1',
          title: 'Intro',
          startTime: 0,
          endTime: 30,
        },
      ]

      await expect(
        videoChapterService.saveChapters('video-1', chapters)
      ).resolves.not.toThrow()

      expect(fetch).toHaveBeenCalledWith(
        '/api/videos/video-1/chapters',
        expect.any(Object)
      )
    })
  })

  describe('getChapters', () => {
    it('should fetch chapters for video', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      const result = await videoChapterService.getChapters('video-1')
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return empty array on fetch failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      const result = await videoChapterService.getChapters('video-1')
      expect(result).toEqual([])
    })
  })

  describe('updateChapter', () => {
    it('should update chapter metadata', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'ch-1',
          videoId: 'video-1',
          title: 'Updated Title',
          startTime: 0,
          endTime: 30,
        }),
      } as Response)

      const result = await videoChapterService.updateChapter('video-1', 'ch-1', {
        title: 'Updated Title',
      })

      expect(result.title).toBe('Updated Title')
    })
  })

  describe('deleteChapter', () => {
    it('should delete chapter', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
      } as Response)

      await expect(
        videoChapterService.deleteChapter('video-1', 'ch-1')
      ).resolves.not.toThrow()
    })
  })

  describe('formatTime', () => {
    it('should format time without hours', () => {
      expect(videoChapterService.formatTime(125)).toBe('2:05')
    })

    it('should format time with hours', () => {
      expect(videoChapterService.formatTime(3725)).toBe('1:02:05')
    })

    it('should pad with zeros', () => {
      expect(videoChapterService.formatTime(65)).toBe('1:05')
      expect(videoChapterService.formatTime(5)).toBe('0:05')
    })
  })

  describe('extractKeyframes', () => {
    it('should extract keyframes from video', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          keyframes: ['https://example.com/frame1.jpg'],
        }),
      } as Response)

      const result = await videoChapterService.extractKeyframes(
        'video-1',
        'https://example.com/video.mp4'
      )

      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('generateChapterThumbnails', () => {
    it('should generate thumbnails for chapters', async () => {
      const chapters = [
        {
          id: 'ch-1',
          videoId: 'video-1',
          title: 'Intro',
          startTime: 0,
          endTime: 30,
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => chapters,
      } as Response)

      const result = await videoChapterService.generateChapterThumbnails('video-1', chapters)
      expect(result).toHaveLength(1)
    })
  })
})
