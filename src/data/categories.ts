import type { Category } from '../types'

export const categories: Category[] = [
  {
    id: 'official',
    label: 'Offizielle News',
    description: 'Bestätigte Ankündigungen von Rockstar Games und Take-Two.',
    slug: 'offizielle-news',
  },
  {
    id: 'trailer',
    label: 'Trailer',
    description: 'Offizielle Trailer, Gameplay-Reveals und Teaser.',
    slug: 'trailer',
  },
  {
    id: 'leak',
    label: 'Leaks',
    description: 'Unbestätigte Gerüchte und durchgesickerte Informationen.',
    slug: 'leaks',
  },
  {
    id: 'release',
    label: 'Release',
    description: 'Release-Termin, Pre-Order und Plattform-Infos.',
    slug: 'release',
  },
]

export const categoryMap: Record<string, Category> = Object.fromEntries(
  categories.map((c) => [c.id, c]),
)

export const categoryBySlug: Record<string, Category> = Object.fromEntries(
  categories.map((c) => [c.slug, c]),
)
