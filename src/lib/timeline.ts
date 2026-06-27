import type { Article } from '../types'

export interface TimelineEvent {
  date: string
  title: string
  kind: 'article' | 'milestone'
  category?: Article['category']
  id?: string
}

/** Feste Meilensteine der GTA-6-Geschichte. */
const MILESTONES: TimelineEvent[] = [
  { date: '2026-11-19', title: 'Release: Grand Theft Auto VI', kind: 'milestone' },
]

/**
 * Baut eine chronologische Timeline aus Artikeln + Meilensteinen.
 * Sortiert aufsteigend nach Datum (reine Funktion, getestet).
 */
export function buildTimeline(articles: Article[]): TimelineEvent[] {
  const fromArticles: TimelineEvent[] = articles.map((a) => ({
    date: a.date,
    title: a.title,
    kind: 'article',
    category: a.category,
    id: a.id,
  }))
  return [...fromArticles, ...MILESTONES].sort((a, b) => a.date.localeCompare(b.date))
}

/** Gruppiert Timeline-Events nach Jahr (für die Darstellung). */
export function groupByYear(events: TimelineEvent[]): Array<{ year: string; events: TimelineEvent[] }> {
  const map = new Map<string, TimelineEvent[]>()
  for (const e of events) {
    const year = e.date.slice(0, 4)
    if (!map.has(year)) map.set(year, [])
    map.get(year)!.push(e)
  }
  return [...map.entries()].map(([year, evs]) => ({ year, events: evs }))
}
