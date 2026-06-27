import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { levelFor, badgesFor } from './gamification.mjs'

describe('levelFor', () => {
  it('startet auf Level 1', () => {
    const l = levelFor(0)
    assert.equal(l.level, 1)
    assert.equal(l.name, 'Rookie')
    assert.equal(l.next.at, 50)
  })

  it('steigt mit Reputation', () => {
    assert.equal(levelFor(150).level, 3)
    assert.equal(levelFor(1000).level, 5)
  })

  it('hat auf höchstem Level kein next', () => {
    assert.equal(levelFor(5000).next, null)
  })
})

describe('badgesFor', () => {
  it('vergibt Erstkommentar-Badge', () => {
    const ids = badgesFor({ commentCount: 1 }).map((b) => b.id)
    assert.ok(ids.includes('first-comment'))
  })

  it('vergibt Reputations- und Beitrags-Badges', () => {
    const ids = badgesFor({ reputation: 200, commentCount: 12, submissionsApproved: 1 }).map((b) => b.id)
    assert.ok(ids.includes('respected'))
    assert.ok(ids.includes('chatty'))
    assert.ok(ids.includes('contributor'))
  })

  it('gibt keine Badges für Neulinge', () => {
    assert.equal(badgesFor({}).length, 0)
  })
})
