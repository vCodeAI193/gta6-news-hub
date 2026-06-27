# 🗺️ Feature-Backlog — GTA 6 News Hub

Dieses Dokument ist das **Arbeits-Backlog** für den weiteren Ausbau der
Plattform. 100 Features, gruppiert nach Themen. Erledigte Punkte werden einfach
abgehakt (`- [x]`).

**Bereits umgesetzt (Fundament):** Dark-Mode-UI, Kategorie-Filter (Offizielle
News, Trailer, Leaks, Release), Volltextsuche, Artikel-Modal mit Datum/Quelle/
Bild, Release-Countdown, responsives 1/2/3-Spalten-Layout, 18 Tests.

> Konvention: pro Kategorie grob nach Priorität/Aufwand sortiert (oben =
> naheliegend, weiter unten = größer). Beim Erledigen `[ ]` → `[x]` setzen.

---

## 1. Inhalte & Artikel

- [ ] **Tags pro Artikel** — Freie Schlagworte (z. B. „Vice City", „Lucia") zusätzlich zur Kategorie.
- [ ] **Verwandte Artikel** — Im Modal 2–3 thematisch passende Artikel vorschlagen.
- [ ] **Lesezeit-Anzeige** — Geschätzte Lesedauer aus der Wortzahl berechnen und anzeigen.
- [ ] **Autoren-Feld** — Artikel mit Autor/Redakteur versehen und anzeigen.
- [ ] **Bildergalerie im Artikel** — Mehrere Bilder pro Artikel mit Lightbox.
- [ ] **Video-Einbettung** — YouTube-/Trailer-Embeds direkt im Artikel-Modal.
- [ ] **„Aktualisiert am"-Datum** — Neben dem Veröffentlichungsdatum ein Update-Datum führen.
- [ ] **Quellen-Verlässlichkeit** — Badge „bestätigt / Gerücht / unbestätigt" pro Artikel.
- [ ] **Mehrere Quellen pro Artikel** — Liste statt einzelnem Source-Feld.
- [ ] **Markdown-Body** — Artikeltexte als Markdown mit Überschriften, Listen, Links rendern.

## 2. Suche & Filter

- [ ] **Fuzzy-Suche** — Tippfehler-tolerante Suche (z. B. via Fuse.js).
- [ ] **Sortier-Optionen** — Nach Datum, Relevanz oder Quelle sortieren.
- [ ] **Mehrfach-Kategorie-Filter** — Mehrere Kategorien gleichzeitig auswählbar.
- [ ] **Datums-Filter** — Zeitraum-Auswahl (z. B. „letzte 7 Tage", „2026").
- [ ] **Such-State in URL** — Query & Filter in der URL spiegeln (teilbar, Back-Button).
- [ ] **Suchvorschläge** — Autocomplete-Dropdown während des Tippens.
- [ ] **Suchhistorie** — Zuletzt gesuchte Begriffe lokal speichern und anbieten.
- [ ] **Treffer-Hervorhebung** — Suchbegriff in Titel/Teaser visuell markieren.
- [ ] **Tag-Filter** — Nach den unter 1.1 eingeführten Tags filtern.
- [ ] **„Keine Treffer"-Vorschläge** — Bei 0 Treffern verwandte/populäre Artikel anbieten.

## 3. UI / UX & Design

- [ ] **Light-Mode-Toggle** — Umschalter Hell/Dunkel mit Speicherung der Präferenz.
- [ ] **System-Theme-Erkennung** — `prefers-color-scheme` als Standard respektieren.
- [ ] **Skeleton-Loading** — Platzhalter-Karten während des Ladens.
- [ ] **Infinite Scroll / „Mehr laden"** — Artikel nachladen statt alle auf einmal.
- [ ] **Scroll-to-Top-Button** — Schnell zurück nach oben bei langen Listen.
- [ ] **Sticky Kategorie-Leiste** — Filter beim Scrollen am oberen Rand fixieren.
- [ ] **Karten-Hover-Animationen** — Sanfte Micro-Interactions verfeinern.
- [ ] **Seiten-Übergänge** — Animierte Transitions beim Öffnen/Schließen des Modals.
- [ ] **Featured-Karussell** — Hero-Slider für hervorgehobene Top-News.
- [ ] **Anpassbare Schriftgröße** — Leseansicht mit größerer Schrift (A−/A+).

## 4. Navigation & Routing

- [ ] **Client-Side-Router** — React Router für echte Seitenstruktur einführen.
- [ ] **Artikel-Permalinks** — Eigene URL pro Artikel (`/news/:id`), teilbar & deeplinkbar.
- [ ] **Kategorie-Seiten** — Eigene Routen je Kategorie (`/trailer`, `/leaks` …).
- [ ] **404-Seite** — Gestaltete Fehlerseite für unbekannte Routen.
- [ ] **Breadcrumbs** — Pfadnavigation in Detailansichten.
- [ ] **Header-Navigation** — Vollwertiges Menü mit Kategorien & Links.
- [ ] **Mobile-Burger-Menü** — Ausklappbare Navigation auf kleinen Screens.
- [ ] **„Über uns"-Seite** — Statische Info-/Impressum-Seite.
- [ ] **Footer-Linkbereich** — Strukturierte Footer-Links (Kategorien, Rechtliches, Social).
- [ ] **Pagination** — Klassische Seiten-Navigation als Alternative zu Infinite Scroll.

## 5. Community & Interaktion

- [ ] **Kommentarfunktion** — Nutzer können Artikel kommentieren.
- [ ] **Reaktionen / Emojis** — Schnelle Reaktionen (👍 🔥 😮) pro Artikel.
- [ ] **Leak-Voting** — Abstimmung „glaubwürdig / Quatsch" bei Leak-Artikeln.
- [ ] **Teilen-Buttons** — Direktes Teilen auf X, Reddit, WhatsApp, Link kopieren.
- [ ] **Artikel-Melden** — Falschmeldungen/Fehler melden.
- [ ] **Diskussions-Thread** — Verschachtelte Antworten auf Kommentare.
- [ ] **Community-Leaderboard** — Aktivste Nutzer/Kommentatoren hervorheben.
- [ ] **Umfragen / Polls** — Interaktive Community-Umfragen (z. B. „Welche Plattform?").
- [ ] **Newsletter-Anmeldung** — E-Mail-Abo für News-Updates.
- [ ] **Live-Diskussion zu Events** — Echtzeit-Thread zu Trailer-Releases.

## 6. Personalisierung

- [ ] **Favoriten / Lesezeichen** — Artikel speichern und später wiederfinden.
- [ ] **Gelesen-Markierung** — Bereits gelesene Artikel optisch abdunkeln.
- [ ] **Lesezeichen-Seite** — Übersicht aller gemerkten Artikel.
- [ ] **Themen-Abos** — Bestimmte Kategorien/Tags abonnieren.
- [ ] **Push-Benachrichtigungen** — Browser-Pushes bei neuen Top-News.
- [ ] **Personalisierter Feed** — Reihenfolge nach Interessen gewichten.
- [ ] **„Für später lesen"-Liste** — Separate Merkliste mit Lesefortschritt.
- [ ] **Onboarding-Präferenzen** — Beim ersten Besuch Interessen abfragen.
- [ ] **Benachrichtigungs-Center** — In-App-Glocke mit Aktivitäts-Feed.
- [ ] **Profil-/Einstellungsseite** — Zentrale Verwaltung aller Präferenzen.

## 7. Daten & Backend / CMS

- [ ] **API-Anbindung** — Artikel über eine REST/GraphQL-API statt statischem Modul laden.
- [ ] **Headless-CMS** — Inhalte über z. B. Sanity/Strapi/Contentful pflegen.
- [ ] **Admin-Editor** — Geschützter Bereich zum Anlegen/Bearbeiten von Artikeln.
- [ ] **RSS-Import** — Offizielle Rockstar-/News-Feeds automatisch einlesen.
- [ ] **Bild-Upload & -Hosting** — Cover-Bilder hochladen statt URL eintragen.
- [ ] **Entwurf/Veröffentlicht-Status** — Artikel als Draft speichern, später publishen.
- [ ] **Geplante Veröffentlichung** — Artikel auf zukünftiges Datum terminieren.
- [ ] **Volltext-Suchindex** — Server-seitige Suche (z. B. Algolia/Meilisearch).
- [ ] **Caching-Layer** — Antworten cachen für schnelle Ladezeiten.
- [ ] **Webhook-Benachrichtigungen** — Bei neuem Artikel externe Dienste triggern.

## 8. Performance & PWA

- [ ] **Bild-Optimierung** — Responsive `srcset`, moderne Formate (WebP/AVIF).
- [ ] **Lazy-Loading verfeinern** — Bilder/Komponenten erst bei Bedarf laden.
- [ ] **Code-Splitting** — Routen/Modals als separate Chunks ausliefern.
- [ ] **Service Worker** — Offline-Fähigkeit & Caching von Assets.
- [ ] **PWA-Manifest** — Installierbar als App (Icon, Splash, Standalone).
- [ ] **Offline-Lesemodus** — Zuletzt geladene Artikel offline verfügbar.
- [ ] **Prefetching** — Artikeldaten beim Hover auf eine Karte vorladen.
- [ ] **Bundle-Analyse** — Bundle-Größe überwachen und reduzieren.
- [ ] **Core-Web-Vitals-Monitoring** — LCP/CLS/INP messen und optimieren.
- [ ] **Font-Optimierung** — Schriften lokal hosten & `font-display: swap`.

## 9. SEO, Sharing & Analytics

- [ ] **Dynamische Meta-Tags** — Pro Seite/Artikel Title & Description setzen.
- [ ] **OpenGraph & Twitter Cards** — Schöne Vorschauen beim Teilen.
- [ ] **Sitemap.xml** — Automatisch generierte Sitemap für Suchmaschinen.
- [ ] **robots.txt** — Crawler-Steuerung ergänzen.
- [ ] **JSON-LD (Schema.org)** — Strukturierte Daten als `NewsArticle`.
- [ ] **Canonical-URLs** — Duplicate-Content vermeiden.
- [ ] **RSS-/Atom-Feed (ausgehend)** — Eigenen Feed für Leser & Aggregatoren anbieten.
- [ ] **Analytics-Integration** — Datenschutzfreundliches Tracking (z. B. Plausible).
- [ ] **Cookie-Consent-Banner** — DSGVO-konforme Einwilligung.
- [ ] **Datenschutz & Impressum** — Rechtliche Pflichtseiten ergänzen.

## 10. Qualität, DevOps & Accessibility

- [ ] **Komponenten-Tests ausbauen** — Tests für jede UI-Komponente ergänzen.
- [ ] **E2E-Tests** — Playwright-Tests für die wichtigsten User-Flows.
- [ ] **CI-Pipeline** — GitHub Actions für Lint, Test & Build bei jedem Push/PR.
- [ ] **Automatisches Deployment** — CD auf z. B. Vercel/Netlify/Pages.
- [ ] **Storybook** — Komponenten-Katalog zur isolierten Entwicklung.
- [ ] **Internationalisierung (i18n)** — Mehrsprachigkeit (DE/EN) vorbereiten.
- [ ] **Accessibility-Audit** — Kontraste, Fokus, Screenreader systematisch prüfen.
- [ ] **Test-Coverage-Report** — Coverage messen und Schwelle erzwingen.
- [ ] **Pre-Commit-Hooks** — Lint/Format/Test automatisch vor jedem Commit (husky).
- [ ] **Fehler-Monitoring** — Laufzeitfehler erfassen (z. B. Sentry).
