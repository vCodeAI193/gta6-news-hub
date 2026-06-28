import type { Article, CategoryId } from '../types'

/**
 * Score an article for a given user profile. Higher = more relevant.
 * Pure function — no side effects.
 */
export function scoreArticle(
  article: Article,
  interests: CategoryId[],
  history: Array<{ articleId: string }>,
  hiddenTags: string[],
  hiddenSources: string[],
): number {
  // Hidden articles score -Infinity so they never surface
  if (hiddenSources.includes(article.source)) return -Infinity
  if (article.tags?.some((t) => hiddenTags.includes(t))) return -Infinity

  let score = 0

  // Interest match
  if (interests.includes(article.category)) score += 10

  // Tag overlap with interests (lightweight proxy)
  const interestStr = interests.join(' ')
  const tagOverlap = (article.tags ?? []).filter((t) =>
    interestStr.toLowerCase().includes(t.toLowerCase()),
  ).length
  score += tagOverlap * 2

  // Recency — articles within the last 7 days get a bonus
  const ageMs = Date.now() - new Date(article.date).getTime()
  const ageDays = ageMs / 86_400_000
  if (ageDays <= 1) score += 8
  else if (ageDays <= 3) score += 5
  else if (ageDays <= 7) score += 2

  // Featured boost
  if (article.featured) score += 3

  // Reliability boost
  if (article.reliability === 'confirmed') score += 2

  // Already read — deprioritise but don't remove
  if (history.some((h) => h.articleId === article.id)) score -= 15

  return score
}

/** Return articles sorted by personalised score (highest first). */
export function recommendFeed(
  articles: Article[],
  interests: CategoryId[],
  history: Array<{ articleId: string }>,
  hiddenTags: string[],
  hiddenSources: string[],
): Article[] {
  return [...articles]
    .map((a) => ({
      article: a,
      score: scoreArticle(a, interests, history, hiddenTags, hiddenSources),
    }))
    .filter((x) => x.score > -Infinity)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.article)
}

/**
 * Return a human-readable German explanation for why an article is recommended.
 */
export function explainRecommendation(
  article: Article,
  interests: CategoryId[],
  history: Array<{ articleId: string }>,
): string {
  // Check if user has read articles in the same category
  const categoryLabel: Record<CategoryId, string> = {
    official: 'Offiziell',
    trailer: 'Trailer',
    leak: 'Leak',
    release: 'Release',
  }

  if (interests.includes(article.category)) {
    return `Weil dich ${categoryLabel[article.category]}-News interessieren`
  }

  if (history.some((h) => h.articleId === article.id)) {
    return `Du hast diesen Artikel bereits gelesen`
  }

  const tag = article.tags?.[0]
  if (tag) {
    return `Weil du Artikel über ${tag} gelesen hast`
  }

  return `Empfohlen für dich`
}

/**
 * Filter articles by mood:
 * - 'positiv': confirmed/official reliability
 * - 'fakten': confirmed reliability only
 * - 'alle': no filter
 */
export function moodFilter(
  articles: Article[],
  mood: 'positiv' | 'fakten' | 'alle',
): Article[] {
  if (mood === 'alle') return articles
  if (mood === 'fakten') {
    return articles.filter((a) => a.reliability === 'confirmed')
  }
  // positiv = confirmed reliability or official category
  return articles.filter(
    (a) => a.reliability === 'confirmed' || a.category === 'official',
  )
}

/**
 * Return only short articles (estimated reading time ≤ 2 minutes).
 * Reading time: ~200 words/min.
 */
export function timeSaveMode(articles: Article[]): Article[] {
  return articles.filter((a) => {
    const words = a.body.trim().split(/\s+/).filter(Boolean).length
    const minutes = Math.max(1, Math.round(words / 200))
    return minutes <= 2
  })
}
