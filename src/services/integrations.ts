import type { Article } from '../types'
import { createId, readJSON, writeJSON } from './storage'

/**
 * Integrationen zu externen Systemen. In einem reinen Frontend-Repo können diese
 * nicht „echt" laufen — sie sind so weit umgesetzt, wie es ohne Server/Keys
 * möglich ist, und ansonsten klar als Stub/lokal gekennzeichnet.
 */

/* ----------------------------- Webhooks -------------------------------- */
// Ausgehende Webhooks erfordern einen Server (CORS/Secrets). Hier wird das
// Event nur lokal protokolliert; die Zielausführung ist dokumentiert.
export interface WebhookEvent {
  id: string
  type: string
  payload: unknown
  at: string
}

export function emitWebhook(type: string, payload: unknown): WebhookEvent {
  const event: WebhookEvent = {
    id: createId('wh'),
    type,
    payload,
    at: new Date().toISOString(),
  }
  const log = readJSON<WebhookEvent[]>('webhooks:log', [])
  writeJSON('webhooks:log', [event, ...log].slice(0, 50))
  // In Produktion: fetch(WEBHOOK_URL, { method: 'POST', body: JSON.stringify(event) })
  return event
}

/* ----------------------------- RSS-Import ------------------------------ */
// Echter Import fremder Feeds scheitert im Browser an CORS und braucht einen
// Server-Proxy. Der Parser funktioniert; als Quelle dient ein lokaler Mock-Feed.
const MOCK_FEED = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <item>
    <title>Rockstar teasert neuen Gameplay-Deep-Dive</title>
    <description>Ein offizieller Deep-Dive zum Gameplay soll im Sommer folgen.</description>
    <link>https://www.rockstargames.com/newswire</link>
    <pubDate>2026-06-01</pubDate>
  </item>
  <item>
    <title>Pre-Order-Boni weltweit freigeschaltet</title>
    <description>Die digitalen Vorbesteller-Boni sind ab sofort verfügbar.</description>
    <link>https://blog.playstation.com</link>
    <pubDate>2026-05-25</pubDate>
  </item>
</channel></rss>`

export interface ParsedFeedItem {
  title: string
  description: string
  link: string
  pubDate: string
}

export function parseRssFeed(xml: string): ParsedFeedItem[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  return Array.from(doc.querySelectorAll('item')).map((item) => ({
    title: item.querySelector('title')?.textContent ?? '',
    description: item.querySelector('description')?.textContent ?? '',
    link: item.querySelector('link')?.textContent ?? '',
    pubDate: item.querySelector('pubDate')?.textContent ?? '',
  }))
}

/** Liefert den Mock-Feed als importierbare Artikel-Entwürfe. */
export function importMockFeed(): Array<Partial<Article>> {
  return parseRssFeed(MOCK_FEED).map((item) => ({
    title: item.title,
    excerpt: item.description,
    body: item.description,
    category: 'official' as const,
    date: item.pubDate,
    source: 'RSS-Import',
    sourceUrl: item.link,
    image: `https://picsum.photos/seed/${encodeURIComponent(item.title).slice(0, 16)}/800/450`,
    status: 'draft' as const,
  }))
}
