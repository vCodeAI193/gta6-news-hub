import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('<App />', () => {
  it('renders the hero and the full feed by default', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /grand theft auto vi/i }),
    ).toBeInTheDocument()
    // 8 sample articles ship with the app.
    expect(screen.getByText('8 Artikel')).toBeInTheDocument()
  })

  it('filters articles by category', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Leaks' }))
    expect(screen.getByText('2 Artikel')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Map zeigt Bundesstaat Leonida/i }),
    ).toBeInTheDocument()
  })

  it('searches articles by free text', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(
      screen.getByRole('searchbox', { name: /durchsuchen/i }),
      'soundtrack',
    )
    expect(screen.getByText('1 Artikel')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Radiosender-Partner/i }),
    ).toBeInTheDocument()
  })

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(
      screen.getByRole('searchbox', { name: /durchsuchen/i }),
      'xyzzy-nichts',
    )
    expect(screen.getByText('Keine Treffer')).toBeInTheDocument()
  })

  it('opens an article in a modal dialog and closes it', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(
      screen.getByRole('button', { name: /Artikel öffnen: Trailer 2/i }),
    )
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByRole('heading', { name: /Trailer 2 ist da/i }),
    ).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Schließen' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
