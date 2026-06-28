/**
 * Minimal Prometheus-compatible metrics endpoint.
 * Tracks http_requests_total, http_errors_total, active_users_total.
 */
const counters = {
  http_requests_total: new Map(),
  http_errors_total: new Map(),
}
let activeUsers = 0

export function recordRequest(method, path, status) {
  const key = `${method}|${path}`
  counters.http_requests_total.set(key, (counters.http_requests_total.get(key) ?? 0) + 1)
  if (status >= 400) {
    const errKey = `${status}|${path}`
    counters.http_errors_total.set(errKey, (counters.http_errors_total.get(errKey) ?? 0) + 1)
  }
}

export function setActiveUsers(n) { activeUsers = n }

export function getMetricsText() {
  const lines = []
  lines.push('# HELP http_requests_total Total HTTP requests')
  lines.push('# TYPE http_requests_total counter')
  for (const [key, count] of counters.http_requests_total) {
    const [method, path] = key.split('|')
    lines.push(`http_requests_total{method="${method}",path="${path}"} ${count}`)
  }
  lines.push('# HELP http_errors_total Total HTTP errors')
  lines.push('# TYPE http_errors_total counter')
  for (const [key, count] of counters.http_errors_total) {
    const [status, path] = key.split('|')
    lines.push(`http_errors_total{status="${status}",path="${path}"} ${count}`)
  }
  lines.push('# HELP active_users_total Currently active users')
  lines.push('# TYPE active_users_total gauge')
  lines.push(`active_users_total ${activeUsers}`)
  return lines.join('\n') + '\n'
}

export function metricsMiddleware(req, res, next) {
  res.on('finish', () => recordRequest(req.method, req.path, res.statusCode))
  next()
}
