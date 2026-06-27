import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, getToken, isApiEnabled, setToken } from '../services/api'

export interface AuthUser {
  id: string
  email: string
  displayName: string
  role: 'reader' | 'author' | 'moderator' | 'admin'
  reputation: number
  createdAt: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  enabled: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  /** Mindestrolle prüfen. */
  hasRole: (role: AuthUser['role']) => boolean
}

const RANK = { reader: 0, author: 1, moderator: 2, admin: 3 }

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const enabled = isApiEnabled()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(enabled)

  // Bestehende Session beim Laden wiederherstellen.
  useEffect(() => {
    if (!enabled || !getToken()) {
      setLoading(false)
      return
    }
    api<{ user: AuthUser }>('/api/auth/me')
      .then((res) => setUser(res.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [enabled])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    })
    setToken(res.token)
    setUser(res.user)
  }, [])

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const res = await api<{ token: string; user: AuthUser }>('/api/auth/register', {
        method: 'POST',
        body: { email, password, displayName },
        auth: false,
      })
      setToken(res.token)
      setUser(res.user)
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } catch {
      /* Session evtl. schon weg — egal */
    }
    setToken(null)
    setUser(null)
  }, [])

  const hasRole = useCallback(
    (role: AuthUser['role']) => (user ? RANK[user.role] >= RANK[role] : false),
    [user],
  )

  const value = useMemo(
    () => ({ user, loading, enabled, login, register, logout, hasRole }),
    [user, loading, enabled, login, register, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
