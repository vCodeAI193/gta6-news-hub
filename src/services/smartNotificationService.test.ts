import { describe, it, expect, beforeEach, vi } from 'vitest'
import { smartNotificationService } from './smartNotificationService'

describe('SmartNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should assign variant deterministically for same user', () => {
    const result1 = smartNotificationService.assignVariant(
      'user-123',
      'campaign-1',
      2,
      50
    )
    const result2 = smartNotificationService.assignVariant(
      'user-123',
      'campaign-1',
      2,
      50
    )

    expect(result1).toEqual(result2)
  })

  it('should assign different users to different variants with control ratio', () => {
    const assignments: boolean[] = []

    for (let i = 0; i < 100; i++) {
      const result = smartNotificationService.assignVariant(
        `user-${i}`,
        'campaign-1',
        2,
        50
      )
      assignments.push(result.isControl)
    }

    const controlCount = assignments.filter(x => x).length
    const variantCount = assignments.filter(x => !x).length

    expect(controlCount).toBeGreaterThan(20)
    expect(controlCount).toBeLessThan(80)
    expect(variantCount).toBeGreaterThan(20)
    expect(variantCount).toBeLessThan(80)
  })

  it('should calculate statistical significance correctly', () => {
    const result = smartNotificationService.calculateSignificance(
      50,
      1000,
      60,
      1000
    )

    expect(result).toHaveProperty('pValue')
    expect(result).toHaveProperty('isSignificant')
    expect(result.pValue).toBeGreaterThanOrEqual(0)
    expect(result.pValue).toBeLessThanOrEqual(1)
  })

  it('should require minimum sample size for significance', () => {
    const result = smartNotificationService.calculateSignificance(
      10,
      50,
      15,
      50
    )

    expect(result.isSignificant).toBe(false)
  })

  it('should detect significant difference with large samples', () => {
    const result = smartNotificationService.calculateSignificance(
      100,
      10000,
      150,
      10000
    )

    expect(result.pValue).toBeLessThan(0.05)
    expect(result.isSignificant).toBe(true)
  })

  it('should validate campaign has at least 2 variants', async () => {
    await expect(
      smartNotificationService.createCampaign({
        title: 'Test',
        audience: 'all',
        variants: [{ id: 'v1', title: 'Title', body: 'Body' }],
        controlGroupPct: 50,
        startTime: Date.now(),
        status: 'draft',
      })
    ).rejects.toThrow('Campaign requires at least 2 variants')
  })
})
