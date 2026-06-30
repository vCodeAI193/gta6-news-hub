# GTA 6 News Hub

A community news platform dedicated to GTA 6 — tracking release updates, trailers,
leaks, and Rockstar announcements from **every channel worldwide**. Launches
November 19, 2026.

> **Vision:** one hub where a fan can inform themselves about GTA 6 as completely as
> possible across every channel on the internet, worldwide — official, press,
> community and social, in multiple languages and regions.

## What's inside

A fast, installable, **static** web app (no backend, no build step) implementing the
100 features tracked in [`FEATURES.md`](FEATURES.md). Highlights:

- 📰 **News feed** with categories, verified/rumor badges, search, filters and sort
- 🌐 **Channels Hub** — every worldwide GTA 6 source in one place (Rockstar, YouTube,
  Reddit, X, IGN, GameSpot, Eurogamer, GameStar, Jeuxvideo, Famitsu, wikis…)
- ⏳ **Live countdown** to Nov 19, 2026, add-to-calendar (.ics) and reminders
- 🎬 **Media gallery** with lightbox, downloadable wallpapers and character cards
- 🗺️ **Release roadmap** timeline
- 💬 **Community**: newsletter, polls, tip submission, FAQ — all client-side
- 🔖 Bookmarks, likes, reactions, local comments, "read" state, recently viewed
- 🎨 Dark/light themes, accent picker, text-size & density, reduced-motion
- 🌐 **Article translation** into the UI language via a self-hosted, LibreTranslate-compatible engine (no third-party, no API cost — see [`TRANSLATION.md`](TRANSLATION.md))
- 📲 **PWA**: installable, offline-capable via service worker
- ♿ Accessible: semantic landmarks, ARIA, focus traps, keyboard nav
- 🔎 SEO: meta tags, Open Graph, JSON-LD structured data, print stylesheet

## Run locally

It's a static site — serve the folder with any web server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

(Service worker and ES modules require `http://`, not opening the file directly.)

## Project structure

```
index.html              # main page / all sections
offline.html            # PWA offline fallback
manifest.webmanifest    # installable app metadata
sw.js                   # service worker (cache-first + offline)
css/styles.css          # theming via CSS custom properties
js/data.js              # articles, channels, timeline, FAQ, polls (swappable for an API)
js/app.js               # all behaviour, localStorage persistence
js/translate.js         # self-hosted translation client (LibreTranslate-compatible)
FEATURES.md             # the feature scope (source of truth)
DECISIONS.md            # architecture decision log
TRANSLATION.md          # how to self-host the translation engine
```

## Notes & limitations

Engagement data (likes, comments, votes, bookmarks) is stored in the browser via
`localStorage`, so it is per-device, not shared between users. The `Store` module in
`js/app.js` is the single persistence boundary — swap it for a real API later without
touching the UI. See [`DECISIONS.md`](DECISIONS.md) for the reasoning behind the
architecture.

Fan-made project. Not affiliated with Rockstar Games or Take-Two Interactive.
