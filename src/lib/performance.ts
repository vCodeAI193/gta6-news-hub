// Performance utilities: blur-up images, offline mode, data saver

export interface BlurUpOptions {
  src: string
  placeholder?: string
  width?: number
  height?: number
}

export function getBlurDataUrl(color = '#1a1a2e'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="5"><rect width="8" height="5" fill="${color}"/></svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export function isDataSaverMode(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection
  return conn?.saveData === true || conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g'
}

export function prefetchRoute(href: string): void {
  if (isDataSaverMode()) return
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = href
  document.head.appendChild(link)
}

export function prefetchOnHover(el: HTMLElement, href: string): () => void {
  let prefetched = false
  function handler() {
    if (!prefetched) {
      prefetchRoute(href)
      prefetched = true
    }
  }
  el.addEventListener('mouseenter', handler, { once: true })
  el.addEventListener('touchstart', handler, { passive: true, once: true } as AddEventListenerOptions)
  return () => {
    el.removeEventListener('mouseenter', handler)
    el.removeEventListener('touchstart', handler)
  }
}

// Background sync queue for offline actions
export interface OfflineAction {
  id: string
  type: string
  payload: unknown
  createdAt: number
  retries: number
}

const OFFLINE_QUEUE_KEY = 'gta6hub_offline_queue'

export function queueOfflineAction(type: string, payload: unknown): OfflineAction {
  const action: OfflineAction = {
    id: crypto.randomUUID(),
    type,
    payload,
    createdAt: Date.now(),
    retries: 0,
  }
  const queue = getOfflineQueue()
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([...queue, action]))
  return action
}

export function getOfflineQueue(): OfflineAction[] {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) ?? '[]') as OfflineAction[]
  } catch {
    return []
  }
}

export function clearOfflineAction(id: string): void {
  const queue = getOfflineQueue().filter(a => a.id !== id)
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}

export function getOfflineQueueSize(): number {
  return getOfflineQueue().length
}

// Web Vitals budget thresholds (ms)
export const VITALS_BUDGET = {
  FCP: 1800,
  LCP: 2500,
  FID: 100,
  CLS: 0.1,
  TTFB: 800,
} as const

export function checkVitalsBudget(metric: keyof typeof VITALS_BUDGET, value: number): 'good' | 'needs-improvement' | 'poor' {
  const budget = VITALS_BUDGET[metric]
  const poor = budget * 2
  if (value <= budget) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}

// Lazy image with progressive enhancement
export function imgSrcset(base: string, widths = [320, 640, 1280]): string {
  return widths.map(w => `${base}?w=${w} ${w}w`).join(', ')
}
