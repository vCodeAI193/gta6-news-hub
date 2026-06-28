import type { Article } from '../types'

// ── Vehicle database ────────────────────────────────────────────────────────

export interface Vehicle {
  id: string
  name: string
  type: 'car' | 'bike' | 'boat' | 'helicopter' | 'plane' | 'special'
  manufacturer: string
  topSpeed: number
  handling: number
  confirmed: boolean
  imageUrl?: string
  description: string
}

export const VEHICLES: Vehicle[] = [
  { id: 'infernus', name: 'Infernus', type: 'car', manufacturer: 'Grotti', topSpeed: 120, handling: 85, confirmed: false, description: 'Klassischer GTA-Sportwagen, in Vice City-Trailer angedeutet.' },
  { id: 'comet', name: 'Comet', type: 'car', manufacturer: 'Pfister', topSpeed: 115, handling: 90, confirmed: false, description: 'Porsche-Klon, seit GTA III ein Serienklassiker.' },
  { id: 'sultan', name: 'Sultan', type: 'car', manufacturer: 'Karin', topSpeed: 105, handling: 92, confirmed: false, description: 'Beliebter All-Rounder, im Trailer kurz sichtbar.' },
  { id: 'patriot', name: 'Patriot', type: 'car', manufacturer: 'Mammoth', topSpeed: 95, handling: 75, confirmed: true, description: 'Militär-SUV, im offiziellen Trailer bestätigt.' },
  { id: 'buzzard', name: 'Buzzard', type: 'helicopter', manufacturer: 'Western', topSpeed: 90, handling: 80, confirmed: false, description: 'Angriffshubschrauber, aus GTA V bekannt.' },
  { id: 'jetski', name: 'Seashark', type: 'boat', manufacturer: 'Nagasaki', topSpeed: 70, handling: 70, confirmed: true, description: 'Jet-Ski, im Florida-Trailer auf dem Wasser gezeigt.' },
]

export function searchVehicles(q: string): Vehicle[] {
  const lower = q.toLowerCase()
  return VEHICLES.filter(v =>
    v.name.toLowerCase().includes(lower) ||
    v.manufacturer.toLowerCase().includes(lower) ||
    v.type.includes(lower) ||
    v.description.toLowerCase().includes(lower)
  )
}

// ── Weapon / Item database ──────────────────────────────────────────────────

export interface WeaponItem {
  id: string
  name: string
  category: 'pistol' | 'smg' | 'rifle' | 'shotgun' | 'melee' | 'special' | 'explosive'
  damage: number
  range: number
  confirmed: boolean
  description: string
}

export const WEAPONS: WeaponItem[] = [
  { id: 'pistol', name: 'Pistole', category: 'pistol', damage: 30, range: 50, confirmed: true, description: 'Standard-Seitenwaffe.' },
  { id: 'micro-smg', name: 'Micro-SMG', category: 'smg', damage: 28, range: 40, confirmed: false, description: 'Kompaktes Maschinenpistole.' },
  { id: 'assault-rifle', name: 'Sturmgewehr', category: 'rifle', damage: 55, range: 80, confirmed: true, description: 'Im Trailer-Schusswechsel zu sehen.' },
  { id: 'sniper', name: 'Scharfschützengewehr', category: 'rifle', damage: 95, range: 100, confirmed: false, description: 'Präzisionswaffe für große Distanzen.' },
  { id: 'shotgun', name: 'Schrotflinte', category: 'shotgun', damage: 80, range: 20, confirmed: true, description: 'Kurze Reichweite, hoher Schaden.' },
  { id: 'rpg', name: 'Raketenwerfer', category: 'explosive', damage: 100, range: 60, confirmed: false, description: 'Schweres Sprengstoffgeschütz.' },
  { id: 'knife', name: 'Messer', category: 'melee', damage: 40, range: 2, confirmed: true, description: 'Nahkampfwaffe.' },
]

export function searchWeapons(q: string): WeaponItem[] {
  const lower = q.toLowerCase()
  return WEAPONS.filter(w =>
    w.name.toLowerCase().includes(lower) ||
    w.category.includes(lower) ||
    w.description.toLowerCase().includes(lower)
  )
}

// ── Hype meter ──────────────────────────────────────────────────────────────

export function computeHypeMeter(articles: Article[]): { score: number; label: string; breakdown: Record<string, number> } {
  const recent = articles.filter(a => {
    const d = new Date(a.date)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    return d > cutoff
  })
  const confirmed = recent.filter(a => a.reliability === 'confirmed').length
  const total = recent.length || 1
  const ratio = confirmed / total
  const score = Math.round(50 + ratio * 50)
  const label = score >= 85 ? '🔥 Hyper-hype' : score >= 70 ? '🚀 Sehr hoch' : score >= 50 ? '📈 Mittel' : '😴 Gering'
  return { score, label, breakdown: { recent: recent.length, confirmed, total } }
}

// ── Timeline entries ────────────────────────────────────────────────────────

export interface TimelineEntry {
  id: string
  date: string
  title: string
  type: 'announcement' | 'trailer' | 'leak' | 'milestone' | 'other'
  description: string
  importance: 1 | 2 | 3
}

export const TIMELINE_ENTRIES: TimelineEntry[] = [
  { id: 'tl-1', date: '2023-12-05', title: 'Erster offizieller Trailer', type: 'trailer', description: 'Rockstar veröffentlicht Trailer 1 mit >200M Views.', importance: 3 },
  { id: 'tl-2', date: '2022-09-18', title: 'Offizieller GTA VI Titel bestätigt', type: 'announcement', description: 'Rockstar bestätigt Entwicklung von GTA VI.', importance: 3 },
  { id: 'tl-3', date: '2022-09-18', title: 'Größter Rockstar-Leak', type: 'leak', description: '90 Videos aus der Entwicklung geleakt.', importance: 2 },
  { id: 'tl-4', date: '2024-06-00', title: 'Release-Fenster Herbst 2025 angekündigt', type: 'milestone', description: 'Ursprüngliches Releaseziel für Konsole.', importance: 2 },
  { id: 'tl-5', date: '2025-05-00', title: 'PC-Release verschoben', type: 'announcement', description: 'Konsolen-Release November 2026 bestätigt.', importance: 3 },
]

export function filterTimeline(entries: TimelineEntry[], type?: string, minImportance?: number): TimelineEntry[] {
  return entries
    .filter(e => !type || e.type === type)
    .filter(e => !minImportance || e.importance >= minImportance)
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ── Edition comparator ──────────────────────────────────────────────────────

export interface Edition {
  id: string
  name: string
  price: number
  platform: string[]
  includes: string[]
}

export const EDITIONS: Edition[] = [
  { id: 'standard', name: 'Standard Edition', price: 70, platform: ['PS5', 'Xbox Series X|S'], includes: ['Basisspiel'] },
  { id: 'deluxe', name: 'Deluxe Edition', price: 90, platform: ['PS5', 'Xbox Series X|S'], includes: ['Basisspiel', 'Premium-Fahrzeugpack', 'Exklusives Outfit', 'GTA$1.000.000'] },
  { id: 'collectors', name: "Collector's Edition", price: 150, platform: ['PS5', 'Xbox Series X|S'], includes: ['Basisspiel', 'Steelbook', 'Artbook', 'Soundtrack-CD', 'Exklusive Karte', 'GTA$2.000.000', 'Premium-Pack'] },
]
