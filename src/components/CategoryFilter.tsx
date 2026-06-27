import { categories } from '../data/categories'
import type { CategoryId } from '../types'

interface CategoryFilterProps {
  active: CategoryId | 'all'
  onChange: (category: CategoryId | 'all') => void
}

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <nav className="filters" aria-label="Nachrichtenkategorien">
      <button
        type="button"
        className="chip"
        aria-pressed={active === 'all'}
        onClick={() => onChange('all')}
      >
        Alle
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className="chip"
          title={category.description}
          aria-pressed={active === category.id}
          onClick={() => onChange(category.id)}
        >
          {category.label}
        </button>
      ))}
    </nav>
  )
}
