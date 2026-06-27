import express from 'express'
import cors from 'cors'
import { randomUUID } from 'node:crypto'
import { createDb, logAudit, rowToArticle } from './db.mjs'
import { classifyComment } from './moderation.mjs'
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
export function createApp({ dbPath = ':memory:' } = {}) {
  const db = createDb(dbPath)
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '1mb' }))

  const isPublished = (a) =>
    a.status === 'published' && (!a.publish_at || new Date(a.publish_at) <= new Date())
  const canEdit = (req) => ['author', 'admin'].includes(req.auth?.user?.role)

  // ---------------------------------------------------------------- health
  app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }))

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
    const { email, password } = req.body ?? {}
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get((email ?? '').toLowerCase())
    if (!user || !verifyPassword(password ?? '', user.password_hash))
      return res.status(401).json({ error: 'E-Mail oder Passwort falsch' })
    const { token } = issueToken(db, user, req.headers['user-agent'])
    res.json({ token, user: publicUser(user) })
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
    res.json({ article: rowToArticle(row) })
  })

  app.post('/api/articles', requireAuth(db, 'author'), (req, res) => {
    const b = req.body ?? {}
    if (!b.title || !b.source) return res.status(400).json({ error: 'Titel & Quelle nötig' })
    const id = b.id || randomUUID()
    const now = new Date().toISOString()
    db.prepare(
      `INSERT INTO articles (id, title, excerpt, body, category, date, source, source_url, image, tags, author, reliability, status, publish_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id, b.title, b.excerpt ?? '', b.body ?? '', b.category ?? 'official',
      b.date ?? now.slice(0, 10), b.source, b.sourceUrl ?? null,
      b.image ?? 'https://picsum.photos/seed/neu/800/450', JSON.stringify(b.tags ?? []),
      b.author ?? req.auth.user.display_name, b.reliability ?? null,
      b.status ?? 'published', b.publishAt ?? null, now, now,
    )
    res.status(201).json({ article: rowToArticle(db.prepare('SELECT * FROM articles WHERE id = ?').get(id)) })
  })

  app.put('/api/articles/:id', requireAuth(db, 'author'), (req, res) => {
    const row = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
    if (!row) return res.status(404).json({ error: 'Nicht gefunden' })
    const b = req.body ?? {}
    const now = new Date().toISOString()
    db.prepare(
      `UPDATE articles SET title=?, excerpt=?, body=?, category=?, date=?, source=?, source_url=?, image=?, tags=?, author=?, reliability=?, status=?, publish_at=?, updated_at=? WHERE id=?`,
    ).run(
      b.title ?? row.title, b.excerpt ?? row.excerpt, b.body ?? row.body,
      b.category ?? row.category, b.date ?? row.date, b.source ?? row.source,
      b.sourceUrl ?? row.source_url, b.image ?? row.image,
      JSON.stringify(b.tags ?? JSON.parse(row.tags)), b.author ?? row.author,
      b.reliability ?? row.reliability, b.status ?? row.status,
      b.publishAt ?? row.publish_at, now, req.params.id,
    )
    res.json({ article: rowToArticle(db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)) })
  })

  app.delete('/api/articles/:id', requireAuth(db, 'author'), (req, res) => {
    db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id)
    res.json({ ok: true })
  })

  // -------------------------------------------------------------- comments
  app.get('/api/articles/:id/comments', (req, res) => {
    const rows = db
      .prepare("SELECT * FROM comments WHERE article_id = ? AND status = 'visible' ORDER BY created_at ASC")
      .all(req.params.id)
    res.json({ comments: rows.map((c) => ({
      id: c.id, articleId: c.article_id, author: c.author, text: c.text,
      parentId: c.parent_id, createdAt: c.created_at,
    })) })
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

    res.status(201).json({
      comment: { id, articleId: req.params.id, author: req.auth.user.display_name, text: text.trim(), parentId: parentId ?? null, createdAt: now },
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

  // ------------------------------------------------------------- not found
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Route nicht gefunden' }))

  return { app, db }
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
