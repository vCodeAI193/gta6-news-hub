/**
 * Einfaches In-Memory-Rate-Limiting pro IP (Token-Bucket-artig, Fixed-Window).
 * Für Produktion mit mehreren Instanzen würde man Redis o. Ä. verwenden.
 */
export function rateLimit({ windowMs = 60_000, max = 60 } = {}) {
  const hits = new Map()

  return (req, res, next) => {
    const key = req.ip || req.socket?.remoteAddress || 'unknown'
    const now = Date.now()
    const entry = hits.get(key)

    if (!entry || now > entry.reset) {
      hits.set(key, { count: 1, reset: now + windowMs })
      return next()
    }

    entry.count += 1
    if (entry.count > max) {
      const retry = Math.ceil((entry.reset - now) / 1000)
      res.setHeader('Retry-After', String(retry))
      return res.status(429).json({ error: 'Zu viele Anfragen', retryAfter: retry })
    }
    next()
  }
}
