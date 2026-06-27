export type LoreType = 'character' | 'location' | 'faction'

export interface LoreEntry {
  id: string
  name: string
  type: LoreType
  /** Kurzbeschreibung für Karten/Listen. */
  summary: string
  /** Ausführlicher Text (Markdown). */
  body: string
  image: string
  facts: Array<{ label: string; value: string }>
  tags: string[]
}

/**
 * Strukturierte Lore-/Wiki-Einträge zu Grand Theft Auto VI. Bewusst als typisierte
 * Daten gehalten, damit sie später aus einem CMS/Backend kommen können.
 */
export const loreEntries: LoreEntry[] = [
  {
    id: 'lucia',
    name: 'Lucia Caminos',
    type: 'character',
    summary: 'Eine der beiden Hauptfiguren — die erste spielbare Protagonistin der Reihe.',
    body: '**Lucia** ist eine der beiden Protagonist:innen von GTA 6 und die erste spielbare weibliche Hauptfigur der Hauptreihe.\n\nIhre Geschichte ist eng mit der von **Jason** verknüpft — Trailer deuten ein Bonnie-und-Clyde-artiges Duo an.',
    image: 'https://picsum.photos/seed/lore-lucia/600/600',
    facts: [
      { label: 'Rolle', value: 'Protagonistin' },
      { label: 'Erster Auftritt', value: 'Trailer 1 (2023)' },
      { label: 'Verbündete', value: 'Jason' },
    ],
    tags: ['Protagonist', 'Vice City'],
  },
  {
    id: 'jason',
    name: 'Jason',
    type: 'character',
    summary: 'Der zweite Protagonist, an Lucias Seite.',
    body: '**Jason** bildet zusammen mit Lucia das spielbare Duo. Über seinen Hintergrund ist offiziell noch wenig bekannt.',
    image: 'https://picsum.photos/seed/lore-jason/600/600',
    facts: [
      { label: 'Rolle', value: 'Protagonist' },
      { label: 'Verbündete', value: 'Lucia' },
    ],
    tags: ['Protagonist'],
  },
  {
    id: 'vice-city',
    name: 'Vice City',
    type: 'location',
    summary: 'Die an Miami angelehnte Metropole — Herzstück der Spielwelt.',
    body: '**Vice City** kehrt als zentrale Metropole zurück, diesmal im modernen Bundesstaat **Leonida**.\n\nNeonlichter, Strände und ein dynamisches Wettersystem mit Hurrikan-Vorboten prägen die Stadt.',
    image: 'https://picsum.photos/seed/lore-vicecity/600/600',
    facts: [
      { label: 'Bundesstaat', value: 'Leonida' },
      { label: 'Vorbild', value: 'Miami' },
      { label: 'Besonderheit', value: 'Dynamisches Wetter' },
    ],
    tags: ['Ort', 'Leonida'],
  },
  {
    id: 'leonida',
    name: 'Bundesstaat Leonida',
    type: 'location',
    summary: 'Der fiktive, an Florida angelehnte Bundesstaat mit Vice City im Zentrum.',
    body: '**Leonida** ist der an Florida angelehnte Bundesstaat, in dem GTA 6 spielt. Neben Vice City umfasst er Sümpfe, Strände und ländliche Regionen.',
    image: 'https://picsum.photos/seed/lore-leonida/600/600',
    facts: [
      { label: 'Vorbild', value: 'Florida' },
      { label: 'Hauptstadt', value: 'Vice City' },
    ],
    tags: ['Ort'],
  },
]

export const loreById: Record<string, LoreEntry> = Object.fromEntries(
  loreEntries.map((e) => [e.id, e]),
)
