import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { readJSON, writeJSON } from '../services/storage'
import { RTL_LOCALES, translations, type Locale, type TranslationKey } from './translations'

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)
const KEY = 'locale'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readJSON<Locale>(KEY, 'de'))

  const applyLang = (loc: Locale) => {
    document.documentElement.lang = loc
    document.documentElement.dir = RTL_LOCALES.includes(loc) ? 'rtl' : 'ltr'
  }

  // Schreibrichtung/Sprache beim Start anwenden.
  useEffect(() => {
    applyLang(locale)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    writeJSON(KEY, next)
    applyLang(next)
  }, [])

  const t = useCallback(
    (key: TranslationKey) => translations[locale][key] ?? translations.de[key] ?? key,
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
