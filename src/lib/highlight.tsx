import type { ReactNode } from 'react'

/** Escape für die Verwendung eines Strings in einem RegExp. */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Hebt Vorkommen von `query` in `text` hervor (case-insensitive).
 * Gibt ein React-Fragment mit <mark>-Elementen zurück.
 */
export function highlight(text: string, query: string): ReactNode {
  const q = query.trim()
  if (!q) return text
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, 'ig'))
  return parts.map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="mark">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}
