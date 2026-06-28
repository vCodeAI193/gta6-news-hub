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

---

## Wave 4 — Soziales & Community (`src/services/socialService.ts`, `/community`, `/nachrichten`, `/profil`)

### Decisions
- All social features are localStorage-only simulations. The contract (function
  signatures, data shapes) is designed to be drop-in replaceable with real API
  calls (a REST or WebSocket backend) without touching any UI component.
- Direct messages store a `from`/`to` pair with the constant `'ich'` as the
  current-user sentinel. This avoids a user-auth dependency while keeping the
  data model realistic.
- Community votes use an optimistic local-only write: the default vote tallies
  are seeded in the module so the UI never shows an empty poll. User votes are
  stored separately (`community:userVotes`) so toggling or re-voting is idempotent.
- Spotlight rotation is purely deterministic from the ISO week number — no
  stored state, no drift, instant testability.
- `getSpotlightMember` and `getDailyHighlights` return hardcoded arrays; this is
  honest — without a backend there is no real "best comment" algorithm. The
  function boundary makes it easy to replace with an API call later.
- Routes: `/profil` is a new `UserProfilePage` separate from the existing
  `/u/:id` `ProfilePage` (which is API-backed). This avoids a merge conflict
  while still showing the rich-profile feature.

### Critique (what is fake / weak)
- **No real-time.** DMs, group feeds, and events are all read from localStorage;
  there is no push mechanism. Two browser tabs will not sync.
- **No user identity.** The `'ich'` sentinel means everyone is the same user.
  A real auth context would replace this constant.
- **Vote tallies are not secure.** Nothing prevents a user from opening DevTools
  and editing `localStorage` to un-vote or stuff the ballot.
- **Block list is display-only.** `isBlocked` is exported but no UI currently
  hides blocked-user content from comment threads; that wiring is left for a
  later wave.
- **Community events have no RSVP or reminder system.** The calendar is purely
  informational.

### Improvement suggestions
- Replace `'ich'` with `useAuth().user.username` once the auth context stabilises.
- Add a BroadcastChannel for cross-tab sync of DMs (zero-dependency, works in
  all modern browsers).
- Add a `hiddenBy` field to comments so the block list actually filters content.
- Wire `reactToComment` into the existing `Comments` component (currently the
  `ReactionBar` component exists but is article-level, not comment-level).

---

## Wave 5 — Gamification & Belohnungen (`src/services/gamificationService.ts`, `/spielen`)

### Decisions
- All gamification state lives in a single `gamification:stats` localStorage key
  for simplicity; sub-keys (`gamification:questProgress`, `gamification:collectibles`)
  are used only where isolation matters (quests reset daily, collectibles grow
  monotonically).
- `getDailyQuests` is deterministic from a date string: `dayIndex(date) % pool.length`
  selects quests without any stored rotation state. This makes the function pure
  and trivially testable.
- `getLeaderboard` generates a deterministic synthetic leaderboard from a seed
  function (`deterministicXp`). The user's real XP is injected as the "Du" entry
  so the leaderboard reflects true progress. This is the honest approach: we
  never claim the other entries are real users.
- Quiz questions are static TypeScript arrays (`QUIZ_QUESTIONS`), not fetched.
  `getQuizQuestion(seed)` uses modular arithmetic so the seed wraps cleanly —
  the test explicitly verifies this.
- `openLootbox` is the one function that is intentionally non-deterministic (uses
  `Date.now() % total` as a seed), since randomness is core to the feature's
  perceived value. This is documented in the service file.
- Battle Pass uses a simple XP-threshold model (every 200 XP = one tier) rather
  than a separate "season XP" counter. This means earning XP anywhere in the app
  progresses the pass, creating a natural cross-feature reward loop.
- Bingo detection covers rows, columns, and both diagonals; XP is awarded once
  (guarded by `celebrated` state) even if multiple bingos occur later.

### Critique (what is fake / weak)
- **25 achievements, not "hundreds".** The spec says "Hunderte freischaltbare
  Abzeichen" — we shipped 25. Adding more is mechanical (extend the `ACHIEVEMENTS`
  array) but the unlock-check logic in `checkAndUnlockAchievements` needs expanding
  to cover more conditions (comment counts, article reads, etc.).
- **XP events are not wired end-to-end.** `addXp` is exported but only called
  from within `gamificationService` itself (via quests and quiz). The article,
  comment, and bookmark flows do not call it yet.
- **No streak tracking with date.** `UserStats.streak` is stored but never
  auto-incremented from a daily login check. A real implementation needs a
  "last-active date" field and a scheduled check (or a login-time check).
- **Leaderboard is synthetic.** The other 15 entries are not real users. Any
  user who opens DevTools will see `name: 'Vice_Fan99'` across all accounts.
- **Battle Pass has no expiry.** Season 1 never ends. A real pass needs a
  `seasonEndsAt` timestamp and a migration path for the next season.
- **`openLootbox` is not fair-drop guaranteed.** With only 10 collectibles and
  a `Date.now()` seed, the distribution is random but not pity-system-protected.

### Improvement suggestions
- Add `addXp` calls in `commentsService`, `readingHistoryService`, and
  `bookmarksService` to make XP truly cross-feature.
- Implement a daily login check in the app entry point (`main.tsx` or a
  `useEffect` in `Layout`) that calls `incrementStreak(today)` and guards with
  a `lastLoginDate` localStorage field.
- Extend `checkAndUnlockAchievements` to accept an `event: AchievementEvent`
  discriminated union (`{ type: 'comment' } | { type: 'read', count: number }`)
  so conditions can be checked at the call site without reading all stats.
- Add a `pityCounter` to `openLootbox`: after N commons in a row, guarantee
  at least a rare drop (standard gacha fair-play mechanism).

---

## Wave 6 — Moderation, Trust & Security (`src/services/moderationService.ts`, `/moderation`, `/sicherheit`)

### Decisions
- **All moderation is localStorage-only.** Shadow bans, trust scores, warning
  levels, audit logs, and GDPR operations all persist client-side. The same
  service interface drops into a real backend without changing callers.
- **Trust score is additive heuristic.** Starts at 50, gains points for
  activity/age/no-reports, loses for warnings/reports/shadow-ban. No ML —
  but the `computeTrustScore` signature accepts any stats object so a real
  backend can supply them.
- **Spam detection uses pattern matching.** Repeated chars (6+), >70% caps,
  and a short keyword list. Deliberately simple — real spam is more varied.
- **GDPR export/delete are stub implementations.** `exportUserData` only
  returns moderation-related data (warnings, ban status). A real DSGVO
  implementation must cover ALL namespaced localStorage keys for that user.
- **2FA UI is a placeholder.** The TOTP backend (`server/auth.mjs`) is real,
  but the SecurityPage shows a setup flow without a live QR generator —
  requires an actual TOTP library (e.g. `otpauth`) to compute the URI.

### Critique
- **Trust score is not cross-feature.** Comments, votes, and reads do not
  automatically call `computeTrustScore`; the caller must supply stats manually.
- **Shadow ban only hides from other users conceptually.** Since the app is a
  frontend SPA, shadow-banned content is not actually withheld from the feed —
  it requires a server-side filter on the comments/posts endpoints.
- **GDPR delete is incomplete.** Only clears moderation keys; does not iterate
  all `gta6hub_*` namespaced keys owned by the user.

### Improvement suggestions
- Integrate `computeTrustScore` as a computed property served by `/api/users/:id`
  so it aggregates real activity data from the SQLite backend.
- Wire shadow-ban into comment fetch: filter `getShadowBanned()` in
  `commentsService.getComments` so banned users' posts are invisible.
- Implement full GDPR export by scanning all `gta6hub_*` localStorage keys and
  returning values matching the user ID.
- Replace the 2FA placeholder with a real `otpauth` URI + a QR rendering
  library (e.g. `qrcode`) to complete the setup flow end-to-end.

---

## Wave 7 — Editorial & CMS (`src/lib/cms.ts`, enhanced `/admin`)

### Decisions
- **CMS enhancements are all client-side.** TOC generation, SEO analyzer,
  duplicate checker, template picker, media library, infobox builder, and
  AI writing suggestions all run in the browser using `src/lib/cms.ts`.
- **Markdown preview uses existing `react-markdown`.** No new dependency;
  the side-by-side editor/preview toggle reuses the component already used
  in `ArticlePage`.
- **Media library stores data URLs in localStorage.** Easy, zero-config.
  Impractical for production (localStorage limit ~5–10 MB), but the service
  interface is the same as a real upload endpoint.
- **Duplicate detection uses Jaccard similarity on word tokens.** Fast and
  dependency-free. Threshold 0.5 for warning. Same limitation as all
  bag-of-words approaches: paraphrases score near zero.
- **Writing suggestions are fully deterministic.** Based on simple keyword
  detection in the partial text, not an LLM call. With `ANTHROPIC_API_KEY`
  the same function could call the AI layer instead.

### Critique
- **SEO analyzer is rule-based.** No real keyword density analysis, no
  readability score, no structured data validation. The score is directional.
- **Revisions are not diff-based.** Full article body is stored per revision,
  not a diff patch. Storage cost grows linearly with edits.
- **Content calendar is a list, not a grid.** A real editorial calendar
  would show a monthly grid; this is a sorted list of scheduled articles.
- **Collaborative writing lock is not enforced.** The "lock" concept exists
  in `editorialApi` but the AdminPage does not prevent two tabs from editing
  simultaneously.

### Improvement suggestions
- Integrate `src/lib/aiLocal.ts` `summarize` into `writingSuggestions` for
  richer deterministic suggestions; swap for Claude when key is present.
- Replace full-body revision storage with a Myers diff patch (e.g. `diff`
  npm package) to reduce localStorage footprint.
- Add a real monthly grid to `ContentCalendar` using CSS grid with 7 columns.
- Wire duplicate detection into the publish flow: block publish (not just warn)
  if `duplicateScore > 0.7` and no override flag is set.

---

## Wave 8 — Media (`src/services/mediaService.ts`, `src/components/AudioPlayer.tsx`, etc.)

### Decisions
- **No real video hosting.** `VideoPlayer` wraps a `<video>` tag; actual HLS
  streaming requires a separate CDN/transcoding pipeline (e.g. Cloudflare
  Stream). The component is wired for a `src` URL and accepts chapter data.
- **Audio is simulated.** `MOCK_AUDIO_TRACKS` provides 6 sample tracks with
  metadata; there is no actual audio file. The `AudioPlayer` acts as a UI
  prototype and persistent mini-player driven by localStorage.
- **Gallery/Lightbox uses existing images.** `SlideshowGallery` and
  `ImageLightbox` are generic components that accept any image array. They
  reuse the project's standard image URLs (picsum etc.) in seed data.
- **A11y first.** All click handlers are on `<button>` elements (not `<div>`
  or `<li>`); `<video>` has an empty `<track kind="captions">` stub to
  satisfy `jsx-a11y/media-has-caption`. The lightbox backdrop is a transparent
  button positioned absolutely behind the content.

### Critique
- **HLS, adaptive streaming, transcoding** are all stub features — the UI
  exists but real implementation needs server infrastructure.
- **Media library is localStorage-only.** DataURLs hit the 5–10 MB storage
  limit quickly; a real CDN upload is needed.
- **Audio player has no actual audio.** Without real `.mp3` files behind the
  mock tracks, the "play" state is purely cosmetic.

### Improvement suggestions
- Wire `VideoPlayer` to an HLS.js instance for real adaptive streaming.
- Replace the media library with a multipart upload to `/api/media`, storing
  only the resulting CDN URL in localStorage.
- Add a podcast RSS feed at `/api/podcast.xml` that serves `AudioTrack` items.

---

## Wave 9 — Interactive Tools (`src/lib/interactiveTools.ts`, `src/routes/DatabasePage.tsx`, etc.)

### Decisions
- **Databases are hardcoded seed data.** Vehicle, weapon, edition, and timeline
  entries are static arrays in `interactiveTools.ts` — easy to replace with
  API calls later without changing consumers.
- **Hype meter is deterministic.** Computed from article counts filtered to
  the last 30 days; no ML, no real sentiment. Gives a defensible proxy metric.
- **Timeline uses string date comparison.** ISO-date strings sort correctly
  lexicographically, so no `Date` parsing is needed for ordering.
- **Soundtrack explorer** reuses `mediaService` and the persistent
  `AudioPlayer`; clicking "Abspielen" sets the now-playing track in localStorage.

### Critique
- **Interactive map** is not implemented — a real leaflet/mapbox integration
  is out of scope without map data.
- **Vehicle/weapon databases** are tiny (6 vehicles, 7 weapons). Real data
  would come from a dedicated API or a datamined game database.
- **Hype meter has no social signal.** Comment volume, reaction counts, and
  external social data would make it more meaningful.

### Improvement suggestions
- Move databases to `/api/vehicles`, `/api/weapons` backed by SQLite with
  full-text search so the DatabasePage can use the existing search endpoint.
- Add a Leaflet map component at `/karte` with marker clustering for fan-
  submitted POIs stored in the backend.
- Pull hype score into the WebSocket broadcast so all clients update live.

---

## Wave 10 — Notifications & Realtime (`src/services/notificationsService.ts`, `/benachrichtigungen`)

### Decisions
- **All notifications are client-side.** Inbox, preferences, quiet hours, and
  bundling all persist in localStorage. The `addInboxNotif` function already
  bundles duplicate notifications (same type+link within 5 minutes).
- **Favicon badge uses Canvas API.** `updateFavicon` draws the unread count
  onto a 32×32 canvas and replaces the `<link rel="icon">` href. Falls back
  silently if canvas is unavailable.
- **Quiet hours are enforced client-side.** `isQuietHours()` checks the
  current hour against the stored window — callers must check this before
  delivering a notification.
- **No real push server.** VAPID push, email, SMS, and Discord/Telegram bot
  stubs are documented in the FEATURES list but not wired — they require
  external services and credentials.

### Critique
- **Notifications have no source of truth.** Nothing in the app automatically
  calls `addInboxNotif`; the inbox will be empty until callers integrate.
- **Bundle logic is time-based only.** True batching would group by topic and
  deliver once per quiet-hours window end.
- **Favicon badge** requires the SVG favicon to be replaced by a canvas URL —
  this may break PWA icon references in the service worker manifest.

### Improvement suggestions
- Call `addInboxNotif` from `commentsService` on new replies, from
  `reactionsService` on reactions, and from `moderationService` on warnings.
- Implement server-side push via the existing WebSocket hub: on `broadcast`
  event, call the Notifications API (already wired in `miscServices.ts`).
- Export/import notification preferences as part of the GDPR data export.

---

## Wave 11 — Monetisation & Commerce (`src/services/subscriptionService.ts`, `/premium`)

### Decisions
- **No real payment processing.** `upgradePlan` stores the new plan in
  localStorage and records a mock payment. Stripe, crypto, and dunning workflow
  are documented stubs — they require external credentials and server endpoints.
- **Three-tier plan model.** Free / Plus / Pro with static feature lists in
  `PLANS`. Simple to extend: add a tier to the array, no code change elsewhere.
- **Coupon codes are hardcoded.** Three codes (`LAUNCH20`, `FANS10`, `VICE30`)
  give 20–30 % discounts. A real system would query a discount table.
- **Gift codes use a simple prefix check.** Any code starting with `GTA6-`
  activates Plus. Real codes need a cryptographically unique redemption flow.

### Critique
- **All subscription logic is client-side.** Nothing prevents the user from
  opening DevTools and writing `'pro'` directly to localStorage.
- **No real paywall enforcement.** The `isPremium()` guard is a suggestion;
  premium content is not actually withheld without a server-side check.
- **Refund flow is immediate.** Real dunning requires retry logic, webhook
  events from Stripe, and a grace period.

### Improvement suggestions
- Move subscription state to the JWT claims served by `/api/auth`; verify
  on each API call so the paywall is enforced server-side.
- Add a `POST /api/billing/portal` redirect to a Stripe Customer Portal for
  real subscription management.
- Generate unique gift codes server-side with expiry dates and redemption
  tracking, stored in the `billing` SQLite table.

---

## Wave 12 — Accounts, Identity & Privacy (`src/services/privacyService.ts`, `/datenschutz-dashboard`)

### Decisions
- **GDPR export iterates `gta6hub_*` localStorage keys.** This is the actual
  full export — all data in localStorage with our prefix — not a curated subset.
- **Consent is logged per purpose.** `recordConsent` appends an immutable log
  entry on each toggle; the log accumulates over time for audit purposes.
- **Age verification is honour-based.** The year field is unvalidated beyond
  computing `currentYear - birthYear >= 18`. Real age verification requires a
  third-party provider.
- **OAuth/Magic Link/Passkeys/SSO** are UI stubs — the backend (`server/auth.mjs`)
  already has JWT + 2FA (TOTP); extending it to social providers is a future
  integration task.

### Critique
- **Privacy dashboard controls are not enforced.** `showBookmarks: false` does
  not actually hide bookmarks from other users' views (no backend filter).
- **Cookie inventory is hardcoded.** A real scanner would enumerate all first-
  and third-party cookies at runtime. The list will rot as services are added.
- **Import is not validated.** `importUserData` writes any key starting with
  `gta6hub_` without schema validation, allowing corrupted data to overwrite
  valid state.

### Improvement suggestions
- Enforce privacy settings server-side: pass `profilePublic` in `/api/users/:id`
  response and filter accordingly in the social routes.
- Replace the hardcoded cookie list with a runtime scanner using
  `document.cookie` + known key prefixes.
- Validate imported data against Zod schemas before writing to localStorage.

---

## Wave 13 — Localisation & Accessibility (`src/lib/a11y.ts`, `/barrierefreiheit`)

### Decisions
- **Font family is applied via a CSS custom property.** `--font-family` is set
  on `<html>` element; all components inherit it. No class toggle needed.
- **High-contrast and reduced-motion** are applied via class toggles on `<html>`
  so CSS can target them with `html.high-contrast` and
  `html.force-reduced-motion` selectors. Separate from `prefers-reduced-motion`
  media query to allow explicit user override.
- **Locale formatting uses `Intl` APIs.** No date/number formatting library
  added — `Intl.DateTimeFormat` / `Intl.NumberFormat` cover all needs and are
  available in all target browsers.
- **Additional languages (ES/FR/PT/JP)** are infrastructure stubs. The i18n
  `DE/EN` translation system exists; extending it requires translation files
  which are not authored here.

### Critique
- **OpenDyslexic font is not bundled.** The dyslexia-friendly font falls back
  to Comic Sans MS if OpenDyslexic is not installed. A real implementation would
  self-host the font.
- **High-contrast CSS variables** are not defined in `index.css` yet; the class
  toggle works but has no visual effect without CSS rules targeting it.
- **Locale auto-detection** reads `navigator.language` once at startup; it does
  not react to language changes (which is fine for SSR but not for in-session
  switching).

### Improvement suggestions
- Add `@font-face` for OpenDyslexic from a self-hosted source.
- Define `html.high-contrast` CSS overrides: white background, black text,
  thick borders, no gradients.
- Extend the i18n system with at least partial ES and FR translations to make
  the multi-language support tangible rather than structural.
