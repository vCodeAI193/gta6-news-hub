// ===========================================================================
// GTA 6 News Hub — translation module (ADR-011)
// Talks to a SELF-HOSTED, LibreTranslate-compatible endpoint configured at
// runtime. No costs, no third-party: the user runs the engine on their own
// (German) server. Degrades gracefully to the original text when no endpoint
// is configured or the server is unreachable.
// ===========================================================================

// Thin localStorage wrapper mirroring app.js `Store` semantics (gta6_ prefix).
// `Store` is module-private in app.js, so we re-implement the minimal surface.
const L = {
  get(key, fb) { try { const v = localStorage.getItem('gta6_' + key); return v == null ? fb : JSON.parse(v); } catch { return fb; } },
  set(key, val) { try { localStorage.setItem('gta6_' + key, JSON.stringify(val)); } catch {} },
};

// --- Config ----------------------------------------------------------------
export function getEndpoint() { return (L.get('translateEndpoint', '') || '').trim(); }
export function setEndpoint(url) { L.set('translateEndpoint', (url || '').trim()); }
export function isTranslationEnabled() { return !!getEndpoint(); }

// Map UI lang ('en'/'de') and article lang ('EN'/'DE'/'FR'/'JP'/'Multi') to
// LibreTranslate ISO codes. Returns null for unmappable (caller skips).
const ISO = { EN: 'en', DE: 'de', FR: 'fr', JP: 'ja' };
export function toISO(code) {
  if (!code) return null;
  const c = String(code).trim();
  if (c.toLowerCase() === 'multi') return 'auto';
  if (ISO[c.toUpperCase()]) return ISO[c.toUpperCase()];
  const lower = c.toLowerCase();
  if (['en', 'de', 'fr', 'ja', 'es', 'it', 'pt'].includes(lower)) return lower;
  return null;
}

// --- Cache (synchronous, FIFO-evicted) -------------------------------------
function hash(str) {
  // FNV-1a 32-bit -> base36. Good enough for a non-critical cache key.
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}
function cacheKey(source, target, text) { return 'tr_' + source + '_' + target + '_' + hash(text); }

const MAX_CACHE = 300;
function cacheGet(key) { return L.get(key, null); }
function cachePut(key, value) {
  L.set(key, value);
  const idx = L.get('tr_index', []);
  if (!idx.includes(key)) {
    idx.push(key);
    while (idx.length > MAX_CACHE) {
      const old = idx.shift();
      try { localStorage.removeItem('gta6_' + old); } catch {}
    }
    L.set('tr_index', idx);
  }
}

// --- In-flight de-duplication ----------------------------------------------
const inflight = new Map();

// --- Network ---------------------------------------------------------------
// Translate an array of strings in one request. Resolves to a same-length
// array; on ANY failure resolves to the original `texts` (never rejects).
function requestBatch(texts, source, target) {
  const endpoint = getEndpoint();
  if (!endpoint) return Promise.resolve(texts);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  return fetch(endpoint.replace(/\/$/, '') + '/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: texts, source, target, format: 'text' }),
    signal: ctrl.signal,
  })
    .then((res) => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then((data) => {
      let out = data.translatedText;
      if (typeof out === 'string') out = [out];          // single-string servers
      if (!Array.isArray(out) || out.length !== texts.length) throw new Error('shape');
      return out;
    })
    .catch(() => texts) // graceful degradation
    .finally(() => clearTimeout(timer));
}

// Translate a single string (used by feed cards / endpoint test).
export function translateText(text, source, target) {
  if (!text || source === target || !isTranslationEnabled()) return Promise.resolve(text);
  const s = toISO(source), tg = toISO(target);
  if (!s || !tg || s === tg) return Promise.resolve(text);
  const key = cacheKey(s, tg, text);
  const cached = cacheGet(key);
  if (cached != null) return Promise.resolve(cached);
  if (inflight.has(key)) return inflight.get(key);
  const p = requestBatch([text], s, tg).then((arr) => {
    const out = arr[0];
    if (out && out !== text) cachePut(key, out);
    return out;
  }).finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

// Translate a whole article (title + excerpt + body paragraphs) in one request,
// reusing per-segment cache. Returns { title, excerpt, body } (translated or
// original on failure). NEVER mutates the source article.
export function translateArticle(article, target) {
  const s = toISO(article.lang), tg = toISO(target);
  const orig = { title: article.title, excerpt: article.excerpt, body: article.body };
  if (!s || !tg || s === tg || !isTranslationEnabled()) return Promise.resolve(orig);

  const paras = article.body.split('\n\n');
  const segments = [article.title, article.excerpt, ...paras];

  // Resolve from cache where possible; collect the misses for one batch call.
  const keys = segments.map((seg) => cacheKey(s, tg, seg));
  const result = segments.map((seg, i) => cacheGet(keys[i]));
  const missIdx = [];
  result.forEach((v, i) => { if (v == null) missIdx.push(i); });

  const finish = () => ({
    title: result[0] || orig.title,
    excerpt: result[1] || orig.excerpt,
    body: result.slice(2).map((p, i) => p || paras[i]).join('\n\n'),
  });

  if (missIdx.length === 0) return Promise.resolve(finish());

  return requestBatch(missIdx.map((i) => segments[i]), s, tg).then((translated) => {
    translated.forEach((tr, j) => {
      const i = missIdx[j];
      result[i] = tr;
      if (tr && tr !== segments[i]) cachePut(keys[i], tr);
    });
    return finish();
  });
}

// Probe the endpoint for the Preferences "Test" button. Resolves true/false.
export function testEndpoint(url) {
  const clean = (url || '').trim().replace(/\/$/, '');
  if (!/^https?:\/\/.+/.test(clean)) return Promise.resolve(false);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  return fetch(clean + '/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: 'hello', source: 'en', target: 'de', format: 'text' }),
    signal: ctrl.signal,
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => clearTimeout(timer));
}
