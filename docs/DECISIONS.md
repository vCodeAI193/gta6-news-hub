# Engineering Decisions, Critique & Improvement Backlog

> Working log for the FEATURES-3 implementation waves. Written in English on
> request. Each wave records the **decisions** made, an honest **critique** of
> what is real vs. faked, and concrete **improvement suggestions** for later.
> The German `FEATURES-*.md` files track *what* is done; this file tracks *why*
> and *what is still weak*.

## Cross-cutting principles

- **Two-mode design.** Every feature that "wants" an external service ships with
  a deterministic local fallback so the app is fully functional offline and in
  CI, and lights up the real integration when a key/URL is configured. Concrete
  switches: `VITE_API_URL` (frontend → backend) and `ANTHROPIC_API_KEY`
  (backend → Claude).
- **Pure core, thin shell.** Algorithms live in pure, unit-tested modules
  (`src/lib/*`, `server/*.mjs`); routes/components stay thin. This keeps tests
  fast (no network) and logic portable.
- **No silent failure.** API clients catch and fall back to local logic rather
  than throwing into the UI.
- **Honest labelling.** Heuristic results are marked as such in the UI (e.g. the
  AI "mode" indicator) so we never imply more intelligence than is present.

---

## Wave 1 — AI & Automation (`server/ai.mjs`, `/api/ai/*`)

### Decisions
- Built one AI layer with a `withAi()` wrapper: prefer Claude when a key exists,
  otherwise run a deterministic heuristic; any API error also falls back.
- Heuristics chosen to be defensible, not toy: extractive summarisation (TF +
  position), bag-of-words cosine for "semantic" search/RAG/dedup, lexicon
  sentiment, Flesch-DE readability, rule-based moderation.
- Backend tests assert the **heuristics**; the Claude path is wired but not
  exercised in CI (no key, by design).
- Picked `claude-haiku-4-5` as the default model — cheap/fast suits these
  short utility calls; overridable via `AI_MODEL`.

### Critique (what is fake / weak)
- **"Semantic" search is lexical.** Bag-of-words cosine has no real semantic
  understanding — synonyms/paraphrases that don't share tokens score ~0. It is a
  keyword-overlap proxy, not embeddings.
- **RAG retrieval is shallow.** Same cosine limitation; the extractive answer is
  just the top sentences concatenated — can read disjointed without the LLM.
- **Sentiment/ moderation lexicons are tiny and German-only**; trivially evaded
  and prone to false negatives. Not safe as a sole moderation gate.
- **Duplicate detection** threshold (0.6) is untuned against real data.
- **No caching / rate limiting** on AI endpoints — with a key, repeated
  summaries re-call the model every time.

### Improvement suggestions
- Swap bag-of-words for real embeddings (e.g. an embeddings endpoint or a local
  model) behind the same `semanticRank` interface; persist vectors in SQLite.
- Cache AI outputs keyed by `(task, contentHash, model)`; add a per-IP limiter
  reusing `server/rateLimit.mjs`.
- Stream chat responses (SSE) for the "Frag den Hub" page instead of awaiting
  the full answer.
- Make moderation a two-stage gate (cheap heuristic → LLM only on borderline
  cases) and log decisions to `audit_log`.
- Proxy support: Node's global `fetch` ignores `HTTPS_PROXY`; wire an
  undici `EnvHttpProxyAgent` so the Claude call works behind the agent proxy.

---

## Wave 2 — Search & Discovery (`server/search.mjs`, `src/lib/searchQuery.ts`)

### Decisions
- **No external search index.** Implemented operators + synonyms + typo
  tolerance + snippets + facets directly over SQLite rows / in-memory articles.
  The route shape (`/api/search`) is index-agnostic, so Meilisearch/Algolia can
  drop in later without touching callers.
- **Shared query engine, duplicated in two languages.** `src/lib/searchQuery.ts`
  (TS, frontend fallback) and `server/search.mjs` (JS, backend) implement the
  same parser/matcher. Chosen over a shared package because the frontend is Vite
  and the backend deliberately avoids a build step / can't import TS.
- **Operators:** `"phrase"`, `-exclude`, `a OR b`; default is AND. Synonyms are a
  small hand-curated GTA-domain map; typo tolerance is Levenshtein with a
  length-scaled threshold (0 for ≤4 chars, 1 for ≤7, else 2).
- **Discovery is deterministic.** "Surprise me", the discovery stream and cover
  generation all derive from an FNV seed hash so results are stable across
  reloads and testable (no `Math.random`).
- **Saved searches & search stats are client-side** (localStorage). "New hits"
  is computed by comparing the current total against the count stored when the
  search was saved — i.e. *polling on view*, not push.
- Reused existing CSS primitives (`.grid`, `.chip`, `.tab`, `.feed__more`)
  instead of inventing parallel classes.

### Critique (what is fake / weak)
- **Logic is duplicated** between TS and JS — the two can drift. (A subtle
  control-character corruption slipped into one regex during authoring and was
  only caught by lint + tests; see "process notes".)
- **Ranking is naive.** `lexicalScore` = weighted substring hits (title 3 / tag
  2 / body 1). No TF-IDF, no field-length normalisation, no recency blending —
  long articles and stuffed tags can over-rank.
- **Reverse-image search is not image search.** It approximates "similar
  screenshots" via category + tag overlap. No perceptual hashing or pixels.
- **Saved-search notifications are not real subscriptions.** No background job,
  no push; the badge only updates when the user reopens the search page.
- **Comment & lore search coverage differs by mode.** Comment search needs the
  backend (local fallback returns `[]`); lore search is frontend-only. So
  results depend on whether `VITE_API_URL` is set.
- **Synonyms are hand-maintained** and tiny; unknown domain terms get no
  expansion. Typo tolerance can also create false positives on short tokens.
- **Voice search** depends on the browser's Web Speech API (Chromium-only-ish)
  and is silently hidden where unsupported.

### Improvement suggestions
- Extract the query engine into **one** module consumed by both sides (e.g.
  ship the backend as TS-compiled, or run the frontend fallback through the same
  `.mjs` via a tiny adapter) to kill the duplication.
- Move to **TF-IDF / BM25** scoring with length normalisation; blend a recency
  decay so fresh news surfaces. Add a relevance-vs-date sort toggle (UI already
  has the slot).
- Back saved searches with a real subscription: persist server-side, run a
  periodic diff, deliver via the existing notifications/WebSocket hub.
- Generate synonyms from the corpus (co-occurrence / embeddings) instead of a
  hand list; consider a stemmer for German.
- Real reverse-image search would need perceptual hashes (aHash/pHash) stored
  per image, then Hamming-distance lookup — feasible but out of scope here.
- Add an integration test that runs the SAME query corpus through both the TS
  and JS engines and asserts identical results, to catch drift automatically.

---

## Process notes
- Backend tests use Node's built-in runner (`node --test`) because Vite can't
  transform `node:sqlite`; frontend tests use Vitest. Keep them separate.
- Verification gate per wave: `tsc -b` → `lint` (0 errors) → frontend tests →
  backend tests → `build` → live curl of new endpoints → screenshots if UI.
- Watch for stray control characters in regex/template literals introduced
  during file authoring — `grep -nP '[\x00-\x08\x0e-\x1f]'` over changed files
  is a cheap guard and caught a real bug in Wave 2.
