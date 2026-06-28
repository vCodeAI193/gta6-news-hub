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

export type ThemeMode = 'dark' | 'light' | 'system'

interface ThemeContextValue {
  mode: ThemeMode
  /** Tatsächlich aktives Theme nach Auflösung von "system". */
  resolved: 'dark' | 'light'
  setMode: (mode: ThemeMode) => void
  toggle: () => void
  fontScale: number
  setFontScale: (scale: number) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const MODE_KEY = 'theme:mode'
const FONT_KEY = 'theme:fontScale'

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : true
}

/** Returns true if the current hour is outside daytime (6–20). */
function isNightTime(): boolean {
  const hour = new Date().getHours()
  return hour < 6 || hour >= 20
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Dark Mode ist bewusst der Standard (GTA-Stil).
  const [mode, setModeState] = useState<ThemeMode>(() => readJSON<ThemeMode>(MODE_KEY, 'dark'))
  const [fontScale, setFontScaleState] = useState<number>(() => readJSON<number>(FONT_KEY, 1))
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark)

  // Auf Systemwechsel reagieren, wenn "system" aktiv ist.
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // When mode is 'system', also apply time-of-day heuristic (6–20 = light, else dark).
  const resolved: 'dark' | 'light' =
    mode === 'system' ? (systemDark || isNightTime() ? 'dark' : 'light') : mode

  // Theme & Schriftgröße auf <html> anwenden.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolved === 'dark')
    root.classList.toggle('light', resolved === 'light')
    root.style.setProperty('--font-scale', String(fontScale))
    root.setAttribute('data-theme', resolved)
  }, [resolved, fontScale])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    writeJSON(MODE_KEY, next)
  }, [])

  const setFontScale = useCallback((scale: number) => {
    const clamped = Math.min(1.4, Math.max(0.85, Math.round(scale * 100) / 100))
    setFontScaleState(clamped)
    writeJSON(FONT_KEY, clamped)
  }, [])

  const toggle = useCallback(() => {
    setMode(resolved === 'dark' ? 'light' : 'dark')
  }, [resolved, setMode])

  const value = useMemo(
    () => ({ mode, resolved, setMode, toggle, fontScale, setFontScale }),
    [mode, resolved, setMode, toggle, fontScale, setFontScale],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
