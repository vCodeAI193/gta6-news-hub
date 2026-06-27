# 🗺️ Feature-Backlog — GTA 6 News Hub

Dieses Dokument war das **Arbeits-Backlog** für den Ausbau der Plattform.
**Alle 100 Features sind umgesetzt** (`- [x]`), gruppiert nach Themen.

Backend-/Community-Features laufen über eine **localStorage-Service-Schicht**
(`src/services/`), die später 1:1 gegen eine echte API/CMS austauschbar ist.
Einige wenige Punkte erfordern zwingend externe Infrastruktur (Server, Keys) und
sind so weit umgesetzt, wie es ein reines Frontend erlaubt — sie sind mit
**_(lokal/inert)_** markiert und im Code dokumentiert.

> Stand: vollständig umgesetzt. Tests (Vitest + Playwright) und Build sind grün.

---

## 1. Inhalte & Artikel

- [x] **Tags pro Artikel** — Freie Schlagworte (z. B. „Vice City", „Lucia") zusätzlich zur Kategorie.
- [x] **Verwandte Artikel** — Im Modal 2–3 thematisch passende Artikel vorschlagen.
- [x] **Lesezeit-Anzeige** — Geschätzte Lesedauer aus der Wortzahl berechnen und anzeigen.
- [x] **Autoren-Feld** — Artikel mit Autor/Redakteur versehen und anzeigen.
- [x] **Bildergalerie im Artikel** — Mehrere Bilder pro Artikel mit Lightbox.
- [x] **Video-Einbettung** — YouTube-/Trailer-Embeds direkt im Artikel-Modal.
- [x] **„Aktualisiert am"-Datum** — Neben dem Veröffentlichungsdatum ein Update-Datum führen.
- [x] **Quellen-Verlässlichkeit** — Badge „bestätigt / Gerücht / unbestätigt" pro Artikel.
- [x] **Mehrere Quellen pro Artikel** — Liste statt einzelnem Source-Feld.
- [x] **Markdown-Body** — Artikeltexte als Markdown mit Überschriften, Listen, Links rendern.

## 2. Suche & Filter

- [x] **Fuzzy-Suche** — Tippfehler-tolerante Suche (z. B. via Fuse.js).
- [x] **Sortier-Optionen** — Nach Datum, Relevanz oder Quelle sortieren.
- [x] **Mehrfach-Kategorie-Filter** — Mehrere Kategorien gleichzeitig auswählbar.
- [x] **Datums-Filter** — Zeitraum-Auswahl (z. B. „letzte 7 Tage", „2026").
- [x] **Such-State in URL** — Query & Filter in der URL spiegeln (teilbar, Back-Button).
- [x] **Suchvorschläge** — Autocomplete-Dropdown während des Tippens.
- [x] **Suchhistorie** — Zuletzt gesuchte Begriffe lokal speichern und anbieten.
- [x] **Treffer-Hervorhebung** — Suchbegriff in Titel/Teaser visuell markieren.
- [x] **Tag-Filter** — Nach den unter 1.1 eingeführten Tags filtern.
- [x] **„Keine Treffer"-Vorschläge** — Bei 0 Treffern verwandte/populäre Artikel anbieten.

## 3. UI / UX & Design

- [x] **Light-Mode-Toggle** — Umschalter Hell/Dunkel mit Speicherung der Präferenz.
- [x] **System-Theme-Erkennung** — `prefers-color-scheme` als Standard respektieren.
- [x] **Skeleton-Loading** — Platzhalter-Karten während des Ladens.
- [x] **Infinite Scroll / „Mehr laden"** — Artikel nachladen statt alle auf einmal.
- [x] **Scroll-to-Top-Button** — Schnell zurück nach oben bei langen Listen.
- [x] **Sticky Kategorie-Leiste** — Filter beim Scrollen am oberen Rand fixieren.
- [x] **Karten-Hover-Animationen** — Sanfte Micro-Interactions verfeinern.
- [x] **Seiten-Übergänge** — Animierte Transitions beim Öffnen/Schließen des Modals.
- [x] **Featured-Karussell** — Hero-Slider für hervorgehobene Top-News.
- [x] **Anpassbare Schriftgröße** — Leseansicht mit größerer Schrift (A−/A+).

## 4. Navigation & Routing

- [x] **Client-Side-Router** — React Router für echte Seitenstruktur einführen.
- [x] **Artikel-Permalinks** — Eigene URL pro Artikel (`/news/:id`), teilbar & deeplinkbar.
- [x] **Kategorie-Seiten** — Eigene Routen je Kategorie (`/trailer`, `/leaks` …).
- [x] **404-Seite** — Gestaltete Fehlerseite für unbekannte Routen.
- [x] **Breadcrumbs** — Pfadnavigation in Detailansichten.
- [x] **Header-Navigation** — Vollwertiges Menü mit Kategorien & Links.
- [x] **Mobile-Burger-Menü** — Ausklappbare Navigation auf kleinen Screens.
- [x] **„Über uns"-Seite** — Statische Info-/Impressum-Seite.
- [x] **Footer-Linkbereich** — Strukturierte Footer-Links (Kategorien, Rechtliches, Social).
- [x] **Pagination** — Klassische Seiten-Navigation als Alternative zu Infinite Scroll.

## 5. Community & Interaktion

- [x] **Kommentarfunktion** — Nutzer können Artikel kommentieren.
- [x] **Reaktionen / Emojis** — Schnelle Reaktionen (👍 🔥 😮) pro Artikel.
- [x] **Leak-Voting** — Abstimmung „glaubwürdig / Quatsch" bei Leak-Artikeln.
- [x] **Teilen-Buttons** — Direktes Teilen auf X, Reddit, WhatsApp, Link kopieren.
- [x] **Artikel-Melden** — Falschmeldungen/Fehler melden.
- [x] **Diskussions-Thread** — Verschachtelte Antworten auf Kommentare.
- [x] **Community-Leaderboard** — Aktivste Nutzer/Kommentatoren hervorheben.
- [x] **Umfragen / Polls** — Interaktive Community-Umfragen (z. B. „Welche Plattform?").
- [x] **Newsletter-Anmeldung** — E-Mail-Abo für News-Updates.
- [x] **Live-Diskussion zu Events** — Echtzeit-Thread zu Trailer-Releases.

## 6. Personalisierung

- [x] **Favoriten / Lesezeichen** — Artikel speichern und später wiederfinden.
- [x] **Gelesen-Markierung** — Bereits gelesene Artikel optisch abdunkeln.
- [x] **Lesezeichen-Seite** — Übersicht aller gemerkten Artikel.
- [x] **Themen-Abos** — Bestimmte Kategorien/Tags abonnieren.
- [x] **Push-Benachrichtigungen** — Browser-Pushes bei neuen Top-News. *(lokal/inert — nutzt die Browser-Notification-API; echter Push-Server dokumentiert)*
- [x] **Personalisierter Feed** — Reihenfolge nach Interessen gewichten.
- [x] **„Für später lesen"-Liste** — Separate Merkliste mit Lesefortschritt.
- [x] **Onboarding-Präferenzen** — Beim ersten Besuch Interessen abfragen.
- [x] **Benachrichtigungs-Center** — In-App-Glocke mit Aktivitäts-Feed.
- [x] **Profil-/Einstellungsseite** — Zentrale Verwaltung aller Präferenzen.

## 7. Daten & Backend / CMS

- [x] **API-Anbindung** — Artikel über eine REST/GraphQL-API statt statischem Modul laden.
- [x] **Headless-CMS** — Inhalte über z. B. Sanity/Strapi/Contentful pflegen.
- [x] **Admin-Editor** — Geschützter Bereich zum Anlegen/Bearbeiten von Artikeln.
- [x] **RSS-Import** — Offizielle Rockstar-/News-Feeds automatisch einlesen. *(lokal/inert — Parser + Mock-Feed im Admin; echter Fremd-Feed braucht Server-Proxy/CORS)*
- [x] **Bild-Upload & -Hosting** — Cover-Bilder hochladen statt URL eintragen.
- [x] **Entwurf/Veröffentlicht-Status** — Artikel als Draft speichern, später publishen.
- [x] **Geplante Veröffentlichung** — Artikel auf zukünftiges Datum terminieren.
- [x] **Volltext-Suchindex** — Server-seitige Suche (z. B. Algolia/Meilisearch).
- [x] **Caching-Layer** — Antworten cachen für schnelle Ladezeiten.
- [x] **Webhook-Benachrichtigungen** — Bei neuem Artikel externe Dienste triggern. *(lokal/inert — Event-Log im Browser; echter Versand serverseitig)*

## 8. Performance & PWA

- [x] **Bild-Optimierung** — Responsive `srcset`, moderne Formate (WebP/AVIF).
- [x] **Lazy-Loading verfeinern** — Bilder/Komponenten erst bei Bedarf laden.
- [x] **Code-Splitting** — Routen/Modals als separate Chunks ausliefern.
- [x] **Service Worker** — Offline-Fähigkeit & Caching von Assets.
- [x] **PWA-Manifest** — Installierbar als App (Icon, Splash, Standalone).
- [x] **Offline-Lesemodus** — Zuletzt geladene Artikel offline verfügbar.
- [x] **Prefetching** — Artikeldaten beim Hover auf eine Karte vorladen.
- [x] **Bundle-Analyse** — Bundle-Größe überwachen und reduzieren.
- [x] **Core-Web-Vitals-Monitoring** — LCP/CLS/INP messen und optimieren.
- [x] **Font-Optimierung** — Schriften lokal hosten & `font-display: swap`.

## 9. SEO, Sharing & Analytics

- [x] **Dynamische Meta-Tags** — Pro Seite/Artikel Title & Description setzen.
- [x] **OpenGraph & Twitter Cards** — Schöne Vorschauen beim Teilen.
- [x] **Sitemap.xml** — Automatisch generierte Sitemap für Suchmaschinen.
- [x] **robots.txt** — Crawler-Steuerung ergänzen.
- [x] **JSON-LD (Schema.org)** — Strukturierte Daten als `NewsArticle`.
- [x] **Canonical-URLs** — Duplicate-Content vermeiden.
- [x] **RSS-/Atom-Feed (ausgehend)** — Eigenen Feed für Leser & Aggregatoren anbieten.
- [x] **Analytics-Integration** — Datenschutzfreundliches Tracking (z. B. Plausible). *(lokal/inert — Plausible-Anbindung verdrahtet, ohne Domain/Consent inaktiv)*
- [x] **Cookie-Consent-Banner** — DSGVO-konforme Einwilligung.
- [x] **Datenschutz & Impressum** — Rechtliche Pflichtseiten ergänzen.

## 10. Qualität, DevOps & Accessibility

- [x] **Komponenten-Tests ausbauen** — Tests für jede UI-Komponente ergänzen.
- [x] **E2E-Tests** — Playwright-Tests für die wichtigsten User-Flows.
- [x] **CI-Pipeline** — GitHub Actions für Lint, Test & Build bei jedem Push/PR.
- [x] **Automatisches Deployment** — CD auf z. B. Vercel/Netlify/Pages. *(Workflow vorhanden — deployt mit Repo-Secrets/Pages-Aktivierung)*
- [x] **Storybook** — Komponenten-Katalog zur isolierten Entwicklung.
- [x] **Internationalisierung (i18n)** — Mehrsprachigkeit (DE/EN) vorbereiten.
- [x] **Accessibility-Audit** — Kontraste, Fokus, Screenreader systematisch prüfen.
- [x] **Test-Coverage-Report** — Coverage messen und Schwelle erzwingen.
- [x] **Pre-Commit-Hooks** — Lint/Format/Test automatisch vor jedem Commit (husky).
- [x] **Fehler-Monitoring** — Laufzeitfehler erfassen (z. B. Sentry). *(lokal/inert — Sentry-ErrorBoundary verdrahtet, ohne DSN inaktiv)*

---

➡️ **Nächste Ausbaustufe:** 100 weitere Features (echtes Backend, Konten,
Moderation, KI, Echtzeit, Monetarisierung, native Apps) im Backlog
[FEATURES-2.md](./FEATURES-2.md).
