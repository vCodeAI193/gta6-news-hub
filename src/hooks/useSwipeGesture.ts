import { useEffect, useRef } from 'react'

export interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

export function useSwipeGesture(handlers: SwipeHandlers, threshold = 50) {
  const startX = useRef(0)
  const startY = useRef(0)
  const elRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = elRef.current ?? document.body

    function onTouchStart(e: TouchEvent) {
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
    }

    function onTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - startX.current
      const dy = e.changedTouches[0].clientY - startY.current
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)
      if (absDx > absDy && absDx > threshold) {
        if (dx < 0) handlers.onSwipeLeft?.()
        else handlers.onSwipeRight?.()
      } else if (absDy > absDx && absDy > threshold) {
        if (dy < 0) handlers.onSwipeUp?.()
        else handlers.onSwipeDown?.()
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [handlers, threshold])

  return elRef
}
