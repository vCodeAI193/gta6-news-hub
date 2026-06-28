import { useEffect, useState, useCallback } from 'react'
import { useI18n } from '../i18n/I18nContext'

interface SearchHistoryEntry {
  query: string
  resultsCount: number
  filters?: Record<string, unknown>
  timestamp?: number
  deviceId?: string
}

interface SearchHistorySyncProps {
  userId?: string
  onSyncComplete?: (count: number) => void
  autoSync?: boolean
}

const STORAGE_KEY = 'gta6_search_history'
const DEVICE_ID_KEY = 'gta6_device_id'

/**
 * Generate or retrieve unique device ID from localStorage
 */
export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

/**
 * Add search to local history (localStorage)
 */
export function addToSearchHistory(query: string, resultsCount = 0, filters: Record<string, unknown> = {}) {
  if (!query || query.length < 2) return

  const history = getLocalSearchHistory()
  const deviceId = getOrCreateDeviceId()

  // Check if entry already exists
  const existingIndex = history.findIndex((h) => h.query === query && h.deviceId === deviceId)

  const entry: SearchHistoryEntry = {
    query,
    resultsCount,
    filters,
    timestamp: Date.now(),
    deviceId,
  }

  if (existingIndex >= 0) {
    // Move to end (most recent)
    history.splice(existingIndex, 1)
  }

  history.push(entry)

  // Keep only last 50 entries
  if (history.length > 50) {
    history.shift()
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

/**
 * Get search history from localStorage
 */
export function getLocalSearchHistory(): SearchHistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Clear search history from localStorage
 */
export function clearLocalSearchHistory() {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Sync local history to backend
 */
async function syncToBackend(userId: string, history: SearchHistoryEntry[]): Promise<{ synced: number; skipped: number }> {
  try {
    const response = await fetch('/api/search/history/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history }),
      credentials: 'include',
    })

    if (!response.ok) throw new Error(`Sync failed: ${response.statusText}`)
    return response.json()
  } catch (err) {
    console.error('Search history sync failed:', err)
    return { synced: 0, skipped: history.length }
  }
}


/**
 * Component for syncing search history across devices
 */
export function SearchHistorySync({ userId, onSyncComplete, autoSync = true }: SearchHistorySyncProps) {
  const { t } = useI18n()
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<string>('')

  const performSync = useCallback(async () => {
    if (!userId) {
      setSyncStatus(t('search.syncRequiresAuth') || 'Sign in to sync search history')
      return
    }

    setIsSyncing(true)
    setSyncStatus(t('search.syncing') || 'Syncing...')

    try {
      const localHistory = getLocalSearchHistory()
      const result = await syncToBackend(userId, localHistory)

      setLastSync(new Date())
      setSyncStatus(`${result.synced} synced, ${result.skipped} skipped`)

      if (onSyncComplete) {
        onSyncComplete(result.synced)
      }
    } catch (err) {
      setSyncStatus(t('search.syncError') || 'Sync failed')
      console.error(err)
    } finally {
      setIsSyncing(false)
    }
  }, [userId, onSyncComplete, t])

  // Auto-sync on mount if enabled and user is authenticated
  useEffect(() => {
    if (autoSync && userId && !isSyncing) {
      performSync()
    }
  }, [autoSync, userId, isSyncing, performSync])

  return (
    <div className="search-history-sync" role="status" aria-live="polite">
      {isSyncing && <span>{t('search.syncing')}</span>}
      {lastSync && <span className="search-history-sync__last">{`Last synced: ${lastSync.toLocaleTimeString()}`}</span>}
      {syncStatus && !isSyncing && <span className="search-history-sync__status">{syncStatus}</span>}
    </div>
  )
}

/**
 * Hook for managing search history
 */
export function useSearchHistory() {
  const [localHistory, setLocalHistory] = useState<SearchHistoryEntry[]>(getLocalSearchHistory())

  const addSearch = useCallback((query: string, resultsCount = 0, filters: Record<string, unknown> = {}) => {
    addToSearchHistory(query, resultsCount, filters)
    setLocalHistory(getLocalSearchHistory())
  }, [])

  const clear = useCallback(() => {
    clearLocalSearchHistory()
    setLocalHistory([])
  }, [])

  return {
    history: localHistory,
    addSearch,
    clear,
    getLocal: getLocalSearchHistory,
  }
}
