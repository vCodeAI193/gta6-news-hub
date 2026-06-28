import express from 'express'
import cors from 'cors'
import { randomUUID } from 'node:crypto'
import { createDb, dumpTables, logAudit, restoreTables, rowToArticle } from './db.mjs'
import { classifyComment } from './moderation.mjs'
import { awardReputation, badgesFor, levelFor, POINTS } from './gamification.mjs'
import { createMetrics } from './metrics.mjs'
import { createFlags } from './flags.mjs'
import { API_VERSION, openapiSpec } from './openapi.mjs'
import { predictionById, predictionQuestions } from './predictions.mjs'
import { generateSecret, otpauthUrl, verifyTotp } from './totp.mjs'
import {
  authenticate,
  hashPassword,
  issueToken,
  optionalAuth,
  publicUser,
  requireAuth,
  verifyPassword,
} from './auth.mjs'
import { rateLimit } from './rateLimit.mjs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const REACTION_EMOJIS = ['👍', '🔥', '😮', '😂', '😢']

/**
 * Baut die Express-App. `dbPath` erlaubt eine echte Datei (Produktion) oder
 * `:memory:` (Tests). Gibt { app, db } zurück.
 */
export function createApp({ dbPath = ':memory:', hub = null } = {}) {
  const db = createDb(dbPath)
  const publish = (type, payload) => hub?.publish(type, payload)
  const app = express()
  const metrics = createMetrics()
  const flags = createFlags()
  app.use(cors())
  app.use(express.json({ limit: '5mb' }))
  app.use(metrics.middleware)

  // API-Versionierung: /api/v1/* wird intern auf /api/* abgebildet (Alias + Back-Compat).
  app.use((req, _res, next) => {
    if (req.url === '/api/v1') req.url = '/api'
    else if (req.url.startsWith('/api/v1/')) req.url = '/api/' + req.url.slice('/api/v1/'.length)
    next()
  })

  const isPublished = (a) =>
    a.status === 'published' && (!a.publish_at || new Date(a.publish_at) <= new Date())
  const canEdit = (req) => ['author', 'admin'].includes(req.auth?.user?.role)

  // ---------------------------------------------------- system & observability
  app.get('/api/health', (_req, res) =>
    res.json({ ok: true, version: API_VERSION, time: new Date().toISOString(), ...metrics.snapshot() }),
  )
  app.get('/api/metrics', (_req, res) => res.json(metrics.snapshot()))
  app.get('/api/flags', (_req, res) => res.json({ flags: flags.all() }))
  app.post('/api/flags/:key', requireAuth(db, 'admin'), (req, res) => {
    const updated = flags.set(req.params.key, req.body?.value)
    if (!updated) return res.status(404).json({ error: 'Unbekanntes Flag' })
    logAudit(db, req.auth.user, 'flag.set', 'flag', req.params.key, String(req.body?.value))
    res.json({ flags: updated })
  })
  app.get('/api/openapi.json', (_req, res) => res.json(openapiSpec))

  // Inhalts-Backup & -Restore (admin).
  app.get('/api/admin/backup', requireAuth(db, 'admin'), (_req, res) => {
    res.json({ version: API_VERSION, exportedAt: new Date().toISOString(), data: dumpTables(db) })
  })
  app.post('/api/admin/restore', requireAuth(db, 'admin'), (req, res) => {
    if (!req.body?.data) return res.status(400).json({ error: 'data fehlt' })
    try {
      restoreTables(db, req.body.data)
      logAudit(db, req.auth.user, 'admin.restore', 'system', 'backup')
      res.json({ ok: true })
    } catch {
      res.status(500).json({ error: 'Restore fehlgeschlagen' })
    }
  })

  // ------------------------------------------------------------------ auth
  const authLimiter = rateLimit({ windowMs: 60_000, max: 20 })

  app.post('/api/auth/register', authLimiter, (req, res) => {
    const { email, password, displayName } = req.body ?? {}
    if (!EMAIL_RE.test(email ?? '')) return res.status(400).json({ error: 'Ungültige E-Mail' })
    if (!password || password.length < 8)
      return res.status(400).json({ error: 'Passwort min. 8 Zeichen' })

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase())
    if (existing) return res.status(409).json({ error: 'E-Mail bereits registriert' })

    const id = randomUUID()
    const now = new Date().toISOString()
    // Erster Nutzer wird Admin (Bootstrap), sonst Reader.
    const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n
    const role = userCount === 0 ? 'admin' : 'reader'
    db.prepare(
      'INSERT INTO users (id, email, password_hash, display_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(id, email.toLowerCase(), hashPassword(password), displayName?.trim() || email.split('@')[0], role, now)

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
    const { token } = issueToken(db, user, req.headers['user-agent'])
    res.status(201).json({ token, user: publicUser(user) })
  })

  app.post('/api/auth/login', authLimiter, (req, res) => {
    const { email, password, code } = req.body ?? {}
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get((email ?? '').toLowerCase())
    if (!user || !verifyPassword(password ?? '', user.password_hash))
      return res.status(401).json({ error: 'E-Mail oder Passwort falsch' })
    // Zweiter Faktor, falls aktiviert.
    if (user.totp_enabled) {
      if (!code) return res.status(401).json({ error: '2FA-Code erforderlich', require2fa: true })
      if (!verifyTotp(user.totp_secret, code)) return res.status(401).json({ error: '2FA-Code falsch', require2fa: true })
    }
    const { token } = issueToken(db, user, req.headers['user-agent'])
    res.json({ token, user: publicUser(user) })
  })

  // --- 2-Faktor-Authentifizierung (TOTP) ---
  app.post('/api/auth/2fa/setup', requireAuth(db), (req, res) => {
    const secret = generateSecret()
    db.prepare('UPDATE users SET totp_secret = ?, totp_enabled = 0 WHERE id = ?').run(secret, req.auth.user.id)
    res.json({ secret, otpauth: otpauthUrl(secret, req.auth.user.email) })
  })

  app.post('/api/auth/2fa/enable', requireAuth(db), (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth.user.id)
    if (!user.totp_secret) return res.status(400).json({ error: 'Erst Setup aufrufen' })
    if (!verifyTotp(user.totp_secret, req.body?.code)) return res.status(400).json({ error: 'Code falsch' })
    db.prepare('UPDATE users SET totp_enabled = 1 WHERE id = ?').run(user.id)
    res.json({ ok: true, twoFactorEnabled: true })
  })

  app.post('/api/auth/2fa/disable', requireAuth(db), (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth.user.id)
    if (user.totp_enabled && !verifyTotp(user.totp_secret, req.body?.code))
      return res.status(400).json({ error: 'Code falsch' })
    db.prepare('UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?').run(user.id)
    res.json({ ok: true, twoFactorEnabled: false })
  })

  app.get('/api/auth/me', requireAuth(db), (req, res) => {
    res.json({ user: publicUser(req.auth.user) })
  })

  app.get('/api/auth/sessions', requireAuth(db), (req, res) => {
    const rows = db
      .prepare('SELECT id, user_agent, created_at, last_seen, revoked FROM sessions WHERE user_id = ? ORDER BY last_seen DESC')
      .all(req.auth.user.id)
    res.json({ sessions: rows.map((r) => ({ ...r, current: r.id === req.auth.sessionId })) })
  })

  app.delete('/api/auth/sessions/:id', requireAuth(db), (req, res) => {
    db.prepare('UPDATE sessions SET revoked = 1 WHERE id = ? AND user_id = ?').run(
      req.params.id,
      req.auth.user.id,
    )
    res.json({ ok: true })
  })

  app.post('/api/auth/logout', requireAuth(db), (req, res) => {
    db.prepare('UPDATE sessions SET revoked = 1 WHERE id = ?').run(req.auth.sessionId)
    res.json({ ok: true })
  })

  // Profil aktualisieren (Name/E-Mail).
  app.patch('/api/auth/me', requireAuth(db), (req, res) => {
    const { displayName, email } = req.body ?? {}
    if (email != null) {
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Ungültige E-Mail' })
      const taken = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase(), req.auth.user.id)
      if (taken) return res.status(409).json({ error: 'E-Mail bereits vergeben' })
      db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email.toLowerCase(), req.auth.user.id)
    }
    if (displayName != null && displayName.trim()) {
      db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(displayName.trim(), req.auth.user.id)
    }
    res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth.user.id)) })
  })

  // Passwort ändern.
  app.post('/api/auth/change-password', requireAuth(db), (req, res) => {
    const { currentPassword, newPassword } = req.body ?? {}
    if (!verifyPassword(currentPassword ?? '', req.auth.user.password_hash))
      return res.status(403).json({ error: 'Aktuelles Passwort falsch' })
    if (!newPassword || newPassword.length < 8)
      return res.status(400).json({ error: 'Neues Passwort min. 8 Zeichen' })
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(newPassword), req.auth.user.id)
    // Andere Sessions abmelden, aktuelle behalten.
    db.prepare('UPDATE sessions SET revoked = 1 WHERE user_id = ? AND id != ?').run(req.auth.user.id, req.auth.sessionId)
    res.json({ ok: true })
  })

  // DSGVO-Datenexport.
  app.get('/api/auth/export', requireAuth(db), (req, res) => {
    const uid = req.auth.user.id
    res.json({
      exportedAt: new Date().toISOString(),
      user: publicUser(req.auth.user),
      comments: db.prepare('SELECT id, article_id, text, created_at FROM comments WHERE user_id = ?').all(uid),
      reactions: db.prepare('SELECT article_id, emoji FROM reactions WHERE user_id = ?').all(uid),
      votes: db.prepare('SELECT article_id, vote FROM votes WHERE user_id = ?').all(uid),
      follows: db.prepare('SELECT target_id, created_at FROM follows WHERE follower_id = ?').all(uid),
      predictions: db.prepare('SELECT question_id, choice, created_at FROM predictions WHERE user_id = ?').all(uid),
      sync: JSON.parse(db.prepare('SELECT data FROM user_sync WHERE user_id = ?').get(uid)?.data ?? '{}'),
    })
  })

  // Konto löschen (DSGVO) — entfernt Nutzer und zugehörige Daten.
  app.delete('/api/auth/me', requireAuth(db), (req, res) => {
    const uid = req.auth.user.id
    for (const sql of [
      'DELETE FROM comments WHERE user_id = ?',
      'DELETE FROM comment_votes WHERE user_id = ?',
      'DELETE FROM reactions WHERE user_id = ?',
      'DELETE FROM votes WHERE user_id = ?',
      'DELETE FROM follows WHERE follower_id = ? OR target_id = ?',
      'DELETE FROM predictions WHERE user_id = ?',
      'DELETE FROM user_sync WHERE user_id = ?',
      'DELETE FROM sessions WHERE user_id = ?',
      'DELETE FROM users WHERE id = ?',
    ]) {
      db.prepare(sql).run(...(sql.includes('OR target_id') ? [uid, uid] : [uid]))
    }
    res.json({ ok: true })
  })

  // --- Benachrichtigungen (inkl. @mentions) ---
  app.get('/api/me/notifications', requireAuth(db), (req, res) => {
    const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30').all(req.auth.user.id)
    const unread = rows.filter((n) => !n.read).length
    res.json({ notifications: rows.map((n) => ({ id: n.id, type: n.type, text: n.text, link: n.link, read: !!n.read, createdAt: n.created_at })), unread })
  })

  app.post('/api/me/notifications/read', requireAuth(db), (req, res) => {
    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.auth.user.id)
    res.json({ ok: true })
  })

  // Geräteübergreifende Sync (Lesezeichen/Einstellungen).
  app.get('/api/me/sync', requireAuth(db), (req, res) => {
    const row = db.prepare('SELECT data, updated_at FROM user_sync WHERE user_id = ?').get(req.auth.user.id)
    res.json({ data: JSON.parse(row?.data ?? '{}'), updatedAt: row?.updated_at ?? null })
  })
  app.put('/api/me/sync', requireAuth(db), (req, res) => {
    const data = JSON.stringify(req.body?.data ?? {})
    const now = new Date().toISOString()
    db.prepare('INSERT INTO user_sync (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at')
      .run(req.auth.user.id, data, now)
    res.json({ ok: true, updatedAt: now })
  })

  // -------------------------------------------------------------- articles
  app.get('/api/articles', optionalAuth(db), (req, res) => {
    const rows = db.prepare('SELECT * FROM articles ORDER BY date DESC').all()
    const visible = canEdit(req) ? rows : rows.filter(isPublished)
    res.json({ articles: visible.map(rowToArticle) })
  })

  app.get('/api/articles/:id', optionalAuth(db), (req, res) => {
    const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
    if (!row || (!isPublished(row) && !canEdit(req)))
      return res.status(404).json({ error: 'Nicht gefunden' })
    // Aufruf zählen (nur veröffentlichte Artikel, kein Redaktions-Preview).
    if (isPublished(row) && !canEdit(req)) {
      db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').run(req.params.id)
      row.views = (row.views ?? 0) + 1
    }
    res.json({ article: rowToArticle(row) })
  })

  // Versionshistorie eines Artikels.
  app.get('/api/articles/:id/revisions', requireAuth(db, 'author'), (req, res) => {
    const rows = db
      .prepare('SELECT id, edited_by, edited_at FROM article_revisions WHERE article_id = ? ORDER BY edited_at DESC')
      .all(req.params.id)
    res.json({ revisions: rows })
  })

  app.post('/api/articles/:id/revisions/:revId/restore', requireAuth(db, 'author'), (req, res) => {
    const rev = db.prepare('SELECT * FROM article_revisions WHERE id = ? AND article_id = ?').get(req.params.revId, req.params.id)
    if (!rev) return res.status(404).json({ error: 'Revision nicht gefunden' })
    const current = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
    if (current) snapshotRevision(db, current, req.auth.user) // aktuellen Stand sichern
    const snap = JSON.parse(rev.snapshot)
    const now = new Date().toISOString()
    db.prepare(
      `UPDATE articles SET title=?, excerpt=?, body=?, category=?, source=?, source_url=?, image=?, tags=?, author=?, reliability=?, updated_at=? WHERE id=?`,
    ).run(
      snap.title, snap.excerpt, snap.body, snap.category, snap.source, snap.source_url,
      snap.image, snap.tags, snap.author, snap.reliability, now, req.params.id,
    )
    logAudit(db, req.auth.user, 'article.revision.restore', 'article', req.params.id, req.params.revId)
    res.json({ article: rowToArticle(db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)) })
  })

  app.post('/api/articles', requireAuth(db, 'author'), (req, res) => {
    const b = req.body ?? {}
    if (!b.title || !b.source) return res.status(400).json({ error: 'Titel & Quelle nötig' })
    const id = b.id || randomUUID()
    const now = new Date().toISOString()
    db.prepare(
      `INSERT INTO articles (id, title, excerpt, body, category, date, source, source_url, image, tags, author, reliability, status, publish_at, co_authors, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id, b.title, b.excerpt ?? '', b.body ?? '', b.category ?? 'official',
      b.date ?? now.slice(0, 10), b.source, b.sourceUrl ?? null,
      b.image ?? 'https://picsum.photos/seed/neu/800/450', JSON.stringify(b.tags ?? []),
      b.author ?? req.auth.user.display_name, b.reliability ?? null,
      b.status ?? 'published', b.publishAt ?? null, JSON.stringify(b.coAuthors ?? []), now, now,
    )
    publish('article', { action: 'created', id })
    res.status(201).json({ article: rowToArticle(db.prepare('SELECT * FROM articles WHERE id = ?').get(id)) })
  })

  app.put('/api/articles/:id', requireAuth(db, 'author'), (req, res) => {
    const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
    if (!row) return res.status(404).json({ error: 'Nicht gefunden' })
    const b = req.body ?? {}
    const now = new Date().toISOString()
    // Aktuelle Version vor dem Überschreiben als Revision sichern.
    snapshotRevision(db, row, req.auth.user)
    db.prepare(
      `UPDATE articles SET title=?, excerpt=?, body=?, category=?, date=?, source=?, source_url=?, image=?, tags=?, author=?, reliability=?, status=?, publish_at=?, co_authors=?, updated_at=? WHERE id=?`,
    ).run(
      b.title ?? row.title, b.excerpt ?? row.excerpt, b.body ?? row.body,
      b.category ?? row.category, b.date ?? row.date, b.source ?? row.source,
      b.sourceUrl ?? row.source_url, b.image ?? row.image,
      JSON.stringify(b.tags ?? JSON.parse(row.tags)), b.author ?? row.author,
      b.reliability ?? row.reliability, b.status ?? row.status,
      b.publishAt ?? row.publish_at, JSON.stringify(b.coAuthors ?? JSON.parse(row.co_authors || '[]')), now, req.params.id,
    )
    res.json({ article: rowToArticle(db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)) })
  })

  app.delete('/api/articles/:id', requireAuth(db, 'author'), (req, res) => {
    db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id)
    res.json({ ok: true })
  })

  // -------------------------------------------------------------- comments
  app.get('/api/articles/:id/comments', optionalAuth(db), (req, res) => {
    const rows = db
      .prepare("SELECT * FROM comments WHERE article_id = ? AND status = 'visible' ORDER BY created_at ASC")
      .all(req.params.id)
    const userId = req.auth?.user?.id
    res.json({ comments: rows.map((c) => ({
      id: c.id, articleId: c.article_id, author: c.author, authorId: c.user_id, text: c.text,
      parentId: c.parent_id, createdAt: c.created_at,
      score: commentScore(db, c.id),
      myVote: userId ? (db.prepare('SELECT value FROM comment_votes WHERE comment_id = ? AND user_id = ?').get(c.id, userId)?.value ?? 0) : 0,
    })) })
  })

  // Kommentar up-/downvoten (value: 1, -1 oder 0 zum Zurücknehmen).
  app.post('/api/comments/:id/vote', requireAuth(db), (req, res) => {
    const value = Number(req.body?.value)
    if (![1, -1, 0].includes(value)) return res.status(400).json({ error: 'Ungültiger Wert' })
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id)
    if (!comment) return res.status(404).json({ error: 'Nicht gefunden' })
    if (comment.user_id === req.auth.user.id)
      return res.status(403).json({ error: 'Eigene Kommentare nicht bewertbar' })

    const prev = db.prepare('SELECT value FROM comment_votes WHERE comment_id = ? AND user_id = ?').get(req.params.id, req.auth.user.id)?.value ?? 0
    if (value === 0) {
      db.prepare('DELETE FROM comment_votes WHERE comment_id = ? AND user_id = ?').run(req.params.id, req.auth.user.id)
    } else {
      db.prepare('INSERT INTO comment_votes (comment_id, user_id, value) VALUES (?, ?, ?) ON CONFLICT(comment_id, user_id) DO UPDATE SET value = excluded.value').run(req.params.id, req.auth.user.id, value)
    }
    // Autor-Reputation: +1 je erhaltenem Upvote (an/aus).
    const repDelta = (value > 0 ? 1 : 0) - (prev > 0 ? 1 : 0)
    if (repDelta) awardReputation(db, comment.user_id, repDelta)

    res.json({ score: commentScore(db, req.params.id), myVote: value })
  })

  app.post('/api/articles/:id/comments', requireAuth(db), (req, res) => {
    if (req.auth.user.banned) return res.status(403).json({ error: 'Konto gesperrt' })
    const { text, parentId } = req.body ?? {}
    if (!text || !text.trim()) return res.status(400).json({ error: 'Text nötig' })

    // Spam-/Blocklist-Prüfung.
    const verdict = classifyComment(text.trim())
    if (verdict.status === 'rejected')
      return res.status(400).json({ error: 'Kommentar abgelehnt: ' + verdict.reason })

    const id = randomUUID()
    const now = new Date().toISOString()
    db.prepare(
      'INSERT INTO comments (id, article_id, user_id, author, text, parent_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(id, req.params.id, req.auth.user.id, req.auth.user.display_name, text.trim(), parentId ?? null, verdict.status, now)

    // Reputation fürs Mitmachen.
    awardReputation(db, req.auth.user.id, POINTS.comment)
    // @mentions → Benachrichtigungen.
    createMentionNotifications(db, text.trim(), req.params.id, req.auth.user)

    const comment = { id, articleId: req.params.id, author: req.auth.user.display_name, text: text.trim(), parentId: parentId ?? null, createdAt: now }
    // Nur sofort sichtbare Kommentare live verteilen.
    if (verdict.status === 'visible') publish('comment', { articleId: req.params.id, comment })

    res.status(201).json({
      comment,
      // 'pending' bedeutet: erst nach Freigabe öffentlich sichtbar.
      moderation: verdict.status === 'pending' ? verdict.reason : null,
    })
  })

  app.delete('/api/comments/:id', requireAuth(db), (req, res) => {
    const c = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id)
    if (!c) return res.status(404).json({ error: 'Nicht gefunden' })
    const isOwner = c.user_id === req.auth.user.id
    const isMod = ['moderator', 'admin'].includes(req.auth.user.role)
    if (!isOwner && !isMod) return res.status(403).json({ error: 'Keine Berechtigung' })
    db.prepare('DELETE FROM comments WHERE id = ? OR parent_id = ?').run(req.params.id, req.params.id)
    res.json({ ok: true })
  })

  // ------------------------------------------------------ reactions / votes
  app.post('/api/articles/:id/reactions', requireAuth(db), (req, res) => {
    const { emoji } = req.body ?? {}
    if (!REACTION_EMOJIS.includes(emoji)) return res.status(400).json({ error: 'Ungültige Reaktion' })
    const existing = db
      .prepare('SELECT emoji FROM reactions WHERE article_id = ? AND user_id = ?')
      .get(req.params.id, req.auth.user.id)
    if (existing?.emoji === emoji) {
      db.prepare('DELETE FROM reactions WHERE article_id = ? AND user_id = ?').run(req.params.id, req.auth.user.id)
    } else {
      db.prepare(
        'INSERT INTO reactions (article_id, user_id, emoji) VALUES (?, ?, ?) ON CONFLICT(article_id, user_id) DO UPDATE SET emoji = excluded.emoji',
      ).run(req.params.id, req.auth.user.id, emoji)
    }
    res.json({ counts: reactionCounts(db, req.params.id) })
  })

  app.get('/api/articles/:id/reactions', (req, res) => {
    res.json({ counts: reactionCounts(db, req.params.id) })
  })

  app.get('/api/articles/:id/votes', (req, res) => {
    res.json({ counts: voteCounts(db, req.params.id) })
  })

  app.post('/api/articles/:id/votes', requireAuth(db), (req, res) => {
    const { vote } = req.body ?? {}
    if (!['credible', 'fake'].includes(vote)) return res.status(400).json({ error: 'Ungültige Stimme' })
    const existing = db
      .prepare('SELECT vote FROM votes WHERE article_id = ? AND user_id = ?')
      .get(req.params.id, req.auth.user.id)
    if (existing?.vote === vote) {
      db.prepare('DELETE FROM votes WHERE article_id = ? AND user_id = ?').run(req.params.id, req.auth.user.id)
    } else {
      db.prepare(
        'INSERT INTO votes (article_id, user_id, vote) VALUES (?, ?, ?) ON CONFLICT(article_id, user_id) DO UPDATE SET vote = excluded.vote',
      ).run(req.params.id, req.auth.user.id, vote)
    }
    res.json({ counts: voteCounts(db, req.params.id) })
  })

  // ------------------------------------------------------------- moderation
  app.post('/api/reports', optionalAuth(db), (req, res) => {
    const { targetType, targetId, reason } = req.body ?? {}
    if (!targetId || !reason) return res.status(400).json({ error: 'Ziel & Grund nötig' })
    const id = randomUUID()
    db.prepare(
      'INSERT INTO reports (id, target_type, target_id, reason, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(id, targetType ?? 'article', targetId, reason, new Date().toISOString())
    res.status(201).json({ ok: true, id })
  })

  app.get('/api/reports', requireAuth(db, 'moderator'), (_req, res) => {
    res.json({ reports: db.prepare("SELECT * FROM reports WHERE status = 'open' ORDER BY created_at DESC").all() })
  })

  app.post('/api/reports/:id/resolve', requireAuth(db, 'moderator'), (req, res) => {
    db.prepare("UPDATE reports SET status = 'resolved' WHERE id = ?").run(req.params.id)
    logAudit(db, req.auth.user, 'report.resolve', 'report', req.params.id)
    res.json({ ok: true })
  })

  // Moderations-Queue: zur Prüfung markierte Kommentare.
  app.get('/api/moderation/comments', requireAuth(db, 'moderator'), (_req, res) => {
    const rows = db
      .prepare("SELECT * FROM comments WHERE status = 'pending' ORDER BY created_at DESC")
      .all()
    res.json({ comments: rows.map((c) => ({
      id: c.id, articleId: c.article_id, author: c.author, text: c.text,
      status: c.status, createdAt: c.created_at,
    })) })
  })

  app.post('/api/comments/:id/approve', requireAuth(db, 'moderator'), (req, res) => {
    db.prepare("UPDATE comments SET status = 'visible' WHERE id = ?").run(req.params.id)
    logAudit(db, req.auth.user, 'comment.approve', 'comment', req.params.id)
    // Freigegebene Kommentare live verteilen.
    const c = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id)
    if (c) {
      publish('comment', {
        articleId: c.article_id,
        comment: { id: c.id, articleId: c.article_id, author: c.author, text: c.text, parentId: c.parent_id, createdAt: c.created_at },
      })
    }
    res.json({ ok: true })
  })

  app.post('/api/comments/:id/reject', requireAuth(db, 'moderator'), (req, res) => {
    db.prepare("UPDATE comments SET status = 'rejected' WHERE id = ?").run(req.params.id)
    logAudit(db, req.auth.user, 'comment.reject', 'comment', req.params.id, req.body?.reason ?? '')
    res.json({ ok: true })
  })

  // Nutzer sperren/entsperren.
  app.post('/api/users/:id/ban', requireAuth(db, 'moderator'), (req, res) => {
    const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
    if (!target) return res.status(404).json({ error: 'Nutzer nicht gefunden' })
    if (target.role === 'admin') return res.status(403).json({ error: 'Admins können nicht gesperrt werden' })
    const banned = req.body?.banned ? 1 : 0
    db.prepare('UPDATE users SET banned = ? WHERE id = ?').run(banned, req.params.id)
    logAudit(db, req.auth.user, banned ? 'user.ban' : 'user.unban', 'user', req.params.id, target.display_name)
    res.json({ ok: true, banned: Boolean(banned) })
  })

  app.get('/api/moderation/users', requireAuth(db, 'moderator'), (_req, res) => {
    const rows = db.prepare('SELECT id, email, display_name, role, banned, created_at FROM users ORDER BY created_at DESC').all()
    res.json({ users: rows.map((u) => ({ ...u, banned: Boolean(u.banned) })) })
  })

  // Faktencheck: Verlässlichkeit eines (Leak-)Artikels setzen.
  app.patch('/api/articles/:id/verify', requireAuth(db, 'moderator'), (req, res) => {
    const { reliability } = req.body ?? {}
    if (!['confirmed', 'rumor', 'unconfirmed'].includes(reliability))
      return res.status(400).json({ error: 'Ungültiger Status' })
    const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
    if (!row) return res.status(404).json({ error: 'Nicht gefunden' })
    db.prepare('UPDATE articles SET reliability = ?, updated_at = ? WHERE id = ?').run(
      reliability, new Date().toISOString(), req.params.id,
    )
    logAudit(db, req.auth.user, 'article.verify', 'article', req.params.id, reliability)
    res.json({ article: rowToArticle(db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)) })
  })

  // Audit-Log.
  app.get('/api/moderation/audit', requireAuth(db, 'moderator'), (_req, res) => {
    res.json({ entries: db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100').all() })
  })

  // -------------------------------------------------------------- broadcast
  // Eilmeldung an alle verbundenen Clients (Breaking-News-Banner).
  app.post('/api/broadcast/breaking', requireAuth(db, 'author'), (req, res) => {
    const message = (req.body?.message ?? '').trim()
    if (!message) return res.status(400).json({ error: 'Nachricht nötig' })
    const id = randomUUID()
    publish('breaking', { id, message })
    forwardToDiscord(`📣 **Eilmeldung:** ${message}`)
    logAudit(db, req.auth.user, 'broadcast.breaking', 'broadcast', id, message)
    res.status(201).json({ ok: true, id })
  })

  // ----------------------------------------------------------- submissions
  // Leser reichen News/Leaks zur Prüfung ein (status 'submitted').
  app.post('/api/submissions', requireAuth(db), (req, res) => {
    if (req.auth.user.banned) return res.status(403).json({ error: 'Konto gesperrt' })
    const b = req.body ?? {}
    if (!b.title?.trim() || !b.source?.trim()) return res.status(400).json({ error: 'Titel & Quelle nötig' })
    const id = randomUUID()
    const now = new Date().toISOString()
    db.prepare(
      `INSERT INTO articles (id, title, excerpt, body, category, date, source, source_url, image, tags, author, reliability, status, submitted_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, ?)`,
    ).run(
      id, b.title.trim(), b.excerpt ?? '', b.body ?? '', b.category ?? 'leak', now.slice(0, 10),
      b.source.trim(), b.sourceUrl ?? null, b.image ?? 'https://picsum.photos/seed/einreichung/800/450',
      JSON.stringify(b.tags ?? []), req.auth.user.display_name, b.reliability ?? 'unconfirmed',
      req.auth.user.id, now, now,
    )
    res.status(201).json({ ok: true, id })
  })

  app.get('/api/moderation/submissions', requireAuth(db, 'moderator'), (_req, res) => {
    const rows = db.prepare("SELECT * FROM articles WHERE status = 'submitted' ORDER BY created_at DESC").all()
    res.json({ submissions: rows.map(rowToArticle) })
  })

  app.post('/api/submissions/:id/approve', requireAuth(db, 'moderator'), (req, res) => {
    const row = db.prepare("SELECT * FROM articles WHERE id = ? AND status = 'submitted'").get(req.params.id)
    if (!row) return res.status(404).json({ error: 'Nicht gefunden' })
    db.prepare("UPDATE articles SET status = 'published', updated_at = ? WHERE id = ?").run(new Date().toISOString(), req.params.id)
    awardReputation(db, row.submitted_by, POINTS.submissionApproved)
    logAudit(db, req.auth.user, 'submission.approve', 'article', req.params.id, row.title)
    publish('article', { action: 'created', id: req.params.id })
    res.json({ ok: true })
  })

  app.post('/api/submissions/:id/reject', requireAuth(db, 'moderator'), (req, res) => {
    db.prepare("UPDATE articles SET status = 'rejected' WHERE id = ? AND status = 'submitted'").run(req.params.id)
    logAudit(db, req.auth.user, 'submission.reject', 'article', req.params.id)
    res.json({ ok: true })
  })

  // ------------------------------------------------------ profile & ranking
  app.get('/api/users/:id/profile', (req, res) => {
    const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
    if (!u) return res.status(404).json({ error: 'Nutzer nicht gefunden' })
    const commentCount = db.prepare("SELECT COUNT(*) AS n FROM comments WHERE user_id = ? AND status = 'visible'").get(u.id).n
    const submissionsApproved = db.prepare("SELECT COUNT(*) AS n FROM articles WHERE submitted_by = ? AND status = 'published'").get(u.id).n
    const followers = db.prepare('SELECT COUNT(*) AS n FROM follows WHERE target_id = ?').get(u.id).n
    const following = db.prepare('SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?').get(u.id).n
    const recent = db.prepare("SELECT id, article_id, text, created_at FROM comments WHERE user_id = ? AND status = 'visible' ORDER BY created_at DESC LIMIT 5").all(u.id)
    res.json({
      profile: {
        id: u.id,
        displayName: u.display_name,
        role: u.role,
        reputation: u.reputation,
        joinedAt: u.created_at,
        ...levelFor(u.reputation),
        badges: badgesFor({ reputation: u.reputation, commentCount, submissionsApproved }),
        stats: { commentCount, submissionsApproved, followers, following },
        recentComments: recent.map((c) => ({ id: c.id, articleId: c.article_id, text: c.text, createdAt: c.created_at })),
      },
    })
  })

  app.get('/api/leaderboard', (_req, res) => {
    const rows = db.prepare('SELECT id, display_name, role, reputation FROM users ORDER BY reputation DESC, created_at ASC LIMIT 10').all()
    res.json({ leaders: rows.map((u, i) => ({
      rank: i + 1, id: u.id, displayName: u.display_name, role: u.role,
      reputation: u.reputation, level: levelFor(u.reputation).name,
    })) })
  })

  // ------------------------------------------------------- follow & feed
  app.post('/api/users/:id/follow', requireAuth(db), (req, res) => {
    if (req.params.id === req.auth.user.id) return res.status(400).json({ error: 'Selbst folgen geht nicht' })
    const target = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id)
    if (!target) return res.status(404).json({ error: 'Nutzer nicht gefunden' })
    db.prepare('INSERT OR IGNORE INTO follows (follower_id, target_id, created_at) VALUES (?, ?, ?)')
      .run(req.auth.user.id, req.params.id, new Date().toISOString())
    res.json({ ok: true, following: true })
  })

  app.delete('/api/users/:id/follow', requireAuth(db), (req, res) => {
    db.prepare('DELETE FROM follows WHERE follower_id = ? AND target_id = ?').run(req.auth.user.id, req.params.id)
    res.json({ ok: true, following: false })
  })

  app.get('/api/users/:id/follow-status', optionalAuth(db), (req, res) => {
    const followers = db.prepare('SELECT COUNT(*) AS n FROM follows WHERE target_id = ?').get(req.params.id).n
    const following = db.prepare('SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?').get(req.params.id).n
    const me = req.auth?.user?.id
    const isFollowing = me ? !!db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND target_id = ?').get(me, req.params.id) : false
    res.json({ followers, following, isFollowing })
  })

  // Aktivitäts-Feed: jüngste Kommentare gefolgter Nutzer.
  app.get('/api/me/feed', requireAuth(db), (req, res) => {
    const rows = db.prepare(
      `SELECT c.id, c.article_id, c.user_id, c.author, c.text, c.created_at
       FROM comments c
       JOIN follows f ON f.target_id = c.user_id
       WHERE f.follower_id = ? AND c.status = 'visible'
       ORDER BY c.created_at DESC LIMIT 30`,
    ).all(req.auth.user.id)
    res.json({ feed: rows.map((c) => ({ id: c.id, articleId: c.article_id, authorId: c.user_id, author: c.author, text: c.text, createdAt: c.created_at })) })
  })

  // -------------------------------------------------------- predictions (Tippspiel)
  app.get('/api/predictions', optionalAuth(db), (req, res) => {
    const me = req.auth?.user?.id
    const result = predictionQuestions.map((q) => {
      const counts = {}
      for (const opt of q.options) counts[opt] = 0
      for (const row of db.prepare('SELECT choice, COUNT(*) AS n FROM predictions WHERE question_id = ? GROUP BY choice').all(q.id)) {
        if (row.choice in counts) counts[row.choice] = row.n
      }
      const mine = me ? db.prepare('SELECT choice FROM predictions WHERE user_id = ? AND question_id = ?').get(me, q.id)?.choice : undefined
      return { ...q, counts, mine: mine ?? null }
    })
    res.json({ questions: result })
  })

  app.post('/api/predictions/:qid', requireAuth(db), (req, res) => {
    const q = predictionById[req.params.qid]
    if (!q) return res.status(404).json({ error: 'Frage nicht gefunden' })
    const { choice } = req.body ?? {}
    if (!q.options.includes(choice)) return res.status(400).json({ error: 'Ungültige Auswahl' })
    db.prepare('INSERT INTO predictions (user_id, question_id, choice, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, question_id) DO UPDATE SET choice = excluded.choice')
      .run(req.auth.user.id, req.params.qid, choice, new Date().toISOString())
    res.json({ ok: true })
  })

  // -------------------------------------------------- editorial workflow
  // Artikel im Status 'review' (Redaktions-Freigabe).
  app.get('/api/moderation/review', requireAuth(db, 'moderator'), (_req, res) => {
    const rows = db.prepare("SELECT * FROM articles WHERE status = 'review' ORDER BY updated_at DESC").all()
    res.json({ review: rows.map(rowToArticle) })
  })

  app.post('/api/articles/:id/publish', requireAuth(db, 'moderator'), (req, res) => {
    const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
    if (!row) return res.status(404).json({ error: 'Nicht gefunden' })
    db.prepare("UPDATE articles SET status = 'published', updated_at = ? WHERE id = ?").run(new Date().toISOString(), req.params.id)
    logAudit(db, req.auth.user, 'article.publish', 'article', req.params.id, row.title)
    publish('article', { action: 'created', id: req.params.id })
    res.json({ ok: true })
  })

  // ----------------------------------------------------------- analytics
  const searchLimiter = rateLimit({ windowMs: 60_000, max: 60 })
  app.post('/api/analytics/search', searchLimiter, (req, res) => {
    const term = (req.body?.term ?? '').trim().slice(0, 100)
    if (!term) return res.status(400).json({ error: 'term nötig' })
    db.prepare('INSERT INTO search_log (id, term, results, created_at) VALUES (?, ?, ?, ?)').run(
      randomUUID(), term.toLowerCase(), Number(req.body?.results) || 0, new Date().toISOString(),
    )
    res.status(201).json({ ok: true })
  })

  app.get('/api/analytics/dashboard', requireAuth(db, 'author'), (_req, res) => {
    const totalViews = db.prepare('SELECT COALESCE(SUM(views),0) AS n FROM articles').get().n
    const totalComments = db.prepare("SELECT COUNT(*) AS n FROM comments WHERE status = 'visible'").get().n
    const totalUsers = db.prepare('SELECT COUNT(*) AS n FROM users').get().n
    const topArticles = db.prepare("SELECT id, title, views FROM articles WHERE status = 'published' ORDER BY views DESC LIMIT 5").all()
    const topSearches = db.prepare('SELECT term, COUNT(*) AS count FROM search_log GROUP BY term ORDER BY count DESC LIMIT 8').all()
    const zeroResults = db.prepare('SELECT DISTINCT term FROM search_log WHERE results = 0 ORDER BY created_at DESC LIMIT 8').all().map((r) => r.term)
    res.json({ totals: { totalViews, totalComments, totalUsers }, topArticles, topSearches, zeroResults })
  })

  app.get('/api/analytics/export.csv', requireAuth(db, 'author'), (_req, res) => {
    const rows = db.prepare("SELECT id, title, category, date, status, views FROM articles ORDER BY views DESC").all()
    const header = 'id,title,category,date,status,views'
    const csv = [header, ...rows.map((r) =>
      [r.id, '"' + String(r.title).replace(/"/g, '""') + '"', r.category, r.date, r.status, r.views].join(','),
    )].join('\n')
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="artikel-report.csv"')
    res.send(csv)
  })

  // ------------------------------------------------------------- not found
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Route nicht gefunden' }))

  return { app, db }
}

/**
 * Optionale Discord-Integration: leitet Eilmeldungen an einen Webhook weiter,
 * sofern DISCORD_WEBHOOK_URL gesetzt ist (sonst No-op).
 */
function forwardToDiscord(content) {
  const url = process.env.DISCORD_WEBHOOK_URL
  if (!url) return
  try {
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
  } catch {
    /* Integration darf die API nie blockieren. */
  }
}

/** Erzeugt Benachrichtigungen für @erwähnte Nutzer in einem Kommentar. */
function createMentionNotifications(db, text, articleId, author) {
  const tokens = [...new Set((text.match(/@(\w+)/g) ?? []).map((t) => t.slice(1).toLowerCase()))]
  if (tokens.length === 0) return
  const now = new Date().toISOString()
  for (const token of tokens) {
    const target = db
      .prepare("SELECT id FROM users WHERE lower(replace(display_name, ' ', '')) = ? AND id != ?")
      .get(token, author.id)
    if (!target) continue
    db.prepare('INSERT INTO notifications (id, user_id, type, text, link, read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)').run(
      randomUUID(), target.id, 'mention',
      `${author.display_name} hat dich erwähnt`, `/news/${articleId}`, now,
    )
  }
}

function snapshotRevision(db, row, user) {
  db.prepare(
    'INSERT INTO article_revisions (id, article_id, snapshot, edited_by, edited_at) VALUES (?, ?, ?, ?, ?)',
  ).run(randomUUID(), row.id, JSON.stringify(row), user?.display_name ?? null, new Date().toISOString())
}

function commentScore(db, commentId) {
  return db.prepare('SELECT COALESCE(SUM(value), 0) AS s FROM comment_votes WHERE comment_id = ?').get(commentId).s
}

function reactionCounts(db, articleId) {
  const rows = db.prepare('SELECT emoji, COUNT(*) AS n FROM reactions WHERE article_id = ? GROUP BY emoji').all(articleId)
  return Object.fromEntries(rows.map((r) => [r.emoji, r.n]))
}

function voteCounts(db, articleId) {
  const rows = db.prepare('SELECT vote, COUNT(*) AS n FROM votes WHERE article_id = ? GROUP BY vote').all(articleId)
  const counts = { credible: 0, fake: 0 }
  for (const r of rows) counts[r.vote] = r.n
  return counts
}

export { authenticate }
