# 🎮 GTA 6 News Hub

Eine community-getriebene News-Plattform rund um **Grand Theft Auto VI** —
Offizielle Ankündigungen, Trailer, Leaks und Release-Infos, gebündelt an einem
Ort. **Release: 19. November 2026.**

> Fan-Projekt — nicht mit Rockstar Games oder Take-Two Interactive affiliiert.

## ✨ Features

Die Plattform setzt alle 100 Punkte aus [FEATURES.md](./FEATURES.md) um — u. a.
(weitere 100 Features für Ausbaustufe 2 stehen in
[FEATURES-2.md](./FEATURES-2.md), und ein offenes Backlog mit 500 weiteren Ideen
für künftige Ausbaustufen in [FEATURES-3.md](./FEATURES-3.md)):

- **Inhalte**: Markdown-Artikel mit Tags, Autor, Mehrfach-Quellen, Galerie +
  Lightbox, Video-Embeds, Lesezeit, Verlässlichkeits-Badge und verwandten Artikeln
- **Suche & Filter**: Fuzzy-Suche (Fuse.js), Autocomplete, Suchhistorie, Sortierung,
  Mehrfach-Kategorie-, Tag- und Datums-Filter — alles in der URL gespiegelt
- **Navigation**: echtes Routing mit Permalinks, Kategorie-Seiten, Breadcrumbs,
  Pagination, 404-Seite, Mobile-Burger-Menü
- **Community**: Kommentare (mit Threads), Reaktionen, Leak-Voting, Polls, Teilen,
  Melden, Newsletter — persistiert lokal über eine Service-Schicht
- **Personalisierung**: Favoriten, „Später lesen", gelesen-Markierung, Themen-Abos,
  personalisierter Feed, Onboarding, Benachrichtigungs-Center
- **Redaktion/CMS**: Admin-Editor (`/admin`) zum Anlegen, Bearbeiten, Terminieren,
  Bild-Upload und RSS-Import
- **Darstellung**: **Dark Mode als Standard** + Light-Mode & System-Theme,
  Schriftgrößen-Regler, Featured-Karussell, Skeleton-Loading, Countdown
- **PWA & Performance**: Service Worker, Manifest, Offline-Caching, Code-Splitting,
  Lazy-Loading, Prefetching, Web-Vitals
- **SEO**: dynamische Meta-/OG-/Twitter-Tags, Canonical, JSON-LD, Sitemap, RSS-Feed,
  Cookie-Consent, Datenschutz/Impressum
- **Mobile-first & barrierearm**: Skip-Link, ARIA-Rollen, Tastatur-Support,
  `prefers-reduced-motion`, jsx-a11y- und axe-geprüft
- **KI & Automatisierung** (FEATURES-3 Welle 1): TL;DR-Zusammenfassung im Artikel,
  „Frag den Hub"-Chat (`/frag`, RAG über alle Artikel), Auto-Tagging, Sentiment,
  Auto-Moderation, semantische Suche, Faktencheck, Tagesbriefing u. v. m. unter
  `/api/ai/*`. Läuft **heuristisch ohne Key**; mit `ANTHROPIC_API_KEY` übernimmt
  **Claude** (siehe `server/ai.mjs`)
- **Suche & Discovery** (FEATURES-3 Welle 2): Such-Seite `/suche` mit Operatoren
  (`"phrase"`, `-ausschluss`, `a OR b`), Synonymen, Tippfehler-Toleranz, Facetten,
  Verlässlichkeits-/Lesezeit-Filtern, Kontext-Snippets sowie Tabs für Artikel,
  Kommentare und Lore. Dazu Entdecken-Seite `/entdecken` (Discovery-Feed,
  „Überrasch mich", Tag-Wolke), Themen-Hubs `/thema/:tag`, Sprachsuche und
  Entitäts-Autocomplete. Backend unter `/api/search` (austauschbar gegen einen
  echten Index). Architektur-Entscheidungen & offene Punkte: `docs/DECISIONS.md`

> Backend-/Community-Features nutzen eine **localStorage-Service-Schicht**
> (`src/services/`), die sich 1:1 gegen eine echte API/CMS austauschen lässt.
> Punkte, die zwingend Server/Keys brauchen (Push-Server, Analytics, Sentry,
> ausgehende Webhooks), sind verdrahtet, aber ohne Konfiguration inaktiv —
> siehe Markierungen in [FEATURES.md](./FEATURES.md).

## 🧱 Tech-Stack

| Bereich   | Wahl                                          |
| --------- | --------------------------------------------- |
| Framework | React 18 + TypeScript                         |
| Routing   | React Router                                  |
| Build/Dev | Vite 5 + `vite-plugin-pwa`                     |
| Suche     | Fuse.js                                        |
| Inhalte   | react-markdown + remark-gfm                    |
| SEO       | react-helmet-async                            |
| Tests     | Vitest + Testing Library + jest-axe, Playwright (E2E) |
| Styling   | CSS (Design-Tokens, Light/Dark, kein Framework) |
| Qualität  | ESLint 9 (+ jsx-a11y), Husky, Storybook, GitHub Actions |

## 🚀 Setup

Voraussetzung: **Node.js ≥ 18** (Backend: ≥ 22 wegen `node:sqlite`).

```bash
npm install        # Abhängigkeiten installieren
npm run dev        # Frontend-Dev-Server (http://localhost:5173)
npm run build      # Produktions-Build (inkl. Sitemap/Feed + PWA)
npm run preview    # Build lokal prüfen
```

### Optional: echtes Backend (Ausbaustufe 2)

Es gibt einen produktiven **API-Server mit SQLite** (`server/`). Ohne ihn läuft
die App rein lokal (localStorage). Mit ihm kommen Konten, Rollen und echte
Persistenz dazu:

```bash
npm run server                              # API auf http://localhost:8787
VITE_API_URL=http://localhost:8787 npm run dev   # Frontend gegen die API
npm run test:server                         # 16 Backend-Tests
```

Details & Endpunkte: [server/README.md](./server/README.md). Der erste
registrierte Nutzer wird automatisch Admin.

## 🧪 Tests & Qualität

```bash
npm test            # Unit-/Komponententests (Vitest)
npm run test:coverage # mit Coverage-Schwelle
npm run test:e2e    # End-to-End (Playwright)
npm run lint        # ESLint inkl. jsx-a11y
npm run build       # TypeScript-Typecheck (tsc) + Vite-Build
npm run storybook   # Komponenten-Katalog (http://localhost:6006)
```

Ein **Husky pre-commit Hook** führt vor jedem Commit `lint` + `test` aus.
Die **CI** (`.github/workflows/ci.yml`) prüft Lint, Tests und Build bei jedem Push.

> E2E lokal: läuft gegen den Preview-Build. In Umgebungen mit vorinstalliertem
> Chromium kann der Pfad via `PW_CHROMIUM_PATH` gesetzt werden.

## ⚙️ Konfiguration (optional, `.env`)

Alle externen Dienste sind ohne diese Werte inaktiv:

```bash
VITE_ANALYTICS_DOMAIN=deine-domain.de   # aktiviert (Plausible-)Analytics
VITE_SENTRY_DSN=...                      # aktiviert Fehler-Monitoring
```

## 📁 Projektstruktur

```
gta6-news-hub/
├── public/                 # statische Assets, robots.txt, PWA-Icons
├── scripts/                # Sitemap- & RSS-Feed-Generatoren (Build-Zeit)
├── e2e/                    # Playwright-Tests
├── .storybook/             # Storybook-Konfiguration
├── .github/workflows/      # CI + Deploy (GitHub Pages)
├── src/
│   ├── main.tsx            # Bootstrap: Router + Provider + Monitoring
│   ├── App.tsx             # Routen (Code-Splitting via React.lazy)
│   ├── index.css           # Design-Tokens & Styles (Light/Dark)
│   ├── types.ts            # Zentrale Typen
│   ├── routes/             # Seiten (Home, Article, Category, Admin, …)
│   ├── components/         # UI-Bausteine (+ *.stories.tsx)
│   ├── context/            # Theme, Preferences, Toasts
│   ├── i18n/               # DE/EN-Übersetzungen
│   ├── hooks/              # useArticles, useDebounce, useInfiniteScroll, …
│   ├── lib/                # reine Logik: Suche, Lesezeit, SEO, Analytics
│   ├── services/           # localStorage-Service-Schicht (Mock-„Backend")
│   └── test/               # Test-Setup & -Utilities
└── vite.config.ts          # Vite, PWA, Vitest, Coverage
```

## 📰 Inhalte pflegen

Seed-Artikel liegen typisiert in `src/data/articles.ts`. Zusätzlich lassen sich
Artikel direkt im Browser über die **Redaktion** (`/admin`) anlegen, bearbeiten,
als Entwurf speichern, terminieren oder per RSS importieren — gespeichert wird
lokal über `src/services/articlesService.ts`. In Produktion ersetzt man diese
Service-Schicht durch eine echte API oder ein Headless-CMS.

## 📄 Lizenz

MIT — siehe [LICENSE](./LICENSE).
