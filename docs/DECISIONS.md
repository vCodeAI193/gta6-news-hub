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

## Wave 3 — Personalisation & Recommendations (`src/lib/recommendation.ts`, `/fuer-dich`)

### Decisions
- **Pure scoring module.** `src/lib/recommendation.ts` contains only pure
  functions with no side effects and no imports from services. This keeps the
  algorithm independently testable and reusable in any context (component,
  worker, test).
- **Score formula.** `scoreArticle` adds: +10 category match, +2 per matching
  tag, +2–8 recency bonus (1/3/7 days), +3 featured, +2 confirmed reliability,
  −15 already read. Hidden items return −Infinity and are filtered out before
  sorting. Weights are heuristic-tuned, not learned from real user cohorts.
- **All state in localStorage.** Reading history (`readingHistoryService`),
  scroll positions, hidden tags/sources (`hiddenTopicsService`), and goals
  (`readingGoalsService`) all persist in namespaced localStorage keys via the
  existing `storage.ts` layer. No backend round-trips needed for personalisation.
- **Time-of-day dark mode.** Added `isNightTime()` to `ThemeContext`: when mode
  is `'system'`, hours outside 6–20 force dark regardless of the OS preference.
  Explicit `'dark'` / `'light'` user choices are unaffected — purely additive.
- **Scroll-position tracking in ArticlePage.** A passive scroll listener
  computes `scrollY / (scrollHeight - innerHeight)` as a percentage and calls
  `savePosition` on every scroll event. On mount, if the last position was > 10%,
  the page smoothly restores it after a 300 ms delay (needed to let React finish
  rendering the article body).
- **"Weil du X gelesen hast" badge.** `explainRecommendation` tries in order:
  (1) interest category match, (2) tag from the article, (3) generic fallback.
  Displayed as a coloured label above each card in `ForYouFeed`.
- **`moodFilter`.** 'fakten' = `reliability === 'confirmed'`; 'positiv' = that
  OR `category === 'official'`; 'alle' = passthrough. Mood filter and the
  time-save toggle are independent and compose.

### Critique (what is fake / weak)
- **Scoring is not ML.** Despite the section heading, the engine is a rule-based
  weighted sum, not a learned model. Category/tag weights are hard-coded;
  there is no gradient descent, no collaborative filtering, no user cohort.
- **Reading history is local-only.** History lives in the user's browser;
  opening a different device starts fresh. Cross-device sync would require a
  backend and authenticated sessions.
- **Streak can miss a day on DST transitions.** `startOfDay` uses
  wall-clock local time; on daylight-saving switches, a "day" boundary can be
  23 or 25 hours — a rarely-used but technically wrong edge case.
- **"Empfohlene Mitglieder" (recommended members) is mapped to article
  recommendations.** The feature description calls for people-following; this
  implementation shows article recommendations instead, which is strictly a
  subset of the intent.
- **Auto dark/light time window is fixed (6–20).** No user config, no
  geolocation-based sunset/sunrise; a simple but blunt heuristic.
- **Weekly digest is display-only.** The "Personalisierte Empfehlungs-E-Mails"
  feature renders a digest card in-browser but cannot send an actual e-mail
  without a backend mailer provider.

### Improvement suggestions
- Persist reading history server-side (keyed by auth session) to enable
  cross-device continuity and real collaborative filtering.
- Replace the hand-tuned weight vector with an online bandit (e.g. ε-greedy on
  click-through) once user volume justifies the investment.
- Compute sunset/sunrise from latitude/longitude (via a lightweight
  `suncalc`-style formula) for the auto-dark feature instead of a fixed hour.
- Make the daily/weekly goal configurable in the Settings page (wired up to
  `readingGoalsService.setGoal`).
- Wire `WeeklyDigest` content to a real e-mail endpoint (e.g. SendGrid /
  Resend) behind a backend route so the "inert" e-mail feature lights up when
  a provider key is configured.
- Add a "Nicht mehr anzeigen"-button directly on article cards in `ForYouFeed`
  so users can hide without going to the settings sidebar.

---

## Process notes
- Backend tests use Node's built-in runner (`node --test`) because Vite can't
  transform `node:sqlite`; frontend tests use Vitest. Keep them separate.
- Verification gate per wave: `tsc -b` → `lint` (0 errors) → frontend tests →
  backend tests → `build` → live curl of new endpoints → screenshots if UI.
- Watch for stray control characters in regex/template literals introduced
  during file authoring — `grep -nP '[\x00-\x08\x0e-\x1f]'` over changed files
  is a cheap guard and caught a real bug in Wave 2.
