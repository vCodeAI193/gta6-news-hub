import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'

/**
 * Authentifizierung: Passwort-Hashing (bcryptjs), JWT-Ausstellung mit
 * Session-Eintrag (für Widerruf) und Express-Middleware zur Absicherung.
 */
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const TOKEN_TTL = '7d'

export const ROLES = ['reader', 'author', 'moderator', 'admin']
const ROLE_RANK = { reader: 0, author: 1, moderator: 2, admin: 3 }

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10)
}

export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash)
}

/** Erstellt eine Session-Zeile und gibt ein signiertes JWT zurück. */
export function issueToken(db, user, userAgent = '') {
  const sessionId = randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    'INSERT INTO sessions (id, user_id, user_agent, created_at, last_seen) VALUES (?, ?, ?, ?, ?)',
  ).run(sessionId, user.id, userAgent, now, now)
  const token = jwt.sign(
    { sub: user.id, role: user.role, sid: sessionId },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL },
  )
  return { token, sessionId }
}

export function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    createdAt: row.created_at,
  }
}

/** Liest & verifiziert den Bearer-Token; prüft, dass die Session aktiv ist. */
export function authenticate(db, req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const session = db
      .prepare('SELECT * FROM sessions WHERE id = ? AND revoked = 0')
      .get(payload.sid)
    if (!session) return null
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub)
    if (!user) return null
    db.prepare('UPDATE sessions SET last_seen = ? WHERE id = ?').run(
      new Date().toISOString(),
      payload.sid,
    )
    return { user, sessionId: payload.sid }
  } catch {
    return null
  }
}

/** Express-Middleware-Factory: erfordert Login und optional eine Mindestrolle. */
export function requireAuth(db, minRole = 'reader') {
  return (req, res, next) => {
    const auth = authenticate(db, req)
    if (!auth) return res.status(401).json({ error: 'Nicht authentifiziert' })
    if (ROLE_RANK[auth.user.role] < ROLE_RANK[minRole]) {
      return res.status(403).json({ error: 'Keine Berechtigung' })
    }
    req.auth = auth
    next()
  }
}

/** Optionale Authentifizierung: setzt req.auth, blockt aber nicht. */
export function optionalAuth(db) {
  return (req, _res, next) => {
    req.auth = authenticate(db, req)
    next()
  }
}
