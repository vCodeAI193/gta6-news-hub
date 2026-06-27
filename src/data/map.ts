export interface MapPoi {
  id: string
  name: string
  /** Position in Prozent (0–100) auf der stilisierten Karte. */
  x: number
  y: number
  category: 'district' | 'landmark' | 'nature'
  description: string
  /** Optionaler Link zu einem Lore-Eintrag. */
  loreId?: string
}

/**
 * Points of Interest auf der stilisierten Vice-City-/Leonida-Karte.
 * (Fiktiv/illustrativ — keine echte Spielkarte.)
 */
export const mapPois: MapPoi[] = [
  { id: 'downtown', name: 'Downtown Vice City', x: 52, y: 46, category: 'district', description: 'Wolkenkratzer, Neon und Nachtleben im Zentrum.', loreId: 'vice-city' },
  { id: 'beach', name: 'Ocean Beach', x: 70, y: 62, category: 'landmark', description: 'Palmen, Promenade und Art-déco-Hotels.' },
  { id: 'harbor', name: 'Hafenviertel', x: 36, y: 64, category: 'district', description: 'Werften, Lagerhallen und zwielichtige Geschäfte.' },
  { id: 'everglades', name: 'Sümpfe (Everglades)', x: 22, y: 30, category: 'nature', description: 'Weitläufige Feuchtgebiete im Hinterland von Leonida.', loreId: 'leonida' },
  { id: 'keys', name: 'Leonida Keys', x: 78, y: 84, category: 'nature', description: 'Inselkette im Süden — Strände und Bootsstege.' },
  { id: 'airport', name: 'Escobar Int. Airport', x: 44, y: 24, category: 'landmark', description: 'Internationaler Flughafen im Norden der Stadt.' },
]
