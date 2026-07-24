# GTA 6 News Hub — Vision

> **One hub where a fan can inform themselves about GTA 6 as completely as possible
> across every channel on the internet, worldwide — official, press, community and
> social, in multiple languages and regions.**

This file is the north star for the project. Every feature decision is weighed
against the question: *does this help a fan get the full global picture in one place?*

---

## 1. Core vision

The GTA 6 News Hub is a **worldwide aggregation hub**, not an editorial blog. Its
job is to collect, surface and attribute information from every relevant channel
globally — and let the fan choose how deeply they want to engage.

It launches with human-curated sample content and a static architecture that can be
swapped for a live API later without touching the UI layer.

---

## 2. Target audience

| Segment | Description | View mode |
|---------|-------------|-----------|
| **Casual fan** | Occasional check-in, wants highlights only | Casual |
| **Regular reader** | Follows all categories, wants verified + rumor context | Standard |
| **Insider** | Follows leaks, needs region/source/lang metadata at a glance | Insider |

**Language base (v1):** DE, EN, FR, JP — extensible via the i18n dict and additional
channel/article data. The self-hosted translation engine (ADR-011) makes any UI
language reachable without a third-party service.

All three segments share the same URL, the same codebase and the same zero-login,
zero-account experience. No barrier to entry.

---

## 3. The four information pillars

Every piece of news in the hub traces back to one of four source categories:

| Pillar | Examples | Credibility |
|--------|----------|-------------|
| **Official** | Rockstar Newswire, Take-Two IR, PlayStation/Xbox announcements | Highest — treated as ground truth |
| **Press** | IGN, GameSpot, Eurogamer, GameStar, Jeuxvideo, Famitsu, Vandal, PC Games | High — established outlets |
| **Community** | Reddit r/GTA6, Fandom Wiki, Discord servers, fan forums | Medium — community consensus |
| **Social / Leak** | X/Twitter #GTA6, TikTok, Instagram, leak trackers | Varies — prominently labelled |

Articles carry a `verified` flag and a `source` attribution. The Channels Hub
lists every source and lets users navigate directly to any of them.

---

## 4. Design principles

These are non-negotiable constraints, not stylistic preferences:

1. **Static & deployable anywhere** — no backend, no build step, no runtime server
   (ADR-001). The site works on GitHub Pages, Netlify or any static host.
2. **Privacy-first** — all user state (likes, bookmarks, comments, votes) lives in
   `localStorage`. No data leaves the device. No analytics, no cookies beyond the
   dismissed consent banner.
3. **DSGVO / data sovereignty** — the translation engine runs on the user's own server
   in Germany (ADR-011). No article text is sent to a third-party API.
4. **Zero cost** — no paid APIs, no SaaS dependencies. Everything that runs is either
   vanilla browser APIs or self-hosted open-source software.
5. **Worldwide coverage** — channels, articles, and UI strings span multiple
   languages and regions from day one. Single-language / single-region is a bug.
6. **Accessible** — semantic HTML landmarks, ARIA, focus management, keyboard
   navigation, reduced-motion, and color-contrast-safe palettes in both themes.
7. **Offline-capable** — the service worker caches the shell and news articles so
   the hub works without a connection (ADR-004).

---

## 5. What this project is NOT

- Not a CMS or a content publication tool — it aggregates and attributes, it does not
  produce original editorial content.
- Not monetized — no ads, no affiliate links, no premium tier.
- Not a social network — comments and reactions are local-only (`localStorage`);
  the hub does not run a shared backend.
- Not a Rockstar / Take-Two product — fan-made, no affiliation.

---

## 6. Quality gate for new features

Before adding a feature, ask:

1. **Does it help a fan get the full global picture?** (aggregation / worldwide coverage)
2. **Does it keep the site static and cost-free?** (no new server dependencies)
3. **Does it respect privacy and accessibility?** (no tracking, no barriers)
4. **Does it degrade gracefully?** (missing data / offline / wrong language → site still works)

If any answer is "no", reconsider or document the trade-off in `DECISIONS.md`.

---

## 7. Roadmap direction

**Short term (current sprint)**
- More channels (Spanish, Italian, Brazilian, social, Discord)
- Richer multilingual article content (DE, FR, JP bodies)
- URL deep-linking for direct article shares
- Expanded timeline, FAQ and polls

**Medium term**
- RSS / JSON-API data connector (replaces `js/data.js` without touching UI)
- More UI languages (ES, FR, IT, PT)
- Regional edition toggle (EU / Americas / Asia-Pacific feed presets)

**Long term**
- Real-time news aggregation pipeline (headless scraper + static re-deploy)
- Community-contributed channel suggestions
- Full global news aggregator across multiple game titles

---

*Fan-made project. Not affiliated with Rockstar Games or Take-Two Interactive.*
*Grand Theft Auto and GTA are trademarks of Take-Two Interactive Software, Inc.*
