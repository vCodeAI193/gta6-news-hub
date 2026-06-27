import { useState } from 'react'
import { isFavorite, toggleFavorite } from '../services/userDataService'
import { useToast } from '../context/ToastContext'

interface BookmarkButtonProps {
  articleId: string
  /** Kompakte Variante (nur Icon) für Karten. */
  compact?: boolean
}

export function BookmarkButton({ articleId, compact = false }: BookmarkButtonProps) {
  const [saved, setSaved] = useState(() => isFavorite(articleId))
  const { notify } = useToast()

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const now = toggleFavorite(articleId)
    setSaved(now)
    notify(now ? 'Zu Lesezeichen hinzugefügt' : 'Aus Lesezeichen entfernt', 'info')
  }

  return (
    <button
      type="button"
      className={`bookmark${saved ? ' bookmark--active' : ''}${compact ? ' bookmark--compact' : ''}`}
      aria-pressed={saved}
      aria-label={saved ? 'Lesezeichen entfernen' : 'Als Lesezeichen merken'}
      onClick={onClick}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {!compact && <span>{saved ? 'Gemerkt' : 'Merken'}</span>}
    </button>
  )
}
