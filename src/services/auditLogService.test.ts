import { describe, it, expect, vi, beforeEach } from 'vitest'
import { auditLogService } from './auditLogService'

describe('AuditLogService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('logAction', () => {
    it('should log an action', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '127.0.0.1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'log-1',
            userId: 'user1',
            action: 'login',
            status: 'success',
          }),
        })

      const result = await auditLogService.logAction('user1', 'login')
      expect(result.action).toBe('login')
      expect(result.status).toBe('success')
    })

    it('should log action with options', async () => {
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ip: '127.0.0.1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'log-1',
            action: 'password_changed',
            severity: 'high',
          }),
        })

      await auditLogService.logAction('user1', 'password_changed', {
        severity: 'high',
        status: 'success',
      })

      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('getUserAuditLogs', () => {
    it('should get user audit logs', async () => {
      const logs = [
        { id: '1', userId: 'user1', action: 'login' as const, status: 'success' as const, timestamp: 1000, ipAddress: '127.0.0.1', severity: 'low' as const },
        { id: '2', userId: 'user1', action: 'logout' as const, status: 'success' as const, timestamp: 2000, ipAddress: '127.0.0.1', severity: 'low' as const },
      ]

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => logs,
      })

      const result = await auditLogService.getUserAuditLogs('user1')
      expect(result).toHaveLength(2)
      expect(result[0].action).toBe('login')
    })

    it('should filter by action', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      await auditLogService.getUserAuditLogs('user1', { action: 'login' })
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('action=login'))
    })
  })

  describe('getAllAuditLogs', () => {
    it('should get all audit logs', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const result = await auditLogService.getAllAuditLogs()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should filter by severity', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      await auditLogService.getAllAuditLogs({ severity: 'critical' })
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('severity=critical'))
    })
  })

  describe('getAuditLog', () => {
    it('should get specific audit log', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'log-1', action: 'login' }),
      })

      const log = await auditLogService.getAuditLog('log-1')
      expect(log?.id).toBe('log-1')
    })

    it('should return null on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const log = await auditLogService.getAuditLog('log-1')
      expect(log).toBeNull()
    })
  })

  describe('searchAuditLogs', () => {
    it('should search audit logs', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: '1', action: 'login' }],
      })

      const result = await auditLogService.searchAuditLogs('user1')
      expect(result).toHaveLength(1)
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('q=user1'))
    })
  })

  describe('getAuditStats', () => {
    it('should get audit statistics', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalActions: 100,
          successCount: 95,
          failureCount: 5,
          byAction: { login: 50 },
        }),
      })

      const stats = await auditLogService.getAuditStats()
      expect(stats?.totalActions).toBe(100)
      expect(stats?.successCount).toBe(95)
    })
  })

  describe('getSuspiciousActivities', () => {
    it('should get suspicious activities', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { userId: 'user2', reason: 'Multiple failed logins', count: 5, lastSeen: 1000, severity: 'high' },
        ],
      })

      const suspicious = await auditLogService.getSuspiciousActivities()
      expect(suspicious).toHaveLength(1)
      expect(suspicious[0].reason).toContain('failed')
    })

    it('should return empty array on error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false })

      const suspicious = await auditLogService.getSuspiciousActivities()
      expect(suspicious).toEqual([])
    })
  })

  describe('generateAuditReport', () => {
    it('should generate audit report', async () => {
      const blob = new Blob(['report'], { type: 'application/pdf' })

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        blob: async () => blob,
      })

      const result = await auditLogService.generateAuditReport('pdf')
      expect(result).toBeInstanceOf(Blob)
    })
  })

  describe('deleteOldLogs', () => {
    it('should delete old audit logs', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ deletedCount: 100 }),
      })

      const deleted = await auditLogService.deleteOldLogs(90)
      expect(deleted).toBe(100)
    })
  })
})
