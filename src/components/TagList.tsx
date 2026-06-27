import { Link } from 'react-router-dom'

interface TagListProps {
  tags?: string[]
  /** Wenn true, verlinken Tags auf die gefilterte Startseite. */
  linked?: boolean
}

export function TagList({ tags, linked = false }: TagListProps) {
  if (!tags || tags.length === 0) return null
  return (
    <ul className="taglist" aria-label="Schlagworte">
      {tags.map((tag) =>
        linked ? (
          <li key={tag}>
            <Link className="tag-chip" to={`/?tag=${encodeURIComponent(tag)}`}>
              #{tag}
            </Link>
          </li>
        ) : (
          <li key={tag}>
            <span className="tag-chip">#{tag}</span>
          </li>
        ),
      )}
    </ul>
  )
}
