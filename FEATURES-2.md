# 🚀 Feature-Backlog 2 — GTA 6 News Hub (Ausbaustufe 2)

Aufbauend auf den 100 bereits umgesetzten Features (siehe [FEATURES.md](./FEATURES.md))
sammelt dieses Dokument **100 weitere, fortgeschrittenere Features**. Schwerpunkt:
echtes Backend, Konten, Moderation, KI, Echtzeit, Monetarisierung, native Apps und
Betrieb — also alles, was die lokale Mock-Schicht zu einer „echten" Plattform macht.

**Bereits umgesetzt (Ausbaustufe 1):** Routing, localStorage-Service-Schicht,
Suche/Filter, Community-/Personalisierungs-Features, Admin/CMS-Editor, PWA, SEO,
Tests/CI. Dieses Backlog ersetzt die lokalen Mocks Schritt für Schritt durch echte
Dienste.

> Konvention: pro Kategorie grob nach Priorität/Aufwand sortiert. Beim Erledigen
> `[ ]` → `[x]` setzen.

### ✅ Welle 1 umgesetzt — Echtes Backend & Konten

Ein produktiver **Node/Express-Server mit SQLite** (`server/`) ist live und
ersetzt die Mock-Schicht, wenn `VITE_API_URL` gesetzt ist:

- Registrierung/Login (JWT + bcrypt), Rollen (reader→admin), Sessions/Widerruf
- REST-API für Artikel/Kommentare/Reaktionen/Votes/Reports, Auth-Middleware,
  Rate-Limiting, Schema-Migrationen + Seed
- Frontend lädt Artikel & Auth über die API (mit localStorage-Fallback offline)
- 16 Backend-Tests (`npm run test:server`), 40 Frontend-Tests — alle grün

Details: [server/README.md](./server/README.md).

### ✅ Welle 2 umgesetzt — Community ans Backend & Moderation

- Kommentare, Reaktionen und Leak-Votes laufen jetzt über das echte Backend
  (mit localStorage-Fallback offline); Kommentieren erfordert Login
- **Spam-Filter & Blocklisten** (serverseitig): verdächtige Kommentare landen in
  der Moderations-Queue, gesperrte Begriffe werden abgewiesen
- **Moderations-Seite** (`/moderation`, ab Rolle Moderator): Queue freigeben/
  ablehnen, Meldungen erledigen, Nutzer sperren/entsperren, Audit-Log
- **Faktencheck**: Moderator setzt die Verlässlichkeit eines Leaks (mit Audit)
- 22 Backend-Tests (inkl. 6 Moderationstests) — alle grün

### ✅ Welle 3 umgesetzt — Echtzeit (WebSockets)

- **WebSocket-Server** (`/ws`) am API-Server; Frontend-`RealtimeProvider` mit
  Auto-Reconnect (inaktiv ohne `VITE_API_URL`)
- **Live-Kommentare**: neue/freigegebene Kommentare erscheinen ohne Reload
- **Präsenzanzeige**: „👁 X lesen das gerade" pro Artikel + Online-Zähler im Header
- **Breaking-News-Banner**: Redaktion sendet Eilmeldungen (Admin-Formular) an
  alle verbundenen Clients in Echtzeit; optionaler Discord-Webhook
- 25 Backend-Tests (inkl. 3 Realtime-Tests) — alle grün

### ✅ Welle 4 umgesetzt — Gamification & Community

- **Reputationssystem**: Punkte fürs Kommentieren (+2), erhaltene Upvotes (+1)
  und freigegebene Einreichungen (+10)
- **Kommentar-Upvotes/Downvotes** mit Score-Sortierung (beste zuerst)
- **Level & Abzeichen**: Ränge (Rookie → Legende) + automatische Badges
- **Nutzer-Einreichungen** (`/einreichen`): Leser reichen News ein → Moderations-
  Queue → Freigabe veröffentlicht & belohnt
- **Öffentliche Profile** (`/u/:id`) mit Reputation/Level/Badges + **Rangliste**
  (`/rangliste`)
- 37 Backend-Tests (inkl. Gamification + Level/Badge-Unit-Tests) — alle grün

### ✅ Welle 5 umgesetzt — Medien & Interaktiv (reines Frontend)

- **Interaktive Vice-City-Karte** (`/karte`): zoom-/verschiebbare SVG-Karte mit
  klickbaren POIs und Lore-Verlinkung
- **Release-Timeline** (`/timeline`) inkl. Trailer-Analyse: **Before/After-Slider**
  und annotierte **Frame-Hotspots**; DSGVO-Social-Embed mit Klick-Schutz
- **Galerie-/Screenshot-Hub** (`/galerie`): durchsuchbare Medienbibliothek + Lightbox
- **Charakter-/Lore-Wiki** (`/lore`, `/lore/:id`) mit Fakten & Markdown
- **Vorlesen (TTS)** für Artikel & Lore über die Web-Speech-API
- 45 Frontend-Tests (inkl. Timeline-/Galerie-Unit-Tests) — alle grün

### ✅ Welle 6 umgesetzt — Plattform & Betrieb

- **API-Versionierung** (`/api/v1` als Alias) + **OpenAPI-Spezifikation**
  (`/api/openapi.json`) mit Doku-Seite (`/api-docs`)
- **Feature-Flags**: serverseitig, Admin-Toggle, im UI ausgewertet (Footer/Nav)
- **Observability**: Request-Metriken & Uptime (`/api/metrics`)
- **Backup & Restore** der Inhalts-Tabellen (admin)
- **Status-Seite** (`/status`): API, Echtzeit, Uptime, Flags live
- **WCAG-Audit** (axe über mehrere Kernkomponenten) + **k6-Lasttest-Script**
- 44 Backend-Tests (inkl. Plattform-Tests) + 48 Frontend-Tests — alle grün

### ✅ Welle 8 umgesetzt — Redaktion & Analytics

- **Versionshistorie + Rollback**: jede Artikeländerung wird als Revision
  gesichert; Wiederherstellen im Admin-Editor
- **Redaktioneller Workflow**: Status „Review" → Freigabe im Moderations-Tab
- **Redaktionskalender**: geplante/zu prüfende Beiträge nach Datum im Admin
- **Redaktions-Dashboard** (`/dashboard`): Aufruf-Tracking, Top-Artikel, Totals
- **Such-Analytics**: Top-Suchbegriffe & Suchen ohne Treffer
- **CSV-Export** der Artikel-Reports
- 50 Backend-Tests (inkl. Editorial/Analytics) + 48 Frontend-Tests — alle grün

### ✅ Welle 9 umgesetzt — Konto & Community

- **Konto-Einstellungen**: Name/E-Mail/Passwort ändern, Konto löschen (DSGVO)
- **DSGVO-Datenexport** als JSON; **geräteübergreifende Sync** von Lesezeichen/
  Einstellungen (`/api/me/sync`)
- **Folgen & Aktivitäts-Feed** (`/feed`): Profilen folgen, Beiträge gefolgter
  Mitglieder sehen; Follower-Zähler im Profil
- **Release-Tippspiel** (`/tippspiel`): Tipps auf Termin/Plattform/Metascore mit
  Community-Tally
- 60 Backend-Tests (inkl. Account/Social-Tests) + 48 Frontend-Tests — alle grün

---

## 11. Konten & Identität

- [x] **Registrierung & Login** — Echte Nutzerkonten mit E-Mail/Passwort.
- [ ] **OAuth-Login** — Anmeldung via Google, Discord, Apple.
- [ ] **Magic-Link-Login** — Passwortlose Anmeldung per E-Mail-Link.
- [x] **Öffentliche Profilseiten** — Avatar, Bio, Aktivität, Kommentare eines Nutzers. *(/u/:id — Reputation, Level, Badges, Kommentare)*
- [ ] **2-Faktor-Authentifizierung** — TOTP/Authenticator-App-Support.
- [x] **Server-seitige Sync** — Lesezeichen/Einstellungen geräteübergreifend synchronisieren. *(Lesezeichen/Einstellungen, /api/me/sync)*
- [x] **Rollen & Berechtigungen** — Leser, Autor, Moderator, Admin.
- [x] **Konto-Einstellungen** — E-Mail ändern, Passwort zurücksetzen, Konto löschen (DSGVO). *(Name/E-Mail/Passwort ändern, Konto löschen)*
- [x] **Sitzungsverwaltung** — Aktive Geräte/Sessions anzeigen & abmelden. *(API — Sessions auflisten/widerrufen)*
- [x] **Datenexport** — Nutzerdaten als JSON exportieren (DSGVO-Auskunft). *(DSGVO-JSON-Export)*

## 12. Echtes Backend & API

- [x] **REST/GraphQL-API** — Produktiver Server (z. B. Node/Nest oder Hono).
- [x] **Datenbank** — Persistente Speicherung (PostgreSQL/Prisma). *(SQLite via node:sqlite)*
- [x] **Auth-Middleware** — JWT/Session-basierte API-Absicherung.
- [x] **Rate-Limiting** — Schutz vor Missbrauch & Spam.
- [ ] **Server-seitige Suche** — Algolia/Meilisearch-Index statt Client-Fuse.
- [ ] **Bild-Upload zu CDN** — Objektspeicher (S3) + Bild-CDN statt DataURL.
- [ ] **Server-seitiges Rendering** — SSR/SSG (Next.js/Remix) für SEO & Speed.
- [x] **API-Versionierung** — `/v1`-Namespacing & Deprecation-Strategie. *(/api/v1 als Alias)*
- [x] **OpenAPI-Spezifikation** — Dokumentierte, typsichere API (Swagger). *(/api/openapi.json + /api-docs)*
- [x] **Datenbank-Migrationen** — Versionierte Schema-Migrationen & Seeds.

## 13. Redaktion & Moderation

- [x] **Redaktioneller Workflow** — Entwurf → Review → Freigabe → Veröffentlichung. *(Entwurf → Review → Freigabe, /moderation)*
- [x] **Moderations-Queue** — Gemeldete Kommentare/Artikel zentral prüfen. *(Pending-Kommentare + Meldungen, /moderation)*
- [x] **Spam-Filter** — Automatische Erkennung & Quarantäne von Spam. *(Heuristik: Links/CAPS/Wiederholungen → Queue)*
- [x] **Wort-/Blocklisten** — Konfigurierbare Filter für Kommentare. *(serverseitig, via COMMENT_BLOCKLIST erweiterbar)*
- [x] **Versionshistorie** — Änderungsverlauf je Artikel mit Diff & Rollback. *(Revisionen + Rollback)*
- [ ] **Mehrere Autoren** — Co-Authoring & Zuweisung von Beiträgen.
- [x] **Audit-Log** — Nachvollziehbare Protokollierung aller Redaktions-Aktionen.
- [x] **Geplanter Redaktionskalender** — Kalender-Ansicht für geplante Beiträge. *(Admin: geplante/Review-Beiträge nach Datum)*
- [x] **Bann-/Mute-System** — Nutzer temporär oder dauerhaft sperren.
- [x] **Faktencheck-Workflow** — Leak-Verifizierung mit Status-Updates. *(Moderator setzt Verlässlichkeit + Audit)*

## 14. KI & Automatisierung

- [ ] **KI-Artikelzusammenfassung** — Automatische TL;DR pro Artikel.
- [ ] **KI-Übersetzung** — Artikel on-the-fly in weitere Sprachen.
- [ ] **Auto-Tagging** — Schlagworte automatisch aus dem Text ableiten.
- [ ] **Personalisierte Empfehlungen** — ML-basiertes „Das könnte dich interessieren".
- [ ] **Semantische Suche** — Embedding-/Vektor-Suche statt reiner Stichworte.
- [ ] **KI-Chat-Assistent** — „Frag den Hub" zu GTA-6-Themen (RAG über Artikel).
- [ ] **Duplikat-Erkennung** — Ähnliche/doppelte Meldungen automatisch bündeln.
- [ ] **Sentiment-Analyse** — Stimmung in Kommentaren auswerten.
- [ ] **Auto-Moderation** — KI markiert toxische Kommentare zur Prüfung.
- [ ] **KI-Titel-/Teaser-Vorschläge** — Im Editor Vorschläge generieren.

## 15. Echtzeit & Benachrichtigungen

- [x] **WebSocket-Live-Updates** — Neue Artikel/Kommentare ohne Reload.
- [ ] **Echter Web-Push-Server** — Server-seitige Push-Benachrichtigungen (VAPID).
- [ ] **E-Mail-Newsletter-Versand** — Echter Versand via Provider (Resend/Postmark).
- [ ] **Tägliche/wöchentliche Digests** — Zusammenfassungs-Mails nach Interessen.
- [x] **Live-Kommentar-Threads** — Echtzeit-Diskussion zu Events (z. B. Trailer-Launch).
- [x] **Präsenzanzeige** — „X Nutzer lesen das gerade".
- [x] **Breaking-News-Banner** — Sofort-Einblendung bei Eilmeldungen.
- [ ] **Benachrichtigungs-Einstellungen** — Granular pro Kanal/Thema/Frequenz.
- [ ] **Countdown-Push** — Erinnerungen zu Release-Meilensteinen.
- [x] **Discord-/Webhook-Integration** — Neue Artikel in Communities posten. *(Eilmeldungen → Discord, inert ohne DISCORD_WEBHOOK_URL)*

## 16. Gamification & Community

- [x] **Reputationssystem** — Punkte/Karma für hilfreiche Beiträge.
- [x] **Abzeichen & Achievements** — Badges für Aktivität & Meilensteine.
- [x] **Level & Fortschritt** — Sichtbarer Community-Rang.
- [x] **Nutzer-Einreichungen** — Leser reichen News/Leaks zur Prüfung ein. *(→ Moderations-Queue, +Rep bei Freigabe)*
- [x] **Upvote/Downvote für Kommentare** — Beste Kommentare nach oben.
- [ ] **Wöchentliche Community-Challenges** — Themen-Aktionen mit Belohnung.
- [x] **Tippspiel zum Release** — Wetten auf Termin/Details, Bestenliste. *(/tippspiel — Tipps + Tally)*
- [x] **Folgen & Feed** — Autoren/Themen folgen, personalisierter Aktivitäts-Feed. *(Profile folgen → /feed)*
- [ ] **Nutzer-Erwähnungen** — `@mention` in Kommentaren mit Benachrichtigung.
- [ ] **Community-Wiki** — Kollaborative Wissensseiten zu GTA 6.

## 17. Medien & Interaktiv

- [ ] **Eigenes Video-Hosting** — Trailer/Clips selbst hosten & streamen (HLS).
- [x] **Interaktive Vice-City-Karte** — Zoombare Map mit Points of Interest.
- [x] **Release-Timeline** — Interaktive Chronologie aller Ankündigungen.
- [x] **Bildvergleich (Before/After)** — Slider für Trailer-Vergleiche.
- [x] **Galerie-/Screenshot-Hub** — Durchsuchbare Medienbibliothek.
- [x] **Eingebettete Tweets/Posts** — Social-Embeds mit Datenschutz-Klick-Schutz. *(Klick-Schutz/DSGVO)*
- [x] **Audio-Version (TTS)** — Artikel als Audio vorlesen lassen. *(Web-Speech-API, kein externer Dienst)*
- [x] **Charakter-/Lore-Datenbank** — Strukturierte Wiki-Einträge zu Figuren/Orten. *(/lore)*
- [x] **Trailer-Frame-Analyse** — Annotierte Standbilder mit Hotspots. *(annotierte Standbilder mit Hotspots)*
- [ ] **360°-/Panorama-Viewer** — Interaktive Vice-City-Ansichten.

## 18. Monetarisierung & Wachstum

- [ ] **Mitgliedschaften (Premium)** — Werbefrei + exklusive Inhalte.
- [ ] **Zahlungsabwicklung** — Stripe-Integration für Abos.
- [ ] **Datenschutzkonforme Werbung** — Ad-Slots mit Consent-Steuerung.
- [ ] **Affiliate-Links** — Pre-Order-/Merch-Links mit Tracking.
- [ ] **Referral-Programm** — Freunde einladen, Belohnungen erhalten.
- [ ] **Spenden/Trinkgeld** — „Buy me a coffee" für das Fan-Projekt.
- [ ] **Merch-Shop-Anbindung** — Print-on-Demand-Store.
- [ ] **Paywall für Premium-Analysen** — Tiefen-Artikel hinter Abo.
- [ ] **Sponsored-Posts-Kennzeichnung** — Transparente Werbe-Markierung.
- [ ] **Newsletter-Sponsoring** — Platzierungen im E-Mail-Digest.

## 19. Analytics & Insights

- [x] **Redaktions-Dashboard** — Aufrufe, Verweildauer, Top-Artikel. *(/dashboard — Aufrufe, Top-Artikel)*
- [ ] **A/B-Testing-Framework** — Überschriften/Layouts experimentell testen.
- [ ] **Funnel-Analyse** — Conversion vom Besuch zum Abo nachverfolgen.
- [ ] **Heatmaps** — Klick-/Scroll-Verhalten visualisieren.
- [ ] **Echtzeit-Besucherzähler** — Live-Traffic im Dashboard.
- [x] **Such-Analytics** — Häufige Suchbegriffe & Null-Treffer auswerten. *(Top-Begriffe + Null-Treffer)*
- [ ] **Kohorten-Analyse** — Nutzerbindung über die Zeit.
- [ ] **Trend-Erkennung** — Aufkommende Themen automatisch erkennen.
- [x] **Export & Reports** — Geplante CSV/PDF-Berichte. *(CSV-Export)*
- [ ] **Performance-Budget-Monitoring** — Web-Vitals-Alarme bei Regression.

## 20. Plattform & Betrieb

- [ ] **Native Mobile-App** — iOS/Android via React Native/Expo.
- [ ] **Erweiterte Lokalisierung** — Mehr Sprachen + RTL-Support.
- [x] **Feature-Flags** — Funktionen gezielt ausrollen (Canary/Beta). *(GET /api/flags, Admin-Toggle, gated im UI)*
- [x] **Observability** — Logging, Tracing, Metriken (OpenTelemetry). *(Request-Metriken + Uptime, /api/metrics)*
- [ ] **Echtes Fehler-Monitoring** — Sentry mit Source-Maps in Produktion.
- [x] **Backup & Restore** — Automatisierte DB-Backups & Wiederherstellung. *(Inhalts-Export/-Import, admin)*
- [ ] **CDN & Edge-Caching** — Globale Auslieferung mit Edge-Funktionen.
- [x] **Status-Seite** — Öffentliche Uptime-/Incident-Seite. *(/status — API, Echtzeit, Flags)*
- [x] **Lasttests** — Performance unter Last (k6) automatisiert. *(k6-Script scripts/loadtest.js)*
- [x] **Barrierefreiheit nach WCAG 2.2 AA** — Vollständiges Audit & Zertifizierung. *(axe-Audit über Kernkomponenten in CI)*
