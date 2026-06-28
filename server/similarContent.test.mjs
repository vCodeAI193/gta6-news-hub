import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateSimilarity,
  findSimilar,
  clusterArticles,
  findDuplicates,
  findByTopic,
  getTrendingTopics,
  scoreForVerification,
} from './similarContent.mjs'

const articles = [
  {
    id: 'a1',
    title: 'GTA6 Trailer 2 Release: Vice City Showcased',
    excerpt: 'The second official trailer reveals Vice City',
    body: 'Rockstar released the highly anticipated second trailer for Grand Theft Auto VI, showcasing the sprawling Vice City with rain and neon lights.',
    author: 'Rockstar',
    category: 'trailer',
    date: '2026-04-18',
    tags: ['Trailer', 'Vice City'],
    reliability: 'confirmed',
  },
  {
    id: 'a2',
    title: 'Vice City Map Appears in Leaked Images',
    excerpt: 'Leaked screenshots show Vice City',
    body: 'Unconfirmed leaked images circulating on forums appear to show the map of Vice City with detailed street names and landmarks.',
    author: 'Community',
    category: 'leak',
    date: '2026-04-20',
    tags: ['Leak', 'Vice City', 'Map'],
    reliability: 'unconfirmed',
  },
  {
    id: 'a3',
    title: 'Lucia Character Details Confirmed',
    excerpt: 'Official info about protagonist Lucia',
    body: 'Rockstar confirmed that Lucia is one of the two main protagonists in GTA6, with a detailed background story set in Vice City.',
    author: 'Rockstar',
    category: 'official',
    date: '2026-04-25',
    tags: ['Character', 'Lucia'],
    reliability: 'confirmed',
  },
  {
    id: 'a4',
    title: 'Jason Character Leak: Lucia\'s Partner',
    excerpt: 'Rumor about second protagonist',
    body: 'Leaked information suggests Jason is the second playable character and works alongside Lucia in Vice City crime missions.',
    author: 'Reddit User',
    category: 'leak',
    date: '2026-04-26',
    tags: ['Leak', 'Jason', 'Character'],
    reliability: 'rumor',
  },
  {
    id: 'a5',
    title: 'GTA6 Soundtrack Partners Announced',
    excerpt: 'Music labels collaboration',
    body: 'Rockstar Games announced partnerships with major music labels for the GTA6 soundtrack, featuring various radio stations.',
    author: 'Rockstar',
    category: 'official',
    date: '2026-05-01',
    tags: ['Soundtrack', 'Music'],
    reliability: 'confirmed',
  },
]

test('Feature 5: Calculate similarity between articles', () => {
  const sim1 = calculateSimilarity(articles[0], articles[1])
  assert.ok(sim1 > 0)
  assert.ok(sim1 <= 1)

  // Articles about Vice City should be more similar
  const sim2 = calculateSimilarity(articles[0], articles[1])
  const sim3 = calculateSimilarity(articles[0], articles[4])
  assert.ok(sim2 > sim3, 'Vice City articles should be more similar than trailer vs soundtrack')
})

test('Feature 5: Find similar articles', () => {
  const similar = findSimilar(articles, articles[0], { limit: 3, minScore: 0.2 })

  assert.ok(similar.length > 0)
  assert.equal(similar.every((a) => a.id !== articles[0].id), true)
  assert.ok(similar.every((a) => a.similarityScore >= 20))

  // Second similar article should be about Vice City (a2)
  const viceCityArticle = similar.find((a) => a.id === 'a2')
  assert.ok(viceCityArticle)
})

test('Feature 5: Find similar with minimum score', () => {
  const similarHigh = findSimilar(articles, articles[0], { limit: 10, minScore: 0.6 })
  const similarLow = findSimilar(articles, articles[0], { limit: 10, minScore: 0.1 })

  assert.ok(similarLow.length >= similarHigh.length)
  assert.ok(similarHigh.every((a) => a.similarityScore >= 60))
})

test('Feature 5: Cluster similar articles', () => {
  const clusters = clusterArticles(articles, { minScore: 0.3 })

  assert.ok(clusters.length > 0)
  clusters.forEach((cluster) => {
    assert.ok(cluster.seed)
    assert.ok(cluster.size >= 2)
    assert.equal(cluster.articles.length, cluster.size)
  })
})

test('Feature 5: Find duplicate articles', () => {
  const testArticles = [
    {
      id: 'dup1',
      title: 'GTA6 Release Date Confirmed',
      excerpt: 'November 2026',
      body: 'Rockstar Games has confirmed that Grand Theft Auto VI will release on November 19, 2026.',
      author: 'Official',
      category: 'release',
      date: '2026-05-06',
      tags: ['Release'],
      reliability: 'confirmed',
    },
    {
      id: 'dup2',
      title: 'GTA6 Official Release Date: November 19, 2026',
      excerpt: 'Release confirmed for Nov 2026',
      body: 'Grand Theft Auto VI confirmed release date November 19, 2026 by Rockstar Games official announcement.',
      author: 'Official',
      category: 'release',
      date: '2026-05-06',
      tags: ['Release', 'Confirmed'],
      reliability: 'confirmed',
    },
  ]

  const dupes = findDuplicates(testArticles, { minScore: 0.6 })
  assert.equal(dupes.length, 1)
  assert.equal(dupes[0].article1Id, 'dup1')
  assert.equal(dupes[0].article2Id, 'dup2')
})

test('Feature 5: Find articles by topic', () => {
  const luciaTopic = findByTopic(articles, 'lucia character', { minScore: 0.1 })

  assert.ok(luciaTopic.length > 0)
  const luciaDirect = luciaTopic.find((a) => a.id === 'a3')
  assert.ok(luciaDirect)
  assert.ok(luciaDirect.topicScore >= 10)
})

test('Feature 5: Get trending topics', () => {
  const trends = getTrendingTopics(articles, { limit: 10, minFreq: 1 })

  assert.ok(trends.length > 0)
  trends.forEach((t) => {
    assert.ok(t.term)
    assert.ok(t.frequency >= 1)
  })

  // Should find common terms like 'gta6', 'vice', 'city'
  const hasCommonTerms = trends.some((t) => ['gta6', 'vice', 'city', 'lucia', 'character'].includes(t.term))
  assert.ok(hasCommonTerms)
})

test('Feature 5: Score articles for verification of rumor', () => {
  const rumor = {
    id: 'rumor1',
    title: 'Leaked: Jason and Lucia Protagonists in GTA6',
    excerpt: 'Two playable characters rumored',
    body: 'Rumors suggest that Jason and Lucia are the main protagonists in GTA6 with interwoven storylines.',
    author: 'Leaker',
    category: 'leak',
    date: '2026-04-20',
    tags: ['Leak', 'Characters'],
    reliability: 'rumor',
  }

  const scores = scoreForVerification(articles, rumor, { minScore: 0.1 })

  assert.ok(scores.length > 0)
  scores.forEach((s) => {
    assert.ok(s.contentScore >= 0)
    assert.ok(s.finalScore >= 0)
    assert.ok('officialBoost' in s)
  })

  // Official sources should score higher
  const officialScores = scores.filter((s) => s.officialBoost)
  const rumScores = scores.filter((s) => !s.officialBoost)
  if (officialScores.length > 0 && rumScores.length > 0) {
    assert.ok(officialScores[0].finalScore >= rumScores[0].finalScore)
  }
})

test('Feature 5: Similarity respects weights', () => {
  // Create articles with high content similarity but different dates
  const old = {
    id: 'old',
    title: 'Vice City Trailer',
    excerpt: 'Vice City shown',
    body: 'Vice City is shown in detail',
    author: 'A',
    category: 'trailer',
    date: '2020-01-01',
    tags: ['Vice City'],
    reliability: 'confirmed',
  }

  const recent = {
    id: 'recent',
    title: 'Vice City Footage Released',
    excerpt: 'Vice City shown',
    body: 'Vice City is shown in detail',
    author: 'A',
    category: 'trailer',
    date: '2026-05-01',
    tags: ['Vice City'],
    reliability: 'confirmed',
  }

  // Weighted towards content
  const contentHeavy = calculateSimilarity(old, recent, {
    contentWeight: 0.8,
    temporalWeight: 0.05,
  })

  // Weighted towards temporal
  const temporalHeavy = calculateSimilarity(old, recent, {
    contentWeight: 0.05,
    temporalWeight: 0.8,
  })

  assert.ok(contentHeavy > temporalHeavy)
})
