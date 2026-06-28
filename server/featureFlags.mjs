/**
 * Server-side feature flags.
 * Source of truth: JSON file / env variable.
 * Compatible with LaunchDarkly SDK shape (isEnabled / getAllFlags).
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FLAGS_FILE = join(__dirname, '..', 'flags.json')

function loadFlags() {
  if (existsSync(FLAGS_FILE)) {
    try { return JSON.parse(readFileSync(FLAGS_FILE, 'utf8')) } catch { /* fall through */ }
  }
  return {}
}

let flags = loadFlags()

export function isEnabled(flagKey, defaultValue = false) {
  if (Object.hasOwn(flags, flagKey)) return Boolean(flags[flagKey])
  const envKey = `FLAG_${flagKey.toUpperCase().replace(/-/g, '_')}`
  if (process.env[envKey] !== undefined) return process.env[envKey] !== '0'
  return defaultValue
}

export function setFlag(key, value) {
  flags[key] = value
}

export function getAllFlags() {
  return { ...flags }
}

export function reloadFlags() {
  flags = loadFlags()
}
