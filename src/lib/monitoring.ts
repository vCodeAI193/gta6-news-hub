/**
 * Fehler-Monitoring (Sentry-Stil). Inaktiv ohne DSN.
 *
 * Hält die Schnittstelle bewusst minimal, damit später ein echter Provider
 * (z. B. @sentry/react) eingehängt werden kann, ohne Aufrufer zu ändern.
 */
const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined

export function initMonitoring(): void {
  if (!DSN) return
  // In Produktion: Sentry.init({ dsn: DSN, tracesSampleRate: 0.1 })
  if (import.meta.env.DEV) {
    console.debug('[monitoring] DSN gesetzt — echter Provider würde hier initialisiert.')
  }
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (DSN) {
    // In Produktion: Sentry.captureException(error, { extra: context })
    return
  }
  // Fallback: zumindest lokal sichtbar machen.
  console.error('[monitoring] captured error', error, context)
}
