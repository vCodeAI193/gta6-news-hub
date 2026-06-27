import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, isApiEnabled } from '../services/api'

export interface FeatureFlags {
  community: boolean
  media: boolean
  realtime: boolean
  breaking: boolean
}

const DEFAULTS: FeatureFlags = { community: true, media: true, realtime: true, breaking: true }

const FlagsContext = createContext<FeatureFlags>(DEFAULTS)

export function FlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULTS)

  useEffect(() => {
    if (!isApiEnabled()) return
    api<{ flags: FeatureFlags }>('/api/flags', { auth: false })
      .then((res) => setFlags({ ...DEFAULTS, ...res.flags }))
      .catch(() => setFlags(DEFAULTS))
  }, [])

  const value = useMemo(() => flags, [flags])
  return <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>
}

export function useFlags(): FeatureFlags {
  return useContext(FlagsContext)
}
