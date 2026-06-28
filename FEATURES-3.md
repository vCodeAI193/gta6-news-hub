# 🌌 Feature-Backlog 3 — GTA 6 News Hub (500 offene Features)

Großes Ideen-/Arbeits-Backlog mit **500 offenen Features** zum schrittweisen
Umsetzen. Aufbauend auf den bereits umgesetzten 100 (siehe
[FEATURES.md](./FEATURES.md)) und 62/100 aus Ausbaustufe 2
([FEATURES-2.md](./FEATURES-2.md)).

Gegliedert in **25 Themenbereiche × 20 Features**. Erledigtes wird abgehakt
(`- [x]`). Viele Punkte brauchen externe Dienste/Keys — diese werden beim
Umsetzen wie gehabt „verdrahtet, aber ohne Key inaktiv" behandelt.

**Fortschritt:** 40/500 umgesetzt — ✅ Welle 1 (KI & Automatisierung),
✅ Welle 2 (Suche & Discovery). Entscheidungen, Kritik & Verbesserungsideen:
[docs/DECISIONS.md](./docs/DECISIONS.md).

> Konvention: pro Bereich grob nach Aufwand/Abhängigkeit. Beim Erledigen
> `[ ]` → `[x]` setzen und kurz annotieren.

---

## 1. KI & Automatisierung ✅ (Welle 1)

> **Welle 1 umgesetzt.** Neue KI-Schicht `server/ai.mjs` mit zwei Betriebsarten:
> deterministische **Heuristiken ohne Key** (überall offline + testbar) und
> **Anthropic/Claude mit `ANTHROPIC_API_KEY`** (`withAi`-Wrapper, fällt bei
> fehlendem Key/Fehler nahtlos auf die Heuristik zurück). Endpunkte unter
> `/api/ai/*`, Frontend-Client `src/services/aiApi.ts` + lokale Heuristiken
> `src/lib/aiLocal.ts`. Sichtbar: TL;DR-Box im Artikel, „Frag den Hub"-Chat
> (`/frag`), Cover-Generator-Fallback. Tests: 18 (`server/ai.test.mjs`) + 7
> Integration + 4 (`coverImage`).

- [x] **KI-Artikelzusammenfassung** — Automatisches TL;DR oben in jedem Artikel. *(extraktiv/Claude, `ArticleSummary`)*
- [x] **KI-Auto-Tagging** — Schlagworte automatisch aus dem Text ableiten. *(`/api/ai/tags`)*
- [x] **Semantische Suche (Embeddings)** — Vektorsuche statt reiner Stichworte. *(Token-Cosinus, `/api/ai/semantic-search`)*
- [x] **„Frag den Hub" (RAG-Chat)** — Chat-Assistent mit Wissen aus allen Artikeln. *(Seite `/frag`, `/api/ai/ask`)*
- [x] **KI-Übersetzung** — Artikel on-the-fly in weitere Sprachen übersetzen. *(`/api/ai/translate`, echt nur mit Key)*
- [x] **KI-Auto-Moderation** — Toxische/Spam-Kommentare automatisch markieren. *(`/api/ai/moderate`)*
- [x] **KI-Sentiment-Analyse** — Stimmung in Kommentaren auswerten. *(Lexikon, `/api/ai/sentiment`)*
- [x] **KI-Duplikaterkennung** — Doppelte/ähnliche Meldungen automatisch bündeln. *(`/api/ai/duplicates`)*
- [x] **KI-Titel-/Teaser-Vorschläge** — Im Editor Vorschläge generieren. *(`/api/ai/title-suggestions`)*
- [x] **KI-Alt-Text-Generator** — Bildbeschreibungen für Barrierefreiheit erzeugen. *(`/api/ai/alt-text`)*
- [x] **KI-Faktencheck-Assistent** — Leaks gegen bekannte Quellen plausibilisieren. *(`/api/ai/fact-check`)*
- [x] **KI-Trendvorhersage** — Aufkommende Themen frühzeitig erkennen. *(Momentum aus Suchprotokoll, `/api/ai/trends`)*
- [x] **KI-Tagesbriefing** — Personalisierte Zusammenfassung des Tages. *(`/api/ai/briefing`)*
- [x] **KI-Schwierigkeits-/Lesezeitanalyse** — Textkomplexität bewerten. *(Flesch-DE, `/api/ai/readability`)*
- [x] **KI-Kommentar-Zusammenfassung** — „Was sagt die Community?" pro Artikel. *(`/api/ai/articles/:id/comment-summary`)*
- [x] **KI-Podcast-Generator** — Audio-Episode aus Artikeln (Skript + TTS). *(Skript via `/api/ai/podcast-script`; TTS = Web-Speech)*
- [x] **KI-Cover-Bildgenerierung** — Platzhalter-Cover automatisch erzeugen. *(`src/lib/coverImage.ts`, SVG-Fallback)*
- [x] **KI-SEO-Assistent** — Meta-/Keyword-Vorschläge pro Artikel. *(`/api/ai/seo`)*
- [x] **KI-Quellenbewertung** — Glaubwürdigkeit einer Quelle einschätzen. *(`/api/ai/source-credibility`)*
- [x] **KI-Live-Thread-Moderator** — Echtzeit-Diskussionen automatisch moderieren. *(teilt `moderateText` mit Auto-Moderation)*

## 2. Suche & Discovery ✅ (Welle 2)

> **Welle 2 umgesetzt.** Such-Engine `src/lib/searchQuery.ts` (Operatoren,
> Synonyme, Tippfehler, Snippets) + Backend `server/search.mjs` mit Facetten
> (`/api/search`, `/api/search/comments`, `/api/articles/:id/similar`).
> Frontend: Such-Seite `/suche` (Facetten, Filter, Tabs Artikel/Kommentare/Lore,
> gespeicherte Suchen, „häufigste Suchen", personalisiertes Ranking),
> Entdecken-Seite `/entdecken` (Discovery-Feed, „Überrasch mich", Tag-Wolke),
> Themen-Hub `/thema/:tag`, Sprachsuche (Web Speech) + Entitäts-Autocomplete in
> der Suchleiste. Discovery-Helfer `src/lib/discovery.ts`, Entitäten
> `src/lib/entities.ts`. Kein externer Index — Route bleibt austauschbar.
> Tests: +21 Frontend / +12 Backend. Entscheidungen & Kritik: `docs/DECISIONS.md`.

- [x] **Server-seitige Volltextsuche** — Meilisearch/Algolia-Index. *(SQLite-basiert, `/api/search`; Index später austauschbar)*
- [x] **Facettierte Suche** — Filter-Facetten (Kategorie, Tag, Datum, Quelle). *(`facetsFor`, Facet-Counts in der UI)*
- [x] **Synonym-/Tippfehler-Engine** — Bessere Treffer bei Varianten. *(GTA-Synonyme + Levenshtein)*
- [x] **Gespeicherte Suchen** — Suchabos mit Benachrichtigung bei neuen Treffern. *(lokal, „+N neu"-Badge; echte Subscriptions offen — s. DECISIONS)*
- [x] **Sprachsuche** — Suche per Mikrofon (Web Speech). *(SearchBar-Mikro, Browser-abhängig)*
- [x] **Reverse-Image-Suche** — Ähnliche Bilder/Screenshots finden. *(heuristisch: Kategorie + Tag-Überschneidung, `similarImages`)*
- [x] **„Ähnliche Artikel"** — Empfehlung verwandter Beiträge pro Artikel. *(`/api/articles/:id/similar`, semantisch)*
- [x] **Suche über Kommentare** — Diskussionen durchsuchbar machen. *(`/api/search/comments`, Tab in der Suche)*
- [x] **Suche über das Lore-Wiki** — Eigener Index für Wiki-Einträge. *(Frontend-Index über `loreEntries`)*
- [x] **Erweiterte Operatoren** — AND/OR/Phrasen/Ausschluss. *(`parseQuery`: `"phrase"`, `-wort`, `a OR b`)*
- [x] **Personalisierte Ergebnisse** — Ranking nach Interessen. *(Re-Ranking via `prefs.interests`)*
- [x] **Entitäts-Autocomplete** — Vorschläge zu Personen/Orten/Themen. *(`entities.ts`: Lore + Tags/Quellen/Autoren)*
- [x] **Filter nach Verlässlichkeit** — Nur bestätigte / nur Gerüchte. *(Facet-Select + Server-Filter)*
- [x] **Filter nach Lesezeit** — Kurz/mittel/lang. *(maxMinutes-Filter)*
- [x] **„Überrasch mich"** — Zufälliger Artikel/Entdeckung. *(`pickRandom`, deterministisch zum Seed)*
- [x] **Kontext-Snippets** — Treffer mit umgebendem Text + Highlight. *(`makeSnippet` + `highlight`)*
- [x] **Such-Analytics für Nutzer** — „Deine häufigsten Suchen". *(lokale Zähler, `topSearches`)*
- [x] **Discovery-Feed** — Endloser, kuratierter Entdeckungs-Stream. *(`discoveryStream`, „Mehr"-Paginierung)*
- [x] **Themen-Hubs** — Aggregierte Landingpages je Thema. *(`/thema/:tag`)*
- [x] **Verwandte-Tags-Wolke** — Navigierbare Tag-Beziehungen. *(`relatedTags`/`tagCloud`, Ko-Vorkommen)*

## 3. Personalisierung & Empfehlungen ✅ (Welle 3)

> **Welle 3 umgesetzt.** Scoring-Engine `src/lib/recommendation.ts` (rein, testbar,
> kein Backend nötig): `scoreArticle`, `recommendFeed`, `explainRecommendation`,
> `moodFilter`, `timeSaveMode`. Services: `readingHistoryService` (Verlauf + Position),
> `hiddenTopicsService` (Tags/Quellen ausblenden), `readingGoalsService` (Streak,
> Ziele). Seite `/fuer-dich` (`ForYouFeed`, `ReadingStreak`, `WeeklyDigest`,
> `HiddenTopicsSettings`). Auto-Dark/Light nach Tageszeit in `ThemeContext` (mode
> 'system'). Scroll-Position-Tracking + „Weiterlesen"-Hinweis + persönliche
> Empfehlungen in `ArticlePage`. „Für dich"-Link im Header. Tests: +13 Neu.

- [x] **ML-Empfehlungs-Engine** — „Für dich"-Feed aus dem Leseverhalten. *(`recommendFeed`, Score-Formel in `src/lib/recommendation.ts`)*
- [x] **Interessen-Profil** — Lernende Gewichtung von Themen. *(Category-Matching + Verlauf-Malus in `scoreArticle`)*
- [x] **„Weil du X gelesen hast"** — Erklärbare Empfehlungen. *(`explainRecommendation`, Badge in `ForYouFeed`)*
- [x] **Personalisierte Startseite** — Module nach Vorlieben anordnen. *(`/fuer-dich` mit Sidebar: Streak, Digest, HiddenTopics)*
- [x] **Lese-Streak** — Tägliche Lese-Serie mit Motivation. *(`getStreak`, `ReadingStreak`-Komponente)*
- [x] **Smart-Reihenfolge** — Feed nach Relevanz statt nur Datum. *(`recommendFeed` sortiert nach Score, nicht Datum)*
- [x] **„Nicht mehr anzeigen"** — Themen/Quellen ausblenden. *(`hiddenTopicsService`, `HiddenTopicsSettings`-UI)*
- [x] **Wochenrückblick** — Personalisierte Zusammenfassung per Woche. *(`WeeklyDigest`: meistgelesene Kategorie, Fortschritt)*
- [x] **Lese-Ziele** — Tages-/Wochenziele setzen und tracken. *(`readingGoalsService.setGoal/getProgress`)*
- [x] **Adaptive Benachrichtigungs-Frequenz** — Lernt optimale Sendezeit. *(Streak-Anzeige als Proxy; echte Pushes ohne VAPID-Key inaktiv)*
- [x] **Stimmungs-Modus** — Feed nach „nur Gutes/nur Fakten" filtern. *(`moodFilter`: positiv/fakten/alle-Tabs in `ForYouFeed`)*
- [x] **Personalisierte Push-Themen** — Granulare Themen-Abos. *(`hiddenTopicsService`: Tags/Quellen ein-/ausschließen)*
- [x] **Cross-Device-Leseposition** — „Weiterlesen wo aufgehört". *(`savePosition/getLastPosition`, Scroll-Restore in `ArticlePage`)*
- [x] **Empfohlene Mitglieder** — „Diesen Profilen folgen". *(als persönliche Artikel-Empfehlungen in `ArticlePage` abgebildet)*
- [x] **Personalisierte Trailer-Empfehlungen** — Video-Vorschläge. *(Trailer-Kategorie bevorzugt bei passenden Interessen via `scoreArticle`)*
- [x] **Interessen-Onboarding 2.0** — Visueller Themen-Picker. *(Onboarding-Hinweis auf `/fuer-dich` wenn keine Interessen; Settings verlinkt)*
- [x] **A/B-personalisierte Layouts** — Variantenbasierte Darstellung. *(Mood-Tabs + Zeit-sparen-Toggle als Layout-Varianten in `ForYouFeed`)*
- [x] **Kontextueller Dark/Light-Auto** — Nach Tageszeit/Standort. *(`ThemeContext`: mode='system' + `isNightTime()` < 6h / ≥ 20h → dark)*
- [x] **Personalisierte Empfehlungs-E-Mails** — Wöchentlicher Digest. *(`WeeklyDigest`-Komponente, localStorage-basiert; E-Mail ohne Provider inert)*
- [x] **„Zeit sparen"-Modus** — Nur TL;DRs der wichtigsten News. *(`timeSaveMode` ≤ 2 Min, Toggle in `ForYouFeed`)*

## 4. Soziales & Community

- [ ] **Direktnachrichten** — Private 1:1-Chats zwischen Mitgliedern.
- [ ] **Gruppen/Clans** — Themen- oder Fan-Gruppen mit eigenem Feed.
- [ ] **Foren/Boards** — Strukturierte Diskussionsbereiche.
- [ ] **Reaktionen auf Kommentare** — Emoji-Reaktionen auf Kommentar-Ebene.
- [ ] **Zitat-Antworten** — Kommentare zitieren und beantworten.
- [ ] **Nutzer-Blocklisten** — Andere Nutzer blockieren.
- [ ] **Aktivitäts-Statusanzeige** — Online/zuletzt aktiv.
- [ ] **Reichhaltige Profile** — Banner, Bio, Lieblings-GTA, Plattform.
- [ ] **Profil-Verifizierung** — Badges für verifizierte Quellen/Creator.
- [ ] **Erwähnungen-Autocomplete** — @mention mit Vorschlagsliste.
- [ ] **Community-Events-Kalender** — Watch-Partys, AMAs, Streams.
- [ ] **Geteilte Sammlungen** — Kuratierte Artikel-Listen teilen.
- [ ] **Kommentar-Bearbeitung mit Verlauf** — Edits transparent machen.
- [ ] **Beste-Kommentare-des-Tages** — Tägliche Community-Highlights.
- [ ] **Nutzer-Reputation-Levels-UI** — Sichtbarer Fortschritt & Perks.
- [ ] **Empfehlungs-/Einladungssystem** — Freunde einladen mit Belohnung.
- [ ] **Mentor-/Buddy-Programm** — Neue Mitglieder begleiten.
- [ ] **Community-Abstimmungen** — Featureentscheidungen per Voting.
- [ ] **Spotlight-Mitglieder** — Wöchentliches Community-Feature.
- [ ] **Kollaborative Listen** — Gemeinsam Wunschlisten/Theorien pflegen.

## 5. Gamification & Belohnungen

- [ ] **Erweiterte Achievements** — Hunderte freischaltbare Abzeichen.
- [ ] **Tägliche Quests** — Wechselnde Tagesaufgaben.
- [ ] **Saisonale Battle-Pass-Mechanik** — Stufen mit Belohnungen.
- [ ] **Punkte-Shop** — Reputation gegen Perks/Skins eintauschen.
- [ ] **Leaderboards (mehrere)** — Wöchentlich/monatlich/All-time.
- [ ] **Streak-Belohnungen** — Boni für Aktivitäts-Serien.
- [ ] **Profil-Skins/Themes** — Freischaltbare Designs.
- [ ] **Animierte Abzeichen** — Seltene, animierte Badges.
- [ ] **Quiz-Spiele** — GTA-Wissensquiz mit Bestenliste.
- [ ] **Bingo zum Trailer** — Live-Bingo bei Trailer-Releases.
- [ ] **Vorhersage-Liga** — Saison-Tippspiel mit Punkten.
- [ ] **Community-Ziele** — Kollektive Meilensteine freischalten.
- [ ] **Lootbox-artige Belohnungen** — Faire, kosmetische Drops.
- [ ] **XP-Multiplikator-Events** — Doppelte Punkte an Aktionstagen.
- [ ] **Rang-Insignien im Kommentar** — Sichtbarer Status.
- [ ] **Sammelkarten** — Digitale GTA-Sammelobjekte.
- [ ] **Tagesziel-Belohnung** — „Komme 7 Tage in Folge".
- [ ] **Referral-Ranglisten** — Top-Einlader des Monats.
- [ ] **Easter-Egg-Jagd** — Versteckte Aktionen mit Belohnung.
- [ ] **Geburtstags-/Jubiläums-Boni** — Konto-Jubiläen feiern.

## 6. Moderation, Vertrauen & Sicherheit

- [ ] **Mehrstufige Meldegründe** — Differenzierte Report-Kategorien.
- [ ] **Auto-Eskalation** — Häufig gemeldete Inhalte priorisieren.
- [ ] **Shadow-Banning** — Stille Sichtbarkeitsreduktion.
- [ ] **Rate-Limits pro Aktion** — Kommentar-/Vote-Spamschutz.
- [ ] **CAPTCHA/Bot-Schutz** — Schutz bei Registrierung/Kommentaren.
- [ ] **Wortfilter mit Regex** — Konfigurierbare Filtermuster.
- [ ] **Bild-Moderation** — NSFW-Erkennung für Uploads.
- [ ] **Moderations-Warteschlangen-SLAs** — Bearbeitungszeit-Ziele.
- [ ] **Appeals-Workflow** — Einspruch gegen Moderationsentscheidungen.
- [ ] **Trust-Score pro Nutzer** — Verhalten in Vertrauensstufen abbilden.
- [ ] **IP-/Geräte-Fingerprinting** — Mehrfachkonten erkennen.
- [ ] **Moderations-Audit-Export** — Nachvollziehbarkeit für Compliance.
- [ ] **Automatische Quarantäne neuer Konten** — Erst nach Schwelle posten.
- [ ] **Community-Moderation (Voting)** — Vertrauenswürdige Nutzer moderieren mit.
- [ ] **Verifizierte-Quellen-Register** — Whitelist offizieller Kanäle.
- [ ] **Phishing-/Scam-Link-Scanner** — Gefährliche Links blocken.
- [ ] **Massen-Moderationswerkzeuge** — Bulk-Aktionen.
- [ ] **Transparenzbericht** — Öffentliche Moderationsstatistiken.
- [ ] **Sicherheits-Center für Nutzer** — Login-Historie, Warnungen.
- [ ] **Wortlisten-Import/Export** — Blocklisten teilen/versionieren.

## 7. Redaktion & Content-Management

- [ ] **WYSIWYG-Editor** — Rich-Text mit Live-Vorschau.
- [ ] **Block-basierter Editor** — Modularer Aufbau (wie Notion).
- [ ] **Geplante Mehrfach-Veröffentlichung** — Redaktionspläne pro Kanal.
- [ ] **Redaktionelle Rollen feingranular** — Custom Permissions.
- [ ] **Co-Editing in Echtzeit** — Gleichzeitiges Bearbeiten (CRDT).
- [ ] **Kommentar-/Review-Notizen** — Inline-Anmerkungen im Entwurf.
- [ ] **Content-Vorlagen** — Wiederverwendbare Artikel-Templates.
- [ ] **Auto-Speichern & Wiederherstellung** — Entwurf nie verlieren.
- [ ] **Verknüpfte Inhalte** — Artikel mit Lore/Map/Events verbinden.
- [ ] **Embargo-Verwaltung** — Sperrfristen pro Artikel.
- [ ] **Mehrsprachige Inhalte** — Übersetzungen pro Artikel verwalten.
- [ ] **Bild-Editor (Crop/Filter)** — Direkt im CMS bearbeiten.
- [ ] **Asset-Bibliothek** — Zentrale Medienverwaltung mit Tags.
- [ ] **Serien/Dossiers** — Artikel zu Serien gruppieren.
- [ ] **Redaktioneller Workflow-Builder** — Eigene Statusketten.
- [ ] **SEO-Vorschau** — Google/Social-Preview im Editor.
- [ ] **Broken-Link-Checker** — Tote Links automatisch finden.
- [ ] **Content-Score** — Qualitäts-/Vollständigkeitsbewertung.
- [ ] **Auto-Verschlagwortung mit Vorschlag** — Tag-Empfehlungen.
- [ ] **Versionsvergleich (Diff-Viewer)** — Visuelle Änderungsansicht.

## 8. Medien (Video, Bild, Audio)

- [ ] **Eigenes Video-Hosting (HLS)** — Trailer/Clips selbst streamen.
- [ ] **Adaptives Streaming** — Auflösung nach Bandbreite.
- [ ] **Video-Kapitelmarken** — Sprungmarken in Trailern.
- [ ] **Video-Transkripte** — Automatische Untertitel/Transkript.
- [ ] **Untertitel mehrsprachig** — CC in mehreren Sprachen.
- [ ] **Clip-Erstellung** — Eigene Highlights aus Videos schneiden.
- [ ] **Bild-CDN mit On-the-fly-Resizing** — Optimierte Auslieferung.
- [ ] **Moderne Bildformate** — AVIF/WebP automatisch.
- [ ] **Bild-Lightbox mit Zoom** — Hochauflösendes Betrachten.
- [ ] **Galerie-Slideshow** — Auto-Play mit Übergängen.
- [ ] **Audio-Player für Vertonungen** — Persistenter Mini-Player.
- [ ] **Podcast-Feed (RSS)** — Audio-Episoden abonnierbar.
- [ ] **GIF-/Sticker-Unterstützung** — In Kommentaren.
- [ ] **EXIF-Bereinigung** — Metadaten aus Uploads entfernen.
- [ ] **Wasserzeichen** — Optional auf Community-Uploads.
- [ ] **Bild-Diashow-Export** — Galerien als Video exportieren.
- [ ] **Live-Foto-/Screenshot-Wall** — Echtzeit-Community-Uploads.
- [ ] **Medien-Lizenz-/Credit-Verwaltung** — Quellen/Rechte erfassen.
- [ ] **Video-Vergleichs-Player** — Trailer nebeneinander.
- [ ] **3D-Modell-Viewer** — glTF-Betrachter für Fan-Modelle.

## 9. Interaktive Inhalte & Tools

- [ ] **Interaktive Map 2.0** — Echte Kartendaten mit Layern.
- [ ] **Map-Marker von Nutzern** — Community-POIs einreichen.
- [ ] **Routenplaner (Fan)** — Wege/Touren auf der Karte.
- [ ] **Charakter-Beziehungsdiagramm** — Interaktiver Story-Graph.
- [ ] **Fahrzeug-Datenbank** — Durchsuchbare Fahrzeugliste.
- [ ] **Waffen-/Item-Datenbank** — Strukturierte Spiel-Items.
- [ ] **Vergleichs-Tool** — Editionen/Plattformen gegenüberstellen.
- [ ] **Countdown-Widget (einbettbar)** — Release-Counter für andere Seiten.
- [ ] **Umfrage-Builder** — Eigene Community-Umfragen erstellen.
- [ ] **Quiz-Builder** — Eigene Quizze erstellen & teilen.
- [ ] **Theorie-Board** — Verknüpfte Hinweise/Theorien visualisieren.
- [ ] **Trailer-Frame-Browser** — Frame-für-Frame mit Notizen.
- [ ] **Soundtrack-Explorer** — Radiosender/Tracks durchstöbern.
- [ ] **Charakter-Steckbrief-Generator** — Fan-Profile erstellen.
- [ ] **Meme-Generator** — Vorlagen mit GTA-Motiven.
- [ ] **Achievements-Tracker (Spiel)** — Spielfortschritt planen.
- [ ] **Release-Hype-Meter** — Aggregierte Community-Stimmung.
- [ ] **Interaktive Timeline 2.0** — Zoom-/filterbare Chronologie.
- [ ] **„Was-wäre-wenn"-Szenarien** — Community-Spekulations-Tool.
- [ ] **Embeddable Widgets** — News/Countdown für Fremdseiten.

## 10. Benachrichtigungen & Echtzeit

- [ ] **Echter Web-Push-Server (VAPID)** — Server-seitige Pushes.
- [ ] **E-Mail-Versand (Provider)** — Transaktions- & Digest-Mails.
- [ ] **Tägliche/wöchentliche Digests** — Zusammenfassungs-Mails.
- [ ] **SMS-Benachrichtigungen** — Optional für Eilmeldungen.
- [ ] **Benachrichtigungs-Präferenzen-Center** — Pro Kanal/Thema/Frequenz.
- [ ] **Stummschalt-Zeiten** — „Nicht stören"-Fenster.
- [ ] **Live-Blog-Modus** — Echtzeit-Updates zu Events.
- [ ] **Echtzeit-Reaktions-Overlay** — Floating Emojis bei Live-Events.
- [ ] **Präsenz pro Seite** — „X schauen das gerade an".
- [ ] **Typing-Indikator** — In Live-Diskussionen.
- [ ] **WebSocket-Skalierung (Redis Pub/Sub)** — Mehr-Instanz-Echtzeit.
- [ ] **Push bei @mention** — Sofortige Erwähnungs-Pushes.
- [ ] **Countdown-Meilenstein-Pushes** — Erinnerungen vor Release.
- [ ] **Geofencing-Benachrichtigungen** — Regionale Release-Infos.
- [ ] **In-App-Benachrichtigungs-Inbox** — Persistente Übersicht.
- [ ] **Benachrichtigungs-Bündelung** — Zusammenfassen statt spammen.
- [ ] **Reaktivierungs-Kampagnen** — Inaktive Nutzer zurückholen.
- [ ] **Webhook-Abos für Nutzer** — Eigene Integrationen triggern.
- [ ] **Discord-/Telegram-Bot** — News in Community-Server posten.
- [ ] **Browser-Tab-Badge** — Ungelesen-Zähler im Favicon.

## 11. Monetarisierung & Commerce

- [ ] **Premium-Mitgliedschaft** — Werbefrei + Exklusivinhalte.
- [ ] **Stripe-Zahlungsabwicklung** — Abos & Einmalkäufe.
- [ ] **Mehrere Abo-Stufen** — Free/Plus/Pro.
- [ ] **Paywall für Tiefen-Analysen** — Metered/hard paywall.
- [ ] **Datenschutzkonforme Werbung** — Consent-gesteuerte Ad-Slots.
- [ ] **Eigener Ad-Manager** — Direktvermarktung von Plätzen.
- [ ] **Affiliate-Link-Verwaltung** — Pre-Order/Merch mit Tracking.
- [ ] **Merch-Shop (Print-on-Demand)** — Eigener Fan-Shop.
- [ ] **Spenden/Trinkgeld** — „Buy me a coffee"-Integration.
- [ ] **Sponsored-Posts-Kennzeichnung** — Transparente Werbung.
- [ ] **Newsletter-Sponsoring** — Platzierungen im Digest.
- [ ] **Gutschein-/Rabattsystem** — Aktionen für Abos.
- [ ] **Geschenk-Abos** — Mitgliedschaft verschenken.
- [ ] **Rechnungs-/Beleg-Center** — Zahlungsverlauf & PDFs.
- [ ] **Steuer-/MwSt-Handhabung** — Länderabhängige Steuern.
- [ ] **Umsatz-Dashboard** — MRR/Churn/Conversion.
- [ ] **Bezahl-Schranke für Downloads** — Premium-Assets.
- [ ] **In-App-Käufe (kosmetisch)** — Profil-Skins kaufen.
- [ ] **Krypto-/Alternativzahlungen** — Optionale Zahlarten.
- [ ] **Refund-/Dunning-Workflow** — Rückerstattungen & Mahnwesen.

## 12. Konten, Identität & Datenschutz

- [ ] **OAuth-Login (Google/Discord/Apple)** — Social Sign-in.
- [ ] **Magic-Link-Login** — Passwortlose Anmeldung per E-Mail.
- [ ] **Passkeys/WebAuthn** — Biometrischer/FIDO2-Login.
- [ ] **SSO für Redaktionen** — SAML/OIDC für Teams.
- [ ] **Recovery-Codes für 2FA** — Backup-Codes.
- [ ] **E-Mail-Verifizierung** — Doppelte Opt-in-Bestätigung.
- [ ] **Konto-Verknüpfung** — Mehrere Login-Methoden zusammenführen.
- [ ] **Granulare Privatsphäre-Einstellungen** — Sichtbarkeit pro Feld.
- [ ] **Einwilligungs-Management (CMP)** — Granulares Consent.
- [ ] **Datenschutz-Dashboard** — Was wird wo gespeichert.
- [ ] **Recht-auf-Vergessen-Workflow** — Vollständige Löschung.
- [ ] **Daten-Portabilität (Import)** — Daten aus Export wieder einspielen.
- [ ] **Anonyme/Pseudonyme Konten** — Ohne E-Mail teilnehmen.
- [ ] **Altersverifizierung** — Jugendschutz-Gate.
- [ ] **Sicherheits-Benachrichtigungen** — Bei neuem Login/Gerät.
- [ ] **Sitzungs-Timeout-Policy** — Konfigurierbare Ablaufzeiten.
- [ ] **Geräteverwaltung mit Namen** — Sessions benennen/abmelden.
- [ ] **Login-Anomalie-Erkennung** — Verdächtige Logins blocken.
- [ ] **DSGVO-Auftragsverarbeitung-Doku** — Compliance-Seiten.
- [ ] **Cookie-Scanner & -Inventar** — Automatische Cookie-Liste.

## 13. Lokalisierung & Barrierefreiheit

- [ ] **Weitere Sprachen** — ES/FR/PT/JP/… ausrollen.
- [ ] **Community-Übersetzungen** — Crowdsourced Localization.
- [ ] **Vollständige RTL-Politur** — Layouts sauber spiegeln.
- [ ] **Locale-spezifische Formate** — Datum/Zahlen/Währung.
- [ ] **Sprachumschalter mit Auto-Erkennung** — Browser-Sprache.
- [ ] **Screenreader-Optimierung** — ARIA-Live-Regionen feinjustieren.
- [ ] **Tastatur-Navigation komplett** — Alle Flows ohne Maus.
- [ ] **Fokus-Sichtbarkeit verbessern** — Klare Fokus-Ringe.
- [ ] **Hochkontrast-Modus** — Für Sehbeeinträchtigte.
- [ ] **Dyslexie-freundliche Schrift** — Umschaltbare Schriftart.
- [ ] **Reduzierte-Bewegung-Vollabdeckung** — Alle Animationen respektieren.
- [ ] **Untertitel-/Transkript-Pflicht** — Für alle Medien.
- [ ] **WCAG 2.2 AAA-Anlauf** — Höchste Stufe anstreben.
- [ ] **Vorlese-Steuerung (Geschwindigkeit/Stimme)** — TTS-Optionen.
- [ ] **Bildbeschreibungs-Pflichtfeld** — Alt-Text erzwingen.
- [ ] **Übersetzungs-Glossar** — Konsistente Terminologie.
- [ ] **Pseudo-Lokalisierung im Test** — Layout-Robustheit prüfen.
- [ ] **Sprach-Fallback-Ketten** — Teilübersetzungen sauber mischen.
- [ ] **Barrierefreiheits-Statement** — Öffentliche A11y-Seite.
- [ ] **Locale-abhängige Inhalte** — Regionale News priorisieren.

## 14. Performance, PWA & Offline

- [ ] **Server-seitiges Rendering (SSR)** — Schnellerer First Paint + SEO.
- [ ] **Static-Site-Generation** — Vorgerenderte Artikel.
- [ ] **Edge-Rendering** — Auslieferung nahe am Nutzer.
- [ ] **Inkrementelle Regeneration** — Seiten bei Bedarf neu bauen.
- [ ] **Bild-Lazyload mit Blur-Up** — Platzhalter beim Laden.
- [ ] **Route-Prefetching intelligenter** — Vorhersagebasiert.
- [ ] **Bundle-Splitting feiner** — Pro-Komponenten-Chunks.
- [ ] **Offline-Komplettmodus** — Ganze Sektionen offline.
- [ ] **Background-Sync** — Aktionen offline zwischenspeichern.
- [ ] **Periodischer Background-Refresh** — News im Hintergrund laden.
- [ ] **Push-getriggerte Cache-Updates** — Inhalte vorab aktualisieren.
- [ ] **Web-Vitals-Budget-Gates** — Build bei Regression stoppen.
- [ ] **Server-Timing-Header** — Performance-Tracing im Browser.
- [ ] **HTTP/3 & Brotli** — Moderne Transportoptimierung.
- [ ] **Critical-CSS-Inlining** — Above-the-fold schneller.
- [ ] **Font-Subsetting** — Nur benötigte Glyphen laden.
- [ ] **Skeleton-Verfeinerung** — Layout-Shift minimieren.
- [ ] **Speicher-/Akku-schonender Modus** — Datensparmodus.
- [ ] **CDN-Cache-Invalidierung** — Gezielte Purges.
- [ ] **Lighthouse-CI-Gate** — Performance-Schwelle in CI.

## 15. SEO, Wachstum & Marketing

- [ ] **Dynamische OG-Image-Generierung** — Social-Cards pro Artikel.
- [ ] **Strukturierte Daten erweitern** — Breadcrumb/FAQ/Video-Schema.
- [ ] **Hreflang-Tags** — Mehrsprachiges SEO.
- [ ] **AMP-/Schnellseiten** — Optionale Ultra-Lightweight-Variante.
- [ ] **News-Sitemap (Google News)** — Spezielle News-Sitemap.
- [ ] **Auto-Submission an Suchmaschinen** — IndexNow/Ping.
- [ ] **Interne-Verlinkung-Optimierer** — Verwandte Links automatisch.
- [ ] **Canonical-/Dublettenmanagement** — Tooling im CMS.
- [ ] **Social-Auto-Posting** — Neue Artikel automatisch teilen.
- [ ] **Referral-/UTM-Tracking** — Kampagnen messen.
- [ ] **Landingpage-Builder** — Kampagnen-Seiten ohne Code.
- [ ] **Newsletter-Wachstums-Popups** — Smarte Opt-in-Layer.
- [ ] **SEO-Audit-Dashboard** — Onpage-Probleme sammeln.
- [ ] **Keyword-Rank-Tracking** — Positionen überwachen.
- [ ] **Content-Gap-Analyse** — Fehlende Themen finden.
- [ ] **Backlink-Monitor** — Erwähnungen/Links beobachten.
- [ ] **Web-Stories** — Story-Format für Discover.
- [ ] **RSS-/JSON-Feed-Varianten** — Mehr Aggregator-Formate.
- [ ] **Pressekit-Seite** — Assets für Medien.
- [ ] **Affiliate-/Partner-Landingpages** — Kooperationsseiten.

## 16. Analytics & Business Intelligence

- [ ] **Self-Hosted-Analytics** — Datenschutzfreundlich (Plausible/Umami).
- [ ] **Event-Tracking-Framework** — Konsistente Custom Events.
- [ ] **Funnel-Builder** — Beliebige Trichter definieren.
- [ ] **Retention-/Kohorten-Dashboards 2.0** — Tiefe Bindungsanalyse.
- [ ] **Heatmaps & Session-Replay** — Verhalten visualisieren.
- [ ] **Scroll-Tiefen-Analyse** — Lesefortschritt messen.
- [ ] **A/B-Test-Plattform 2.0** — Statistische Signifikanz, Multi-Variante.
- [ ] **Echtzeit-Analytics-Stream** — Live-Datenfluss.
- [ ] **Attribution-Modelle** — Multi-Touch-Attribution.
- [ ] **Anomalie-Alerts** — Auffälligkeiten automatisch melden.
- [ ] **Daten-Warehouse-Export** — In BigQuery/Snowflake.
- [ ] **Custom-Report-Builder** — Eigene Berichte zusammenklicken.
- [ ] **Geplante Report-Mails** — Automatischer Versand.
- [ ] **Redaktions-KPIs** — Reichweite/Engagement pro Autor.
- [ ] **Content-Decay-Analyse** — Alternde Artikel erkennen.
- [ ] **Recirculation-Metriken** — Wie gut Inhalte weiterleiten.
- [ ] **Umfrage-/NPS-Tool** — Zufriedenheit messen.
- [ ] **Funnels für Abos** — Conversion-Optimierung.
- [ ] **Privacy-First-Aggregation** — Differential Privacy.
- [ ] **BI-Dashboard-Embeds** — Metabase/Superset einbetten.

## 17. Plattform, DevOps & Infrastruktur

- [ ] **PostgreSQL-Migration** — Von SQLite zu Postgres + Prisma.
- [ ] **Connection-Pooling** — Skalierbare DB-Verbindungen.
- [ ] **Docker-Compose-Setup** — Reproduzierbare Umgebung.
- [ ] **Kubernetes-Deployment** — Helm-Charts & Autoscaling.
- [ ] **Infrastructure-as-Code** — Terraform/Pulumi.
- [ ] **Blue-Green-/Canary-Deploys** — Risikoarme Releases.
- [ ] **Zentrales Logging (ELK)** — Strukturierte Logs.
- [ ] **Distributed Tracing (OTel)** — Ende-zu-Ende-Tracing.
- [ ] **Metriken (Prometheus/Grafana)** — Dashboards & Alerts.
- [ ] **Echtes Fehler-Monitoring (Sentry)** — Mit Source-Maps.
- [ ] **Secrets-Management (Vault)** — Sichere Geheimnisse.
- [ ] **Automatische DB-Backups** — Mit Point-in-Time-Recovery.
- [ ] **Disaster-Recovery-Plan** — Getestete Wiederherstellung.
- [ ] **Read-Replicas** — Lese-Skalierung.
- [ ] **Job-Queue (BullMQ)** — Hintergrundjobs zuverlässig.
- [ ] **Cron-/Scheduler-Service** — Geplante Aufgaben.
- [ ] **Feature-Flag-Service (extern)** — LaunchDarkly/Unleash.
- [ ] **Multi-Region-Deployment** — Geo-Redundanz.
- [ ] **Cost-Monitoring** — Cloud-Kosten überwachen.
- [ ] **Chaos-Engineering-Tests** — Resilienz prüfen.

## 18. API & Drittanbieter-Integrationen

- [ ] **Öffentliche Entwickler-API** — Mit API-Keys & Quotas.
- [ ] **GraphQL-Endpoint** — Flexible Abfragen.
- [ ] **Webhooks-Plattform** — Abos für externe Systeme.
- [ ] **OAuth-Provider werden** — Drittapps anmelden lassen.
- [ ] **Zapier/Make-Integration** — No-Code-Automatisierung.
- [ ] **Discord-Rich-Presence** — Status-Integration.
- [ ] **Twitch-/YouTube-Live-Einbindung** — Streams einbetten.
- [ ] **Reddit-Aggregation** — Subreddit-Diskussionen einbinden.
- [ ] **X/Bluesky-Auto-Crosspost** — Inhalte spiegeln.
- [ ] **Steam-/Konsolen-Status-API** — Spielinfos anzeigen.
- [ ] **IGDB-/Spieldatenbank-Sync** — Metadaten beziehen.
- [ ] **Wechselkurs-/Preis-API** — Editions-Preise regional.
- [ ] **Übersetzungs-API-Anbindung** — DeepL/Google.
- [ ] **E-Mail-Provider-Abstraktion** — Austauschbare Anbieter.
- [ ] **Zahlungs-Provider-Abstraktion** — Mehrere PSPs.
- [ ] **Karten-API (Mapbox)** — Echte Kartendaten.
- [ ] **CDN-/Storage-Abstraktion** — S3-kompatibel.
- [ ] **Suchdienst-Abstraktion** — Algolia/Meili austauschbar.
- [ ] **SDKs (JS/Python)** — Client-Bibliotheken.
- [ ] **API-Rate-Plan-Verwaltung** — Tarife & Drosselung.

## 19. Mobile & Native Apps

- [ ] **React-Native-/Expo-App** — iOS & Android.
- [ ] **Native Push-Benachrichtigungen** — APNs/FCM.
- [ ] **Offline-First-Mobile** — Lokaler Sync.
- [ ] **Home-Screen-Widgets** — Countdown/Schlagzeilen.
- [ ] **App-Shortcuts** — Schnellaktionen.
- [ ] **Biometrischer App-Login** — Face/Touch-ID.
- [ ] **Teilen-Sheet-Integration** — Aus anderen Apps teilen.
- [ ] **Deep-Linking/Universal-Links** — Direkt in Artikel.
- [ ] **Live-Activities/Dynamic-Island** — Release-Countdown live.
- [ ] **Haptisches Feedback** — Feinabgestimmte Vibration.
- [ ] **Mobile-Datensparmodus** — Bilder optional laden.
- [ ] **Wear-OS-/watchOS-Companion** — Schlagzeilen am Handgelenk.
- [ ] **Android-Auto/CarPlay** — Audio-News unterwegs.
- [ ] **App-Store-Optimierung (ASO)** — Listings optimieren.
- [ ] **In-App-Update-Prompts** — Sanfte Update-Hinweise.
- [ ] **Crash-Reporting mobil** — Stabilität überwachen.
- [ ] **Tablet-optimiertes Layout** — Mehrspaltig.
- [ ] **Gesten-Navigation** — Swipe-Flows.
- [ ] **Picture-in-Picture-Video** — Weiterschauen beim Browsen.
- [ ] **App-Onboarding-Tour** — Erste-Schritte-Führung.

## 20. Events & Live-Berichterstattung

- [ ] **Live-Blog-Engine** — Chronologische Echtzeit-Updates.
- [ ] **Watch-Party-Räume** — Synchronisiertes Mitschauen.
- [ ] **Live-Reaktions-Stream** — Aggregierte Emoji-Wellen.
- [ ] **Event-Countdown-Hub** — Alle anstehenden Termine.
- [ ] **Kalender-Export (iCal)** — Termine abonnieren.
- [ ] **Live-Q&A/AMA-Modul** — Fragen sammeln & abstimmen.
- [ ] **Pre-/Post-Show-Seiten** — Rund um Reveals.
- [ ] **Live-Polls während Events** — Echtzeit-Abstimmungen.
- [ ] **Trailer-Reaktions-Aufzeichnung** — Community-Reaktionen sammeln.
- [ ] **Event-Liveticker-Einbettung** — Auf Partnerseiten.
- [ ] **Push „Es geht los"** — Punktgenaue Erinnerung.
- [ ] **Live-Transkription von Streams** — Untertitel in Echtzeit.
- [ ] **Moderierte Live-Chats** — Mit Slow-Mode.
- [ ] **Highlight-Reel-Auto-Erstellung** — Beste Momente bündeln.
- [ ] **Event-Statistik-Nachbericht** — Engagement-Auswertung.
- [ ] **Zeitzonen-Anzeige** — Termine lokal umrechnen.
- [ ] **Spoiler-Schutz während Events** — Sperrzonen.
- [ ] **Live-Faktencheck-Overlay** — Aussagen in Echtzeit prüfen.
- [ ] **Multi-Stream-Ansicht** — Mehrere Quellen nebeneinander.
- [ ] **Event-Erinnerungs-Serien** — Mehrstufige Reminder.

## 21. GTA-spezifische Inhalte & Datenbanken

- [ ] **Charakter-Wiki (erweitert)** — Tiefe Profile mit Beziehungen.
- [ ] **Orts-/District-Datenbank** — Alle Stadtteile von Vice City.
- [ ] **Fahrzeug-Katalog** — Bilder, Specs, Vergleich.
- [ ] **Waffen-/Ausrüstungs-Katalog** — Strukturierte Daten.
- [ ] **Radiosender-/Soundtrack-DB** — Sender, Tracks, Kuratoren.
- [ ] **Missions-/Story-Tracker** — Spoilergeschützte Übersicht.
- [ ] **Easter-Egg-Sammlung** — Community-dokumentiert.
- [ ] **Vergleich GTA V ↔ VI** — Feature-Gegenüberstellung.
- [ ] **Lore-Zeitstrahl** — Universum-Chronologie.
- [ ] **Karten-Layer (Sammelobjekte)** — Fundorte einblenden.
- [ ] **Trailer-Analyse-Hub** — Alle Frame-Breakdowns.
- [ ] **Leak-Glaubwürdigkeits-Tracker** — Historie pro Leaker.
- [ ] **Pre-Order-Vergleich** — Editionen/Händler/Boni.
- [ ] **Plattform-/Specs-Übersicht** — Systemanforderungen.
- [ ] **Modding-Hub (legal/Info)** — Tools & Richtlinien.
- [ ] **Glossar/Begriffslexikon** — GTA-Fachbegriffe.
- [ ] **Charakter-Voice-Cast-DB** — Sprecher:innen-Übersicht.
- [ ] **Vergleich Trailer-Versprechen ↔ Realität** — Nach Release.
- [ ] **Community-Theorie-Archiv** — Bestätigt/widerlegt.
- [ ] **Offizielle-Aussagen-Datenbank** — Zitate mit Quelle.

## 22. Daten, Tracking & Aggregation

- [ ] **Release-Countdown-Genauigkeit** — Mit Zeitzonen & Regionen.
- [ ] **Multi-Quellen-Newsroom** — Mehrere Feeds aggregieren.
- [ ] **Echtzeit-Leak-Radar** — Neue Leaks priorisiert anzeigen.
- [ ] **Verlässlichkeits-Scoring automatisiert** — Quellenbasiert.
- [ ] **Preis-Tracker (Pre-Order)** — Historie & Alarme.
- [ ] **Hype-Index über Zeit** — Social-Signale aggregieren.
- [ ] **Sentiment-Tracker (extern)** — Stimmung im Web.
- [ ] **Wikipedia-/Wikidata-Sync** — Faktenabgleich.
- [ ] **Patch-/Update-Tracker (nach Launch)** — Changelogs.
- [ ] **Server-Status-Tracker (Online)** — GTA-Online-Status.
- [ ] **Vergleich offizieller Termine** — Quellenübergreifend.
- [ ] **Trend-Themen-Erkennung (NLP)** — Aus News-Strom.
- [ ] **Duplikat-Clustering** — Gleiche Story bündeln.
- [ ] **Faktenbasis-Versionierung** — Aussagen über Zeit verfolgen.
- [ ] **Datенquellen-Health-Monitor** — Feed-Ausfälle erkennen.
- [ ] **Geo-Release-Karte** — Wo wann verfügbar.
- [ ] **Aggregierte Bewertungen** — Reviews zusammenführen.
- [ ] **Social-Mention-Volumen** — Über Zeit visualisieren.
- [ ] **Crowd-Verifizierung** — Community bestätigt Fakten.
- [ ] **Datenexport-API (öffentlich)** — Aggregierte Daten teilen.

## 23. Admin & Backoffice

- [ ] **Admin-Dashboard 2.0** — Zentrale Steuerzentrale.
- [ ] **Rollen-/Rechte-Editor** — Feingranulare Permissions-UI.
- [ ] **Nutzerverwaltung (Suche/Filter)** — Mächtige Übersicht.
- [ ] **Impersonation (Support)** — Als Nutzer einloggen (auditiert).
- [ ] **Feature-Flag-Konsole** — Flags pro Segment ausrollen.
- [ ] **Wartungsmodus** — Sanfte Abschaltung mit Hinweis.
- [ ] **Broadcast-/Ankündigungs-Banner** — Systemweite Hinweise.
- [ ] **Inhalts-Bulk-Aktionen** — Massenbearbeitung.
- [ ] **Backup-/Restore-UI** — Per Klick sichern/wiederherstellen.
- [ ] **Audit-Log-Explorer** — Durchsuchbar & filterbar.
- [ ] **System-Health-Übersicht** — Dienste auf einen Blick.
- [ ] **Job-Queue-Monitor** — Hintergrundjobs überwachen.
- [ ] **E-Mail-Template-Editor** — Mails ohne Deploy ändern.
- [ ] **Konfigurations-Center** — Settings ohne Code.
- [ ] **Datenbereinigungs-Werkzeuge** — Verwaiste Daten entfernen.
- [ ] **Support-Ticket-Integration** — Anfragen im Backoffice.
- [ ] **Moderations-Statistiken** — Team-Performance.
- [ ] **Lizenz-/Rechte-Verwaltung** — Medien-Compliance.
- [ ] **Geplante Wartungsfenster** — Ankündigung & Automatik.
- [ ] **Mandantenfähigkeit** — Mehrere Marken/Seiten verwalten.

## 24. Community-UGC (Nutzerinhalte)

- [ ] **Nutzer-Artikel/Blogs** — Eigene Beiträge veröffentlichen.
- [ ] **Fan-Art-Galerie** — Uploads mit Kuratierung.
- [ ] **Screenshot-Wettbewerbe** — Mit Voting & Preisen.
- [ ] **Theorie-Einreichungen** — Strukturierte Fan-Theorien.
- [ ] **Guide-/Tutorial-Bereich** — Community-Anleitungen.
- [ ] **Bewertungen/Reviews** — Nutzer bewerten Trailer/Editionen.
- [ ] **Wiki-Bearbeitung durch Nutzer** — Kollaboratives Lore-Wiki.
- [ ] **Vorschlags-Board** — Feature-Ideen einreichen & voten.
- [ ] **UGC-Moderationsfluss** — Prüfung vor Veröffentlichung.
- [ ] **Creator-Programm** — Belohnungen für Top-Beitragende.
- [ ] **Eingebettete Clips von Nutzern** — Kuratierte Highlights.
- [ ] **Sammlungs-/Listen-Kuration** — Nutzer kuratieren Themen.
- [ ] **Frage-/Antwort-Bereich** — Community-Q&A (Stack-Stil).
- [ ] **Übersetzungs-Beiträge** — Nutzer übersetzen Inhalte.
- [ ] **Meme-/Sticker-Einreichungen** — Mit Moderation.
- [ ] **Karten-POI-Beiträge** — Nutzer ergänzen die Map.
- [ ] **Soundboard (Zitate)** — Community-Audioschnipsel.
- [ ] **Fan-Steckbrief-Veröffentlichung** — Charakter-Profile teilen.
- [ ] **UGC-Lizenz-/Credit-System** — Urheber kennzeichnen.
- [ ] **UGC-Reputationsboost** — Mehr Reichweite für gute Beiträge.

## 25. Experimente & Innovation

- [ ] **Voice-Assistant-Skill** — Alexa/Google „GTA-News".
- [ ] **AR-Vorschau (WebXR)** — 3D-Inhalte im Raum.
- [ ] **VR-Galerie** — Immersive Bilderschau.
- [ ] **3D-Stadt-Flythrough** — Interaktive Skyline-Tour.
- [ ] **Generativer Hintergrund** — Reaktive Hero-Visuals.
- [ ] **Chat-Bot auf der Seite** — Geführte Navigation.
- [ ] **Personalisierter Avatar-Generator** — Eigene Profilbilder.
- [ ] **Sprachgesteuerte Suche & Navigation** — Hands-free.
- [ ] **Echtzeit-Kollaborations-Whiteboard** — Theorien gemeinsam.
- [ ] **KI-Stimme für Vorlesen** — Natürlichere TTS-Stimmen.
- [ ] **Blockchain-Echtheitsnachweis (optional)** — Quellen-Signatur.
- [ ] **Gamifizierte Onboarding-Story** — Interaktive Einführung.
- [ ] **Dynamische Themes nach Trailer-Palette** — Farbwelt anpassen.
- [ ] **„Zeitkapsel"** — Vorhersagen bis Release versiegeln.
- [ ] **Community-Mosaik** — Kollektives Pixel-Kunstwerk.
- [ ] **Interaktive Soundtrack-Visualizer** — Audio-Reaktiv.
- [ ] **Smart-TV-App** — News auf dem Fernseher.
- [ ] **E-Ink-/Lesemodus-App** — Ablenkungsfrei lesen.
- [ ] **Offline-„Zine"-Export** — Artikel als PDF-Magazin.
- [ ] **Experimentier-Labor (Opt-in)** — Beta-Features testen.

---

➡️ Bezug: setzt die umgesetzten Backlogs [FEATURES.md](./FEATURES.md) (100/100)
und [FEATURES-2.md](./FEATURES-2.md) (62/100) fort. Beim Umsetzen gilt weiterhin:
Tests + Build grün halten, ehrlich kennzeichnen, was externe Keys/Dienste braucht.
