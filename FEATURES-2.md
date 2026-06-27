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

---

## 11. Konten & Identität

- [x] **Registrierung & Login** — Echte Nutzerkonten mit E-Mail/Passwort.
- [ ] **OAuth-Login** — Anmeldung via Google, Discord, Apple.
- [ ] **Magic-Link-Login** — Passwortlose Anmeldung per E-Mail-Link.
- [ ] **Öffentliche Profilseiten** — Avatar, Bio, Aktivität, Kommentare eines Nutzers.
- [ ] **2-Faktor-Authentifizierung** — TOTP/Authenticator-App-Support.
- [ ] **Server-seitige Sync** — Lesezeichen/Einstellungen geräteübergreifend synchronisieren.
- [x] **Rollen & Berechtigungen** — Leser, Autor, Moderator, Admin.
- [ ] **Konto-Einstellungen** — E-Mail ändern, Passwort zurücksetzen, Konto löschen (DSGVO).
- [x] **Sitzungsverwaltung** — Aktive Geräte/Sessions anzeigen & abmelden. *(API — Sessions auflisten/widerrufen)*
- [ ] **Datenexport** — Nutzerdaten als JSON exportieren (DSGVO-Auskunft).

## 12. Echtes Backend & API

- [x] **REST/GraphQL-API** — Produktiver Server (z. B. Node/Nest oder Hono).
- [x] **Datenbank** — Persistente Speicherung (PostgreSQL/Prisma). *(SQLite via node:sqlite)*
- [x] **Auth-Middleware** — JWT/Session-basierte API-Absicherung.
- [x] **Rate-Limiting** — Schutz vor Missbrauch & Spam.
- [ ] **Server-seitige Suche** — Algolia/Meilisearch-Index statt Client-Fuse.
- [ ] **Bild-Upload zu CDN** — Objektspeicher (S3) + Bild-CDN statt DataURL.
- [ ] **Server-seitiges Rendering** — SSR/SSG (Next.js/Remix) für SEO & Speed.
- [ ] **API-Versionierung** — `/v1`-Namespacing & Deprecation-Strategie.
- [ ] **OpenAPI-Spezifikation** — Dokumentierte, typsichere API (Swagger).
- [x] **Datenbank-Migrationen** — Versionierte Schema-Migrationen & Seeds.

## 13. Redaktion & Moderation

- [ ] **Redaktioneller Workflow** — Entwurf → Review → Freigabe → Veröffentlichung.
- [ ] **Moderations-Queue** — Gemeldete Kommentare/Artikel zentral prüfen.
- [ ] **Spam-Filter** — Automatische Erkennung & Quarantäne von Spam.
- [ ] **Wort-/Blocklisten** — Konfigurierbare Filter für Kommentare.
- [ ] **Versionshistorie** — Änderungsverlauf je Artikel mit Diff & Rollback.
- [ ] **Mehrere Autoren** — Co-Authoring & Zuweisung von Beiträgen.
- [ ] **Audit-Log** — Nachvollziehbare Protokollierung aller Redaktions-Aktionen.
- [ ] **Geplanter Redaktionskalender** — Kalender-Ansicht für geplante Beiträge.
- [ ] **Bann-/Mute-System** — Nutzer temporär oder dauerhaft sperren.
- [ ] **Faktencheck-Workflow** — Leak-Verifizierung mit Status-Updates.

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

- [ ] **WebSocket-Live-Updates** — Neue Artikel/Kommentare ohne Reload.
- [ ] **Echter Web-Push-Server** — Server-seitige Push-Benachrichtigungen (VAPID).
- [ ] **E-Mail-Newsletter-Versand** — Echter Versand via Provider (Resend/Postmark).
- [ ] **Tägliche/wöchentliche Digests** — Zusammenfassungs-Mails nach Interessen.
- [ ] **Live-Kommentar-Threads** — Echtzeit-Diskussion zu Events (z. B. Trailer-Launch).
- [ ] **Präsenzanzeige** — „X Nutzer lesen das gerade".
- [ ] **Breaking-News-Banner** — Sofort-Einblendung bei Eilmeldungen.
- [ ] **Benachrichtigungs-Einstellungen** — Granular pro Kanal/Thema/Frequenz.
- [ ] **Countdown-Push** — Erinnerungen zu Release-Meilensteinen.
- [ ] **Discord-/Webhook-Integration** — Neue Artikel in Communities posten.

## 16. Gamification & Community

- [ ] **Reputationssystem** — Punkte/Karma für hilfreiche Beiträge.
- [ ] **Abzeichen & Achievements** — Badges für Aktivität & Meilensteine.
- [ ] **Level & Fortschritt** — Sichtbarer Community-Rang.
- [ ] **Nutzer-Einreichungen** — Leser reichen News/Leaks zur Prüfung ein.
- [ ] **Upvote/Downvote für Kommentare** — Beste Kommentare nach oben.
- [ ] **Wöchentliche Community-Challenges** — Themen-Aktionen mit Belohnung.
- [ ] **Tippspiel zum Release** — Wetten auf Termin/Details, Bestenliste.
- [ ] **Folgen & Feed** — Autoren/Themen folgen, personalisierter Aktivitäts-Feed.
- [ ] **Nutzer-Erwähnungen** — `@mention` in Kommentaren mit Benachrichtigung.
- [ ] **Community-Wiki** — Kollaborative Wissensseiten zu GTA 6.

## 17. Medien & Interaktiv

- [ ] **Eigenes Video-Hosting** — Trailer/Clips selbst hosten & streamen (HLS).
- [ ] **Interaktive Vice-City-Karte** — Zoombare Map mit Points of Interest.
- [ ] **Release-Timeline** — Interaktive Chronologie aller Ankündigungen.
- [ ] **Bildvergleich (Before/After)** — Slider für Trailer-Vergleiche.
- [ ] **Galerie-/Screenshot-Hub** — Durchsuchbare Medienbibliothek.
- [ ] **Eingebettete Tweets/Posts** — Social-Embeds mit Datenschutz-Klick-Schutz.
- [ ] **Audio-Version (TTS)** — Artikel als Audio vorlesen lassen.
- [ ] **Charakter-/Lore-Datenbank** — Strukturierte Wiki-Einträge zu Figuren/Orten.
- [ ] **Trailer-Frame-Analyse** — Annotierte Standbilder mit Hotspots.
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

- [ ] **Redaktions-Dashboard** — Aufrufe, Verweildauer, Top-Artikel.
- [ ] **A/B-Testing-Framework** — Überschriften/Layouts experimentell testen.
- [ ] **Funnel-Analyse** — Conversion vom Besuch zum Abo nachverfolgen.
- [ ] **Heatmaps** — Klick-/Scroll-Verhalten visualisieren.
- [ ] **Echtzeit-Besucherzähler** — Live-Traffic im Dashboard.
- [ ] **Such-Analytics** — Häufige Suchbegriffe & Null-Treffer auswerten.
- [ ] **Kohorten-Analyse** — Nutzerbindung über die Zeit.
- [ ] **Trend-Erkennung** — Aufkommende Themen automatisch erkennen.
- [ ] **Export & Reports** — Geplante CSV/PDF-Berichte.
- [ ] **Performance-Budget-Monitoring** — Web-Vitals-Alarme bei Regression.

## 20. Plattform & Betrieb

- [ ] **Native Mobile-App** — iOS/Android via React Native/Expo.
- [ ] **Erweiterte Lokalisierung** — Mehr Sprachen + RTL-Support.
- [ ] **Feature-Flags** — Funktionen gezielt ausrollen (Canary/Beta).
- [ ] **Observability** — Logging, Tracing, Metriken (OpenTelemetry).
- [ ] **Echtes Fehler-Monitoring** — Sentry mit Source-Maps in Produktion.
- [ ] **Backup & Restore** — Automatisierte DB-Backups & Wiederherstellung.
- [ ] **CDN & Edge-Caching** — Globale Auslieferung mit Edge-Funktionen.
- [ ] **Status-Seite** — Öffentliche Uptime-/Incident-Seite.
- [ ] **Lasttests** — Performance unter Last (k6) automatisiert.
- [ ] **Barrierefreiheit nach WCAG 2.2 AA** — Vollständiges Audit & Zertifizierung.
