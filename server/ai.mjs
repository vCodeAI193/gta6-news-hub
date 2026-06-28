/**
 * KI- & Automatisierungs-Schicht (Welle 1, FEATURES-3 Kategorie 1).
 *
 * Zwei Betriebsarten:
 *  - **Heuristik (Standard, ohne Key)**: deterministische, rein funktionale
 *    Verfahren (Extraktion, TF-Gewichtung, Lexikon-Sentiment, Token-Cosinus).
 *    Damit funktionieren alle KI-Features auch komplett offline und sind
 *    testbar — ohne Netz, ohne externe Kosten.
 *  - **Anthropic (aktiv mit `ANTHROPIC_API_KEY`)**: dieselben Aufgaben werden
 *    an ein Claude-Modell delegiert und liefern bessere Ergebnisse. Fehlt der
 *    Key, bleibt die Schicht „verdrahtet, aber inaktiv" und fällt nahtlos auf
 *    die Heuristik zurück.
 *
 * Die reinen Heuristiken sind synchron exportiert (gut testbar); die Routen
 * nutzen `withAi(...)`, das bei vorhandenem Key Claude bevorzugt.
 */

const MODEL = process.env.AI_MODEL || 'claude-haiku-4-5-20251001'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

export function aiAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

export function aiStatus() {
  return {
    available: aiAvailable(),
    provider: aiAvailable() ? 'anthropic' : 'heuristic',
    model: aiAvailable() ? MODEL : 'lokal/heuristisch',
  }
}

// ----------------------------------------------------------------- Textbasics

const STOPWORDS = new Set([
  'der', 'die', 'das', 'und', 'oder', 'aber', 'mit', 'von', 'für', 'auf', 'ist',
  'im', 'in', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer',
  'zu', 'zum', 'zur', 'auch', 'als', 'am', 'an', 'sich', 'es', 'sie', 'er',
  'wir', 'ihr', 'sind', 'war', 'wird', 'werden', 'hat', 'haben', 'nicht',
  'noch', 'schon', 'nur', 'so', 'wie', 'was', 'wenn', 'dann', 'dass', 'man',
  'bei', 'aus', 'nach', 'über', 'unter', 'vor', 'durch', 'gibt', 'mehr', 'sehr',
  'the', 'and', 'for', 'with', 'this', 'that', 'are', 'was', 'has', 'have',
])

/** Zerlegt Text in normalisierte Wort-Token (ohne Stoppwörter, ≥3 Zeichen). */
export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-zà-ÿ0-9äöüß\s-]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
}

/** Teilt Text grob in Sätze. */
export function splitSentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<!\b\d{1,2}[.!?])(?<=[.!?])\s+(?=[A-ZÄÖÜ])/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function termFrequencies(tokens) {
  const tf = new Map()
  for (const w of tokens) tf.set(w, (tf.get(w) || 0) + 1)
  return tf
}

// ----------------------------------------------------- 1. Zusammenfassung (TL;DR)

/**
 * Extraktive Zusammenfassung: bewertet Sätze nach Häufigkeit ihrer wichtigsten
 * Wörter und nach Position (frühe Sätze tragen mehr). Liefert die n stärksten
 * in Originalreihenfolge.
 */
export function summarize(text, { sentences = 2 } = {}) {
  const all = splitSentences(text)
  if (all.length <= sentences) return all.join(' ')
  const tf = termFrequencies(tokenize(text))
  const scored = all.map((s, i) => {
    const words = tokenize(s)
    const base = words.reduce((sum, w) => sum + (tf.get(w) || 0), 0) / (words.length || 1)
    const positionBoost = 1 + (all.length - i) / (all.length * 4) // frühe Sätze leicht bevorzugt
    return { i, s, score: base * positionBoost }
  })
  const top = [...scored].sort((a, b) => b.score - a.score).slice(0, sentences)
  return top.sort((a, b) => a.i - b.i).map((x) => x.s).join(' ')
}

// ------------------------------------------------------------ 2. Auto-Tagging

/** Leitet bis zu `max` Schlagworte aus dem Text ab (häufigste Inhaltswörter). */
export function autoTag(text, { max = 6 } = {}) {
  const tf = termFrequencies(tokenize(text))
  return [...tf.entries()]
    .filter(([w]) => w.length >= 4)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, max)
    .map(([w]) => w)
}

// ----------------------------------------------- 3. Semantik / „Embedding"-Cosinus

/** Sehr einfacher Term-Vektor (Bag-of-Words) als Ersatz für echte Embeddings. */
export function embed(text) {
  return termFrequencies(tokenize(text))
}

export function cosineSim(a, b) {
  let dot = 0
  let na = 0
  let nb = 0
  for (const [, v] of a) na += v * v
  for (const [, v] of b) nb += v * v
  for (const [k, v] of a) if (b.has(k)) dot += v * b.get(k)
  if (!na || !nb) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

/** Rangliste von Items (mit `.text`) nach semantischer Nähe zur Anfrage. */
export function semanticRank(query, items, { limit = 5 } = {}) {
  const q = embed(query)
  return items
    .map((it) => ({ item: it, score: cosineSim(q, embed(it.text || '')) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

// ------------------------------------------------------------- 7. Sentiment

const POS_WORDS = new Set([
  'gut', 'super', 'toll', 'genial', 'klasse', 'mega', 'hype', 'freude', 'liebe',
  'beste', 'perfekt', 'spannend', 'hammer', 'wow', 'danke', 'cool', 'stark',
  'großartig', 'fantastisch', 'gespannt', 'endlich', 'freue',
])
const NEG_WORDS = new Set([
  'schlecht', 'mies', 'enttäuscht', 'enttäuschend', 'hass', 'müll', 'langweilig',
  'fake', 'lüge', 'unsinn', 'schade', 'nervt', 'flop', 'katastrophe', 'wut',
  'betrug', 'verschiebung', 'fehler', 'bug', 'desaster', 'unfair',
])

/** Lexikon-basierte Stimmungsanalyse → label + Score in [-1, 1]. */
export function analyzeSentiment(text) {
  const tokens = tokenize(text)
  let score = 0
  for (const w of tokens) {
    if (POS_WORDS.has(w)) score += 1
    if (NEG_WORDS.has(w)) score -= 1
  }
  const norm = tokens.length ? Math.max(-1, Math.min(1, score / Math.sqrt(tokens.length))) : 0
  const label = norm > 0.15 ? 'positiv' : norm < -0.15 ? 'negativ' : 'neutral'
  return { label, score: Number(norm.toFixed(3)) }
}

// ---------------------------------------------------------- 6. Auto-Moderation

const TOXIC = ['idiot', 'arschloch', 'hurensohn', 'wichser', 'nazi', 'spast', 'fotze']

/** Markiert toxische/Spam-Kommentare. Liefert flagged + Gründe + Konfidenz. */
export function moderateText(text) {
  const lower = String(text || '').toLowerCase()
  const reasons = []
  if (TOXIC.some((w) => lower.includes(w))) reasons.push('Beleidigung/Toxizität')
  const links = (lower.match(/https?:\/\//g) || []).length
  if (links >= 3) reasons.push('Zu viele Links (Spam-Verdacht)')
  if (lower.length > 20 && lower === lower.toUpperCase()) reasons.push('Durchgehend Großbuchstaben')
  if (/(.)\1{6,}/.test(lower)) reasons.push('Zeichenwiederholung')
  const { label } = analyzeSentiment(text)
  return {
    flagged: reasons.length > 0,
    severity: reasons.length >= 2 ? 'hoch' : reasons.length === 1 ? 'mittel' : 'keine',
    sentiment: label,
    reasons,
  }
}

// --------------------------------------------------------- 14. Lesbarkeit

function countSyllables(word) {
  const groups = word.toLowerCase().match(/[aeiouyäöü]+/g)
  return Math.max(1, groups ? groups.length : 1)
}

/**
 * Flesch-Reading-Ease (deutsche Variante) → Score + Schwierigkeitslabel +
 * geschätzte Lesezeit (200 WPM).
 */
export function readability(text) {
  const sentences = splitSentences(text)
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const syllables = words.reduce((s, w) => s + countSyllables(w), 0)
  const sCount = Math.max(1, sentences.length)
  const wCount = Math.max(1, words.length)
  const flesch = 180 - wCount / sCount - 58.5 * (syllables / wCount)
  const score = Math.max(0, Math.min(100, Math.round(flesch)))
  const level = score >= 70 ? 'leicht' : score >= 50 ? 'mittel' : 'schwer'
  return { score, level, words: wCount, minutes: Math.max(1, Math.round(wCount / 200)) }
}

// ----------------------------------------------- 9. Titel-/Teaser-Vorschläge

/** Generiert Titel- und Teaser-Vorschläge aus dem Text (heuristisch). */
export function titleSuggestions(text, { max = 3 } = {}) {
  const tags = autoTag(text, { max: 4 }).map((w) => w[0].toUpperCase() + w.slice(1))
  const first = splitSentences(text)[0] || ''
  const lead = first.length > 70 ? first.slice(0, 67).trimEnd() + '…' : first
  const out = []
  if (tags.length) out.push(`${tags[0]}: Das musst du wissen`)
  if (tags.length >= 2) out.push(`GTA 6 & ${tags[1]} — alle Infos im Überblick`)
  if (lead) out.push(lead)
  return out.slice(0, max)
}

export function teaser(text, { chars = 160 } = {}) {
  const s = summarize(text, { sentences: 1 })
  return s.length > chars ? s.slice(0, chars - 1).trimEnd() + '…' : s
}

// -------------------------------------------------------- 10. Alt-Text-Generator

/** Erzeugt eine knappe Bildbeschreibung (Barrierefreiheit) aus Titel/Kategorie. */
export function altText(title, category = '') {
  const cat = { trailer: 'Trailer-Standbild', leak: 'mutmaßlicher Leak', release: 'Release-Grafik', official: 'offizielles Artwork' }[category] || 'Artikelbild'
  return `${cat} zu „${String(title || '').trim()}" – GTA 6 News Hub`.replace(/\s+/g, ' ')
}

// ------------------------------------------------------------ 18. SEO-Assistent

export function seoSuggest(title, text) {
  const description = teaser(text, { chars: 155 })
  const keywords = ['gta 6', 'gta vi', 'rockstar', ...autoTag(`${title} ${text}`, { max: 6 })]
  return { description, keywords: [...new Set(keywords)].slice(0, 8) }
}

// --------------------------------------------------------- 19. Quellenbewertung

const TRUSTED = ['rockstargames.com', 'rockstar', 'take-two', 'ign', 'gamestar', 'gamespot', 'eurogamer', 'vgc']
const SHAKY = ['reddit', 'twitter', 'x.com', '4chan', 'telegram', 'anonym', 'leak']

/** Schätzt Glaubwürdigkeit einer Quelle (0–100) anhand bekannter Muster. */
export function sourceCredibility(source) {
  const s = String(source || '').toLowerCase()
  let score = 50
  if (TRUSTED.some((t) => s.includes(t))) score += 35
  if (SHAKY.some((t) => s.includes(t))) score -= 25
  if (/^https?:\/\//.test(s)) score += 5
  score = Math.max(5, Math.min(100, score))
  const label = score >= 75 ? 'verlässlich' : score >= 45 ? 'mit Vorsicht' : 'unbestätigt'
  return { score, label }
}

// ------------------------------------------------------- 11. Faktencheck-Assistent

/**
 * Plausibilisiert eine Behauptung gegen einen Korpus bekannter Aussagen
 * (semantische Nähe). Liefert verdict + Belegstellen.
 */
export function factCheck(claim, corpus = []) {
  const matches = semanticRank(claim, corpus.map((c) => ({ text: c.text, ref: c })), { limit: 3 })
  const best = matches[0]?.score || 0
  const verdict = best >= 0.35 ? 'gestützt' : best >= 0.15 ? 'teils belegt' : 'unbestätigt'
  return {
    verdict,
    confidence: Number(best.toFixed(3)),
    evidence: matches.map((m) => ({ text: m.item.text, score: Number(m.score.toFixed(3)) })),
  }
}

// ----------------------------------------------------------- 8. Duplikaterkennung

/** Bündelt ähnliche Items (mit `.id`/`.text`) zu Clustern (Cosinus ≥ threshold). */
export function detectDuplicates(items, { threshold = 0.6 } = {}) {
  const vecs = items.map((it) => ({ it, v: embed(it.text || it.title || '') }))
  const used = new Set()
  const groups = []
  for (let i = 0; i < vecs.length; i++) {
    if (used.has(i)) continue
    const group = [vecs[i].it]
    used.add(i)
    for (let j = i + 1; j < vecs.length; j++) {
      if (used.has(j)) continue
      if (cosineSim(vecs[i].v, vecs[j].v) >= threshold) {
        group.push(vecs[j].it)
        used.add(j)
      }
    }
    if (group.length > 1) groups.push(group)
  }
  return groups
}

// --------------------------------------------------------- 13. Tagesbriefing

/** Baut ein kurzes Tagesbriefing aus den jüngsten Artikeln. */
export function briefing(articles, { max = 5 } = {}) {
  const recent = [...articles]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, max)
  return {
    date: recent[0]?.date || null,
    intro: `Dein GTA-6-Tagesbriefing: ${recent.length} aktuelle Meldungen.`,
    items: recent.map((a) => ({ id: a.id, title: a.title, tldr: summarize(a.body || a.excerpt || '', { sentences: 1 }) })),
  }
}

// --------------------------------------------------------- 16. Podcast-Skript

/** Erzeugt ein Podcast-Skript (Intro, Segmente, Outro) aus Artikeln. */
export function podcastScript(articles, { max = 4 } = {}) {
  const picked = articles.slice(0, max)
  const segments = picked.map((a, i) => ({
    headline: a.title,
    script: `Segment ${i + 1}: ${a.title}. ${summarize(a.body || a.excerpt || '', { sentences: 2 })}`,
  }))
  return {
    intro: 'Willkommen beim GTA 6 News Hub Podcast – hier sind die wichtigsten Meldungen.',
    segments,
    outro: 'Das war\'s für heute. Bleib dran für mehr News rund um GTA 6!',
  }
}

// ------------------------------------------------ 15. Kommentar-Zusammenfassung

/** Fasst eine Kommentar-Liste zusammen: Stimmung + Top-Themen. */
export function summarizeComments(comments) {
  if (!comments.length) return { count: 0, sentiment: 'neutral', themes: [], gist: 'Noch keine Kommentare.' }
  const joined = comments.map((c) => c.text || '').join(' ')
  const sentiment = analyzeSentiment(joined)
  const themes = autoTag(joined, { max: 5 })
  const pos = comments.filter((c) => analyzeSentiment(c.text || '').label === 'positiv').length
  const neg = comments.filter((c) => analyzeSentiment(c.text || '').label === 'negativ').length
  return {
    count: comments.length,
    sentiment: sentiment.label,
    themes,
    gist: `${comments.length} Kommentare, Stimmung überwiegend ${sentiment.label} (${pos}👍/${neg}👎). Themen: ${themes.slice(0, 3).join(', ') || '—'}.`,
  }
}

// ------------------------------------------------------- 12. Trendvorhersage

/** Erkennt aufkommende Themen aus (gewichteten) Tag-/Suchbegriff-Zählungen. */
export function emergingTrends(counts, { limit = 8 } = {}) {
  // counts: [{ term, count, prev? }]; momentum = count - prev
  return counts
    .map((c) => ({ term: c.term, count: c.count, momentum: c.count - (c.prev || 0) }))
    .sort((a, b) => b.momentum - a.momentum || b.count - a.count)
    .slice(0, limit)
}

// ------------------------------------------------------- 5. Übersetzung (Stub)

const PHRASES = {
  en: { 'GTA 6 News Hub': 'GTA 6 News Hub', Leak: 'leak', Trailer: 'trailer', Release: 'release' },
}

/**
 * Heuristische „Übersetzung": ohne Key nur ein gekennzeichneter Pass-through
 * (echte Übersetzung erfolgt via Anthropic, sobald ein Key gesetzt ist).
 */
export function translateHeuristic(text, lang) {
  return { lang, text, machine: false, note: 'Übersetzung benötigt einen ANTHROPIC_API_KEY (sonst Originaltext).' }
}

// ------------------------------------------------------- 4. RAG-Chat „Frag den Hub"

/**
 * Retrieval-augmentierte Antwort ohne Modell: findet die relevantesten Artikel
 * (Cosinus) und setzt eine extraktive Antwort aus deren stärksten Sätzen
 * zusammen. Mit Key übernimmt Claude die Formulierung.
 */
export function ragAnswer(question, articles, { topK = 3 } = {}) {
  const ranked = semanticRank(
    question,
    articles.map((a) => ({ text: `${a.title} ${a.body || a.excerpt || ''}`, ref: a })),
    { limit: topK },
  )
  if (!ranked.length) {
    return { answer: 'Dazu habe ich in den Artikeln nichts gefunden.', sources: [] }
  }
  const sentences = ranked.flatMap((r) =>
    splitSentences(r.item.text).slice(0, 2).map((s) => ({ s, ref: r.item.ref })),
  )
  const answer = sentences.slice(0, 3).map((x) => x.s).join(' ')
  const sources = ranked.map((r) => ({ id: r.item.ref.id, title: r.item.ref.title, score: Number(r.score.toFixed(3)) }))
  return { answer, sources }
}

// ----------------------------------------------------------- Anthropic-Aufruf

/**
 * Ruft das Claude-Modell auf (nur mit Key). Liefert Text oder wirft. Wird von
 * `withAi` umschlossen, sodass Fehler still auf die Heuristik zurückfallen.
 */
export async function callAnthropic(system, user, { maxTokens = 512 } = {}) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('no key')
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  if (!res.ok) throw new Error(`anthropic ${res.status}`)
  const data = await res.json()
  return data?.content?.[0]?.text?.trim() || ''
}

/**
 * Führt eine Aufgabe aus: bei vorhandenem Key via Claude (mit Mapping der
 * Antwort), sonst über die übergebene Heuristik. Bei jedem Fehler (Netz, Quota)
 * greift ebenfalls die Heuristik — die App bleibt immer funktionsfähig.
 */
export async function withAi({ system, user, maxTokens, map }, heuristic) {
  if (!aiAvailable()) return { ...heuristic, provider: 'heuristic' }
  try {
    const raw = await callAnthropic(system, user, { maxTokens })
    return { ...(map ? map(raw) : { text: raw }), provider: 'anthropic' }
  } catch {
    return { ...heuristic, provider: 'heuristic', fallback: true }
  }
}
