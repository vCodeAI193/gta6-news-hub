import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CategoryId } from '../types'
import { readJSON, writeJSON } from '../services/storage'

export interface Preferences {
  /** Anzeigename für Kommentare etc. */
  displayName: string
  /** Beim Onboarding gewählte Interessen (Kategorien). */
  interests: CategoryId[]
  /** Onboarding bereits abgeschlossen? */
  onboarded: boolean
  /** Analytics/Cookie-Consent erteilt? (null = noch nicht entschieden) */
  consent: boolean | null
  /** Bewegungsreduktion erzwingen. */
  reduceMotion: boolean
}

const DEFAULTS: Preferences = {
  displayName: '',
  interests: [],
  onboarded: false,
  consent: null,
  reduceMotion: false,
}

interface PreferencesContextValue {
  prefs: Preferences
  update: (patch: Partial<Preferences>) => void
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)
const KEY = 'preferences'

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(() => ({
    ...DEFAULTS,
    ...readJSON<Partial<Preferences>>(KEY, {}),
  }))

  const update = useCallback((patch: Partial<Preferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch }
      writeJSON(KEY, next)
      return next
    })
  }, [])

  const value = useMemo(() => ({ prefs, update }), [prefs, update])
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider')
  return ctx
}
