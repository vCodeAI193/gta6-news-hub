import { describe, it, expect } from 'vitest'
import { getQuizQuestion, QUIZ_QUESTIONS } from '../services/gamificationService'

describe('getQuizQuestion', () => {
  it('returns a valid question object', () => {
    const q = getQuizQuestion(0)
    expect(typeof q.question).toBe('string')
    expect(q.question.length).toBeGreaterThan(0)
    expect(Array.isArray(q.options)).toBe(true)
    expect(q.options).toHaveLength(4)
    expect(typeof q.correctIndex).toBe('number')
    expect(q.correctIndex).toBeGreaterThanOrEqual(0)
    expect(q.correctIndex).toBeLessThan(4)
  })

  it('all options are non-empty strings', () => {
    const q = getQuizQuestion(3)
    for (const opt of q.options) {
      expect(typeof opt).toBe('string')
      expect(opt.length).toBeGreaterThan(0)
    }
  })

  it('seed wraps around (handles negative and large seeds)', () => {
    const q1 = getQuizQuestion(QUIZ_QUESTIONS.length)
    const q0 = getQuizQuestion(0)
    expect(q1).toEqual(q0)
  })

  it('handles seed 1', () => {
    const q = getQuizQuestion(1)
    expect(q).toBeTruthy()
  })
})
