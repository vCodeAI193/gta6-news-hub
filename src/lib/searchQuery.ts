/**
 * Such-Query-Engine (FEATURES-3 Kategorie 2): erweiterte Operatoren, Synonyme,
 * Tippfehler-Toleranz und Kontext-Snippets. Rein funktional und getestet;
 * wird sowohl im Frontend-Fallback als auch (gespiegelt) serverseitig genutzt.
 *
 * Unterstützte Operatoren:
 *   "exakte phrase"   → Teilstring muss vorkommen
 *   -wort             → Ausschluss
 *   a OR b            → Alternativen (sonst gilt UND zwischen den Begriffen)
 */

export interface ParsedQuery {
  /** OR-Alternativen; jede Alternative ist eine UND-Liste von Pflicht-Termen. */
  alternatives: Array<{ phrases: string[]; words: string[] }>
  /** Global auszuschließende Begriffe. */
  exclude: string[]
  /** Originaltext (getrimmt). */
  raw: string
}

/** Synonym-Cluster (alle Einträge eines Clusters gelten als gleichwertig). */
const SYNONYM_CLUSTERS: string[][] = [
  ['gta6', 'gta', 'gtavi', 'grand theft auto', 'gta 6', 'gta vi'],
  ['leak', 'leaks', 'gerücht', 'geruecht', 'rumor', 'rumour'],
  ['trailer', 'video', 'clip', 'teaser'],
  ['karte', 'map', 'leonida'],
  ['release', 'termin', 'erscheinungsdatum', 'launch', 'releasedatum'],
  ['charakter', 'character', 'protagonist', 'protagonistin'],
  ['soundtrack', 'musik', 'radio', 'radiosender', 'song'],
  ['rockstar', 'take-two', 'taketwo'],
]

const SYNONYM_MAP: Map<string, Set<string>> = (() => {
  const m = new Map<string, Set<string>>()
  for (const cluster of SYNONYM_CLUSTERS) {
    const set = new Set(cluster)
    for (const word of cluster) m.set(word, set)
  }
  return m
})()

/** Liefert die Synonyme eines Begriffs (inkl. ihm selbst). */
export function synonymsOf(term: string): string[] {
  const set = SYNONYM_MAP.get(term.toLowerCase())
  return set ? [...set] : [term.toLowerCase()]
}

/** Levenshtein-Distanz (für Tippfehler-Toleranz). */
export function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  let curr = new Array<number>(n + 1)
  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }
  return prev[n]
}

/** Erlaubte Tippfehler-Distanz je nach Wortlänge. */
function tolerance(len: number): number {
  if (len <= 4) return 0
  if (len <= 7) return 1
  return 2
}

/** Zerlegt eine Suchanfrage in Operatoren-Struktur. */
export function parseQuery(input: string): ParsedQuery {
  const raw = String(input || '').trim()
  // Phrasen extrahieren und durch Platzhalter ersetzen.
  const phrases: string[] = []
  const withoutPhrases = raw.replace(/"([^"]+)"/g, (_, p) => {
    phrases.push(p.trim().toLowerCase())
    return ` ${phrases.length - 1} `
  })

  const exclude: string[] = []
  const alternatives: ParsedQuery['alternatives'] = []
  const orParts = withoutPhrases.split(/\s+OR\s+/i)

  for (const part of orParts) {
    const altPhrases: string[] = []
    const altWords: string[] = []
    for (const tokenRaw of part.split(/\s+/).filter(Boolean)) {
      const phraseMatch = tokenRaw.match(/^([0-9]+)$/)
      if (phraseMatch) {
        altPhrases.push(phrases[Number(phraseMatch[1])])
        continue
      }
      const token = tokenRaw.toLowerCase().replace(/[^a-zà-ÿ0-9äöüß-]/gi, '')
      if (!token) continue
      if (tokenRaw.startsWith('-')) {
        const bare = token.replace(/^-+/, '')
        if (bare) exclude.push(bare)
      } else {
        altWords.push(token.replace(/^-+/, ''))
      }
    }
    if (altPhrases.length || altWords.length) alternatives.push({ phrases: altPhrases, words: altWords })
  }

  if (!alternatives.length) alternatives.push({ phrases, words: [] })
  return { alternatives, exclude, raw }
}

/** Prüft, ob ein Wort (mit Synonymen/Tippfehler) im Token-Set vorkommt. */
function wordMatches(word: string, tokens: Set<string>, text: string): boolean {
  const syns = synonymsOf(word)
  for (const syn of syns) {
    if (syn.includes(' ')) {
      if (text.includes(syn)) return true
      continue
    }
    if (tokens.has(syn)) return true
    const tol = tolerance(syn.length)
    if (tol > 0) {
      for (const tok of tokens) {
        if (Math.abs(tok.length - syn.length) <= tol && levenshtein(tok, syn) <= tol) return true
      }
    }
  }
  return false
}

/** Wertet eine geparste Query gegen einen Text aus. */
export function matchesQuery(text: string, parsed: ParsedQuery): boolean {
  const lower = String(text || '').toLowerCase()
  const tokens = new Set(lower.split(/[^a-zà-ÿ0-9äöüß]+/i).filter(Boolean))

  for (const ex of parsed.exclude) {
    if (lower.includes(ex) || tokens.has(ex)) return false
  }
  if (parsed.alternatives.every((a) => !a.phrases.length && !a.words.length)) return true

  return parsed.alternatives.some((alt) => {
    if (alt.phrases.some((p) => !lower.includes(p))) return false
    return alt.words.every((w) => wordMatches(w, tokens, lower))
  })
}

/** Bequemer One-Shot: gibt true zurück, wenn `text` zu `query` passt. */
export function textMatches(text: string, query: string): boolean {
  return matchesQuery(text, parseQuery(query))
}

/**
 * Erzeugt ein Kontext-Snippet um den ersten Treffer eines Suchbegriffs herum.
 * Liefert reinen Text (Hervorhebung übernimmt die UI via `highlight`).
 */
export function makeSnippet(text: string, query: string, radius = 90): string {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  const parsed = parseQuery(query)
  const terms = [
    ...parsed.alternatives.flatMap((a) => [...a.phrases, ...a.words]),
  ].filter(Boolean)
  const lower = clean.toLowerCase()
  let idx = -1
  for (const term of terms) {
    for (const syn of synonymsOf(term)) {
      const at = lower.indexOf(syn)
      if (at >= 0 && (idx === -1 || at < idx)) idx = at
    }
  }
  if (idx === -1) return clean.length > radius * 2 ? clean.slice(0, radius * 2).trimEnd() + '…' : clean
  const start = Math.max(0, idx - radius)
  const end = Math.min(clean.length, idx + radius)
  return (start > 0 ? '…' : '') + clean.slice(start, end).trim() + (end < clean.length ? '…' : '')
}

/** Einfacher lexikalischer Score: Titel-Treffer zählen mehr als Body-Treffer. */
export function lexicalScore(fields: { title?: string; body?: string; tags?: string[] }, query: string): number {
  const parsed = parseQuery(query)
  const terms = parsed.alternatives.flatMap((a) => [...a.words, ...a.phrases])
  if (!terms.length) return 0
  const title = (fields.title || '').toLowerCase()
  const body = (fields.body || '').toLowerCase()
  const tags = (fields.tags || []).join(' ').toLowerCase()
  let score = 0
  for (const term of terms) {
    for (const syn of synonymsOf(term)) {
      if (title.includes(syn)) score += 3
      if (tags.includes(syn)) score += 2
      if (body.includes(syn)) score += 1
    }
  }
  return score
}
