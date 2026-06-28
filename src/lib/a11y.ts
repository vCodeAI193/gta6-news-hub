// Accessibility utilities

export type FontFamily = 'system' | 'dyslexia' | 'monospace'

export function applyFontFamily(family: FontFamily): void {
  const fonts: Record<FontFamily, string> = {
    system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    dyslexia: '"OpenDyslexic", "Comic Sans MS", "Comic Sans", cursive',
    monospace: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
  }
  document.documentElement.style.setProperty('--font-family', fonts[family])
}

export function applyHighContrast(enabled: boolean): void {
  document.documentElement.classList.toggle('high-contrast', enabled)
}

export function skipToMain(): void {
  const main = document.querySelector<HTMLElement>('main, [role="main"]')
  if (main) {
    main.focus()
    main.scrollIntoView()
  }
}

export function announceToScreenReader(message: string): void {
  let el = document.querySelector<HTMLDivElement>('#sr-announcer')
  if (!el) {
    el = document.createElement('div')
    el.id = 'sr-announcer'
    el.setAttribute('aria-live', 'polite')
    el.setAttribute('aria-atomic', 'true')
    el.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden'
    document.body.appendChild(el)
  }
  el.textContent = ''
  requestAnimationFrame(() => { if (el) el.textContent = message })
}

export interface LocaleFormatOptions {
  locale: string
  currency?: string
}

export function formatDate(date: string | Date, opts: LocaleFormatOptions): string {
  return new Intl.DateTimeFormat(opts.locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date))
}

export function formatNumber(n: number, opts: LocaleFormatOptions): string {
  return new Intl.NumberFormat(opts.locale).format(n)
}

export function formatCurrency(amount: number, opts: LocaleFormatOptions): string {
  return new Intl.NumberFormat(opts.locale, {
    style: 'currency',
    currency: opts.currency ?? 'EUR',
  }).format(amount)
}

export function detectBrowserLocale(): string {
  return navigator.language || 'de-DE'
}

export const SUPPORTED_LOCALES = ['de', 'en', 'es', 'fr', 'pt', 'ja'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

export function normalizeLocale(raw: string): SupportedLocale {
  const base = raw.split('-')[0].toLowerCase() as SupportedLocale
  return SUPPORTED_LOCALES.includes(base) ? base : 'de'
}
