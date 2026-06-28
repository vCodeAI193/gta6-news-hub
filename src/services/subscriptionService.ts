import { readJSON, writeJSON } from './storage'

export type PlanId = 'free' | 'plus' | 'pro'

export interface Plan {
  id: PlanId
  name: string
  price: number
  features: string[]
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['Alle Artikel lesen', 'Kommentieren', 'Basis-Suche'],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 4.99,
    features: ['Werbefrei', 'Exklusive Analysen', 'Früher Zugang zu Artikeln', 'Newsletter'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    features: ['Alles aus Plus', 'KI-Assistent unlimitiert', 'Premium-Profil-Badge', 'Downloadbare Assets', 'Direkter Redaktions-Chat'],
  },
]

export interface Subscription {
  planId: PlanId
  startedAt: number
  renewsAt: number
  coupon?: string
  giftCode?: string
}

export interface PaymentRecord {
  id: string
  amount: number
  plan: PlanId
  date: number
  status: 'paid' | 'refunded'
}

export function getSubscription(): Subscription {
  return readJSON<Subscription>('subscription', { planId: 'free', startedAt: Date.now(), renewsAt: Date.now() + 30 * 24 * 3600 * 1000 })
}

export function upgradePlan(planId: PlanId, coupon?: string): Subscription {
  const sub: Subscription = {
    planId,
    startedAt: Date.now(),
    renewsAt: Date.now() + 30 * 24 * 3600 * 1000,
    coupon,
  }
  writeJSON('subscription', sub)
  const record: PaymentRecord = {
    id: crypto.randomUUID(),
    amount: PLANS.find(p => p.id === planId)?.price ?? 0,
    plan: planId,
    date: Date.now(),
    status: 'paid',
  }
  const history = getPaymentHistory()
  writeJSON('payment_history', [...history, record])
  return sub
}

export function cancelSubscription(): void {
  writeJSON('subscription', { planId: 'free', startedAt: Date.now(), renewsAt: Date.now() })
}

export function getPaymentHistory(): PaymentRecord[] {
  return readJSON<PaymentRecord[]>('payment_history', [])
}

export function refundLast(): PaymentRecord | null {
  const history = getPaymentHistory()
  const last = [...history].reverse().find(r => r.status === 'paid')
  if (!last) return null
  const updated = history.map(r => r.id === last.id ? { ...r, status: 'refunded' as const } : r)
  writeJSON('payment_history', updated)
  cancelSubscription()
  return { ...last, status: 'refunded' }
}

export function applyGiftCode(code: string): boolean {
  if (code.toUpperCase().startsWith('GTA6-')) {
    upgradePlan('plus', code)
    return true
  }
  return false
}

export function applyCoupon(code: string): number {
  const discounts: Record<string, number> = { 'LAUNCH20': 0.20, 'FANS10': 0.10, 'VICE30': 0.30 }
  return discounts[code.toUpperCase()] ?? 0
}

export function isPremium(): boolean {
  return getSubscription().planId !== 'free'
}

export function hasPro(): boolean {
  return getSubscription().planId === 'pro'
}
