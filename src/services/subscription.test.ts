import { describe, it, expect, beforeEach } from 'vitest'
import { PLANS, upgradePlan, cancelSubscription, getSubscription, applyCoupon, applyGiftCode, isPremium, hasPro, getPaymentHistory } from './subscriptionService'

beforeEach(() => {
  localStorage.clear()
})

describe('PLANS', () => {
  it('has 3 plans', () => {
    expect(PLANS).toHaveLength(3)
  })
  it('free plan costs 0', () => {
    expect(PLANS.find(p => p.id === 'free')?.price).toBe(0)
  })
  it('pro plan costs more than plus', () => {
    const plus = PLANS.find(p => p.id === 'plus')!
    const pro = PLANS.find(p => p.id === 'pro')!
    expect(pro.price).toBeGreaterThan(plus.price)
  })
})

describe('upgradePlan', () => {
  it('upgrades to plus', () => {
    const sub = upgradePlan('plus')
    expect(sub.planId).toBe('plus')
  })
  it('adds a payment record', () => {
    upgradePlan('pro')
    expect(getPaymentHistory()).toHaveLength(1)
  })
})

describe('isPremium / hasPro', () => {
  it('free plan is not premium', () => {
    expect(isPremium()).toBe(false)
  })
  it('plus plan is premium', () => {
    upgradePlan('plus')
    expect(isPremium()).toBe(true)
    expect(hasPro()).toBe(false)
  })
  it('pro plan hasPro', () => {
    upgradePlan('pro')
    expect(hasPro()).toBe(true)
  })
})

describe('cancelSubscription', () => {
  it('reverts to free', () => {
    upgradePlan('plus')
    cancelSubscription()
    expect(getSubscription().planId).toBe('free')
  })
})

describe('applyCoupon', () => {
  it('returns discount for valid code', () => {
    expect(applyCoupon('LAUNCH20')).toBe(0.20)
  })
  it('returns 0 for invalid code', () => {
    expect(applyCoupon('INVALID')).toBe(0)
  })
  it('is case insensitive', () => {
    expect(applyCoupon('launch20')).toBe(0.20)
  })
})

describe('applyGiftCode', () => {
  it('activates plus for GTA6- code', () => {
    const result = applyGiftCode('GTA6-ABCD')
    expect(result).toBe(true)
    expect(isPremium()).toBe(true)
  })
  it('rejects invalid code', () => {
    expect(applyGiftCode('INVALID')).toBe(false)
  })
})
