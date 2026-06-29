/**
 * Scheduling Service
 * Schedule content publication, notifications, and recurring tasks
 */

export interface ScheduledItem {
  id: string
  type: 'article' | 'video' | 'notification' | 'sync'
  title: string
  description?: string
  scheduledFor: number // timestamp
  status: 'pending' | 'scheduled' | 'published' | 'failed'
  metadata?: Record<string, unknown>
  createdAt: number
  updatedAt: number
}

export interface RecurringSchedule {
  id: string
  itemId: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  interval: number // for custom frequency
  startDate: number
  endDate?: number
  times: number[] // hour of day
  timezone: string
  active: boolean
}

export interface ScheduleConflict {
  items: ScheduledItem[]
  suggestion: number // suggested timestamp
}

class SchedulingService {
  /**
   * Schedule an item for publication
   */
  async scheduleItem(
    type: string,
    title: string,
    scheduledFor: number,
    metadata?: Record<string, unknown>
  ): Promise<ScheduledItem> {
    const item: ScheduledItem = {
      id: `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      title,
      scheduledFor,
      status: 'scheduled',
      metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    try {
      const response = await fetch('/api/scheduling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })

      if (!response.ok) throw new Error('Failed to schedule item')
      return response.json()
    } catch (error) {
      throw error
    }
  }

  /**
   * Get scheduled items
   */
  async getScheduledItems(
    status?: string,
    limit: number = 50
  ): Promise<ScheduledItem[]> {
    try {
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      params.append('limit', limit.toString())

      const response = await fetch(`/api/scheduling?${params.toString()}`)
      if (!response.ok) return []
      const data = await response.json()
      return data.items || []
    } catch {
      return []
    }
  }

  /**
   * Update scheduled item
   */
  async updateScheduledItem(
    itemId: string,
    updates: Partial<ScheduledItem>
  ): Promise<ScheduledItem> {
    const response = await fetch(`/api/scheduling/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!response.ok) throw new Error('Failed to update scheduled item')
    return response.json()
  }

  /**
   * Cancel scheduled item
   */
  async cancelScheduledItem(itemId: string): Promise<void> {
    const response = await fetch(`/api/scheduling/${itemId}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to cancel scheduled item')
  }

  /**
   * Create recurring schedule
   */
  async createRecurringSchedule(
    itemId: string,
    frequency: string,
    startDate: number,
    times: number[],
    timezone: string,
    endDate?: number
  ): Promise<RecurringSchedule> {
    const schedule: RecurringSchedule = {
      id: `recur-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      itemId,
      frequency: frequency as any,
      interval: 1,
      startDate,
      endDate,
      times,
      timezone,
      active: true,
    }

    const response = await fetch('/api/scheduling/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule),
    })

    if (!response.ok) throw new Error('Failed to create recurring schedule')
    return response.json()
  }

  /**
   * Get recurring schedules
   */
  async getRecurringSchedules(itemId?: string): Promise<RecurringSchedule[]> {
    try {
      const url = itemId
        ? `/api/scheduling/recurring?itemId=${itemId}`
        : '/api/scheduling/recurring'
      const response = await fetch(url)
      if (!response.ok) return []
      const data = await response.json()
      return data.schedules || []
    } catch {
      return []
    }
  }

  /**
   * Pause recurring schedule
   */
  async pauseRecurringSchedule(scheduleId: string): Promise<void> {
    const response = await fetch(`/api/scheduling/recurring/${scheduleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    })

    if (!response.ok) throw new Error('Failed to pause schedule')
  }

  /**
   * Resume recurring schedule
   */
  async resumeRecurringSchedule(scheduleId: string): Promise<void> {
    const response = await fetch(`/api/scheduling/recurring/${scheduleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: true }),
    })

    if (!response.ok) throw new Error('Failed to resume schedule')
  }

  /**
   * Check for scheduling conflicts
   */
  async checkConflicts(
    scheduledFor: number,
    window: number = 3600000 // 1 hour default
  ): Promise<ScheduleConflict | null> {
    try {
      const response = await fetch('/api/scheduling/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor, window }),
      })

      if (!response.ok) return null
      return response.json()
    } catch {
      return null
    }
  }

  /**
   * Get analytics for scheduled items
   */
  async getSchedulingAnalytics(
    startDate: number,
    endDate: number
  ): Promise<{
    total: number
    published: number
    failed: number
    pendingCount: number
  }> {
    try {
      const response = await fetch(
        `/api/scheduling/analytics?start=${startDate}&end=${endDate}`
      )
      if (!response.ok) {
        return { total: 0, published: 0, failed: 0, pendingCount: 0 }
      }
      return response.json()
    } catch {
      return { total: 0, published: 0, failed: 0, pendingCount: 0 }
    }
  }

  /**
   * Get next scheduled items
   */
  async getUpcomingSchedules(limit: number = 10): Promise<ScheduledItem[]> {
    try {
      const response = await fetch(`/api/scheduling/upcoming?limit=${limit}`)
      if (!response.ok) return []
      const data = await response.json()
      return data.items || []
    } catch {
      return []
    }
  }

  /**
   * Bulk schedule items
   */
  async bulkSchedule(items: Omit<ScheduledItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<ScheduledItem[]> {
    try {
      const response = await fetch('/api/scheduling/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      if (!response.ok) return []
      const data = await response.json()
      return data.items || []
    } catch {
      return []
    }
  }

  /**
   * Calculate next occurrence for recurring schedule
   */
  calculateNextOccurrence(
    frequency: string,
    times: number[],
    timezone: string,
    baseDate: number = Date.now()
  ): number {
    const date = new Date(baseDate)
    const hour = times[0] || 9

    if (frequency === 'daily') {
      date.setDate(date.getDate() + 1)
      date.setHours(hour, 0, 0, 0)
    } else if (frequency === 'weekly') {
      date.setDate(date.getDate() + 7)
      date.setHours(hour, 0, 0, 0)
    } else if (frequency === 'monthly') {
      date.setMonth(date.getMonth() + 1)
      date.setHours(hour, 0, 0, 0)
    }

    return date.getTime()
  }
}

export const schedulingService = new SchedulingService()
