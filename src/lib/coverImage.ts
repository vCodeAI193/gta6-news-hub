/**
 * KI-Cover-Bildgenerierung (FEATURES-3 #17) — rein lokal, ohne Modell/Key.
 *
 * Erzeugt aus einem Seed (z. B. Titel) deterministisch ein abstraktes
 * Verlaufs-Cover als SVG-Data-URI. Nützlich als Platzhalter, wenn ein Artikel
 * (noch) kein Bild hat oder ein Bild nicht lädt.
 */

const PALETTES: Array<[string, string]> = [
  ['#7c3aed', '#ec4899'],
  ['#0ea5e9', '#22d3ee'],
  ['#f97316', '#ef4444'],
  ['#10b981', '#84cc16'],
  ['#6366f1', '#3b82f6'],
  ['#e11d48', '#f59e0b'],
]

/** Stabiler 32-bit-Hash (FNV-1a) für deterministische Auswahl. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export interface CoverOptions {
  width?: number
  height?: number
  label?: string
}

/** Liefert ein SVG als Data-URI (deterministisch zum Seed). */
export function generateCover(seed: string, { width = 800, height = 450, label }: CoverOptions = {}): string {
  const h = hashSeed(seed || 'gta6')
  const [c1, c2] = PALETTES[h % PALETTES.length]
  const angle = h % 360
  const cx = 10 + (h % 80)
  const cy = 10 + ((h >> 3) % 80)
  const text = (label ?? seed ?? 'GTA 6').slice(0, 24)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(${angle})">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#g)"/>
  <circle cx="${(cx / 100) * width}" cy="${(cy / 100) * height}" r="${height / 3}" fill="#ffffff" opacity="0.12"/>
  <circle cx="${width - (cx / 100) * width}" cy="${height - (cy / 100) * height}" r="${height / 5}" fill="#000000" opacity="0.12"/>
  <text x="50%" y="50%" fill="#ffffff" opacity="0.92" font-family="system-ui, sans-serif" font-size="${Math.round(height / 12)}" font-weight="700" text-anchor="middle" dominant-baseline="middle">${escapeXml(text)}</text>
</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] as string)
}
