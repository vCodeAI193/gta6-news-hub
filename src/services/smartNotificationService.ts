/**
 * Smart Notification Service
 * Handles intelligent push timing and A/B tested notification campaigns
 */

export interface NotificationCampaign {
  id: string
  title: string
  audience: 'all' | 'segment'
  variants: NotificationVariant[]
  controlGroupPct: number
  startTime: number
  endTime?: number
  status: 'draft' | 'active' | 'completed'
  metrics?: CampaignMetrics
}

export interface NotificationVariant {
  id: string
  title: string
  body: string
  image?: string
  actionUrl?: string
  actionLabel?: string
  isControl?: boolean
}

export interface CampaignMetrics {
  sent: number
  opened: number
  clicked: number
  conversions: number
  openRate: number
  clickRate: number
  conversionRate: number
}

export interface UserActivityPattern {
  userId: string
  peakHours: number[] // 0-23
  avgEngagementByHour: Record<number, number>
  lastUpdated: number
}

class SmartNotificationService {
  private static readonly MIN_SAMPLE_SIZE = 100
  private static readonly WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000

  /**
   * Get optimal send time for user based on activity patterns
   */
  async getOptimalSendTime(userId: string): Promise<number> {
    try {
      const pattern = await this.getUserActivityPattern(userId)
      if (!pattern || pattern.peakHours.length === 0) {
        // Fallback: evening time (19:00 UTC)
        return this.getNextTimeAt(19)
      }

      // Pick the first peak hour within next 24h
      const peakHour = pattern.peakHours[0]!
      return this.getNextTimeAt(peakHour)
    } catch {
      return this.getNextTimeAt(19)
    }
  }

  /**
   * Analyze user's historical activity to extract peak engagement hours
   */
  async analyzeUserActivity(userId: string): Promise<UserActivityPattern> {
    try {
      const response = await fetch(`/api/users/${userId}/activity/patterns`)
      if (!response.ok) throw new Error('Failed to fetch activity pattern')

      const data = await response.json()
      return {
        userId,
        peakHours: data.peakHours || [19, 20, 21],
        avgEngagementByHour: data.avgEngagementByHour || {},
        lastUpdated: Date.now(),
      }
    } catch {
      // Return default pattern (evening)
      return {
        userId,
        peakHours: [19, 20, 21],
        avgEngagementByHour: {},
        lastUpdated: Date.now(),
      }
    }
  }

  /**
   * Create A/B test notification campaign
   */
  async createCampaign(campaign: Omit<NotificationCampaign, 'id' | 'metrics'>): Promise<NotificationCampaign> {
    if (!campaign.variants || campaign.variants.length < 2) {
      throw new Error('Campaign requires at least 2 variants (control + treatment)')
    }

    const newCampaign: NotificationCampaign = {
      ...campaign,
      id: `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metrics: {
        sent: 0,
        opened: 0,
        clicked: 0,
        conversions: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0,
      },
    }

    const response = await fetch('/api/notifications/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCampaign),
    })

    if (!response.ok) throw new Error('Failed to create campaign')
    return response.json()
  }

  /**
   * Segment users for A/B test
   * Deterministic: same user always gets same variant
   */
  assignVariant(
    userId: string,
    campaignId: string,
    variantCount: number,
    controlGroupPct: number
  ): { variantId: string; isControl: boolean } {
    // Use hash of userId + campaignId for deterministic assignment
    const hash = this.hashString(`${userId}:${campaignId}`)
    const rand = (hash % 100) / 100

    const isControl = rand < (controlGroupPct / 100)
    const variantIndex = isControl ? 0 : Math.floor(rand * (variantCount - 1)) + 1
    const variantId = `variant-${variantIndex}`

    return { variantId, isControl }
  }

  /**
   * Track notification interaction for analytics
   */
  async trackNotificationEvent(
    userId: string,
    campaignId: string,
    variantId: string,
    eventType: 'sent' | 'opened' | 'clicked' | 'converted'
  ): Promise<void> {
    await fetch('/api/notifications/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        campaignId,
        variantId,
        eventType,
        timestamp: Date.now(),
      }),
    })
  }

  /**
   * Get campaign results and determine winner
   */
  async getCampaignResults(campaignId: string): Promise<{
    campaign: NotificationCampaign
    winner: NotificationVariant | null
    pValue: number
    isSignificant: boolean
  }> {
    const response = await fetch(`/api/notifications/campaigns/${campaignId}/results`)
    if (!response.ok) throw new Error('Failed to fetch campaign results')

    const data = await response.json()
    return {
      campaign: data.campaign,
      winner: data.winner,
      pValue: data.pValue,
      isSignificant: data.isSignificant,
    }
  }

  /**
   * Calculate statistical significance (chi-square test)
   */
  calculateSignificance(
    controlOpens: number,
    controlTotal: number,
    variantOpens: number,
    variantTotal: number
  ): { pValue: number; isSignificant: boolean } {
    if (controlTotal < SmartNotificationService.MIN_SAMPLE_SIZE ||
        variantTotal < SmartNotificationService.MIN_SAMPLE_SIZE) {
      return { pValue: 1, isSignificant: false }
    }

    // Simple chi-square test approximation
    const controlRate = controlOpens / controlTotal
    const variantRate = variantOpens / variantTotal
    const pooledRate = (controlOpens + variantOpens) / (controlTotal + variantTotal)

    const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / controlTotal + 1 / variantTotal))
    const zScore = Math.abs((variantRate - controlRate) / se)

    // Two-tailed p-value (approximate)
    const pValue = 2 * (1 - this.normalCDF(zScore))

    return {
      pValue,
      isSignificant: pValue < 0.05,
    }
  }

  private getNextTimeAt(hour: number): number {
    const now = new Date()
    const target = new Date()
    target.setHours(hour, 0, 0, 0)

    if (target <= now) {
      target.setDate(target.getDate() + 1)
    }

    return target.getTime()
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  private normalCDF(z: number): number {
    // Approximate normal CDF using error function
    const t = 1 / (1 + 0.2316419 * Math.abs(z))
    const d = 0.3989423 * Math.exp(-z * z / 2)
    const probability = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
    return z >= 0 ? 1 - probability : probability
  }
}

export const smartNotificationService = new SmartNotificationService()
