import { categories } from '../data/categories'
import type { CategoryId } from '../types'
import type { SortKey } from '../lib/filterArticles'

interface FilterBarProps {
  selected: CategoryId[]
  onToggleCategory: (cat: CategoryId) => void
  onClearCategories: () => void
  sort: SortKey
  onSortChange: (sort: SortKey) => void
  from: string
  to: string
  onDateChange: (range: { from?: string; to?: string }) => void
  activeTag?: string
  onClearTag?: () => void
}

/** Mehrfach-Kategorie-Filter + Sortierung + Datumsbereich + aktiver Tag. */
export function FilterBar({
  selected,
  onToggleCategory,
  onClearCategories,
  sort,
  onSortChange,
  from,
  to,
  onDateChange,
  activeTag,
  onClearTag,
}: FilterBarProps) {
  return (
    <div className="filterbar">
      <nav className="filters" aria-label="Nachrichtenkategorien">
        <button
          type="button"
          className="chip"
          aria-pressed={selected.length === 0}
          onClick={onClearCategories}
        >
          Alle
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className="chip"
            title={c.description}
            aria-pressed={selected.includes(c.id)}
            onClick={() => onToggleCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </nav>

      <div className="filterbar__controls">
        {activeTag && (
          <button type="button" className="chip chip--tag" onClick={onClearTag}>
            #{activeTag} ✕
          </button>
        )}
        <label className="filterbar__field">
          <span>Sortieren</span>
          <select value={sort} onChange={(e) => onSortChange(e.target.value as SortKey)} aria-label="Sortierung">
            <option value="date">Neueste zuerst</option>
            <option value="relevance">Relevanz</option>
            <option value="source">Quelle</option>
          </select>
        </label>
        <label className="filterbar__field">
          <span>Von</span>
          <input type="date" value={from} onChange={(e) => onDateChange({ from: e.target.value, to })} aria-label="Von Datum" />
        </label>
        <label className="filterbar__field">
          <span>Bis</span>
          <input type="date" value={to} onChange={(e) => onDateChange({ from, to: e.target.value })} aria-label="Bis Datum" />
        </label>
      </div>
    </div>
  )
}
