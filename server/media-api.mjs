/**
 * Express API Routes for Media Features
 * Handles all 5 media feature endpoints
 */

import express from 'express'
import {
  getTranscript,
  saveTranscript,
  searchTranscripts,
  getTranscriptStats,
  generateChapters,
  getChapters,
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
  getQualityProfile,
  getRecommendedQuality,
  generateABRManifest,
  estimateOptimalQuality,
} from './media-services.mjs'

const router = express.Router()

// ============================================================================
// Feature 1: Transcript Search
// ============================================================================

/**
 * Get transcript for a video
 */
router.get('/transcripts/:videoId', (req, res) => {
  try {
    const { videoId } = req.params
    const transcript = getTranscript(videoId)

    if (!transcript) {
      return res.status(404).json({ error: 'Transcript not found' })
    }

    res.json(transcript)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Save transcript for a video
 */
router.post('/transcripts/:videoId', (req, res) => {
  try {
    const { videoId } = req.params
    const { segments } = req.body

    if (!Array.isArray(segments)) {
      return res.status(400).json({ error: 'Segments must be an array' })
    }

    const transcript = saveTranscript(videoId, segments)
    res.json(transcript)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Search transcripts
 */
router.get('/transcripts/search/:query', (req, res) => {
  try {
    const { query } = req.params
    const { videoIds } = req.query

    const videoIdList = videoIds ? videoIds.split(',') : null
    const results = searchTranscripts(query, videoIdList)

    res.json(results)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get transcript statistics
 */
router.get('/transcripts/:videoId/stats', (req, res) => {
  try {
    const { videoId } = req.params
    const stats = getTranscriptStats(videoId)

    if (!stats) {
      return res.status(404).json({ error: 'Transcript not found' })
    }

    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// Feature 2: Auto Chapter Generation
// ============================================================================

/**
 * Generate chapters from transcript
 */
router.post('/chapters/:videoId/generate', (req, res) => {
  try {
    const { videoId } = req.params
    const chapters = generateChapters(videoId)
    res.json(chapters)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get chapters for a video
 */
router.get('/chapters/:videoId', (req, res) => {
  try {
    const { videoId } = req.params
    const chapters = getChapters(videoId)
    res.json(chapters)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Update a chapter
 */
router.patch('/chapters/:videoId/:chapterId', (req, res) => {
  try {
    const { videoId, chapterId } = req.params
    const { title, description } = req.body

    const updated = updateChapter(videoId, chapterId, {
      title,
      description,
    })

    if (!updated) {
      return res.status(404).json({ error: 'Chapter not found' })
    }

    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Delete a chapter
 */
router.delete('/chapters/:videoId/:chapterId', (req, res) => {
  try {
    const { videoId, chapterId } = req.params
    deleteChapter(videoId, chapterId)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// Feature 3: Subtitle Management
// ============================================================================

/**
 * Get subtitles for a video
 */
router.get('/subtitles/:videoId/:language', (req, res) => {
  try {
    const { videoId, language } = req.params
    const subtitles = getSubtitles(videoId, language)

    if (!subtitles) {
      return res.status(404).json({ error: 'Subtitles not found' })
    }

    res.json(subtitles)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Save subtitles for a video
 */
router.post('/subtitles/:videoId/:language', (req, res) => {
  try {
    const { videoId, language } = req.params
    const { subtitles } = req.body

    const errors = validateSubtitles(subtitles)
    if (errors.length > 0) {
      return res.status(400).json({ errors })
    }

    const track = {
      id: `track-${Date.now()}`,
      language,
      label: language.toUpperCase(),
      subtitles,
      createdAt: Date.now(),
    }

    const saved = saveSubtitles(videoId, language, track)
    res.json(saved)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Import VTT file
 */
router.post('/subtitles/:videoId/:language/import-vtt', (req, res) => {
  try {
    const { videoId, language } = req.params
    const { vttContent } = req.body

    if (!vttContent) {
      return res.status(400).json({ error: 'VTT content is required' })
    }

    const subtitles = parseVTT(vttContent)
    const errors = validateSubtitles(subtitles)

    if (errors.length > 0) {
      return res.status(400).json({ errors })
    }

    const track = {
      id: `track-${Date.now()}`,
      language,
      label: language.toUpperCase(),
      subtitles,
      createdAt: Date.now(),
    }

    const saved = saveSubtitles(videoId, language, track)
    res.json(saved)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Export subtitles as VTT
 */
router.get('/subtitles/:videoId/:language/export-vtt', (req, res) => {
  try {
    const { videoId, language } = req.params
    const track = getSubtitles(videoId, language)

    if (!track) {
      return res.status(404).json({ error: 'Subtitles not found' })
    }

    const vtt = generateVTT(track.subtitles)
    res.setHeader('Content-Type', 'text/vtt')
    res.setHeader('Content-Disposition', `attachment; filename="subtitles-${videoId}-${language}.vtt"`)
    res.send(vtt)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get available subtitle languages
 */
router.get('/subtitles/:videoId/languages', (req, res) => {
  try {
    const { videoId } = req.params
    const languages = getSubtitleLanguages(videoId)
    res.json(languages)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Update a subtitle
 */
router.patch('/subtitles/:videoId/:language/:subtitleId', (req, res) => {
  try {
    const { videoId, language, subtitleId } = req.params
    const { text, startTime, endTime } = req.body

    const updated = updateSubtitle(videoId, language, subtitleId, {
      text,
      startTime,
      endTime,
    })

    if (!updated) {
      return res.status(404).json({ error: 'Subtitle not found' })
    }

    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// Feature 4: Live Streaming
// ============================================================================

/**
 * Get all live streams
 */
router.get('/streams', (req, res) => {
  try {
    const { platform } = req.query
    const streams = getLiveStreams(platform)
    res.json(streams)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Add a live stream
 */
router.post('/streams', (req, res) => {
  try {
    const { platform, channelId, title, embedUrl } = req.body

    if (!validateStreamChannel(platform, channelId)) {
      return res.status(400).json({ error: 'Invalid channel ID for platform' })
    }

    const stream = addLiveStream({
      platform,
      channelId,
      title,
      embedUrl,
      isLive: true,
    })

    res.status(201).json(stream)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Update a live stream
 */
router.patch('/streams/:streamId', (req, res) => {
  try {
    const { streamId } = req.params
    const updates = req.body

    const updated = updateLiveStream(streamId, updates)

    if (!updated) {
      return res.status(404).json({ error: 'Stream not found' })
    }

    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Remove a live stream
 */
router.delete('/streams/:streamId', (req, res) => {
  try {
    const { streamId } = req.params
    removeLiveStream(streamId)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================================================
// Feature 5: Quality/Bitrate Management
// ============================================================================

/**
 * Get recommended quality based on bandwidth
 */
router.post('/quality/recommend', (req, res) => {
  try {
    const { bandwidth } = req.body

    if (typeof bandwidth !== 'number' || bandwidth < 0) {
      return res.status(400).json({ error: 'Valid bandwidth number required' })
    }

    const recommended = getRecommendedQuality(bandwidth)
    res.json({ recommended })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Get quality profile details
 */
router.get('/quality/:resolution', (req, res) => {
  try {
    const { resolution } = req.params
    const profile = getQualityProfile(resolution)

    if (!profile) {
      return res.status(404).json({ error: 'Quality profile not found' })
    }

    res.json(profile)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Generate ABR manifest
 */
router.post('/quality/:videoId/manifest', (req, res) => {
  try {
    const { videoId } = req.params
    const { qualities } = req.body

    if (!Array.isArray(qualities)) {
      return res.status(400).json({ error: 'Qualities must be an array' })
    }

    const manifest = generateABRManifest(videoId, qualities)
    res.json(manifest)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * Estimate optimal quality
 */
router.post('/quality/:videoId/optimal', (req, res) => {
  try {
    const { videoId } = req.params
    const { bandwidth } = req.body

    if (typeof bandwidth !== 'number') {
      return res.status(400).json({ error: 'Bandwidth number required' })
    }

    const optimal = estimateOptimalQuality(bandwidth, videoId)

    if (!optimal) {
      return res.status(404).json({ error: 'No manifest found for video' })
    }

    res.json(optimal)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
