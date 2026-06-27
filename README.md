# 🎮 GTA 6 News Hub

Eine community-getriebene News-Plattform rund um **Grand Theft Auto VI** —
Offizielle Ankündigungen, Trailer, Leaks und Release-Infos, gebündelt an einem
Ort. **Release: 19. November 2026.**

> Fan-Projekt — nicht mit Rockstar Games oder Take-Two Interactive affiliiert.

## ✨ Features

- **Nachrichtenkategorien** — Offizielle News, Trailer, Leaks und Release
- **Volltextsuche** über Titel, Teaser, Inhalt und Quelle
- **Kategorie-Filter** als Chips, kombinierbar mit der Suche
- **Artikel-Detailansicht** als Modal mit Datum, Quelle, Bild und Originallink
- **Live-Countdown** bis zum Release
- **Dark Mode als Standard** (passend zum GTA-Stil)
- **Mobile-first & responsive** (1 → 2 → 3 Spalten je nach Viewport)
- **Barrierearm** — Skip-Link, ARIA-Rollen, Tastatur- und Reduced-Motion-Support

## 🧱 Tech-Stack

| Bereich   | Wahl                                |
| --------- | ----------------------------------- |
| Framework | React 18 + TypeScript               |
| Build/Dev | Vite 5                              |
| Tests     | Vitest + Testing Library (jsdom)    |
| Styling   | CSS (Design-Tokens, kein Framework) |
| Linting   | ESLint 9 (Flat Config)              |

Bewusst leichtgewichtig gehalten: schnelle Ladezeiten, keine schwere
Runtime-Abhängigkeit, einfach wartbar.

## 🚀 Setup

Voraussetzung: **Node.js ≥ 18**.

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Dev-Server starten (http://localhost:5173)
npm run dev

# 3. Produktions-Build erzeugen
npm run build

# 4. Build lokal prüfen
npm run preview
```

## 🧪 Tests & Qualität

```bash
npm test           # Testsuite einmalig ausführen
npm run test:watch # Tests im Watch-Modus
npm run lint       # ESLint
npm run build      # inkl. TypeScript-Typecheck (tsc -b)
```

Getestet werden:

- die reine Filter-/Suchlogik (`filterArticles`, `formatDate`),
- die Countdown-Berechnung (`getTimeLeft`),
- das Zusammenspiel in der UI (Suche, Kategoriefilter, Modal, Empty-State).

> Vor jedem Commit gilt: `npm run lint`, `npm test` und `npm run build` müssen
> grün sein.

## 📁 Projektstruktur

```
gta6-news-hub/
├── index.html              # Einstiegspunkt, Dark Mode default (<html class="dark">)
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx            # React-Bootstrap
│   ├── App.tsx             # Seiten-Layout & State (Suche/Filter/Modal)
│   ├── index.css           # Design-Tokens & Styles (Dark Theme)
│   ├── types.ts            # Zentrale Typen (Article, Category)
│   ├── components/         # UI-Bausteine
│   │   ├── SearchBar.tsx
│   │   ├── CategoryFilter.tsx
│   │   ├── Countdown.tsx
│   │   ├── ArticleCard.tsx
│   │   └── ArticleModal.tsx
│   ├── data/               # Inhalte (Artikel & Kategorien)
│   │   ├── articles.ts
│   │   └── categories.ts
│   ├── lib/                # Reine, testbare Logik
│   │   ├── filterArticles.ts
│   │   └── countdown.ts
│   └── test/
│       └── setup.ts
└── vite.config.ts
```

## 📰 Inhalte pflegen

Artikel liegen typisiert in `src/data/articles.ts`. Ein Eintrag hat folgende
Felder:

```ts
{
  id: 'eindeutige-id',
  title: 'Titel',
  excerpt: 'Kurzer Teaser für die Karte',
  body: 'Volltext.\n\nAbsätze werden mit Leerzeilen getrennt.',
  category: 'official' | 'trailer' | 'leak' | 'release',
  date: '2026-11-19',          // ISO 8601
  source: 'Quelle',
  sourceUrl: 'https://…',       // optional
  image: 'https://…/bild.jpg',
  featured: true,               // optional: Hero-Hervorhebung
}
```

Neue Artikel werden automatisch nach Datum (neueste zuerst) sortiert und sind
sofort durch- und filterbar. In einem Produktivsystem ließe sich dieses Modul
problemlos durch ein CMS oder eine API ersetzen.

## 🗺️ Roadmap

Geplante Features für den weiteren Ausbau stehen als abhakbares Backlog in
[FEATURES.md](./FEATURES.md) — 100 Features in 10 Themenbereichen.

## 📄 Lizenz

MIT — siehe [LICENSE](./LICENSE).
