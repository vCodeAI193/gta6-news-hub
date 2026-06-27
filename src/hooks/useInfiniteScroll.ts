import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Einfaches „nach und nach laden". Gibt die sichtbare Anzahl zurück und einen
 * Sentinel-Ref, der beim Sichtbarwerden die nächste Seite nachlädt.
 */
export function useInfiniteScroll(total: number, pageSize = 6) {
  const [visible, setVisible] = useState(pageSize)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Bei Änderung der Gesamtmenge (z. B. neuer Filter) zurücksetzen.
  useEffect(() => {
    setVisible(pageSize)
  }, [total, pageSize])

  const loadMore = useCallback(() => {
    setVisible((v) => Math.min(total, v + pageSize))
  }, [total, pageSize])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || visible >= total) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible, total, loadMore])

  return { visible, sentinelRef, loadMore, hasMore: visible < total }
}
