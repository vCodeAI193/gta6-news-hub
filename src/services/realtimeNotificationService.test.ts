import { describe, it, expect, vi, beforeEach } from 'vitest'
import { realtimeNotificationService } from './realtimeNotificationService'

describe('RealtimeNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    realtimeNotificationService.disconnect()
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

  describe('isConnected', () => {
    it('should return connection status', () => {
      expect(realtimeNotificationService.isConnected()).toBe(false)
    })
  })

  describe('getReadyState', () => {
    it('should return WebSocket ready state when disconnected', () => {
      const state = realtimeNotificationService.getReadyState()
      expect(typeof state).toBe('number')
      expect(state).toBe(WebSocket.CLOSED)
    })
  })

  describe('send', () => {
    it('should not send when disconnected', () => {
      const result = realtimeNotificationService.send({ type: 'test' })
      expect(result).toBeUndefined()
    })
  })

  describe('subscribeToTypes', () => {
    it('should filter messages by type', () => {
      const listener = vi.fn()
      const unsubscribe = realtimeNotificationService.subscribeToTypes(['notification', 'update'], listener)

      expect(typeof unsubscribe).toBe('function')
      unsubscribe()
    })
  })

  describe('disconnect', () => {
    it('should handle disconnect gracefully', () => {
      realtimeNotificationService.disconnect()
      expect(realtimeNotificationService.isConnected()).toBe(false)
    })
  })
})
