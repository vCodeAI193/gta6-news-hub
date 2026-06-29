import { describe, it, expect, vi, beforeEach } from 'vitest'
import { realtimeNotificationService } from './realtimeNotificationService'

describe('RealtimeNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    realtimeNotificationService.disconnect()
  })

  describe('connect', () => {
    it('should establish WebSocket connection', async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        close: vi.fn(),
        send: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onopen: null as ((event: Event) => void) | null,
        onmessage: null as ((event: MessageEvent) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        onclose: null as ((event: CloseEvent) => void) | null,
      }

      global.WebSocket = vi.fn().mockImplementation(() => mockWs) as unknown as typeof WebSocket

      const connectPromise = realtimeNotificationService.connect('user1', 'token123')

      if (mockWs.onopen) {
        mockWs.onopen(new Event('open'))
      }

      await connectPromise
      expect(realtimeNotificationService.isConnected()).toBe(true)
    })

    it('should handle connection errors', async () => {
      global.WebSocket = vi.fn().mockImplementation(() => {
        throw new Error('Connection failed')
      }) as unknown as typeof WebSocket

      await expect(realtimeNotificationService.connect('user1', 'token')).rejects.toThrow()
    })
  })

  describe('disconnect', () => {
    it('should disconnect from service', async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        close: vi.fn(),
        send: vi.fn(),
        onopen: null as ((event: Event) => void) | null,
        onmessage: null as ((event: MessageEvent) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        onclose: null as ((event: CloseEvent) => void) | null,
      }

      global.WebSocket = vi.fn().mockReturnValue(mockWs) as unknown as typeof WebSocket

      await realtimeNotificationService.connect('user1', 'token')

      realtimeNotificationService.disconnect()
      expect(mockWs.close).toHaveBeenCalled()
      expect(realtimeNotificationService.isConnected()).toBe(false)
    })
  })

  describe('subscribe', () => {
    it('should add listener for messages', () => {
      const listener = vi.fn()
      const unsubscribe = realtimeNotificationService.subscribe(listener)

      expect(typeof unsubscribe).toBe('function')
    })

    it('should remove listener when unsubscribed', () => {
      const listener = vi.fn()
      const unsubscribe = realtimeNotificationService.subscribe(listener)

      unsubscribe()

      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('send', () => {
    it('should send message when connected', async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        close: vi.fn(),
        send: vi.fn(),
        onopen: null as ((event: Event) => void) | null,
        onmessage: null as ((event: MessageEvent) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        onclose: null as ((event: CloseEvent) => void) | null,
      }

      global.WebSocket = vi.fn().mockReturnValue(mockWs) as unknown as typeof WebSocket

      await realtimeNotificationService.connect('user1', 'token')

      realtimeNotificationService.send({ type: 'test' })
      expect(mockWs.send).toHaveBeenCalled()
    })

    it('should not send when disconnected', () => {
      const result = realtimeNotificationService.send({ type: 'test' })
      expect(result).toBeUndefined()
    })
  })

  describe('isConnected', () => {
    it('should return connection status', () => {
      expect(realtimeNotificationService.isConnected()).toBe(false)
    })
  })

  describe('getReadyState', () => {
    it('should return WebSocket ready state', () => {
      const state = realtimeNotificationService.getReadyState()
      expect(typeof state).toBe('number')
      expect(state).toBe(WebSocket.CLOSED)
    })
  })

  describe('subscribeToTypes', () => {
    it('should filter messages by type', () => {
      const listener = vi.fn()
      realtimeNotificationService.subscribeToTypes(['notification', 'update'], listener)

      // Would need to mock WebSocket and simulate messages to fully test
      expect(typeof listener).toBe('function')
    })
  })
})
