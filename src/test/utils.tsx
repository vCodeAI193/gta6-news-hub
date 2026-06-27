import type { ReactElement, ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ThemeProvider } from '../context/ThemeContext'
import { PreferencesProvider } from '../context/PreferencesContext'
import { ToastProvider } from '../context/ToastContext'
import { AuthProvider } from '../context/AuthContext'
import { I18nProvider } from '../i18n/I18nContext'

interface Options extends Omit<RenderOptions, 'wrapper'> {
  route?: string
}

/** Rendert eine Komponente mit allen App-Providern und einem Memory-Router. */
export function renderWithProviders(ui: ReactElement, { route = '/', ...options }: Options = {}) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <HelmetProvider>
      <I18nProvider>
        <ThemeProvider>
          <PreferencesProvider>
            <ToastProvider>
              <AuthProvider>
                <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
              </AuthProvider>
            </ToastProvider>
          </PreferencesProvider>
        </ThemeProvider>
      </I18nProvider>
    </HelmetProvider>
  )
  return render(ui, { wrapper: Wrapper, ...options })
}
