/**
 * Cron-like scheduler for background jobs.
 * Uses setInterval; in production replace with BullMQ + Redis.
 */
const jobs = new Map()
let jobIdCounter = 0

export function scheduleJob(name, intervalMs, fn) {
  const id = ++jobIdCounter
  const timer = setInterval(async () => {
    try {
      await fn()
    } catch (err) {
      console.error(`[scheduler] Job ${name} failed:`, err.message)
    }
  }, intervalMs)
  jobs.set(id, { id, name, intervalMs, fn, startedAt: new Date().toISOString() })
  console.log(`[scheduler] Registered job "${name}" every ${intervalMs}ms (id=${id})`)
  return id
}

export function cancelJob(id) {
  const job = jobs.get(id)
  if (!job) return false
  clearInterval(job.timer)
  jobs.delete(id)
  return true
}

export function listJobs() {
  return Array.from(jobs.values()).map(({ id, name, intervalMs, startedAt }) => ({
    id, name, intervalMs, startedAt,
  }))
}
