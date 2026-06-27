import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { PreferencesProvider } from './context/PreferencesContext'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import { RealtimeProvider } from './context/RealtimeContext'
import { FlagsProvider } from './context/FlagsContext'
import { I18nProvider } from './i18n/I18nContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initMonitoring } from './lib/monitoring'
import { reportWebVitals } from './lib/webVitals'
import './index.css'

initMonitoring()
reportWebVitals()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <I18nProvider>
          <ThemeProvider>
            <PreferencesProvider>
              <ToastProvider>
                <AuthProvider>
                  <FlagsProvider>
                    <RealtimeProvider>
                      <BrowserRouter>
                        <App />
                      </BrowserRouter>
                    </RealtimeProvider>
                  </FlagsProvider>
                </AuthProvider>
              </ToastProvider>
            </PreferencesProvider>
          </ThemeProvider>
        </I18nProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
)
