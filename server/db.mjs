import { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'node:crypto'

/**
 * Echte SQLite-Datenbank über das eingebaute `node:sqlite`-Modul (keine native
 * Abhängigkeit). Enthält Schema-Migrationen und einen Seed mit den Artikeln,
 * die zuvor nur im Frontend lagen.
 */

const SEED_ARTICLES = [
  {
    id: 'release-date-confirmed',
    title: 'Rockstar bestätigt: GTA 6 erscheint am 19. November 2026',
    excerpt:
      'Nach Monaten der Spekulation steht der Termin fest. Grand Theft Auto VI kommt zum Holiday-Window 2026.',
    body: '**Rockstar Games** hat den finalen Release-Termin für *Grand Theft Auto VI* offiziell bestätigt: Das Spiel erscheint weltweit am **19. November 2026**.',
    category: 'release',
    date: '2026-05-06',
    source: 'Rockstar Newswire',
    source_url: 'https://www.rockstargames.com/newswire',
    image: 'https://picsum.photos/seed/gta6-release/800/450',
    tags: ['Release', 'Termin', 'Vice City'],
    author: 'Redaktion',
    reliability: 'confirmed',
  },
  {
    id: 'trailer-2-breakdown',
    title: 'Trailer 2 ist da: Vice City bei Nacht in 4K',
    excerpt:
      'Der zweite offizielle Trailer zeigt eine lebendige Open World, dynamisches Wetter und die beiden Protagonisten Lucia und Jason.',
    body: 'Der mit Spannung erwartete **zweite Trailer** zu GTA 6 ist erschienen und sammelte Rekordaufrufe.',
    category: 'trailer',
    date: '2026-04-18',
    source: 'Rockstar Games (YouTube)',
    source_url: 'https://www.youtube.com/rockstargames',
    image: 'https://picsum.photos/seed/gta6-trailer2/800/450',
    tags: ['Trailer', 'Vice City', 'Lucia', 'Jason'],
    author: 'Redaktion',
    reliability: 'confirmed',
  },
  {
    id: 'map-leak-vice-city',
    title: 'Leak: Angebliche Map zeigt Bundesstaat Leonida',
    excerpt:
      'Eine durchgesickerte Karte soll den fiktiven Bundesstaat Leonida mit Vice City und Umland zeigen.',
    body: 'In diversen Foren kursiert eine angeblich durchgesickerte **Übersichtskarte**. **Unbestätigt.**',
    category: 'leak',
    date: '2026-03-29',
    source: 'Community-Forum (unbestätigt)',
    source_url: null,
    image: 'https://picsum.photos/seed/gta6-map/800/450',
    tags: ['Leak', 'Map', 'Leonida'],
    author: 'Community',
    reliability: 'unconfirmed',
  },
  {
    id: 'official-soundtrack-partners',
    title: 'Offiziell: Rockstar kündigt Radiosender-Partner an',
    excerpt:
      'Für den Soundtrack arbeitet Rockstar erneut mit zahlreichen Labels zusammen.',
    body: 'Rockstar Games hat erste Details zum **Soundtrack** von GTA 6 bestätigt.',
    category: 'official',
    date: '2026-05-20',
    source: 'Rockstar Newswire',
    source_url: 'https://www.rockstargames.com/newswire',
    image: 'https://picsum.photos/seed/gta6-radio/800/450',
    tags: ['Offiziell', 'Soundtrack'],
    author: 'Redaktion',
    reliability: 'confirmed',
  },
]

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'reader',
    banned INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    actor_id TEXT,
    actor_name TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    detail TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_agent TEXT,
    created_at TEXT NOT NULL,
    last_seen TEXT NOT NULL,
    revoked INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    source TEXT NOT NULL,
    source_url TEXT,
    image TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    author TEXT,
    reliability TEXT,
    status TEXT NOT NULL DEFAULT 'published',
    publish_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL,
    user_id TEXT,
    author TEXT NOT NULL,
    text TEXT NOT NULL,
    parent_id TEXT,
    status TEXT NOT NULL DEFAULT 'visible',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS reactions (
    article_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    PRIMARY KEY (article_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS votes (
    article_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    vote TEXT NOT NULL,
    PRIMARY KEY (article_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS comment_votes (
    comment_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    value INTEGER NOT NULL,
    PRIMARY KEY (comment_id, user_id)
  )`,
]

export function createDb(path = ':memory:') {
  const db = new DatabaseSync(path)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  for (const sql of MIGRATIONS) db.exec(sql)
  ensureColumn(db, 'users', 'banned', 'INTEGER NOT NULL DEFAULT 0')
  ensureColumn(db, 'users', 'reputation', 'INTEGER NOT NULL DEFAULT 0')
  ensureColumn(db, 'articles', 'submitted_by', 'TEXT')
  seedArticles(db)
  return db
}

/** Fügt eine Spalte hinzu, falls sie in einer älteren DB noch fehlt. */
function ensureColumn(db, table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all()
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

/** Schreibt einen Eintrag ins Audit-Log (Moderations-Nachvollziehbarkeit). */
export function logAudit(db, actor, action, targetType, targetId, detail = '') {
  db.prepare(
    'INSERT INTO audit_log (id, actor_id, actor_name, action, target_type, target_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    randomUUID(),
    actor?.id ?? null,
    actor?.display_name ?? null,
    action,
    targetType,
    targetId,
    detail,
    new Date().toISOString(),
  )
}

function seedArticles(db) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM articles').get().n
  if (count > 0) return
  const now = new Date().toISOString()
  const stmt = db.prepare(
    `INSERT INTO articles (id, title, excerpt, body, category, date, source, source_url, image, tags, author, reliability, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)`,
  )
  for (const a of SEED_ARTICLES) {
    stmt.run(
      a.id, a.title, a.excerpt, a.body, a.category, a.date, a.source,
      a.source_url, a.image, JSON.stringify(a.tags), a.author, a.reliability, now, now,
    )
  }
}

/** Wandelt eine DB-Zeile in das vom Frontend erwartete Artikel-Format. */
export function rowToArticle(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    category: row.category,
    date: row.date,
    updatedDate: row.updated_at?.slice(0, 10),
    source: row.source,
    sourceUrl: row.source_url ?? undefined,
    image: row.image,
    tags: JSON.parse(row.tags || '[]'),
    author: row.author ?? undefined,
    reliability: row.reliability ?? undefined,
    status: row.status,
    publishAt: row.publish_at ?? undefined,
  }
}
