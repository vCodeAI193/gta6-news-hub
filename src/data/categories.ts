import type { Category } from '../types'

export const categories: Category[] = [
  {
    id: 'official',
    label: 'Offizielle News',
    description: 'Bestätigte Ankündigungen von Rockstar Games und Take-Two.',
  },
  {
    id: 'trailer',
    label: 'Trailer',
    description: 'Offizielle Trailer, Gameplay-Reveals und Teaser.',
  },
  {
    id: 'leak',
    label: 'Leaks',
    description: 'Unbestätigte Gerüchte und durchgesickerte Informationen.',
  },
  {
    id: 'release',
    label: 'Release',
    description: 'Release-Termin, Pre-Order und Plattform-Infos.',
  },
]

export const categoryMap: Record<string, Category> = Object.fromEntries(
  categories.map((c) => [c.id, c]),
)
