import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import {
  createVideoSearchTable,
  registerVideo,
  addVideoSegment,
  segmentTranscript,
  searchVideoSegments,
  getVideoSegments,
  getArticleVideo,
  batchAddSegments,
} from './videoSearch.mjs'

let db

test.before(() => {
  db = new DatabaseSync(':memory:')

  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON')

  // Create articles table first
  db.exec(`
    CREATE TABLE articles (
      id TEXT PRIMARY KEY,
      title TEXT,
      excerpt TEXT,
      body TEXT,
      category TEXT,
      date TEXT,
      source TEXT,
      source_url TEXT,
      image TEXT,
      tags TEXT,
      author TEXT,
      reliability TEXT,
      status TEXT,
      publish_at TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `)

  // Insert test articles
  db.exec(`
    INSERT INTO articles (id, title, excerpt, body, category, date, source, source_url, image, tags, author, reliability, status, created_at, updated_at)
    VALUES
      ('article-1', 'GTA6 Trailer', 'New trailer', 'Long body', 'trailer', '2026-05-01', 'Rockstar', 'https://example.com', 'https://example.com/img.jpg', '[]', 'Author', 'confirmed', 'published', '2026-05-01', '2026-05-01'),
      ('article-2', 'GTA6 Video', 'Video content', 'Body', 'trailer', '2026-05-01', 'Rockstar', 'https://example.com', 'https://example.com/img.jpg', '[]', 'Author', 'confirmed', 'published', '2026-05-01', '2026-05-01'),
      ('article-3', 'GTA6 Announcement', 'Announcement', 'Body', 'official', '2026-05-02', 'Rockstar', 'https://example.com', 'https://example.com/img.jpg', '[]', 'Author', 'confirmed', 'published', '2026-05-02', '2026-05-02'),
      ('article-4', 'GTA6 Info', 'Info', 'Body', 'official', '2026-05-03', 'Rockstar', 'https://example.com', 'https://example.com/img.jpg', '[]', 'Author', 'confirmed', 'published', '2026-05-03', '2026-05-03'),
      ('article-5', 'GTA6 More', 'More', 'Body', 'official', '2026-05-04', 'Rockstar', 'https://example.com', 'https://example.com/img.jpg', '[]', 'Author', 'confirmed', 'published', '2026-05-04', '2026-05-04')
  `)

  createVideoSearchTable(db)
})

test('Feature 2: Register video with transcript', () => {
  const result = registerVideo(db, {
    articleId: 'article-1',
    videoUrl: 'https://example.com/video.mp4',
    duration: 300,
    transcript: 'Welcome to GTA6. This is Vice City. Check out the characters.',
  })

  assert.ok(result.id)
  assert.equal(result.articleId, 'article-1')
  assert.equal(result.duration, 300)

  const video = getArticleVideo(db, 'article-1')
  assert.ok(video)
  assert.equal(video.transcript, 'Welcome to GTA6. This is Vice City. Check out the characters.')
})

test('Feature 2: Add video segment with timestamp', () => {
  const video = registerVideo(db, {
    articleId: 'article-2',
    videoUrl: 'https://example.com/video2.mp4',
    duration: 600,
  })

  const segment = addVideoSegment(db, video.id, {
    startTime: 30,
    endTime: 60,
    text: 'This is Vice City, the setting of GTA6',
    keywords: ['vice city', 'gta6'],
  })

  assert.ok(segment.id)
  assert.equal(segment.startTime, 30)
  assert.equal(segment.endTime, 60)
  assert.equal(segment.text, 'This is Vice City, the setting of GTA6')

  const segments = getVideoSegments(db, video.id)
  assert.equal(segments.length, 1)
  assert.equal(segments[0].text, 'This is Vice City, the setting of GTA6')
})

test('Feature 2: Segment transcript automatically', () => {
  const transcript =
    'Welcome to GTA6. ' +
    'This is the first trailer. ' +
    'The game features Vice City. ' +
    'Two protagonists: Lucia and Jason. ' +
    'Release date is November 2026. ' +
    'Stay tuned for more.'

  const segments = segmentTranscript(transcript, 30, 300)

  assert.ok(segments.length > 0)
  segments.forEach((seg) => {
    assert.ok(seg.startTime >= 0)
    assert.ok(seg.endTime <= 300)
    assert.ok(seg.text.length > 0)
    assert.ok(Array.isArray(seg.keywords))
  })
})

test('Feature 2: Search within video segments', () => {
  const video = registerVideo(db, {
    articleId: 'article-3',
    videoUrl: 'https://example.com/video3.mp4',
    duration: 600,
  })

  addVideoSegment(db, video.id, {
    startTime: 0,
    endTime: 30,
    text: 'Welcome to the GTA6 official trailer',
    keywords: ['gta6', 'trailer'],
  })

  addVideoSegment(db, video.id, {
    startTime: 30,
    endTime: 60,
    text: 'Meet Lucia, the new protagonist',
    keywords: ['lucia', 'protagonist'],
  })

  const results = searchVideoSegments(db, 'lucia')
  assert.equal(results.length, 1)
  assert.equal(results[0].text, 'Meet Lucia, the new protagonist')
  assert.equal(results[0].startTime, 30)
  assert.equal(results[0].videoUrl, 'https://example.com/video3.mp4')
})

test('Feature 2: Search is case-insensitive', () => {
  const results1 = searchVideoSegments(db, 'LUCIA')
  const results2 = searchVideoSegments(db, 'lucia')

  assert.equal(results1.length, results2.length)
  assert.ok(results1.length > 0)
})

test('Feature 2: Batch add segments', () => {
  const video = registerVideo(db, {
    articleId: 'article-4',
    videoUrl: 'https://example.com/video4.mp4',
    duration: 1200,
  })

  const segments = [
    { startTime: 0, endTime: 100, text: 'Introduction', keywords: ['intro'] },
    { startTime: 100, endTime: 200, text: 'Map reveal', keywords: ['map', 'vice city'] },
    { startTime: 200, endTime: 300, text: 'Character showcase', keywords: ['lucia', 'jason'] },
  ]

  const { added, total } = batchAddSegments(db, video.id, segments)
  assert.equal(added, 3)
  assert.equal(total, 3)

  const stored = getVideoSegments(db, video.id)
  assert.equal(stored.length, 3)
  assert.equal(stored[0].text, 'Introduction')
  assert.equal(stored[1].text, 'Map reveal')
  assert.equal(stored[2].text, 'Character showcase')
})

test('Feature 2: Get all segments for a video', () => {
  const video = registerVideo(db, {
    articleId: 'article-5',
    videoUrl: 'https://example.com/video5.mp4',
    duration: 600,
  })

  for (let i = 0; i < 5; i++) {
    addVideoSegment(db, video.id, {
      startTime: i * 60,
      endTime: (i + 1) * 60,
      text: `Segment ${i}`,
      keywords: [],
    })
  }

  const segments = getVideoSegments(db, video.id)
  assert.equal(segments.length, 5)
  segments.forEach((seg, i) => {
    assert.equal(seg.startTime, i * 60)
    assert.equal(seg.text, `Segment ${i}`)
  })
})
