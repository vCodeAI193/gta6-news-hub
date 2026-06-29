/**
 * Push Campaign Service
 * Manages creation and execution of notification campaigns
 */

export interface CampaignTarget {
  userIds?: string[]
  segment?: string
  criteria?: Record<string, unknown>
}

export interface CampaignSchedule {
  type: 'immediate' | 'scheduled' | 'recurring'
  startTime?: number
  endTime?: number
  recurrence?: 'daily' | 'weekly' | 'monthly'
  timezone?: string
}

export interface PushCampaign {
  id: string
  title: string
  message: string
  imageUrl?: string
  actionUrl?: string
  target: CampaignTarget
  schedule: CampaignSchedule
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'cancelled'
  createdBy: string
  createdAt: number
  updatedAt: number
  stats?: CampaignStats
}

export interface CampaignStats {
  targetCount: number
  sentCount: number
  openCount: number
  clickCount: number
  conversionCount: number
  openRate: number
  clickRate: number
  conversionRate: number
}

class PushCampaignService {
  /**
   * Create a new campaign
   */
  async createCampaign(campaign: Omit<PushCampaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<PushCampaign> {
    const response = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaign),
    })

    if (!response.ok) throw new Error('Failed to create campaign')
    return response.json()
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string): Promise<PushCampaign | null> {
    const response = await fetch(`/api/campaigns/${campaignId}`)
    if (!response.ok) return null
    return response.json()
  }

  /**
   * List all campaigns
   */
  async listCampaigns(options?: {
    status?: string
    limit?: number
    offset?: number
    sort?: 'newest' | 'oldest'
  }): Promise<PushCampaign[]> {
    const params = new URLSearchParams()
    if (options?.status) params.append('status', options.status)
    if (options?.limit) params.append('limit', String(options.limit))
    if (options?.offset) params.append('offset', String(options.offset))
    if (options?.sort) params.append('sort', options.sort)

    const response = await fetch(`/api/campaigns?${params}`)
    if (!response.ok) return []
    return response.json()
  }

  /**
   * Update campaign
   */
  async updateCampaign(campaignId: string, updates: Partial<PushCampaign>): Promise<PushCampaign> {
    const response = await fetch(`/api/campaigns/${campaignId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })

    if (!response.ok) throw new Error('Failed to update campaign')
    return response.json()
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string): Promise<void> {
    const response = await fetch(`/api/campaigns/${campaignId}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to delete campaign')
  }

  /**
   * Launch campaign
   */
  async launchCampaign(campaignId: string): Promise<PushCampaign> {
    const response = await fetch(`/api/campaigns/${campaignId}/launch`, {
      method: 'POST',
    })

    if (!response.ok) throw new Error('Failed to launch campaign')
    return response.json()
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<PushCampaign> {
    const response = await fetch(`/api/campaigns/${campaignId}/pause`, {
      method: 'POST',
    })

    if (!response.ok) throw new Error('Failed to pause campaign')
    return response.json()
  }

  /**
   * Resume campaign
   */
  async resumeCampaign(campaignId: string): Promise<PushCampaign> {
    const response = await fetch(`/api/campaigns/${campaignId}/resume`, {
      method: 'POST',
    })

    if (!response.ok) throw new Error('Failed to resume campaign')
    return response.json()
  }

  /**
   * Cancel campaign
   */
  async cancelCampaign(campaignId: string): Promise<PushCampaign> {
    const response = await fetch(`/api/campaigns/${campaignId}/cancel`, {
      method: 'POST',
    })

    if (!response.ok) throw new Error('Failed to cancel campaign')
    return response.json()
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: string): Promise<CampaignStats | null> {
    const response = await fetch(`/api/campaigns/${campaignId}/stats`)
    if (!response.ok) return null
    return response.json()
  }

  /**
   * Get detailed campaign performance
   */
  async getCampaignPerformance(
    campaignId: string,
    options?: { groupBy?: 'hour' | 'day'; limit?: number }
  ): Promise<Array<{ timestamp: number; opens: number; clicks: number; conversions: number }>> {
    const params = new URLSearchParams()
    if (options?.groupBy) params.append('groupBy', options.groupBy)
    if (options?.limit) params.append('limit', String(options.limit))

    const response = await fetch(`/api/campaigns/${campaignId}/performance?${params}`)
    if (!response.ok) return []
    return response.json()
  }

  /**
   * Get user segment
   */
  async getUserSegment(segmentName: string): Promise<{ id: string; name: string; userCount: number } | null> {
    const response = await fetch(`/api/campaigns/segments/${segmentName}`)
    if (!response.ok) return null
    return response.json()
  }

  /**
   * List available segments
   */
  async listSegments(): Promise<Array<{ id: string; name: string; userCount: number }>> {
    const response = await fetch('/api/campaigns/segments')
    if (!response.ok) return []
    return response.json()
  }

  /**
   * Estimate campaign reach
   */
  async estimateReach(target: CampaignTarget): Promise<{ estimatedUsers: number; confidence: number }> {
    const response = await fetch('/api/campaigns/estimate-reach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(target),
    })

    if (!response.ok) {
      return { estimatedUsers: 0, confidence: 0 }
    }
    return response.json()
  }

  /**
   * Send test notification
   */
  async sendTestNotification(campaignId: string, userIds: string[]): Promise<{ sent: number; failed: number }> {
    const response = await fetch(`/api/campaigns/${campaignId}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds }),
    })

    if (!response.ok) {
      return { sent: 0, failed: userIds.length }
    }
    return response.json()
  }

  /**
   * Clone campaign
   */
  async cloneCampaign(campaignId: string): Promise<PushCampaign> {
    const response = await fetch(`/api/campaigns/${campaignId}/clone`, {
      method: 'POST',
    })

    if (!response.ok) throw new Error('Failed to clone campaign')
    return response.json()
  }
}

export const pushCampaignService = new PushCampaignService()
