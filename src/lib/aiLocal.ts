/**
 * Lokale KI-Heuristiken fürs Frontend (Offline-/Fallback-Betrieb ohne Backend).
 *
 * Spiegelt die wichtigsten Verfahren aus `server/ai.mjs`, damit die KI-Features
 * auch im reinen localStorage-Modus (ohne `VITE_API_URL`) funktionieren. Bei
 * aktivem Backend übernimmt stattdessen das Server-Modul (ggf. mit Anthropic).
 */

const STOPWORDS = new Set([
  'der', 'die', 'das', 'und', 'oder', 'aber', 'mit', 'von', 'für', 'auf', 'ist',
  'im', 'in', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer',
  'zu', 'zum', 'zur', 'auch', 'als', 'am', 'an', 'sich', 'es', 'sie', 'er',
  'wir', 'ihr', 'sind', 'war', 'wird', 'werden', 'hat', 'haben', 'nicht',
  'noch', 'schon', 'nur', 'so', 'wie', 'was', 'wenn', 'dann', 'dass', 'man',
  'bei', 'aus', 'nach', 'über', 'unter', 'vor', 'durch', 'gibt', 'mehr', 'sehr',
  'the', 'and', 'for', 'with', 'this', 'that', 'are', 'has', 'have',
])

export function tokenize(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-zà-ÿ0-9äöüß\s-]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
}

export function splitSentences(text: string): string[] {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<!\b\d{1,2}[.!?])(?<=[.!?])\s+(?=[A-ZÄÖÜ])/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function tf(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const w of tokens) m.set(w, (m.get(w) || 0) + 1)
  return m
}

export function summarize(text: string, sentences = 2): string {
  const all = splitSentences(text)
  if (all.length <= sentences) return all.join(' ')
  const freq = tf(tokenize(text))
  const scored = all.map((s, i) => {
    const words = tokenize(s)
    const base = words.reduce((sum, w) => sum + (freq.get(w) || 0), 0) / (words.length || 1)
    return { i, s, score: base * (1 + (all.length - i) / (all.length * 4)) }
  })
  return [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, sentences)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s)
    .join(' ')
}

export function autoTag(text: string, max = 6): string[] {
  return [...tf(tokenize(text)).entries()]
    .filter(([w]) => w.length >= 4)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([w]) => w)
}

const POS = new Set(['gut', 'super', 'toll', 'genial', 'klasse', 'mega', 'hype', 'freude', 'liebe', 'beste', 'perfekt', 'spannend', 'hammer', 'cool', 'stark', 'großartig', 'fantastisch', 'gespannt', 'endlich', 'freue'])
const NEG = new Set(['schlecht', 'mies', 'enttäuscht', 'enttäuschend', 'hass', 'müll', 'langweilig', 'fake', 'lüge', 'unsinn', 'schade', 'nervt', 'flop', 'katastrophe', 'betrug', 'verschiebung', 'fehler', 'bug', 'desaster', 'unfair'])

export function analyzeSentiment(text: string): { label: 'positiv' | 'negativ' | 'neutral'; score: number } {
  const tokens = tokenize(text)
  let score = 0
  for (const w of tokens) {
    if (POS.has(w)) score += 1
    if (NEG.has(w)) score -= 1
  }
  const norm = tokens.length ? Math.max(-1, Math.min(1, score / Math.sqrt(tokens.length))) : 0
  const label = norm > 0.15 ? 'positiv' : norm < -0.15 ? 'negativ' : 'neutral'
  return { label, score: Number(norm.toFixed(3)) }
}

function syllables(word: string): number {
  const g = word.toLowerCase().match(/[aeiouyäöü]+/g)
  return Math.max(1, g ? g.length : 1)
}

export function readability(text: string): { score: number; level: 'leicht' | 'mittel' | 'schwer'; words: number; minutes: number } {
  const sentences = splitSentences(text)
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const syl = words.reduce((s, w) => s + syllables(w), 0)
  const sCount = Math.max(1, sentences.length)
  const wCount = Math.max(1, words.length)
  const flesch = 180 - wCount / sCount - 58.5 * (syl / wCount)
  const score = Math.max(0, Math.min(100, Math.round(flesch)))
  const level = score >= 70 ? 'leicht' : score >= 50 ? 'mittel' : 'schwer'
  return { score, level, words: wCount, minutes: Math.max(1, Math.round(wCount / 200)) }
}

function embed(text: string): Map<string, number> {
  return tf(tokenize(text))
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (const v of a.values()) na += v * v
  for (const v of b.values()) nb += v * v
  for (const [k, v] of a) if (b.has(k)) dot += v * (b.get(k) as number)
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0
}

export interface RagSource {
  id: string
  title: string
  score: number
}

export interface RagDoc {
  id: string
  title: string
  text: string
}

export function ragAnswer(question: string, docs: RagDoc[], topK = 3): { answer: string; sources: RagSource[] } {
  const q = embed(question)
  const ranked = docs
    .map((d) => ({ d, score: cosine(q, embed(`${d.title} ${d.text}`)) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
  if (!ranked.length) return { answer: 'Dazu habe ich in den Artikeln nichts gefunden.', sources: [] }
  const answer = ranked
    .flatMap((r) => splitSentences(`${r.d.title}. ${r.d.text}`).slice(0, 2))
    .slice(0, 3)
    .join(' ')
  return {
    answer,
    sources: ranked.map((r) => ({ id: r.d.id, title: r.d.title, score: Number(r.score.toFixed(3)) })),
  }
}
