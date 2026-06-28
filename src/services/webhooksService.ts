import { storage } from './storage'

export interface WebhookSubscription {
  id: string
  url: string
  events: WebhookEvent[]
  secret: string
  active: boolean
  createdAt: string
  lastFiredAt: string | null
  failureCount: number
}

export type WebhookEvent =
  | 'article.published'
  | 'article.updated'
  | 'comment.created'
  | 'leak.verified'
  | 'user.registered'

export interface WebhookDelivery {
  id: string
  webhookId: string
  event: WebhookEvent
  payload: Record<string, unknown>
  status: 'pending' | 'delivered' | 'failed'
  attempts: number
  createdAt: string
  deliveredAt: string | null
}

const SUBS_KEY = 'gta6hub_webhooks'
const DELIVERIES_KEY = 'gta6hub_webhook_deliveries'

export function getWebhooks(): WebhookSubscription[] {
  return storage.get<WebhookSubscription[]>(SUBS_KEY) ?? []
}

export function registerWebhook(url: string, events: WebhookEvent[]): WebhookSubscription {
  const sub: WebhookSubscription = {
    id: crypto.randomUUID(),
    url,
    events,
    secret: crypto.randomUUID().replace(/-/g, ''),
    active: true,
    createdAt: new Date().toISOString(),
    lastFiredAt: null,
    failureCount: 0,
  }
  const subs = getWebhooks()
  subs.push(sub)
  storage.set(SUBS_KEY, subs)
  return sub
}

export function deleteWebhook(id: string): boolean {
  const subs = getWebhooks().filter(s => s.id !== id)
  storage.set(SUBS_KEY, subs)
  return true
}

export function fireWebhook(event: WebhookEvent, payload: Record<string, unknown>): WebhookDelivery[] {
  const subs = getWebhooks().filter(s => s.active && s.events.includes(event))
  const deliveries = storage.get<WebhookDelivery[]>(DELIVERIES_KEY) ?? []
  const now = new Date().toISOString()
  const newDeliveries: WebhookDelivery[] = subs.map(sub => ({
    id: crypto.randomUUID(),
    webhookId: sub.id,
    event,
    payload,
    status: 'pending' as const,
    attempts: 0,
    createdAt: now,
    deliveredAt: null,
  }))
  deliveries.push(...newDeliveries)
  storage.set(DELIVERIES_KEY, deliveries.slice(-200))
  return newDeliveries
}

export function getDeliveries(webhookId?: string): WebhookDelivery[] {
  const deliveries = storage.get<WebhookDelivery[]>(DELIVERIES_KEY) ?? []
  return webhookId ? deliveries.filter(d => d.webhookId === webhookId) : deliveries
}
