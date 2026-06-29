/**
 * Realtime Notification Service
 * Handles WebSocket-based real-time notifications and updates
 */

export interface RealtimeMessage {
  type: 'notification' | 'update' | 'heartbeat' | 'error'
  data?: Record<string, unknown>
  timestamp: number
}

export interface RealtimeListener {
  (message: RealtimeMessage): void
}

class RealtimeNotificationService {
  private ws: WebSocket | null = null
  private url: string = ''
  private userId: string = ''
  private listeners: Set<RealtimeListener> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  /**
   * Connect to realtime notification service
   */
  async connect(userId: string, token: string): Promise<void> {
    this.userId = userId
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    this.url = `${protocol}//${window.location.host}/api/notifications/realtime?userId=${userId}&token=${token}`

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: RealtimeMessage = JSON.parse(event.data)
            this.notifyListeners(message)
          } catch (error) {
            console.error('Failed to parse realtime message:', error)
          }
        }

        this.ws.onerror = () => {
          reject(new Error('WebSocket connection failed'))
        }

        this.ws.onclose = () => {
          this.attemptReconnect(userId, token)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Disconnect from realtime service
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.listeners.clear()
  }

  /**
   * Subscribe to realtime messages
   */
  subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Send message to server
   */
  send(message: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected')
      return
    }

    this.ws.send(JSON.stringify(message))
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  /**
   * Get readiness state
   */
  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(userId: string, token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    setTimeout(() => {
      this.connect(userId, token).catch(() => {
        // Retry will be attempted by onclose handler
      })
    }, delay)
  }

  /**
   * Notify all listeners of new message
   */
  private notifyListeners(message: RealtimeMessage): void {
    this.listeners.forEach((listener) => {
      try {
        listener(message)
      } catch (error) {
        console.error('Error in notification listener:', error)
      }
    })
  }

  /**
   * Batch subscribe to multiple notification types
   */
  subscribeToTypes(
    types: string[],
    listener: (type: string, data: unknown) => void
  ): () => void {
    const wrappedListener: RealtimeListener = (message) => {
      if (types.includes(message.type)) {
        listener(message.type, message.data)
      }
    }

    return this.subscribe(wrappedListener)
  }
}

export const realtimeNotificationService = new RealtimeNotificationService()
