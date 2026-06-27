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
