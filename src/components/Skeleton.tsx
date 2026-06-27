/** Platzhalter-Karten während des Ladens. */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card skeleton-card" key={i}>
          <div className="skeleton skeleton--media" />
          <div className="card__body">
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line short" />
            <div className="skeleton skeleton--line" />
          </div>
        </div>
      ))}
    </div>
  )
}
