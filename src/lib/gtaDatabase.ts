// GTA VI comprehensive database

export interface GtaCharacter {
  id: string
  name: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'cameo'
  description: string
  traits: string[]
  voiceActor?: string
  firstSeen: string
  relationships: Array<{ characterId: string; type: string }>
}

export interface GtaLocation {
  id: string
  name: string
  district: string
  type: 'district' | 'landmark' | 'beach' | 'highway' | 'interior'
  description: string
  inspiredBy?: string
  seenInTrailer: boolean
  coordinates?: { lat: number; lng: number }
}

export interface EasterEgg {
  id: string
  title: string
  description: string
  location: string
  discoveredBy: string
  confirmedAt: string
  type: 'reference' | 'secret' | 'hidden_item' | 'npc' | 'radio'
  verified: boolean
}

export interface GtaGlossaryEntry {
  term: string
  definition: string
  category: 'gameplay' | 'lore' | 'slang' | 'technical'
}

export interface Leaker {
  id: string
  alias: string
  platform: string
  accuracy: number
  totalLeaks: number
  confirmedLeaks: number
  status: 'active' | 'inactive' | 'banned'
  notableLeaks: string[]
}

export interface OfficialStatement {
  id: string
  source: string
  quote: string
  date: string
  topic: string
  url?: string
  confirmed: boolean
}

export const GTA_CHARACTERS: GtaCharacter[] = [
  {
    id: 'lucia',
    name: 'Lucia',
    role: 'protagonist',
    description: 'Erste weibliche GTA-Protagonistin. Latina, aufgewachsen in Vice City.',
    traits: ['tough', 'loyal', 'streetwise'],
    voiceActor: 'Unbekannt',
    firstSeen: 'Trailer 1 (Dez. 2023)',
    relationships: [{ characterId: 'jason', type: 'partner' }],
  },
  {
    id: 'jason',
    name: 'Jason',
    role: 'protagonist',
    description: 'Lucias Partner, Südstaaten-Hintergrund, Bond zwischen beiden erinnert an Bonnie und Clyde.',
    traits: ['reckless', 'loyal', 'charming'],
    firstSeen: 'Trailer 1 (Dez. 2023)',
    relationships: [{ characterId: 'lucia', type: 'partner' }],
  },
]

export const GTA_LOCATIONS: GtaLocation[] = [
  { id: 'vice_city', name: 'Vice City', district: 'Gesamt', type: 'district', description: 'Fiktionales Miami, Hauptschauplatz von GTA VI.', inspiredBy: 'Miami, Florida', seenInTrailer: true, coordinates: { lat: 25.77, lng: -80.19 } },
  { id: 'leonida', name: 'Leonida', district: 'Bundesstaat', type: 'district', description: 'Fiktionaler Bundesstaat, inspiriert von Florida.', inspiredBy: 'Florida', seenInTrailer: true },
  { id: 'port_gellhorn', name: 'Port Gellhorn', district: 'Hafen', type: 'landmark', description: 'Großer Hafen im Süden Vice Citys.', seenInTrailer: true },
  { id: 'everglades', name: 'Leonida Everglades', district: 'Natur', type: 'district', description: 'Ausgedehnte Sumpflandschaft außerhalb der Stadt.', inspiredBy: 'Everglades, Florida', seenInTrailer: true },
  { id: 'ocean_drive', name: 'Ocean Drive', district: 'Vice Beach', type: 'landmark', description: 'Ikonische Strandpromenade, inspiriert vom Südstrand Miamis.', inspiredBy: 'South Beach Ocean Drive', seenInTrailer: true },
]

export const EASTER_EGGS: EasterEgg[] = [
  {
    id: 'ee1',
    title: 'Hidden "III" in Trailer',
    description: 'Im Trailer 1 ist eine versteckte "III" Graffiti an einer Hauswand zu sehen — Hommage an GTA III.',
    location: 'Vice City, Trailer 1, 0:43',
    discoveredBy: 'GTA Forums Community',
    confirmedAt: '2023-12-06',
    type: 'reference',
    verified: true,
  },
  {
    id: 'ee2',
    title: 'Vice City Neon Signs',
    description: 'Mehrere Leuchtreklamen verweisen auf Orte aus dem Original Vice City (2002).',
    location: 'Vice Beach, Trailer 1',
    discoveredBy: 'YouTube: GTAAnalysis',
    confirmedAt: '2023-12-07',
    type: 'reference',
    verified: true,
  },
]

export const GLOSSARY: GtaGlossaryEntry[] = [
  { term: 'Wanted Level', definition: 'Fahndungsstufe der Polizei (0-5 Sterne in GTA VI). Bestimmt Intensität der Verfolgung.', category: 'gameplay' },
  { term: 'Safe House', definition: 'Geschützte Unterkunft des Protagonisten, wo gespeichert und geschlafen werden kann.', category: 'gameplay' },
  { term: 'Vice City', definition: 'Fiktionale Metropole, inspiriert von Miami/South Florida. Schauplatz von GTA: Vice City (2002) und GTA VI.', category: 'lore' },
  { term: 'Leonida', definition: 'Fiktionaler US-Bundesstaat, dem Florida nachempfunden. Übergeordneter Schauplatz von GTA VI.', category: 'lore' },
  { term: 'Leaker', definition: 'Person, die vorab unveröffentlichte Inhalte aus der Spielentwicklung teilt.', category: 'slang' },
  { term: 'GTA+ Membership', definition: 'Bezahl-Abo für GTA Online mit monatlichen Boni.', category: 'gameplay' },
  { term: 'RAGE Engine', definition: 'Rockstars proprietäre Spiel-Engine (Rockstar Advanced Game Engine), seit GTA IV im Einsatz.', category: 'technical' },
  { term: 'Source Engine', definition: '(Falsch zugeordnet) GTA VI nutzt RAGE, nicht Valves Source Engine.', category: 'technical' },
]

export const LEAKERS: Leaker[] = [
  {
    id: 'teapotuberhacker',
    alias: 'teapotuberhacker',
    platform: 'GTAForums',
    accuracy: 95,
    totalLeaks: 90,
    confirmedLeaks: 85,
    status: 'inactive',
    notableLeaks: ['GTA VI Gameplay-Footage (2022)', 'Lucia & Jason als Protagonisten'],
  },
  {
    id: 'matheusvictorbr',
    alias: 'matheusvictorbr',
    platform: 'Twitter/X',
    accuracy: 78,
    totalLeaks: 23,
    confirmedLeaks: 18,
    status: 'active',
    notableLeaks: ['GTA VI Releasetermin 2025', 'Vice City Kartendetails'],
  },
]

export const OFFICIAL_STATEMENTS: OfficialStatement[] = [
  {
    id: 'os1',
    source: 'Rockstar Games',
    quote: 'We are pleased to confirm that active development of the next entry in the Grand Theft Auto series is well underway.',
    date: '2022-02-04',
    topic: 'GTA VI Bestätigung',
    url: 'https://www.rockstargames.com/',
    confirmed: true,
  },
  {
    id: 'os2',
    source: 'Rockstar Games',
    quote: 'Grand Theft Auto VI is set to return to Vice City in a fictional version of Miami.',
    date: '2023-12-05',
    topic: 'Setting bestätigt',
    confirmed: true,
  },
  {
    id: 'os3',
    source: 'Take-Two Interactive',
    quote: 'GTA VI is planned for release in calendar 2025.',
    date: '2024-05-16',
    topic: 'Release 2025 bestätigt',
    confirmed: true,
  },
]
