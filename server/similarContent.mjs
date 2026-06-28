/**
 * Feature 5: Similar content finder for rumors/leaks.
 *
 * Finds articles similar by:
 * - Semantic similarity (keyword overlap, topic clustering)
 * - Temporal proximity (related timing)
 * - Metadata similarity (author, source, category)
 * - Content similarity (Jaccard index on tokens)
 */

/**
 * Extract tokens from text (words, lowercased, stop words removed)
 */
function extractTokens(text) {
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'must',
    'can',
    'ist',
    'sind',
    'war',
    'waren',
    'sein',
    'die',
    'der',
    'das',
    'dem',
    'den',
    'des',
    'und',
    'oder',
    'aber',
    'in',
    'von',
    'zu',
    'mit',
    'für',
    'auf',
    'gta6',
    'gta',
  ])

  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9äöüß-]+/i)
      .filter((w) => w.length > 2 && !stopWords.has(w)),
  )
}

/**
 * Calculate Jaccard similarity between two sets
 */
function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 1
  if (setA.size === 0 || setB.size === 0) return 0

  const intersection = new Set([...setA].filter((x) => setB.has(x)))
  const union = new Set([...setA, ...setB])

  return intersection.size / union.size
}

/**
 * Score temporal proximity (within last N days)
 */
function temporalScore(date1, date2, maxDaysDiff = 30) {
  const t1 = new Date(date1).getTime()
  const t2 = new Date(date2).getTime()
  const daysDiff = Math.abs(t1 - t2) / (1000 * 60 * 60 * 24)

  if (daysDiff > maxDaysDiff) return 0
  return 1 - daysDiff / maxDaysDiff
}

/**
 * Calculate overall similarity score between two articles
 */
export function calculateSimilarity(article1, article2, weights = {}) {
  const {
    contentWeight = 0.4,
    tagsWeight = 0.2,
    temporalWeight = 0.15,
    authorWeight = 0.1,
    categoryWeight = 0.15,
  } = weights

  let score = 0

  // Content similarity (title + excerpt + body)
  const text1 = `${article1.title} ${article1.excerpt || ''} ${article1.body || ''}`
  const text2 = `${article2.title} ${article2.excerpt || ''} ${article2.body || ''}`
  const tokens1 = extractTokens(text1)
  const tokens2 = extractTokens(text2)
  const contentSim = jaccardSimilarity(tokens1, tokens2)
  score += contentSim * contentWeight

  // Tag similarity
  const tags1 = new Set((article1.tags || []).map((t) => t.toLowerCase()))
  const tags2 = new Set((article2.tags || []).map((t) => t.toLowerCase()))
  const tagSim = jaccardSimilarity(tags1, tags2)
  score += tagSim * tagsWeight

  // Temporal proximity
  const tempSim = temporalScore(article1.date, article2.date)
  score += tempSim * temporalWeight

  // Author similarity
  const authorSim = (article1.author || '').toLowerCase() === (article2.author || '').toLowerCase() ? 1 : 0
  score += authorSim * authorWeight

  // Category similarity
  const categorySim = article1.category === article2.category ? 1 : 0
  score += categorySim * categoryWeight

  return score
}

/**
 * Find similar articles to a given article
 */
export function findSimilar(articles, targetArticle, { limit = 5, minScore = 0.3 } = {}) {
  const similarities = articles
    .filter((a) => a.id !== targetArticle.id)
    .map((a) => ({
      article: a,
      score: calculateSimilarity(targetArticle, a),
    }))
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return similarities.map((s) => ({
    ...s.article,
    similarityScore: Math.round(s.score * 100),
  }))
}

/**
 * Cluster similar articles (transitive grouping)
 */
export function clusterArticles(articles, { minScore = 0.4 } = {}) {
  const clusters = []
  const assigned = new Set()

  for (const article of articles) {
    if (assigned.has(article.id)) continue

    const cluster = [article]
    assigned.add(article.id)

    for (const other of articles) {
      if (assigned.has(other.id)) continue

      const score = calculateSimilarity(article, other)
      if (score >= minScore) {
        cluster.push(other)
        assigned.add(other.id)
      }
    }

    clusters.push({
      seed: article.id,
      size: cluster.length,
      articles: cluster.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    })
  }

  return clusters.filter((c) => c.articles.length > 1)
}

/**
 * Find duplicate or near-duplicate articles
 */
export function findDuplicates(articles, { minScore = 0.7 } = {}) {
  const duplicates = []
  const processed = new Set()

  for (let i = 0; i < articles.length; i++) {
    const article1 = articles[i]
    if (processed.has(article1.id)) continue

    for (let j = i + 1; j < articles.length; j++) {
      const article2 = articles[j]
      if (processed.has(article2.id)) continue

      const score = calculateSimilarity(article1, article2)
      if (score >= minScore) {
        duplicates.push({
          article1Id: article1.id,
          article2Id: article2.id,
          score: Math.round(score * 100),
          article1Title: article1.title,
          article2Title: article2.title,
        })
        processed.add(article2.id)
      }
    }
  }

  return duplicates
}

/**
 * Find articles related by specific topics (tags/keywords)
 */
export function findByTopic(articles, topic, { minScore = 0.2 } = {}) {
  const topicLower = topic.toLowerCase()
  const topicTokens = extractTokens(topicLower)

  return articles
    .map((article) => {
      const text = `${article.title} ${article.excerpt || ''} ${(article.tags || []).join(' ')}`
      const tokens = extractTokens(text)
      const score = jaccardSimilarity(topicTokens, tokens)

      return { article, score }
    })
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .map((s) => ({
      ...s.article,
      topicScore: Math.round(s.score * 100),
    }))
}

/**
 * Get trending topics from articles
 * Finds most common meaningful terms
 */
export function getTrendingTopics(articles, { limit = 20, minFreq = 2 } = {}) {
  const termFreq = new Map()

  for (const article of articles) {
    const text = `${article.title} ${(article.tags || []).join(' ')}`
    const tokens = extractTokens(text)

    for (const token of tokens) {
      if (token.length >= 3) {
        termFreq.set(token, (termFreq.get(token) || 0) + 1)
      }
    }
  }

  return Array.from(termFreq.entries())
    .filter(([_, freq]) => freq >= minFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, freq]) => ({ term, frequency: freq }))
}

/**
 * Score articles by relevance to a rumor/leak (for verification)
 */
export function scoreForVerification(articles, rumor, { minScore = 0.2 } = {}) {
  const rumorTokens = extractTokens(`${rumor.title} ${rumor.excerpt || ''} ${rumor.body || ''}`)

  return articles
    .map((article) => {
      const articleTokens = extractTokens(
        `${article.title} ${article.excerpt || ''} ${article.body || ''}`,
      )
      const contentScore = jaccardSimilarity(rumorTokens, articleTokens)
      const isOfficial = article.reliability === 'confirmed' || article.reliability === 'official'
      const officialBoost = isOfficial ? 0.2 : 0
      const finalScore = Math.min(1, contentScore + officialBoost)

      return {
        article,
        contentScore: Math.round(contentScore * 100),
        officialBoost: officialBoost > 0,
        finalScore: Math.round(finalScore * 100),
      }
    })
    .filter((s) => s.contentScore >= minScore * 100)
    .sort((a, b) => b.finalScore - a.finalScore)
}
