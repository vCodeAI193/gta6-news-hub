# Architecture Decision Log — GTA 6 News Hub

This file records important implementation decisions so the reasoning behind the
codebase stays transparent over time. Newest entries on top.

---

## ADR-010 — Comfort layer: view modes, i18n, shortcuts, TTS, connectivity
- **Decision:** Add a set of convenience features on top of the core 100:
  - **View modes** `data-view` = `casual` | `standard` | `insider`. Casual hides
    rumors and power-user metadata (larger, calmer feed); Insider is denser and
    surfaces every detail (region/lang highlighted). Most differences are pure CSS on
    the `data-view` attribute; the only behavioural rule is "casual ⇒ verified-only".
  - **UI i18n (DE/EN)** via a single `I18N` dict + `t(key)`; static chrome is tagged
    with `data-i18n`/`data-i18n-ph` and re-rendered on switch. Default language is
    derived from `navigator.language`. Dynamic strings (toasts, modal chrome, relative
    times) also go through `t()`.
  - **Keyboard shortcuts**: `/` search, `j/k` move, `o` open, `t` theme, `v` cycle
    view, `l` language, `?` help, `Esc` close — ignored while typing in a field.
  - **Text-to-speech** read-aloud in the article modal using the Web Speech API, with
    the utterance language matched to the article's `lang`.
  - **Online/offline banner** driven by `online`/`offline` events (complements the SW).
  - **Visible PWA install button** surfaced from `beforeinstallprompt`.
  - **Restore last section** on load (only when there is no URL hash).
- **Why:** The owner asked for genuine convenience features and explicitly for
  "simple / normal / expert" views. View modes + DE/EN i18n also reinforce the
  worldwide, multi-audience vision (ADR-007).
- **Naming:** The three views are surfaced as **Casual / Standard / Insider**
  (EN) and **Einfach / Standard / Experte** (DE).

## ADR-008 — Global `[hidden]` override
- **Decision:** Add `[hidden] { display: none !important; }` globally.
- **Why:** Components like `.modal-backdrop` set `display: grid`, which has higher
  specificity than the UA `[hidden] { display: none }` rule. A browser smoke test
  (Playwright) caught the invisible-but-click-intercepting backdrop blocking feed
  clicks. The global override guarantees the `hidden` attribute always wins, which the
  whole JS layer relies on for show/hide.
- **Verification:** All UI is validated with a Playwright smoke test before commit
  (feed render, search, save/like, polls, newsletter, comments, lightbox, prefs,
  persistence across reload) — 0 console errors.

## ADR-001 — Static frontend, no backend
- **Decision:** Build the site as a static HTML/CSS/vanilla-JS app. State that would
  normally need a server (bookmarks, comments, likes, votes, newsletter, "read" state)
  is stored in `localStorage`.
- **Why:** The repo had no build tooling and the task is a content/news hub. A static
  site is instantly deployable (GitHub Pages, Netlify, any static host), has zero
  install/runtime cost, and still lets us genuinely implement the large majority of
  the 100 features client-side.
- **Trade-off:** Engagement data is per-device, not shared across users. Documented as
  a known limitation; a real backend can replace the `Store` module later without
  touching the UI layer.

## ADR-002 — No framework, vanilla JS modules
- **Decision:** Plain ES modules + DOM APIs instead of React/Vue/etc.
- **Why:** Keeps the bundle tiny, removes a build step, and keeps the project
  approachable for a community/fan project. The feature set is DOM-driven, not
  state-graph-heavy, so a framework would add weight without much benefit.

## ADR-003 — Article data lives in a JS data file
- **Decision:** Sample news content lives in `js/data.js` as an exported array.
- **Why:** Lets the feed, search, filters, detail view and related-articles all read
  from one in-memory source. Swapping to a `fetch()` from a CMS/JSON API later only
  changes the data-loading function, not consumers.

## ADR-004 — PWA via manifest + service worker
- **Decision:** Ship a Web App Manifest and a cache-first service worker with an
  offline fallback page.
- **Why:** Delivers the "installable / works offline" features and makes cached news
  readable without a connection. Cache version is bumped on release to invalidate.

## ADR-005 — Theming via CSS custom properties + data attributes
- **Decision:** All colors/spacing come from CSS variables; theme + accent are switched
  by `data-theme` / `data-accent` attributes on `<html>`, persisted in `localStorage`.
- **Why:** One mechanism powers dark/light mode, the GTA6 neon palette, the accent
  picker and reduced-motion, with no JS recoloring needed.

## ADR-007 — Product vision: worldwide multi-channel aggregator
- **Decision:** The site's north star is to let a user inform themselves about GTA 6
  **as completely as possible across every channel on the internet, worldwide.** It is
  not just an editorial blog — it is an aggregation hub. Concretely this adds:
  a "Channels Hub" linking every relevant source (Rockstar official, YouTube,
  Reddit, X/Twitter, IGN/GameSpot/Eurogamer, leak communities, podcasts, wikis),
  per-source language/region tags, and a unified feed that attributes each item to
  its origin channel with a credibility badge.
- **Why:** This is the explicit product vision from the project owner. Every feature
  decision is weighed against "does this help a fan get the full global picture in one
  place?" Aggregation + clear sourcing + multi-region coverage are therefore
  first-class, not add-ons.
- **Implication:** Articles carry a `source`, `sourceUrl`, `region`/`lang` and a
  `verified` flag; the Channels Hub is a primary nav section.

## ADR-006 — Release date constant
- **Decision:** The countdown targets `2026-11-19T00:00:00` and the announcement date
  `2023-12-04` are defined as single constants in `js/app.js`.
- **Why:** Both the countdown and the "days since announcement" counter reference them;
  centralizing avoids drift.
