import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { isApiEnabled } from '../services/api'

export interface RealtimeMessage {
  type: string
  [key: string]: unknown
}

type Handler = (msg: RealtimeMessage) => void

interface RealtimeValue {
  online: number
  connected: boolean
  breaking: { id: string; message: string } | null
  dismissBreaking: () => void
  /** Aktuell betrachteten Artikel setzen (für Präsenz/gezielte Events). */
  setViewing: (articleId: string | null) => void
  /** Auf einen Nachrichtentyp hören; gibt eine Unsubscribe-Funktion zurück. */
  subscribe: (type: string, handler: Handler) => () => void
}

const RealtimeContext = createContext<RealtimeValue | null>(null)

function wsUrl(): string | null {
  const base = import.meta.env.VITE_API_URL as string | undefined
  if (!base) return null
  return base.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws'
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(0)
  const [connected, setConnected] = useState(false)
  const [breaking, setBreaking] = useState<{ id: string; message: string } | null>(null)

  const socketRef = useRef<WebSocket | null>(null)
  const viewingRef = useRef<string | null>(null)
  const handlersRef = useRef<Map<string, Set<Handler>>>(new Map())
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const url = wsUrl()
    if (!isApiEnabled() || !url) return
    let closed = false

    const connect = () => {
      const ws = new WebSocket(url)
      socketRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        if (viewingRef.current) ws.send(JSON.stringify({ type: 'viewing', articleId: viewingRef.current }))
      }
      ws.onclose = () => {
        setConnected(false)
        if (!closed) reconnectRef.current = setTimeout(connect, 1500)
      }
      ws.onmessage = (event) => {
        let msg: RealtimeMessage
        try {
          msg = JSON.parse(event.data)
        } catch {
          return
        }
        if (msg.type === 'online') setOnline(Number(msg.count) || 0)
        else if (msg.type === 'breaking') setBreaking({ id: String(msg.id), message: String(msg.message) })
        const handlers = handlersRef.current.get(msg.type)
        if (handlers) handlers.forEach((h) => h(msg))
      }
    }

    connect()
    return () => {
      closed = true
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      socketRef.current?.close()
    }
  }, [])

  const setViewing = useCallback((articleId: string | null) => {
    viewingRef.current = articleId
    const ws = socketRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'viewing', articleId }))
    }
  }, [])

  const subscribe = useCallback((type: string, handler: Handler) => {
    const map = handlersRef.current
    if (!map.has(type)) map.set(type, new Set())
    map.get(type)!.add(handler)
    return () => map.get(type)?.delete(handler)
  }, [])

  const dismissBreaking = useCallback(() => setBreaking(null), [])

  const value = useMemo(
    () => ({ online, connected, breaking, dismissBreaking, setViewing, subscribe }),
    [online, connected, breaking, dismissBreaking, setViewing, subscribe],
  )

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

export function useRealtime(): RealtimeValue {
  const ctx = useContext(RealtimeContext)
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider')
  return ctx
}
