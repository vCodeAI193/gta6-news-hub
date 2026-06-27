import { describe, expect, it, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { renderWithProviders } from './test/utils'

// Onboarding-Overlay deaktivieren, damit es Klicks nicht abfängt.
beforeEach(() => {
  localStorage.setItem('gta6hub:preferences', JSON.stringify({ onboarded: true, consent: false }))
})

describe('<App /> — Startseite', () => {
  it('zeigt den Hero', async () => {
    renderWithProviders(<App />)
    expect(
      screen.getByRole('heading', { name: /grand theft auto vi/i }),
    ).toBeInTheDocument()
  })

  it('lädt alle 8 Artikel', async () => {
    renderWithProviders(<App />)
    expect(await screen.findByText('8 Artikel')).toBeInTheDocument()
  })

  it('filtert per Volltextsuche', async () => {
    const user = userEvent.setup()
    renderWithProviders(<App />)
    await screen.findByText('8 Artikel')
    await user.type(screen.getByRole('searchbox'), 'soundtrack')
    expect(await screen.findByText('1 Artikel')).toBeInTheDocument()
  })

  it('zeigt einen Empty-State ohne Treffer', async () => {
    const user = userEvent.setup()
    renderWithProviders(<App />)
    await screen.findByText('8 Artikel')
    await user.type(screen.getByRole('searchbox'), 'xyzzy-nichts')
    expect(await screen.findByText('Keine Treffer')).toBeInTheDocument()
  })

  it('filtert über die Kategorie-Chips', async () => {
    const user = userEvent.setup()
    renderWithProviders(<App />)
    await screen.findByText('8 Artikel')
    await user.click(screen.getByRole('button', { name: 'Leaks' }))
    expect(await screen.findByText('2 Artikel')).toBeInTheDocument()
  })

  it('wechselt das Theme auf hell', async () => {
    const user = userEvent.setup()
    renderWithProviders(<App />)
    await user.click(screen.getByRole('button', { name: /Theme wechseln/i }))
    await waitFor(() => expect(document.documentElement).toHaveClass('light'))
  })
})
