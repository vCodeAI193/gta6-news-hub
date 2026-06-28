/**
 * Datenschutzfreundliches Analytics (Plausible-Stil) + Web-Vitals.
 *
 * Inaktiv, solange kein Domain-/Endpoint-Env gesetzt ist und der Nutzer dem
 * Tracking nicht zugestimmt hat (Cookie-Consent). Es werden keine Cookies und
 * keine personenbezogenen Daten verwendet.
 */
const DOMAIN = import.meta.env.VITE_ANALYTICS_DOMAIN as string | undefined
const ENDPOINT =
  (import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined) ??
  'https://plausible.io/api/event'

let enabled = false

export function enableAnalytics(): void {
  enabled = true
}

export function isAnalyticsEnabled(): boolean {
  return enabled && !!DOMAIN
}

/** Schickt ein Event — No-op ohne Domain/Consent. */
export function track(event: string, props?: Record<string, unknown>): void {
  if (!isAnalyticsEnabled()) return
  try {
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: event,
        domain: DOMAIN,
        url: window.location.href,
        props,
      }),
      keepalive: true,
    })
  } catch {
    /* Analytics darf niemals die App stören. */
  }
}

export function trackPageview(): void {
  track('pageview')
}

// ── Event tracking framework ─────────────────────────────────────────────────

import { readJSON, writeJSON } from '../services/storage'

export interface TrackedEvent {
  name: string
  props?: Record<string, string | number | boolean>
  timestamp: number
  path: string
}

export function trackEvent(name: string, props?: Record<string, string | number | boolean>): void {
  const event: TrackedEvent = {
    name,
    props,
    timestamp: Date.now(),
    path: typeof window !== 'undefined' ? window.location.pathname : '/',
  }
  const events = readJSON<TrackedEvent[]>('analytics_events', [])
  writeJSON('analytics_events', [...events.slice(-999), event])
  if (typeof props === 'object' && props !== null) {
    track(name, Object.fromEntries(Object.entries(props).map(([k, v]) => [k, String(v)])))
  } else {
    track(name)
  }
}

export function getEventLog(limit = 100): TrackedEvent[] {
  return readJSON<TrackedEvent[]>('analytics_events', []).slice(-limit)
}

export function getTopEvents(n = 10): Array<{ name: string; count: number }> {
  const events = readJSON<TrackedEvent[]>('analytics_events', [])
  const counts = new Map<string, number>()
  for (const e of events) counts.set(e.name, (counts.get(e.name) ?? 0) + 1)
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

// ── Scroll depth tracking ────────────────────────────────────────────────────

export interface ScrollDepthEntry {
  articleId: string
  depth: number
  timestamp: number
}

export function trackScrollDepth(articleId: string, depth: number): void {
  const existing = readJSON<ScrollDepthEntry[]>('scroll_depths', [])
  const idx = existing.findIndex(e => e.articleId === articleId)
  if (idx >= 0 && existing[idx].depth >= depth) return
  const entry: ScrollDepthEntry = { articleId, depth, timestamp: Date.now() }
  const updated = idx >= 0 ? existing.map((e, i) => i === idx ? entry : e) : [...existing, entry]
  writeJSON('scroll_depths', updated)
  trackEvent('scroll_depth', { articleId, depth })
}

export function getScrollDepth(articleId: string): number {
  return readJSON<ScrollDepthEntry[]>('scroll_depths', []).find(e => e.articleId === articleId)?.depth ?? 0
}

// ── NPS Survey ───────────────────────────────────────────────────────────────

export interface NpsResponse { score: number; comment?: string; timestamp: number }

export function submitNps(score: number, comment?: string): void {
  const responses = readJSON<NpsResponse[]>('nps_responses', [])
  writeJSON('nps_responses', [...responses, { score, comment, timestamp: Date.now() }])
  trackEvent('nps_response', { score })
}

export function getNpsAverage(): number | null {
  const responses = readJSON<NpsResponse[]>('nps_responses', [])
  if (!responses.length) return null
  return responses.reduce((s, r) => s + r.score, 0) / responses.length
}

// ── UTM capture ──────────────────────────────────────────────────────────────

export function captureUtm(): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const utm: Record<string, string> = {}
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const val = params.get(key)
    if (val) utm[key] = val
  }
  if (Object.keys(utm).length) {
    writeJSON('utm_last', utm)
    trackEvent('utm_capture', utm)
  }
}

export function getLastUtm(): Record<string, string> {
  return readJSON<Record<string, string>>('utm_last', {})
}
