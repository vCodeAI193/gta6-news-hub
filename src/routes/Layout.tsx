import { Outlet } from 'react-router-dom'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { ToastViewport } from '../components/ToastViewport'
import { CookieConsent } from '../components/CookieConsent'
import { OnboardingDialog } from '../components/OnboardingDialog'
import { ScrollToTopOnNavigate, ScrollTopButton } from '../components/ScrollHelpers'
import { BreakingNewsBanner } from '../components/BreakingNewsBanner'

/** Gemeinsames Seitengerüst mit globalen Overlays. */
export function Layout() {
  return (
    <>
      <a className="skip-link" href="#main">
        Zum Inhalt springen
      </a>
      <ScrollToTopOnNavigate />
      <BreakingNewsBanner />
      <Header />
      <main id="main" className="container page-transition">
        <Outlet />
      </main>
      <Footer />
      <ScrollTopButton />
      <ToastViewport />
      <CookieConsent />
      <OnboardingDialog />
    </>
  )
}
