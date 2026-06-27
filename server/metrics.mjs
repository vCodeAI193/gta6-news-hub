/**
 * Minimale Observability: zählt Requests nach Methode/Status und misst Uptime.
 * (Ein echtes Setup würde OpenTelemetry/Prometheus nutzen — hier in-memory.)
 */
export function createMetrics(now = Date.now()) {
  const startedAt = now
  const counters = { total: 0, byStatus: {}, byMethod: {} }

  const middleware = (req, res, next) => {
    counters.total += 1
    counters.byMethod[req.method] = (counters.byMethod[req.method] ?? 0) + 1
    res.on('finish', () => {
      const bucket = `${Math.floor(res.statusCode / 100)}xx`
      counters.byStatus[bucket] = (counters.byStatus[bucket] ?? 0) + 1
    })
    next()
  }

  const snapshot = (at = Date.now()) => ({
    startedAt: new Date(startedAt).toISOString(),
    uptimeSec: Math.floor((at - startedAt) / 1000),
    requests: counters.total,
    byMethod: { ...counters.byMethod },
    byStatus: { ...counters.byStatus },
  })

  return { middleware, snapshot }
}
