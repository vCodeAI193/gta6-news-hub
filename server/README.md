# GTA 6 News Hub — Backend API

Produktiver API-Server für den GTA 6 News Hub. Ersetzt die localStorage-Mock-
Schicht des Frontends durch echte, serverseitige Persistenz.

## Stack

- **Node.js + Express** (reines ESM, keine Build-Stufe)
- **SQLite** über das eingebaute `node:sqlite` (keine native Abhängigkeit)
- **JWT** (jsonwebtoken) + **bcryptjs** für Auth
- In-Memory **Rate-Limiting**

## Start

```bash
npm run server        # startet auf http://localhost:8787
npm run server:dev    # mit --watch
npm run test:server   # 16 API-Tests (node:test + supertest)
```

Konfiguration über Umgebungsvariablen:

| Variable     | Default              | Zweck                          |
| ------------ | -------------------- | ------------------------------ |
| `PORT`       | `8787`               | Port des API-Servers           |
| `DB_PATH`    | `server/data.sqlite` | SQLite-Datei (`:memory:` möglich) |
| `JWT_SECRET` | `dev-secret-change-me` | Signatur-Geheimnis (Produktion setzen!) |

Damit das **Frontend** die API nutzt, beim Build/Dev `VITE_API_URL` setzen:

```bash
VITE_API_URL=http://localhost:8787 npm run dev
```

Ohne `VITE_API_URL` läuft das Frontend weiter rein lokal (localStorage).

## Datenmodell

`users`, `sessions`, `articles`, `comments`, `reactions`, `votes`, `reports` —
angelegt per Migrationen in `db.mjs`, inkl. Seed-Artikeln.

## Endpunkte (Auszug)

| Methode & Pfad                         | Auth        | Zweck                       |
| -------------------------------------- | ----------- | --------------------------- |
| `GET  /api/health`                     | –           | Health-Check                |
| `POST /api/auth/register`              | –           | Konto anlegen (1. = Admin)  |
| `POST /api/auth/login`                 | –           | Anmelden → JWT              |
| `GET  /api/auth/me`                    | Bearer      | Aktueller Nutzer            |
| `GET  /api/auth/sessions`              | Bearer      | Aktive Sessions             |
| `DELETE /api/auth/sessions/:id`        | Bearer      | Session widerrufen          |
| `GET  /api/articles`                   | optional    | Artikel (Drafts nur Autor)  |
| `POST/PUT/DELETE /api/articles[/:id]`  | author+     | Artikel verwalten           |
| `GET/POST /api/articles/:id/comments`  | (POST) Login | Kommentare                  |
| `POST /api/articles/:id/reactions`     | Login       | Reaktion togglen            |
| `POST /api/articles/:id/votes`         | Login       | Leak-Glaubwürdigkeit voten  |
| `POST /api/reports`                    | optional    | Inhalt melden               |
| `GET  /api/reports`                    | moderator+  | Offene Meldungen            |

## Rollen

`reader` → `author` → `moderator` → `admin` (aufsteigende Rechte). Der erste
registrierte Nutzer wird automatisch `admin` (Bootstrap).
