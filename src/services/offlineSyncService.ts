/**
 * Offline Sync Service
 * Manages local-first architecture with IndexedDB and background sync
 */

export interface CacheConfig {
  maxAge: number // milliseconds
  maxSize: number // bytes
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate'
}

export interface SyncQueueItem {
  id: string
  type: 'POST' | 'PUT' | 'DELETE'
  url: string
  data?: Record<string, unknown>
  timestamp: number
  retries: number
  lastError?: string
}

export interface OfflineMetadata {
  lastSync: number
  cacheSize: number
  isOnline: boolean
  pendingActions: number
  databaseVersion: string
}

const DB_NAME = 'gta6-news-hub'
const DB_VERSION = 1
const STORES = {
  articles: 'articles',
  syncQueue: 'syncQueue',
  metadata: 'metadata',
  searches: 'searches',
}

class OfflineSyncService {
  private db: IDBDatabase | null = null
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  private syncInProgress = false

  async initialize(): Promise<void> {
    if (!this.isIndexedDBSupported()) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.setupEventListeners()
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create article store
        if (!db.objectStoreNames.contains(STORES.articles)) {
          const articleStore = db.createObjectStore(STORES.articles, { keyPath: 'id' })
          articleStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(STORES.syncQueue)) {
          db.createObjectStore(STORES.syncQueue, { keyPath: 'id' })
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(STORES.metadata)) {
          db.createObjectStore(STORES.metadata, { keyPath: 'key' })
        }

        // Create search history store
        if (!db.objectStoreNames.contains(STORES.searches)) {
          db.createObjectStore(STORES.searches, { keyPath: 'id' })
        }
      }
    })
  }

  /**
   * Cache article for offline reading
   */
  async cacheArticle(article: { id: string; title: string; content: string; timestamp: number }): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORES.articles], 'readwrite')
      const store = tx.objectStore(STORES.articles)
      const request = store.put(article)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * Get cached article
   */
  async getCachedArticle(articleId: string): Promise<Record<string, unknown> | null> {
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORES.articles], 'readonly')
      const store = tx.objectStore(STORES.articles)
      const request = store.get(articleId)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve((request.result as Record<string, unknown> | undefined) || null)
    })
  }

  /**
   * Queue an action for offline sync
   */
  async queueAction(
    type: 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: Record<string, unknown>
  ): Promise<string> {
    if (!this.db) throw new Error('Database not initialized')

    const item: SyncQueueItem = {
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      url,
      data,
      timestamp: Date.now(),
      retries: 0,
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORES.syncQueue], 'readwrite')
      const store = tx.objectStore(STORES.syncQueue)
      const request = store.add(item)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(item.id)
    })
  }

  /**
   * Get pending actions
   */
  async getPendingActions(): Promise<SyncQueueItem[]> {
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORES.syncQueue], 'readonly')
      const store = tx.objectStore(STORES.syncQueue)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * Sync pending actions with server
   */
  async syncPendingActions(): Promise<{ succeeded: number; failed: number }> {
    if (this.syncInProgress || !this.isOnline) {
      return { succeeded: 0, failed: 0 }
    }

    this.syncInProgress = true
    let succeeded = 0
    let failed = 0

    try {
      const pending = await this.getPendingActions()

      for (const action of pending) {
        try {
          const response = await fetch(action.url, {
            method: action.type,
            headers: { 'Content-Type': 'application/json' },
            body: action.data ? JSON.stringify(action.data) : undefined,
          })

          if (response.ok) {
            await this.removeSyncQueueItem(action.id)
            succeeded++
          } else {
            await this.updateSyncQueueItem(action.id, {
              lastError: `HTTP ${response.status}`,
              retries: action.retries + 1,
            })
            failed++
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          await this.updateSyncQueueItem(action.id, {
            lastError: message,
            retries: action.retries + 1,
          })
          failed++
        }
      }
    } finally {
      this.syncInProgress = false
    }

    return { succeeded, failed }
  }

  /**
   * Clear old cached articles (older than 30 days)
   */
  async cleanupOldCache(maxAgeDays: number = 30): Promise<number> {
    if (!this.db) return 0

    const cutoffTime = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
    let deleted = 0

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORES.articles], 'readwrite')
      const store = tx.objectStore(STORES.articles)
      const index = store.index('timestamp')
      const range = IDBKeyRange.upperBound(cutoffTime)
      const request = index.openCursor(range)

      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          deleted++
          cursor.continue()
        } else {
          resolve(deleted)
        }
      }
    })
  }

  /**
   * Get offline metadata
   */
  async getMetadata(): Promise<OfflineMetadata> {
    if (!this.db) {
      return {
        lastSync: 0,
        cacheSize: 0,
        isOnline: this.isOnline,
        pendingActions: 0,
        databaseVersion: DB_VERSION.toString(),
      }
    }

    const pending = await this.getPendingActions()
    const articles = await this.getAllCachedArticles()

    const cacheSize = articles.reduce((sum, article) => {
      return sum + new Blob([JSON.stringify(article)]).size
    }, 0)

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORES.metadata], 'readonly')
      const store = tx.objectStore(STORES.metadata)
      const request = store.get('lastSync')

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        resolve({
          lastSync: request.result?.value || 0,
          cacheSize,
          isOnline: this.isOnline,
          pendingActions: pending.length,
          databaseVersion: DB_VERSION.toString(),
        })
      }
    })
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncPendingActions()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  private async removeSyncQueueItem(id: string): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORES.syncQueue], 'readwrite')
      const store = tx.objectStore(STORES.syncQueue)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  private async updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORES.syncQueue], 'readwrite')
      const store = tx.objectStore(STORES.syncQueue)
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const item = getRequest.result
        if (item) {
          const updated = { ...item, ...updates }
          const putRequest = store.put(updated)
          putRequest.onerror = () => reject(putRequest.error)
          putRequest.onsuccess = () => resolve()
        } else {
          resolve()
        }
      }

      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  private async getAllCachedArticles(): Promise<Record<string, unknown>[]> {
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORES.articles], 'readonly')
      const store = tx.objectStore(STORES.articles)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result as Record<string, unknown>[])
    })
  }

  private isIndexedDBSupported(): boolean {
    if (typeof window === 'undefined') return false
    return !!(window.indexedDB && window.IDBKeyRange)
  }
}

export const offlineSyncService = new OfflineSyncService()
