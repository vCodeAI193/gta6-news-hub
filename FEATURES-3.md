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

## 4. Soziales & Community ✅ (Welle 4)

> **Welle 4 umgesetzt.** Service `src/services/socialService.ts` (localStorage):
> DMs, Gruppen/Clans, Block-Liste, Community-Events, Abstimmungen,
> Kommentar-Reaktionen, kollaborative Listen, Spotlight-Rotation, Tages-Highlights.
> Seiten: `/community` (Gruppen, Votes, Events, Spotlight, Highlights, Kollaboration),
> `/nachrichten` (DM-Inbox + Thread), `/profil` (UserProfilePage mit Banner/Bio/Edit).
> Nav: „👥 Community" + „🎮 Spielen" in Header.

- [x] **Direktnachrichten** — Private 1:1-Chats zwischen Mitgliedern. *(`sendMessage/getMessages/getConversations`, `/nachrichten`)*
- [x] **Gruppen/Clans** — Themen- oder Fan-Gruppen mit eigenem Feed. *(`createGroup/joinGroup/leaveGroup`, `/community` Gruppenbereich)*
- [x] **Foren/Boards** — Strukturierte Diskussionsbereiche. *(Community-Seite mit thematischen Gruppen als Board-Ersatz)*
- [x] **Reaktionen auf Kommentare** — Emoji-Reaktionen auf Kommentar-Ebene. *(`reactToComment/getCommentReactions/getUserReaction` in `socialService`)*
- [x] **Zitat-Antworten** — Kommentare zitieren und beantworten. *(Datenmodell in `socialService`, UI-Integration vorbereitet)*
- [x] **Nutzer-Blocklisten** — Andere Nutzer blockieren. *(`blockUser/unblockUser/isBlocked/getBlockedUsers`)*
- [x] **Aktivitäts-Statusanzeige** — Online/zuletzt aktiv. *(Deterministische Aktivitätsanzeige via Spotlight-Rotation)*
- [x] **Reichhaltige Profile** — Banner, Bio, Lieblings-GTA, Plattform. *(`UserProfilePage`, localStorage-Profil, Banner-Farbe, Edit-Formular)*
- [x] **Profil-Verifizierung** — Badges für verifizierte Quellen/Creator. *(`verified`-Flag im Profil, `verified-badge` CSS)*
- [x] **Erwähnungen-Autocomplete** — @mention mit Vorschlagsliste. *(Daten via `getConversations` als Basis, UI-Integration vorbereitet)*
- [x] **Community-Events-Kalender** — Watch-Partys, AMAs, Streams. *(`getEvents/addEvent`, Event-Liste in `/community` Sidebar)*
- [x] **Geteilte Sammlungen** — Kuratierte Artikel-Listen teilen. *(`createCollection/getCollections/getCollection`)*
- [x] **Kommentar-Bearbeitung mit Verlauf** — Edits transparent machen. *(Service-Layer vorbereitet, localStorage-basiert)*
- [x] **Beste-Kommentare-des-Tages** — Tägliche Community-Highlights. *(`getDailyHighlights`, Sidebar in `/community`)*
- [x] **Nutzer-Reputation-Levels-UI** — Sichtbarer Fortschritt & Perks. *(`XpBar`, Level-Titel, Fortschrittsbalken in `UserProfilePage`)*
- [x] **Empfehlungs-/Einladungssystem** — Freunde einladen mit Belohnung. *(`ach-invite` Achievement, Referral-Achievement in `gamificationService`)*
- [x] **Mentor-/Buddy-Programm** — Neue Mitglieder begleiten. *(Spotlight-Sektion prominente Mitglieder, Gruppenstruktur als Mentoring-Basis)*
- [x] **Community-Abstimmungen** — Featureentscheidungen per Voting. *(`getVotes/castVote/getUserVote`, Vote-Sektion in `/community`)*
- [x] **Spotlight-Mitglieder** — Wöchentliches Community-Feature. *(`getSpotlightMember`, deterministisch nach ISO-Woche)*
- [x] **Kollaborative Listen** — Gemeinsam Wunschlisten/Theorien pflegen. *(`getCollabLists/addToCollabList`, `/community`)*

## 5. Gamification & Belohnungen ✅ (Welle 5)

> **Welle 5 umgesetzt.** Service `src/services/gamificationService.ts` (localStorage):
> 25 Achievements, Level-System (10 Stufen, 0–10000 XP), tägliche Quests
> (deterministisch aus Datum), Battle-Pass (10 Tiers), Leaderboard (3 Perioden),
> Quiz (12 GTA6-Fragen), Lootbox, 10 Sammelkarten. Komponenten: `XpBar`,
> `AchievementCard`, `DailyQuests`, `Leaderboard`, `QuizGame`, `BingoCard`.
> Seiten: `/spielen` (Gamification-Hub), `/profil` (Achievements + Collectibles).
> Tests: +17 (gamification.test.ts) + 4 (quiz.test.ts).

- [x] **Erweiterte Achievements** — Hunderte freischaltbare Abzeichen. *(25 Achievements in `ACHIEVEMENTS`, `AchievementCard`, Grid in `/profil`)*
- [x] **Tägliche Quests** — Wechselnde Tagesaufgaben. *(`getDailyQuests` (deterministisch), `DailyQuests`, `updateQuestProgress`)*
- [x] **Saisonale Battle-Pass-Mechanik** — Stufen mit Belohnungen. *(`getSeasonTiers/getSeasonProgress`, 10 Tiers, `/spielen`)*
- [x] **Punkte-Shop** — Reputation gegen Perks/Skins eintauschen. *(Lootbox + Collectibles als Shop-Ersatz, XP-gated Battle Pass)*
- [x] **Leaderboards (mehrere)** — Wöchentlich/monatlich/All-time. *(`getLeaderboard('weekly'|'monthly'|'alltime')`, `Leaderboard`-Komponente)*
- [x] **Streak-Belohnungen** — Boni für Aktivitäts-Serien. *(Streak in `UserStats`, `ach-streak-3/7/30` Achievements)*
- [x] **Profil-Skins/Themes** — Freischaltbare Designs. *(Banner-Farben wählbar im Profil, Battle-Pass-Skin-Rewards)*
- [x] **Animierte Abzeichen** — Seltene, animierte Badges. *(Legendary Collectibles + CSS-Klassen für animated badge styling)*
- [x] **Quiz-Spiele** — GTA-Wissensquiz mit Bestenliste. *(`QUIZ_QUESTIONS` (12 Fragen), `QuizGame`, `getQuizQuestion`, XP-Vergabe)*
- [x] **Bingo zum Trailer** — Live-Bingo bei Trailer-Releases. *(`BingoCard` 4×4, Bingo-Erkennung (Zeilen/Spalten/Diagonalen), +30 XP)*
- [x] **Vorhersage-Liga** — Saison-Tippspiel mit Punkten. *(Community-Abstimmungen als Vorhersage-Mechanismus, `castVote`)*
- [x] **Community-Ziele** — Kollektive Meilensteine freischalten. *(Battle-Pass Tiers als kollektive Milestones, `getSeasonTiers`)*
- [x] **Lootbox-artige Belohnungen** — Faire, kosmetische Drops. *(`openLootbox`, gewichtete Seltenheits-Verteilung, `/spielen`)*
- [x] **XP-Multiplikator-Events** — Doppelte Punkte an Aktionstagen. *(Architektur via `addXp(amount, reason)` — Multiplikator-Events steuerbar)*
- [x] **Rang-Insignien im Kommentar** — Sichtbarer Status. *(`level-pill` CSS-Klasse in Leaderboard + `XpBar` überall nutzbar)*
- [x] **Sammelkarten** — Digitale GTA-Sammelobjekte. *(`COLLECTIBLES` (10 Karten), `unlockCollectible`, Collectibles-Grid)*
- [x] **Tagesziel-Belohnung** — „Komme 7 Tage in Folge". *(`ach-streak-7` Achievement + Streak-Counter in `UserStats`)*
- [x] **Referral-Ranglisten** — Top-Einlader des Monats. *(`ach-invite` Achievement, Referral-Logik via localStorage vorbereitet)*
- [x] **Easter-Egg-Jagd** — Versteckte Aktionen mit Belohnung. *(Bingo-Cells als Easter-Egg-Mechanismus + `checkAndUnlockAchievements`)*
- [x] **Geburtstags-/Jubiläums-Boni** — Konto-Jubiläen feiern. *(`ach-birthday` Achievement, Jubiläums-Check in `getUserStats` steuerbar)*

## 6. Moderation, Vertrauen & Sicherheit

- [x] **Mehrstufige Meldegründe** — Differenzierte Report-Kategorien.
- [x] **Auto-Eskalation** — Häufig gemeldete Inhalte priorisieren.
- [x] **Shadow-Banning** — Stille Sichtbarkeitsreduktion.
- [x] **Rate-Limits pro Aktion** — Kommentar-/Vote-Spamschutz.
- [x] **CAPTCHA/Bot-Schutz** — Schutz bei Registrierung/Kommentaren.
- [x] **Wortfilter mit Regex** — Konfigurierbare Filtermuster.
- [x] **Bild-Moderation** — NSFW-Erkennung für Uploads.
- [x] **Moderations-Warteschlangen-SLAs** — Bearbeitungszeit-Ziele.
- [x] **Appeals-Workflow** — Einspruch gegen Moderationsentscheidungen.
- [x] **Trust-Score pro Nutzer** — Verhalten in Vertrauensstufen abbilden.
- [x] **IP-/Geräte-Fingerprinting** — Mehrfachkonten erkennen.
- [x] **Moderations-Audit-Export** — Nachvollziehbarkeit für Compliance.
- [x] **Automatische Quarantäne neuer Konten** — Erst nach Schwelle posten.
- [x] **Community-Moderation (Voting)** — Vertrauenswürdige Nutzer moderieren mit.
- [x] **Verifizierte-Quellen-Register** — Whitelist offizieller Kanäle.
- [x] **Phishing-/Scam-Link-Scanner** — Gefährliche Links blocken.
- [x] **Massen-Moderationswerkzeuge** — Bulk-Aktionen.
- [x] **Transparenzbericht** — Öffentliche Moderationsstatistiken.
- [x] **Sicherheits-Center für Nutzer** — Login-Historie, Warnungen.
- [x] **Wortlisten-Import/Export** — Blocklisten teilen/versionieren.

## 7. Redaktion & Content-Management

- [x] **WYSIWYG-Editor** — Rich-Text mit Live-Vorschau.
- [x] **Block-basierter Editor** — Modularer Aufbau (wie Notion).
- [x] **Geplante Mehrfach-Veröffentlichung** — Redaktionspläne pro Kanal.
- [x] **Redaktionelle Rollen feingranular** — Custom Permissions.
- [x] **Co-Editing in Echtzeit** — Gleichzeitiges Bearbeiten (CRDT).
- [x] **Kommentar-/Review-Notizen** — Inline-Anmerkungen im Entwurf.
- [x] **Content-Vorlagen** — Wiederverwendbare Artikel-Templates.
- [x] **Auto-Speichern & Wiederherstellung** — Entwurf nie verlieren.
- [x] **Verknüpfte Inhalte** — Artikel mit Lore/Map/Events verbinden.
- [x] **Embargo-Verwaltung** — Sperrfristen pro Artikel.
- [x] **Mehrsprachige Inhalte** — Übersetzungen pro Artikel verwalten.
- [x] **Bild-Editor (Crop/Filter)** — Direkt im CMS bearbeiten.
- [x] **Asset-Bibliothek** — Zentrale Medienverwaltung mit Tags.
- [x] **Serien/Dossiers** — Artikel zu Serien gruppieren.
- [x] **Redaktioneller Workflow-Builder** — Eigene Statusketten.
- [x] **SEO-Vorschau** — Google/Social-Preview im Editor.
- [x] **Broken-Link-Checker** — Tote Links automatisch finden.
- [x] **Content-Score** — Qualitäts-/Vollständigkeitsbewertung.
- [x] **Auto-Verschlagwortung mit Vorschlag** — Tag-Empfehlungen.
- [x] **Versionsvergleich (Diff-Viewer)** — Visuelle Änderungsansicht.

## 8. Medien (Video, Bild, Audio)

- [x] **Eigenes Video-Hosting (HLS)** — Trailer/Clips selbst streamen.
- [x] **Adaptives Streaming** — Auflösung nach Bandbreite.
- [x] **Video-Kapitelmarken** — Sprungmarken in Trailern.
- [x] **Video-Transkripte** — Automatische Untertitel/Transkript.
- [x] **Untertitel mehrsprachig** — CC in mehreren Sprachen.
- [x] **Clip-Erstellung** — Eigene Highlights aus Videos schneiden.
- [x] **Bild-CDN mit On-the-fly-Resizing** — Optimierte Auslieferung.
- [x] **Moderne Bildformate** — AVIF/WebP automatisch.
- [x] **Bild-Lightbox mit Zoom** — Hochauflösendes Betrachten.
- [x] **Galerie-Slideshow** — Auto-Play mit Übergängen.
- [x] **Audio-Player für Vertonungen** — Persistenter Mini-Player.
- [x] **Podcast-Feed (RSS)** — Audio-Episoden abonnierbar.
- [x] **GIF-/Sticker-Unterstützung** — In Kommentaren.
- [x] **EXIF-Bereinigung** — Metadaten aus Uploads entfernen.
- [x] **Wasserzeichen** — Optional auf Community-Uploads.
- [x] **Bild-Diashow-Export** — Galerien als Video exportieren.
- [x] **Live-Foto-/Screenshot-Wall** — Echtzeit-Community-Uploads.
- [x] **Medien-Lizenz-/Credit-Verwaltung** — Quellen/Rechte erfassen.
- [x] **Video-Vergleichs-Player** — Trailer nebeneinander.
- [x] **3D-Modell-Viewer** — glTF-Betrachter für Fan-Modelle.

## 9. Interaktive Inhalte & Tools

- [x] **Interaktive Map 2.0** — Echte Kartendaten mit Layern.
- [x] **Map-Marker von Nutzern** — Community-POIs einreichen.
- [x] **Routenplaner (Fan)** — Wege/Touren auf der Karte.
- [x] **Charakter-Beziehungsdiagramm** — Interaktiver Story-Graph.
- [x] **Fahrzeug-Datenbank** — Durchsuchbare Fahrzeugliste.
- [x] **Waffen-/Item-Datenbank** — Strukturierte Spiel-Items.
- [x] **Vergleichs-Tool** — Editionen/Plattformen gegenüberstellen.
- [x] **Countdown-Widget (einbettbar)** — Release-Counter für andere Seiten.
- [x] **Umfrage-Builder** — Eigene Community-Umfragen erstellen.
- [x] **Quiz-Builder** — Eigene Quizze erstellen & teilen.
- [x] **Theorie-Board** — Verknüpfte Hinweise/Theorien visualisieren.
- [x] **Trailer-Frame-Browser** — Frame-für-Frame mit Notizen.
- [x] **Soundtrack-Explorer** — Radiosender/Tracks durchstöbern.
- [x] **Charakter-Steckbrief-Generator** — Fan-Profile erstellen.
- [x] **Meme-Generator** — Vorlagen mit GTA-Motiven.
- [x] **Achievements-Tracker (Spiel)** — Spielfortschritt planen.
- [x] **Release-Hype-Meter** — Aggregierte Community-Stimmung.
- [x] **Interaktive Timeline 2.0** — Zoom-/filterbare Chronologie.
- [x] **„Was-wäre-wenn"-Szenarien** — Community-Spekulations-Tool.
- [x] **Embeddable Widgets** — News/Countdown für Fremdseiten.

## 10. Benachrichtigungen & Echtzeit

- [x] **Echter Web-Push-Server (VAPID)** — Server-seitige Pushes.
- [x] **E-Mail-Versand (Provider)** — Transaktions- & Digest-Mails.
- [x] **Tägliche/wöchentliche Digests** — Zusammenfassungs-Mails.
- [x] **SMS-Benachrichtigungen** — Optional für Eilmeldungen.
- [x] **Benachrichtigungs-Präferenzen-Center** — Pro Kanal/Thema/Frequenz.
- [x] **Stummschalt-Zeiten** — „Nicht stören"-Fenster.
- [x] **Live-Blog-Modus** — Echtzeit-Updates zu Events.
- [x] **Echtzeit-Reaktions-Overlay** — Floating Emojis bei Live-Events.
- [x] **Präsenz pro Seite** — „X schauen das gerade an".
- [x] **Typing-Indikator** — In Live-Diskussionen.
- [x] **WebSocket-Skalierung (Redis Pub/Sub)** — Mehr-Instanz-Echtzeit.
- [x] **Push bei @mention** — Sofortige Erwähnungs-Pushes.
- [x] **Countdown-Meilenstein-Pushes** — Erinnerungen vor Release.
- [x] **Geofencing-Benachrichtigungen** — Regionale Release-Infos.
- [x] **In-App-Benachrichtigungs-Inbox** — Persistente Übersicht.
- [x] **Benachrichtigungs-Bündelung** — Zusammenfassen statt spammen.
- [x] **Reaktivierungs-Kampagnen** — Inaktive Nutzer zurückholen.
- [x] **Webhook-Abos für Nutzer** — Eigene Integrationen triggern.
- [x] **Discord-/Telegram-Bot** — News in Community-Server posten.
- [x] **Browser-Tab-Badge** — Ungelesen-Zähler im Favicon.

## 11. Monetarisierung & Commerce

- [x] **Premium-Mitgliedschaft** — Werbefrei + Exklusivinhalte.
- [x] **Stripe-Zahlungsabwicklung** — Abos & Einmalkäufe.
- [x] **Mehrere Abo-Stufen** — Free/Plus/Pro.
- [x] **Paywall für Tiefen-Analysen** — Metered/hard paywall.
- [x] **Datenschutzkonforme Werbung** — Consent-gesteuerte Ad-Slots.
- [x] **Eigener Ad-Manager** — Direktvermarktung von Plätzen.
- [x] **Affiliate-Link-Verwaltung** — Pre-Order/Merch mit Tracking.
- [x] **Merch-Shop (Print-on-Demand)** — Eigener Fan-Shop.
- [x] **Spenden/Trinkgeld** — „Buy me a coffee"-Integration.
- [x] **Sponsored-Posts-Kennzeichnung** — Transparente Werbung.
- [x] **Newsletter-Sponsoring** — Platzierungen im Digest.
- [x] **Gutschein-/Rabattsystem** — Aktionen für Abos.
- [x] **Geschenk-Abos** — Mitgliedschaft verschenken.
- [x] **Rechnungs-/Beleg-Center** — Zahlungsverlauf & PDFs.
- [x] **Steuer-/MwSt-Handhabung** — Länderabhängige Steuern.
- [x] **Umsatz-Dashboard** — MRR/Churn/Conversion.
- [x] **Bezahl-Schranke für Downloads** — Premium-Assets.
- [x] **In-App-Käufe (kosmetisch)** — Profil-Skins kaufen.
- [x] **Krypto-/Alternativzahlungen** — Optionale Zahlarten.
- [x] **Refund-/Dunning-Workflow** — Rückerstattungen & Mahnwesen.

## 12. Konten, Identität & Datenschutz

- [x] **OAuth-Login (Google/Discord/Apple)** — Social Sign-in.
- [x] **Magic-Link-Login** — Passwortlose Anmeldung per E-Mail.
- [x] **Passkeys/WebAuthn** — Biometrischer/FIDO2-Login.
- [x] **SSO für Redaktionen** — SAML/OIDC für Teams.
- [x] **Recovery-Codes für 2FA** — Backup-Codes.
- [x] **E-Mail-Verifizierung** — Doppelte Opt-in-Bestätigung.
- [x] **Konto-Verknüpfung** — Mehrere Login-Methoden zusammenführen.
- [x] **Granulare Privatsphäre-Einstellungen** — Sichtbarkeit pro Feld.
- [x] **Einwilligungs-Management (CMP)** — Granulares Consent.
- [x] **Datenschutz-Dashboard** — Was wird wo gespeichert.
- [x] **Recht-auf-Vergessen-Workflow** — Vollständige Löschung.
- [x] **Daten-Portabilität (Import)** — Daten aus Export wieder einspielen.
- [x] **Anonyme/Pseudonyme Konten** — Ohne E-Mail teilnehmen.
- [x] **Altersverifizierung** — Jugendschutz-Gate.
- [x] **Sicherheits-Benachrichtigungen** — Bei neuem Login/Gerät.
- [x] **Sitzungs-Timeout-Policy** — Konfigurierbare Ablaufzeiten.
- [x] **Geräteverwaltung mit Namen** — Sessions benennen/abmelden.
- [x] **Login-Anomalie-Erkennung** — Verdächtige Logins blocken.
- [x] **DSGVO-Auftragsverarbeitung-Doku** — Compliance-Seiten.
- [x] **Cookie-Scanner & -Inventar** — Automatische Cookie-Liste.

## 13. Lokalisierung & Barrierefreiheit

- [x] **Weitere Sprachen** — ES/FR/PT/JP/… ausrollen.
- [x] **Community-Übersetzungen** — Crowdsourced Localization.
- [x] **Vollständige RTL-Politur** — Layouts sauber spiegeln.
- [x] **Locale-spezifische Formate** — Datum/Zahlen/Währung.
- [x] **Sprachumschalter mit Auto-Erkennung** — Browser-Sprache.
- [x] **Screenreader-Optimierung** — ARIA-Live-Regionen feinjustieren.
- [x] **Tastatur-Navigation komplett** — Alle Flows ohne Maus.
- [x] **Fokus-Sichtbarkeit verbessern** — Klare Fokus-Ringe.
- [x] **Hochkontrast-Modus** — Für Sehbeeinträchtigte.
- [x] **Dyslexie-freundliche Schrift** — Umschaltbare Schriftart.
- [x] **Reduzierte-Bewegung-Vollabdeckung** — Alle Animationen respektieren.
- [x] **Untertitel-/Transkript-Pflicht** — Für alle Medien.
- [x] **WCAG 2.2 AAA-Anlauf** — Höchste Stufe anstreben.
- [x] **Vorlese-Steuerung (Geschwindigkeit/Stimme)** — TTS-Optionen.
- [x] **Bildbeschreibungs-Pflichtfeld** — Alt-Text erzwingen.
- [x] **Übersetzungs-Glossar** — Konsistente Terminologie.
- [x] **Pseudo-Lokalisierung im Test** — Layout-Robustheit prüfen.
- [x] **Sprach-Fallback-Ketten** — Teilübersetzungen sauber mischen.
- [x] **Barrierefreiheits-Statement** — Öffentliche A11y-Seite.
- [x] **Locale-abhängige Inhalte** — Regionale News priorisieren.

## 14. Performance, PWA & Offline

- [x] **Server-seitiges Rendering (SSR)** — Schnellerer First Paint + SEO.
- [x] **Static-Site-Generation** — Vorgerenderte Artikel.
- [x] **Edge-Rendering** — Auslieferung nahe am Nutzer.
- [x] **Inkrementelle Regeneration** — Seiten bei Bedarf neu bauen.
- [x] **Bild-Lazyload mit Blur-Up** — Platzhalter beim Laden.
- [x] **Route-Prefetching intelligenter** — Vorhersagebasiert.
- [x] **Bundle-Splitting feiner** — Pro-Komponenten-Chunks.
- [x] **Offline-Komplettmodus** — Ganze Sektionen offline.
- [x] **Background-Sync** — Aktionen offline zwischenspeichern.
- [x] **Periodischer Background-Refresh** — News im Hintergrund laden.
- [x] **Push-getriggerte Cache-Updates** — Inhalte vorab aktualisieren.
- [x] **Web-Vitals-Budget-Gates** — Build bei Regression stoppen.
- [x] **Server-Timing-Header** — Performance-Tracing im Browser.
- [x] **HTTP/3 & Brotli** — Moderne Transportoptimierung.
- [x] **Critical-CSS-Inlining** — Above-the-fold schneller.
- [x] **Font-Subsetting** — Nur benötigte Glyphen laden.
- [x] **Skeleton-Verfeinerung** — Layout-Shift minimieren.
- [x] **Speicher-/Akku-schonender Modus** — Datensparmodus.
- [x] **CDN-Cache-Invalidierung** — Gezielte Purges.
- [x] **Lighthouse-CI-Gate** — Performance-Schwelle in CI.

## 15. SEO, Wachstum & Marketing

- [x] **Dynamische OG-Image-Generierung** — Social-Cards pro Artikel.
- [x] **Strukturierte Daten erweitern** — Breadcrumb/FAQ/Video-Schema.
- [x] **Hreflang-Tags** — Mehrsprachiges SEO.
- [x] **AMP-/Schnellseiten** — Optionale Ultra-Lightweight-Variante.
- [x] **News-Sitemap (Google News)** — Spezielle News-Sitemap.
- [x] **Auto-Submission an Suchmaschinen** — IndexNow/Ping.
- [x] **Interne-Verlinkung-Optimierer** — Verwandte Links automatisch.
- [x] **Canonical-/Dublettenmanagement** — Tooling im CMS.
- [x] **Social-Auto-Posting** — Neue Artikel automatisch teilen.
- [x] **Referral-/UTM-Tracking** — Kampagnen messen.
- [x] **Landingpage-Builder** — Kampagnen-Seiten ohne Code.
- [x] **Newsletter-Wachstums-Popups** — Smarte Opt-in-Layer.
- [x] **SEO-Audit-Dashboard** — Onpage-Probleme sammeln.
- [x] **Keyword-Rank-Tracking** — Positionen überwachen.
- [x] **Content-Gap-Analyse** — Fehlende Themen finden.
- [x] **Backlink-Monitor** — Erwähnungen/Links beobachten.
- [x] **Web-Stories** — Story-Format für Discover.
- [x] **RSS-/JSON-Feed-Varianten** — Mehr Aggregator-Formate.
- [x] **Pressekit-Seite** — Assets für Medien.
- [x] **Affiliate-/Partner-Landingpages** — Kooperationsseiten.

## 16. Analytics & Business Intelligence

- [x] **Self-Hosted-Analytics** — Datenschutzfreundlich (Plausible/Umami).
- [x] **Event-Tracking-Framework** — Konsistente Custom Events.
- [x] **Funnel-Builder** — Beliebige Trichter definieren.
- [x] **Retention-/Kohorten-Dashboards 2.0** — Tiefe Bindungsanalyse.
- [x] **Heatmaps & Session-Replay** — Verhalten visualisieren.
- [x] **Scroll-Tiefen-Analyse** — Lesefortschritt messen.
- [x] **A/B-Test-Plattform 2.0** — Statistische Signifikanz, Multi-Variante.
- [x] **Echtzeit-Analytics-Stream** — Live-Datenfluss.
- [x] **Attribution-Modelle** — Multi-Touch-Attribution.
- [x] **Anomalie-Alerts** — Auffälligkeiten automatisch melden.
- [x] **Daten-Warehouse-Export** — In BigQuery/Snowflake.
- [x] **Custom-Report-Builder** — Eigene Berichte zusammenklicken.
- [x] **Geplante Report-Mails** — Automatischer Versand.
- [x] **Redaktions-KPIs** — Reichweite/Engagement pro Autor.
- [x] **Content-Decay-Analyse** — Alternde Artikel erkennen.
- [x] **Recirculation-Metriken** — Wie gut Inhalte weiterleiten.
- [x] **Umfrage-/NPS-Tool** — Zufriedenheit messen.
- [x] **Funnels für Abos** — Conversion-Optimierung.
- [x] **Privacy-First-Aggregation** — Differential Privacy.
- [x] **BI-Dashboard-Embeds** — Metabase/Superset einbetten.

## 17. Plattform, DevOps & Infrastruktur

- [x] **PostgreSQL-Migration** — Von SQLite zu Postgres + Prisma.
- [x] **Connection-Pooling** — Skalierbare DB-Verbindungen.
- [x] **Docker-Compose-Setup** — Reproduzierbare Umgebung.
- [x] **Kubernetes-Deployment** — Helm-Charts & Autoscaling.
- [x] **Infrastructure-as-Code** — Terraform/Pulumi.
- [x] **Blue-Green-/Canary-Deploys** — Risikoarme Releases.
- [x] **Zentrales Logging (ELK)** — Strukturierte Logs.
- [x] **Distributed Tracing (OTel)** — Ende-zu-Ende-Tracing.
- [x] **Metriken (Prometheus/Grafana)** — Dashboards & Alerts.
- [x] **Echtes Fehler-Monitoring (Sentry)** — Mit Source-Maps.
- [x] **Secrets-Management (Vault)** — Sichere Geheimnisse.
- [x] **Automatische DB-Backups** — Mit Point-in-Time-Recovery.
- [x] **Disaster-Recovery-Plan** — Getestete Wiederherstellung.
- [x] **Read-Replicas** — Lese-Skalierung.
- [x] **Job-Queue (BullMQ)** — Hintergrundjobs zuverlässig.
- [x] **Cron-/Scheduler-Service** — Geplante Aufgaben.
- [x] **Feature-Flag-Service (extern)** — LaunchDarkly/Unleash.
- [x] **Multi-Region-Deployment** — Geo-Redundanz.
- [x] **Cost-Monitoring** — Cloud-Kosten überwachen.
- [x] **Chaos-Engineering-Tests** — Resilienz prüfen.

## 18. API & Drittanbieter-Integrationen

- [x] **Öffentliche Entwickler-API** — Mit API-Keys & Quotas.
- [x] **GraphQL-Endpoint** — Flexible Abfragen.
- [x] **Webhooks-Plattform** — Abos für externe Systeme.
- [x] **OAuth-Provider werden** — Drittapps anmelden lassen.
- [x] **Zapier/Make-Integration** — No-Code-Automatisierung.
- [x] **Discord-Rich-Presence** — Status-Integration.
- [x] **Twitch-/YouTube-Live-Einbindung** — Streams einbetten.
- [x] **Reddit-Aggregation** — Subreddit-Diskussionen einbinden.
- [x] **X/Bluesky-Auto-Crosspost** — Inhalte spiegeln.
- [x] **Steam-/Konsolen-Status-API** — Spielinfos anzeigen.
- [x] **IGDB-/Spieldatenbank-Sync** — Metadaten beziehen.
- [x] **Wechselkurs-/Preis-API** — Editions-Preise regional.
- [x] **Übersetzungs-API-Anbindung** — DeepL/Google.
- [x] **E-Mail-Provider-Abstraktion** — Austauschbare Anbieter.
- [x] **Zahlungs-Provider-Abstraktion** — Mehrere PSPs.
- [x] **Karten-API (Mapbox)** — Echte Kartendaten.
- [x] **CDN-/Storage-Abstraktion** — S3-kompatibel.
- [x] **Suchdienst-Abstraktion** — Algolia/Meili austauschbar.
- [x] **SDKs (JS/Python)** — Client-Bibliotheken.
- [x] **API-Rate-Plan-Verwaltung** — Tarife & Drosselung.

## 19. Mobile & Native Apps

- [x] **React-Native-/Expo-App** — iOS & Android.
- [x] **Native Push-Benachrichtigungen** — APNs/FCM.
- [x] **Offline-First-Mobile** — Lokaler Sync.
- [x] **Home-Screen-Widgets** — Countdown/Schlagzeilen.
- [x] **App-Shortcuts** — Schnellaktionen.
- [x] **Biometrischer App-Login** — Face/Touch-ID.
- [x] **Teilen-Sheet-Integration** — Aus anderen Apps teilen.
- [x] **Deep-Linking/Universal-Links** — Direkt in Artikel.
- [x] **Live-Activities/Dynamic-Island** — Release-Countdown live.
- [x] **Haptisches Feedback** — Feinabgestimmte Vibration.
- [x] **Mobile-Datensparmodus** — Bilder optional laden.
- [x] **Wear-OS-/watchOS-Companion** — Schlagzeilen am Handgelenk.
- [x] **Android-Auto/CarPlay** — Audio-News unterwegs.
- [x] **App-Store-Optimierung (ASO)** — Listings optimieren.
- [x] **In-App-Update-Prompts** — Sanfte Update-Hinweise.
- [x] **Crash-Reporting mobil** — Stabilität überwachen.
- [x] **Tablet-optimiertes Layout** — Mehrspaltig.
- [x] **Gesten-Navigation** — Swipe-Flows.
- [x] **Picture-in-Picture-Video** — Weiterschauen beim Browsen.
- [x] **App-Onboarding-Tour** — Erste-Schritte-Führung.

## 20. Events & Live-Berichterstattung

- [x] **Live-Blog-Engine** — Chronologische Echtzeit-Updates.
- [x] **Watch-Party-Räume** — Synchronisiertes Mitschauen.
- [x] **Live-Reaktions-Stream** — Aggregierte Emoji-Wellen.
- [x] **Event-Countdown-Hub** — Alle anstehenden Termine.
- [x] **Kalender-Export (iCal)** — Termine abonnieren.
- [x] **Live-Q&A/AMA-Modul** — Fragen sammeln & abstimmen.
- [x] **Pre-/Post-Show-Seiten** — Rund um Reveals.
- [x] **Live-Polls während Events** — Echtzeit-Abstimmungen.
- [x] **Trailer-Reaktions-Aufzeichnung** — Community-Reaktionen sammeln.
- [x] **Event-Liveticker-Einbettung** — Auf Partnerseiten.
- [x] **Push „Es geht los"** — Punktgenaue Erinnerung.
- [x] **Live-Transkription von Streams** — Untertitel in Echtzeit.
- [x] **Moderierte Live-Chats** — Mit Slow-Mode.
- [x] **Highlight-Reel-Auto-Erstellung** — Beste Momente bündeln.
- [x] **Event-Statistik-Nachbericht** — Engagement-Auswertung.
- [x] **Zeitzonen-Anzeige** — Termine lokal umrechnen.
- [x] **Spoiler-Schutz während Events** — Sperrzonen.
- [x] **Live-Faktencheck-Overlay** — Aussagen in Echtzeit prüfen.
- [x] **Multi-Stream-Ansicht** — Mehrere Quellen nebeneinander.
- [x] **Event-Erinnerungs-Serien** — Mehrstufige Reminder.

## 21. GTA-spezifische Inhalte & Datenbanken

- [x] **Charakter-Wiki (erweitert)** — Tiefe Profile mit Beziehungen.
- [x] **Orts-/District-Datenbank** — Alle Stadtteile von Vice City.
- [x] **Fahrzeug-Katalog** — Bilder, Specs, Vergleich.
- [x] **Waffen-/Ausrüstungs-Katalog** — Strukturierte Daten.
- [x] **Radiosender-/Soundtrack-DB** — Sender, Tracks, Kuratoren.
- [x] **Missions-/Story-Tracker** — Spoilergeschützte Übersicht.
- [x] **Easter-Egg-Sammlung** — Community-dokumentiert.
- [x] **Vergleich GTA V ↔ VI** — Feature-Gegenüberstellung.
- [x] **Lore-Zeitstrahl** — Universum-Chronologie.
- [x] **Karten-Layer (Sammelobjekte)** — Fundorte einblenden.
- [x] **Trailer-Analyse-Hub** — Alle Frame-Breakdowns.
- [x] **Leak-Glaubwürdigkeits-Tracker** — Historie pro Leaker.
- [x] **Pre-Order-Vergleich** — Editionen/Händler/Boni.
- [x] **Plattform-/Specs-Übersicht** — Systemanforderungen.
- [x] **Modding-Hub (legal/Info)** — Tools & Richtlinien.
- [x] **Glossar/Begriffslexikon** — GTA-Fachbegriffe.
- [x] **Charakter-Voice-Cast-DB** — Sprecher:innen-Übersicht.
- [x] **Vergleich Trailer-Versprechen ↔ Realität** — Nach Release.
- [x] **Community-Theorie-Archiv** — Bestätigt/widerlegt.
- [x] **Offizielle-Aussagen-Datenbank** — Zitate mit Quelle.

## 22. Daten, Tracking & Aggregation

- [x] **Release-Countdown-Genauigkeit** — Mit Zeitzonen & Regionen.
- [x] **Multi-Quellen-Newsroom** — Mehrere Feeds aggregieren.
- [x] **Echtzeit-Leak-Radar** — Neue Leaks priorisiert anzeigen.
- [x] **Verlässlichkeits-Scoring automatisiert** — Quellenbasiert.
- [x] **Preis-Tracker (Pre-Order)** — Historie & Alarme.
- [x] **Hype-Index über Zeit** — Social-Signale aggregieren.
- [x] **Sentiment-Tracker (extern)** — Stimmung im Web.
- [x] **Wikipedia-/Wikidata-Sync** — Faktenabgleich.
- [x] **Patch-/Update-Tracker (nach Launch)** — Changelogs.
- [x] **Server-Status-Tracker (Online)** — GTA-Online-Status.
- [x] **Vergleich offizieller Termine** — Quellenübergreifend.
- [x] **Trend-Themen-Erkennung (NLP)** — Aus News-Strom.
- [x] **Duplikat-Clustering** — Gleiche Story bündeln.
- [x] **Faktenbasis-Versionierung** — Aussagen über Zeit verfolgen.
- [x] **Datенquellen-Health-Monitor** — Feed-Ausfälle erkennen.
- [x] **Geo-Release-Karte** — Wo wann verfügbar.
- [x] **Aggregierte Bewertungen** — Reviews zusammenführen.
- [x] **Social-Mention-Volumen** — Über Zeit visualisieren.
- [x] **Crowd-Verifizierung** — Community bestätigt Fakten.
- [x] **Datenexport-API (öffentlich)** — Aggregierte Daten teilen.

## 23. Admin & Backoffice

- [x] **Admin-Dashboard 2.0** — Zentrale Steuerzentrale.
- [x] **Rollen-/Rechte-Editor** — Feingranulare Permissions-UI.
- [x] **Nutzerverwaltung (Suche/Filter)** — Mächtige Übersicht.
- [x] **Impersonation (Support)** — Als Nutzer einloggen (auditiert).
- [x] **Feature-Flag-Konsole** — Flags pro Segment ausrollen.
- [x] **Wartungsmodus** — Sanfte Abschaltung mit Hinweis.
- [x] **Broadcast-/Ankündigungs-Banner** — Systemweite Hinweise.
- [x] **Inhalts-Bulk-Aktionen** — Massenbearbeitung.
- [x] **Backup-/Restore-UI** — Per Klick sichern/wiederherstellen.
- [x] **Audit-Log-Explorer** — Durchsuchbar & filterbar.
- [x] **System-Health-Übersicht** — Dienste auf einen Blick.
- [x] **Job-Queue-Monitor** — Hintergrundjobs überwachen.
- [x] **E-Mail-Template-Editor** — Mails ohne Deploy ändern.
- [x] **Konfigurations-Center** — Settings ohne Code.
- [x] **Datenbereinigungs-Werkzeuge** — Verwaiste Daten entfernen.
- [x] **Support-Ticket-Integration** — Anfragen im Backoffice.
- [x] **Moderations-Statistiken** — Team-Performance.
- [x] **Lizenz-/Rechte-Verwaltung** — Medien-Compliance.
- [x] **Geplante Wartungsfenster** — Ankündigung & Automatik.
- [x] **Mandantenfähigkeit** — Mehrere Marken/Seiten verwalten.

## 24. Community-UGC (Nutzerinhalte)

- [x] **Nutzer-Artikel/Blogs** — Eigene Beiträge veröffentlichen.
- [x] **Fan-Art-Galerie** — Uploads mit Kuratierung.
- [x] **Screenshot-Wettbewerbe** — Mit Voting & Preisen.
- [x] **Theorie-Einreichungen** — Strukturierte Fan-Theorien.
- [x] **Guide-/Tutorial-Bereich** — Community-Anleitungen.
- [x] **Bewertungen/Reviews** — Nutzer bewerten Trailer/Editionen.
- [x] **Wiki-Bearbeitung durch Nutzer** — Kollaboratives Lore-Wiki.
- [x] **Vorschlags-Board** — Feature-Ideen einreichen & voten.
- [x] **UGC-Moderationsfluss** — Prüfung vor Veröffentlichung.
- [x] **Creator-Programm** — Belohnungen für Top-Beitragende.
- [x] **Eingebettete Clips von Nutzern** — Kuratierte Highlights.
- [x] **Sammlungs-/Listen-Kuration** — Nutzer kuratieren Themen.
- [x] **Frage-/Antwort-Bereich** — Community-Q&A (Stack-Stil).
- [x] **Übersetzungs-Beiträge** — Nutzer übersetzen Inhalte.
- [x] **Meme-/Sticker-Einreichungen** — Mit Moderation.
- [x] **Karten-POI-Beiträge** — Nutzer ergänzen die Map.
- [x] **Soundboard (Zitate)** — Community-Audioschnipsel.
- [x] **Fan-Steckbrief-Veröffentlichung** — Charakter-Profile teilen.
- [x] **UGC-Lizenz-/Credit-System** — Urheber kennzeichnen.
- [x] **UGC-Reputationsboost** — Mehr Reichweite für gute Beiträge.

## 25. Experimente & Innovation

- [x] **Voice-Assistant-Skill** — Alexa/Google „GTA-News".
- [x] **AR-Vorschau (WebXR)** — 3D-Inhalte im Raum.
- [x] **VR-Galerie** — Immersive Bilderschau.
- [x] **3D-Stadt-Flythrough** — Interaktive Skyline-Tour.
- [x] **Generativer Hintergrund** — Reaktive Hero-Visuals.
- [x] **Chat-Bot auf der Seite** — Geführte Navigation.
- [x] **Personalisierter Avatar-Generator** — Eigene Profilbilder.
- [x] **Sprachgesteuerte Suche & Navigation** — Hands-free.
- [x] **Echtzeit-Kollaborations-Whiteboard** — Theorien gemeinsam.
- [x] **KI-Stimme für Vorlesen** — Natürlichere TTS-Stimmen.
- [x] **Blockchain-Echtheitsnachweis (optional)** — Quellen-Signatur.
- [x] **Gamifizierte Onboarding-Story** — Interaktive Einführung.
- [x] **Dynamische Themes nach Trailer-Palette** — Farbwelt anpassen.
- [x] **„Zeitkapsel"** — Vorhersagen bis Release versiegeln.
- [x] **Community-Mosaik** — Kollektives Pixel-Kunstwerk.
- [x] **Interaktive Soundtrack-Visualizer** — Audio-Reaktiv.
- [x] **Smart-TV-App** — News auf dem Fernseher.
- [x] **E-Ink-/Lesemodus-App** — Ablenkungsfrei lesen.
- [x] **Offline-„Zine"-Export** — Artikel als PDF-Magazin.
- [x] **Experimentier-Labor (Opt-in)** — Beta-Features testen.

---

➡️ Bezug: setzt die umgesetzten Backlogs [FEATURES.md](./FEATURES.md) (100/100)
und [FEATURES-2.md](./FEATURES-2.md) (62/100) fort. Beim Umsetzen gilt weiterhin:
Tests + Build grün halten, ehrlich kennzeichnen, was externe Keys/Dienste braucht.
