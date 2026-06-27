import { describe, expect, it } from 'vitest'
import { axe } from 'jest-axe'
import { ArticleCard } from '../components/ArticleCard'
import { articles } from '../data/articles'
import { renderWithProviders } from './utils'

describe('Accessibility-Audit (axe)', () => {
  it('ArticleCard hat keine offensichtlichen A11y-Verstöße', async () => {
    const { container } = renderWithProviders(<ArticleCard article={articles[0]} />)
    const results = await axe(container)
    expect(results.violations).toEqual([])
  })
})
