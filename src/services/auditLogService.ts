/**
 * Audit Log Service
 * Manages security audit logging and monitoring
 */

export type AuditAction =
  | 'login'
  | 'logout'
  | 'password_changed'
  | 'email_changed'
  | 'permission_granted'
  | 'permission_revoked'
  | 'role_assigned'
  | 'role_removed'
  | 'content_created'
  | 'content_modified'
  | 'content_deleted'
  | 'admin_action'

export interface AuditLogEntry {
  id: string
  userId: string
  action: AuditAction
  resource?: string
  resourceId?: string
  changes?: Record<string, { before: unknown; after: unknown }>
  ipAddress: string
  userAgent?: string
  status: 'success' | 'failure'
  errorMessage?: string
  timestamp: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface AuditLogStats {
  totalActions: number
  successCount: number
  failureCount: number
  byAction: Record<string, number>
  bySeverity: Record<string, number>
}

class AuditLogService {
  /**
   * Log an action
   */
  async logAction(
    userId: string,
    action: AuditAction,
    options?: {
      resource?: string
      resourceId?: string
      changes?: Record<string, { before: unknown; after: unknown }>
      status?: 'success' | 'failure'
      errorMessage?: string
      severity?: 'low' | 'medium' | 'high' | 'critical'
    }
  ): Promise<AuditLogEntry> {
    const ipAddress = await this.getClientIp()

    const entry: Omit<AuditLogEntry, 'id'> = {
      userId,
      action,
      ipAddress,
      userAgent: navigator.userAgent,
      status: options?.status ?? 'success',
      timestamp: Date.now(),
      severity: options?.severity ?? 'low',
      ...(options?.resource && { resource: options.resource }),
      ...(options?.resourceId && { resourceId: options.resourceId }),
      ...(options?.changes && { changes: options.changes }),
      ...(options?.errorMessage && { errorMessage: options.errorMessage }),
    }

    const response = await fetch('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })

    if (!response.ok) throw new Error('Failed to log action')
    return response.json()
  }

  /**
   * Get audit logs for user
   */
  async getUserAuditLogs(
    userId: string,
    options?: {
      limit?: number
      offset?: number
      action?: AuditAction
      fromDate?: number
      toDate?: number
    }
  ): Promise<AuditLogEntry[]> {
    const params = new URLSearchParams()
    if (options?.limit) params.append('limit', String(options.limit))
    if (options?.offset) params.append('offset', String(options.offset))
    if (options?.action) params.append('action', options.action)
    if (options?.fromDate) params.append('from', String(options.fromDate))
    if (options?.toDate) params.append('to', String(options.toDate))

    const response = await fetch(`/api/audit-logs/user/${userId}?${params}`)
    if (!response.ok) return []
    return response.json()
  }

  /**
   * Get all audit logs (admin only)
   */
  async getAllAuditLogs(options?: {
    limit?: number
    offset?: number
    severity?: string
    status?: 'success' | 'failure'
    fromDate?: number
    toDate?: number
  }): Promise<AuditLogEntry[]> {
    const params = new URLSearchParams()
    if (options?.limit) params.append('limit', String(options.limit))
    if (options?.offset) params.append('offset', String(options.offset))
    if (options?.severity) params.append('severity', options.severity)
    if (options?.status) params.append('status', options.status)
    if (options?.fromDate) params.append('from', String(options.fromDate))
    if (options?.toDate) params.append('to', String(options.toDate))

    const response = await fetch(`/api/audit-logs?${params}`)
    if (!response.ok) return []
    return response.json()
  }

  /**
   * Get audit log by ID
   */
  async getAuditLog(logId: string): Promise<AuditLogEntry | null> {
    const response = await fetch(`/api/audit-logs/${logId}`)
    if (!response.ok) return null
    return response.json()
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(query: string, options?: { limit?: number; offset?: number }): Promise<AuditLogEntry[]> {
    const params = new URLSearchParams({ q: query })
    if (options?.limit) params.append('limit', String(options.limit))
    if (options?.offset) params.append('offset', String(options.offset))

    const response = await fetch(`/api/audit-logs/search?${params}`)
    if (!response.ok) return []
    return response.json()
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(
    options?: { userId?: string; fromDate?: number; toDate?: number }
  ): Promise<AuditLogStats | null> {
    const params = new URLSearchParams()
    if (options?.userId) params.append('userId', options.userId)
    if (options?.fromDate) params.append('from', String(options.fromDate))
    if (options?.toDate) params.append('to', String(options.toDate))

    const response = await fetch(`/api/audit-logs/stats?${params}`)
    if (!response.ok) return null
    return response.json()
  }

  /**
   * Get suspicious activities
   */
  async getSuspiciousActivities(): Promise<
    Array<{
      userId: string
      reason: string
      count: number
      lastSeen: number
      severity: 'low' | 'medium' | 'high' | 'critical'
    }>
  > {
    const response = await fetch('/api/audit-logs/suspicious')
    if (!response.ok) return []
    return response.json()
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(
    format: 'json' | 'csv' | 'pdf',
    options?: { fromDate?: number; toDate?: number; userId?: string }
  ): Promise<Blob> {
    const params = new URLSearchParams({ format })
    if (options?.fromDate) params.append('from', String(options.fromDate))
    if (options?.toDate) params.append('to', String(options.toDate))
    if (options?.userId) params.append('userId', options.userId)

    const response = await fetch(`/api/audit-logs/export?${params}`)
    if (!response.ok) throw new Error('Failed to generate report')
    return response.blob()
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(
    fromDate: number,
    toDate: number,
    format: 'json' | 'csv' = 'json'
  ): Promise<string | Blob> {
    const params = new URLSearchParams({
      from: String(fromDate),
      to: String(toDate),
      format,
    })

    const response = await fetch(`/api/audit-logs/export-range?${params}`)
    if (!response.ok) throw new Error('Failed to export logs')

    if (format === 'json') {
      return response.text()
    } else {
      return response.blob()
    }
  }

  /**
   * Delete old audit logs
   */
  async deleteOldLogs(olderThanDays: number = 90): Promise<number> {
    const response = await fetch(`/api/audit-logs/cleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: olderThanDays }),
    })

    if (!response.ok) throw new Error('Failed to delete old logs')
    const result = await response.json()
    return result.deletedCount ?? 0
  }

  /**
   * Get client IP address
   */
  private async getClientIp(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip || 'unknown'
    } catch {
      return 'unknown'
    }
  }
}

export const auditLogService = new AuditLogService()
