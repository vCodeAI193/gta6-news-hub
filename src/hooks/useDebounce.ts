import { useEffect, useState } from 'react'

/** Gibt den Wert verzögert zurück (z. B. für Such-Eingaben). */
export function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}
