import { describe, expect, it } from 'vitest'
import { axe } from 'jest-axe'
import { ArticleCard } from '../components/ArticleCard'
import { Footer } from '../components/Footer'
import { Pagination } from '../components/Pagination'
import { ReliabilityBadge } from '../components/ReliabilityBadge'
import { articles } from '../data/articles'
import { renderWithProviders } from './utils'

/**
 * Accessibility-Audit (WCAG via axe). Deckt mehrere Kernkomponenten ab, damit
 * Regressionen bei Rollen/Labels/Alternativtexten auffallen.
 */
describe('Accessibility-Audit (axe)', () => {
  it('ArticleCard ohne Verstöße', async () => {
    const { container } = renderWithProviders(<ArticleCard article={articles[0]} />)
    expect((await axe(container)).violations).toEqual([])
  })

  it('Footer ohne Verstöße', async () => {
    const { container } = renderWithProviders(<Footer />)
    expect((await axe(container)).violations).toEqual([])
  })

  it('Pagination ohne Verstöße', async () => {
    const { container } = renderWithProviders(
      <Pagination page={2} pageCount={5} onChange={() => {}} />,
    )
    expect((await axe(container)).violations).toEqual([])
  })

  it('ReliabilityBadge ohne Verstöße', async () => {
    const { container } = renderWithProviders(<ReliabilityBadge reliability="rumor" />)
    expect((await axe(container)).violations).toEqual([])
  })
})
