interface PaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

/** Klassische Seiten-Navigation (Alternative zum Infinite Scroll). */
export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  if (pageCount <= 1) return null
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1)

  return (
    <nav className="pagination" aria-label="Seitennavigation">
      <button
        type="button"
        className="btn btn--small btn--ghost"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        ‹ Zurück
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={`btn btn--small${p === page ? '' : ' btn--ghost'}`}
          aria-current={p === page ? 'page' : undefined}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        className="btn btn--small btn--ghost"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
      >
        Weiter ›
      </button>
    </nav>
  )
}
