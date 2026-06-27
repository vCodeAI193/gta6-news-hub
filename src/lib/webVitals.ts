import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals'
import { track } from './analytics'

/**
 * Misst die Core Web Vitals und meldet sie an Analytics (sofern aktiv).
 * In der Entwicklung werden die Werte zusätzlich auf der Konsole ausgegeben.
 */
export function reportWebVitals(): void {
  const handler = (metric: Metric) => {
    track('web-vitals', {
      name: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
    })
    if (import.meta.env.DEV) {
      console.debug(`[web-vitals] ${metric.name}: ${Math.round(metric.value)} (${metric.rating})`)
    }
  }

  onCLS(handler)
  onINP(handler)
  onLCP(handler)
  onFCP(handler)
  onTTFB(handler)
}
