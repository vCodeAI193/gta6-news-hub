import type { Article } from '../types'

export interface DuplicateCluster {
  representative: Article
  duplicates: Article[]
  similarity: number
}

function tokenize(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/\W+/).filter(w => w.length > 3))
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter(x => b.has(x)))
  const union = new Set([...a, ...b])
  return union.size === 0 ? 0 : intersection.size / union.size
}

export function clusterDuplicates(articles: Article[], threshold = 0.6): DuplicateCluster[] {
  const tokenized = articles.map(a => ({ article: a, tokens: tokenize(a.title + ' ' + (a.excerpt ?? '')) }))
  const clusters: DuplicateCluster[] = []
  const clustered = new Set<string>()

  for (let i = 0; i < tokenized.length; i++) {
    if (clustered.has(tokenized[i].article.id)) continue
    const cluster: DuplicateCluster = {
      representative: tokenized[i].article,
      duplicates: [],
      similarity: 1,
    }
    for (let j = i + 1; j < tokenized.length; j++) {
      if (clustered.has(tokenized[j].article.id)) continue
      const sim = jaccardSimilarity(tokenized[i].tokens, tokenized[j].tokens)
      if (sim >= threshold) {
        cluster.duplicates.push(tokenized[j].article)
        cluster.similarity = Math.min(cluster.similarity, sim)
        clustered.add(tokenized[j].article.id)
      }
    }
    if (cluster.duplicates.length > 0) {
      clusters.push(cluster)
      clustered.add(tokenized[i].article.id)
    }
  }
  return clusters
}

export interface TrendingTopic {
  topic: string
  count: number
  growth: number
  articles: string[]
}

export function detectTrends(articles: Article[], windowDays = 7): TrendingTopic[] {
  const cutoff = Date.now() - windowDays * 86400000
  const recent = articles.filter(a => new Date(a.date).getTime() > cutoff)
  const older = articles.filter(a => new Date(a.date).getTime() <= cutoff)

  const countTags = (arr: Article[]) => {
    const counts: Record<string, string[]> = {}
    for (const a of arr) {
      for (const tag of a.tags ?? []) {
        if (!counts[tag]) counts[tag] = []
        counts[tag].push(a.id)
      }
    }
    return counts
  }

  const recentCounts = countTags(recent)
  const olderCounts = countTags(older)

  return Object.entries(recentCounts)
    .map(([topic, articleIds]) => {
      const oldCount = olderCounts[topic]?.length ?? 0
      const growth = oldCount === 0 ? articleIds.length : (articleIds.length - oldCount) / oldCount
      return { topic, count: articleIds.length, growth, articles: articleIds }
    })
    .filter(t => t.count >= 2)
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 10)
}

export interface SourceHealth {
  source: string
  articleCount: number
  lastSeen: string
  avgReliability: number
  status: 'healthy' | 'degraded' | 'down'
}

export function monitorSourceHealth(articles: Article[]): SourceHealth[] {
  const bySource: Record<string, Article[]> = {}
  for (const a of articles) {
    const src = a.author ?? 'Unbekannt'
    if (!bySource[src]) bySource[src] = []
    bySource[src].push(a)
  }
  const now = Date.now()
  return Object.entries(bySource).map(([source, arts]) => {
    const sorted = arts.sort((a, b) => b.date.localeCompare(a.date))
    const lastSeen = sorted[0].date
    const daysSince = (now - new Date(lastSeen).getTime()) / 86400000
    const reliabilityMap = { confirmed: 1, unconfirmed: 0.5, rumor: 0.25 }
    const avgReliability = arts.reduce((sum, a) => sum + (reliabilityMap[a.reliability ?? 'unconfirmed'] ?? 0.5), 0) / arts.length
    return {
      source,
      articleCount: arts.length,
      lastSeen,
      avgReliability,
      status: daysSince < 7 ? 'healthy' : daysSince < 30 ? 'degraded' : 'down',
    } as SourceHealth
  })
}

export interface GeoRelease {
  region: string
  country: string
  releaseDate: string
  timezone: string
  localTime: string
}

export function getGeoReleases(): GeoRelease[] {
  const baseDate = '2025-05-26'
  return [
    { region: 'Pazifik (USA)', country: 'USA (Westküste)', releaseDate: baseDate, timezone: 'PST', localTime: '00:00 PST' },
    { region: 'Ostküste (USA)', country: 'USA (Ostküste)', releaseDate: baseDate, timezone: 'EST', localTime: '03:00 EST' },
    { region: 'Mitteleuropa', country: 'Deutschland / AT / CH', releaseDate: baseDate, timezone: 'CET', localTime: '09:00 CET' },
    { region: 'UK', country: 'Vereinigtes Königreich', releaseDate: baseDate, timezone: 'GMT', localTime: '08:00 GMT' },
    { region: 'Ostasien', country: 'Japan / Südkorea', releaseDate: baseDate, timezone: 'JST', localTime: '17:00 JST' },
    { region: 'Australien', country: 'Australien (AEST)', releaseDate: baseDate, timezone: 'AEST', localTime: '18:00 AEST' },
  ]
}
