/**
 * Server-seitige Such- & Discovery-Schicht (FEATURES-3 Kategorie 2).
 *
 * Bewusst ohne externen Index (Meilisearch/Algolia): lexikalische Suche über
 * SQLite-Zeilen mit Operatoren, Synonymen, Tippfehler-Toleranz, Snippets und
 * Facetten. Lässt sich später 1:1 gegen einen echten Index austauschen — die
 * Route bleibt gleich.
 */

const SYNONYM_CLUSTERS = [
  ['gta6', 'gta', 'gtavi', 'grand theft auto', 'gta 6', 'gta vi'],
  ['leak', 'leaks', 'gerücht', 'geruecht', 'rumor', 'rumour'],
  ['trailer', 'video', 'clip', 'teaser'],
  ['karte', 'map', 'leonida'],
  ['release', 'termin', 'erscheinungsdatum', 'launch', 'releasedatum'],
  ['charakter', 'character', 'protagonist', 'protagonistin'],
  ['soundtrack', 'musik', 'radio', 'radiosender', 'song'],
  ['rockstar', 'take-two', 'taketwo'],
]
const SYN = new Map()
for (const cluster of SYNONYM_CLUSTERS) {
  const set = new Set(cluster)
  for (const w of cluster) SYN.set(w, set)
}
function synonymsOf(term) {
  const s = SYN.get(term.toLowerCase())
  return s ? [...s] : [term.toLowerCase()]
}

export function levenshtein(a, b) {
  const m = a.length
  const n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  let curr = new Array(n + 1)
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
function tolerance(len) {
  return len <= 4 ? 0 : len <= 7 ? 1 : 2
}

export function parseQuery(input) {
  const raw = String(input || '').trim()
  const phrases = []
  const withoutPhrases = raw.replace(/"([^"]+)"/g, (_, p) => {
    phrases.push(p.trim().toLowerCase())
    return ` ${phrases.length - 1} `
  })
  const exclude = []
  const alternatives = []
  for (const part of withoutPhrases.split(/\s+OR\s+/i)) {
    const altPhrases = []
    const altWords = []
    for (const tokenRaw of part.split(/\s+/).filter(Boolean)) {
      const pm = tokenRaw.match(/^([0-9]+)$/)
      if (pm) {
        altPhrases.push(phrases[Number(pm[1])])
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

function wordMatches(word, tokens, text) {
  for (const syn of synonymsOf(word)) {
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

export function matchesQuery(text, parsed) {
  const lower = String(text || '').toLowerCase()
  const tokens = new Set(lower.split(/[^a-zà-ÿ0-9äöüß]+/i).filter(Boolean))
  for (const ex of parsed.exclude) if (lower.includes(ex) || tokens.has(ex)) return false
  if (parsed.alternatives.every((a) => !a.phrases.length && !a.words.length)) return true
  return parsed.alternatives.some((alt) => {
    if (alt.phrases.some((p) => !lower.includes(p))) return false
    return alt.words.every((w) => wordMatches(w, tokens, lower))
  })
}

export function lexicalScore(fields, parsed) {
  const terms = parsed.alternatives.flatMap((a) => [...a.words, ...a.phrases])
  if (!terms.length) return 0
  const title = (fields.title || '').toLowerCase()
  const body = (fields.body || '').toLowerCase()
  const tags = (fields.tags || '').toLowerCase()
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

export function makeSnippet(text, parsed, radius = 90) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  const terms = parsed.alternatives.flatMap((a) => [...a.phrases, ...a.words])
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

/**
 * Durchsucht Artikel und liefert gerankte Treffer (mit Snippet) plus Facetten.
 * `articles` sind bereits gemappte Objekte (rowToArticle).
 */
export function searchArticles(articles, query, { category, reliability, maxMinutes } = {}) {
  const parsed = parseQuery(query)
  const hasQuery = parsed.alternatives.some((a) => a.words.length || a.phrases.length) || parsed.exclude.length

  let pool = articles
  if (category && category !== 'all') pool = pool.filter((a) => a.category === category)
  if (reliability) pool = pool.filter((a) => a.reliability === reliability)
  if (maxMinutes) pool = pool.filter((a) => Math.max(1, Math.round((a.body || '').split(/\s+/).length / 200)) <= maxMinutes)

  let matched = pool
  if (hasQuery) {
    matched = pool.filter((a) =>
      matchesQuery(`${a.title} ${a.excerpt || ''} ${a.body || ''} ${(a.tags || []).join(' ')} ${a.source || ''}`, parsed),
    )
  }

  const results = matched
    .map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category,
      reliability: a.reliability || null,
      date: a.date,
      minutes: Math.max(1, Math.round((a.body || '').split(/\s+/).length / 200)),
      snippet: makeSnippet(a.body || a.excerpt || '', parsed),
      score: hasQuery
        ? lexicalScore({ title: a.title, body: `${a.excerpt} ${a.body}`, tags: (a.tags || []).join(' ') }, parsed)
        : 0,
    }))
    .sort((x, y) => y.score - x.score || y.date.localeCompare(x.date))

  return { results, total: results.length, facets: facetsFor(matched), parsed }
}

/** Facetten-Zähler über eine Artikelmenge. */
export function facetsFor(articles) {
  const bump = (map, key) => key && map.set(key, (map.get(key) || 0) + 1)
  const categories = new Map()
  const sources = new Map()
  const tags = new Map()
  const reliability = new Map()
  for (const a of articles) {
    bump(categories, a.category)
    bump(sources, a.source)
    bump(reliability, a.reliability)
    for (const tag of a.tags || []) bump(tags, tag)
  }
  const toArr = (m, limit) =>
    [...m.entries()].map(([value, count]) => ({ value, count })).sort((x, y) => y.count - x.count).slice(0, limit)
  return {
    categories: toArr(categories, 10),
    sources: toArr(sources, 10),
    tags: toArr(tags, 20),
    reliability: toArr(reliability, 5),
  }
}

/** Durchsucht Kommentar-Zeilen ({ text, ... }). */
export function searchComments(comments, query) {
  const parsed = parseQuery(query)
  return comments
    .filter((c) => matchesQuery(c.text || '', parsed))
    .map((c) => ({ ...c, snippet: makeSnippet(c.text || '', parsed) }))
}
