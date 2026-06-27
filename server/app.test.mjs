import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from './app.mjs'

// Node-eigener Test-Runner (kein Vite/Vitest), damit node:sqlite nativ läuft.

let app

beforeEach(() => {
  app = createApp({ dbPath: ':memory:' }).app
})

async function register(over = {}) {
  return request(app)
    .post('/api/auth/register')
    .send({ email: 'a@b.de', password: 'password123', displayName: 'Tester', ...over })
}

describe('Health', () => {
  it('antwortet ok', async () => {
    const res = await request(app).get('/api/health')
    assert.equal(res.status, 200)
    assert.equal(res.body.ok, true)
  })
})

describe('Auth', () => {
  it('registriert den ersten Nutzer als Admin', async () => {
    const res = await register()
    assert.equal(res.status, 201)
    assert.ok(res.body.token)
    assert.equal(res.body.user.role, 'admin')
  })

  it('lehnt zu kurze Passwörter ab', async () => {
    assert.equal((await register({ password: 'kurz' })).status, 400)
  })

  it('verhindert doppelte E-Mails', async () => {
    await register()
    assert.equal((await register()).status, 409)
  })

  it('login mit korrekten Daten', async () => {
    await register()
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.de', password: 'password123' })
    assert.equal(res.status, 200)
    assert.ok(res.body.token)
  })

  it('login schlägt bei falschem Passwort fehl', async () => {
    await register()
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.de', password: 'falsch123' })
    assert.equal(res.status, 401)
  })

  it('/me erfordert Token', async () => {
    assert.equal((await request(app).get('/api/auth/me')).status, 401)
  })

  it('/me liefert den Nutzer mit Token', async () => {
    const { body } = await register()
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`)
    assert.equal(res.status, 200)
    assert.equal(res.body.user.email, 'a@b.de')
  })

  it('widerrufene Session sperrt den Token', async () => {
    const { body } = await register()
    await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${body.token}`)
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`)
    assert.equal(res.status, 401)
  })
})

describe('Articles', () => {
  it('liefert die Seed-Artikel', async () => {
    const res = await request(app).get('/api/articles')
    assert.equal(res.status, 200)
    assert.ok(res.body.articles.length >= 4)
  })

  it('verweigert Anlegen ohne Rolle', async () => {
    assert.equal((await request(app).post('/api/articles').send({ title: 'X', source: 'Y' })).status, 401)
  })

  it('Admin kann Artikel anlegen, bearbeiten und löschen', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    const created = await request(app).post('/api/articles').set('Authorization', auth)
      .send({ title: 'Neu', source: 'Quelle', category: 'leak', excerpt: 'e', body: 'b' })
    assert.equal(created.status, 201)
    const id = created.body.article.id

    const updated = await request(app).put(`/api/articles/${id}`).set('Authorization', auth).send({ title: 'Geändert' })
    assert.equal(updated.body.article.title, 'Geändert')

    assert.equal((await request(app).delete(`/api/articles/${id}`).set('Authorization', auth)).status, 200)
    assert.equal((await request(app).get(`/api/articles/${id}`)).status, 404)
  })

  it('versteckt Entwürfe vor anonymen Nutzern', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    const draft = await request(app).post('/api/articles').set('Authorization', auth)
      .send({ title: 'Entwurf', source: 'Q', status: 'draft' })
    const id = draft.body.article.id
    const anon = await request(app).get('/api/articles')
    assert.equal(anon.body.articles.some((a) => a.id === id), false)
  })
})

describe('Comments & Reactions', () => {
  it('Kommentieren erfordert Login, dann sichtbar', async () => {
    const anon = await request(app).post('/api/articles/release-date-confirmed/comments').send({ text: 'Hi' })
    assert.equal(anon.status, 401)

    const { body } = await register()
    const auth = `Bearer ${body.token}`
    const posted = await request(app).post('/api/articles/release-date-confirmed/comments').set('Authorization', auth).send({ text: 'Hallo Welt' })
    assert.equal(posted.status, 201)

    const list = await request(app).get('/api/articles/release-date-confirmed/comments')
    assert.equal(list.body.comments.length, 1)
  })

  it('Reaktion togglen aktualisiert die Zähler', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    const r1 = await request(app).post('/api/articles/release-date-confirmed/reactions').set('Authorization', auth).send({ emoji: '🔥' })
    assert.equal(r1.body.counts['🔥'], 1)
    const r2 = await request(app).post('/api/articles/release-date-confirmed/reactions').set('Authorization', auth).send({ emoji: '🔥' })
    assert.equal(r2.body.counts['🔥'] ?? 0, 0)
  })
})

async function registerSecond(over = {}) {
  return request(app)
    .post('/api/auth/register')
    .send({ email: 'leser@b.de', password: 'password123', displayName: 'Leser', ...over })
}

describe('Moderation', () => {
  it('lehnt Kommentare mit gesperrten Begriffen ab', async () => {
    const { body } = await register()
    const res = await request(app)
      .post('/api/articles/release-date-confirmed/comments')
      .set('Authorization', `Bearer ${body.token}`)
      .send({ text: 'Kauf jetzt viagra hier!' })
    assert.equal(res.status, 400)
  })

  it('markiert verdächtige Kommentare als pending und hält sie aus der Öffentlichkeit', async () => {
    await register() // admin
    const reader = await registerSecond()
    const auth = `Bearer ${reader.body.token}`
    const spammy = 'Schaut https://a.com https://b.com https://c.com an'
    const posted = await request(app)
      .post('/api/articles/release-date-confirmed/comments')
      .set('Authorization', auth)
      .send({ text: spammy })
    assert.equal(posted.status, 201)
    assert.ok(posted.body.moderation) // als pending markiert

    const publicList = await request(app).get('/api/articles/release-date-confirmed/comments')
    assert.equal(publicList.body.comments.length, 0)
  })

  it('Moderator kann pending-Kommentare freigeben', async () => {
    const admin = await register()
    const reader = await registerSecond()
    await request(app)
      .post('/api/articles/release-date-confirmed/comments')
      .set('Authorization', `Bearer ${reader.body.token}`)
      .send({ text: 'Spam https://a.com https://b.com https://c.com' })

    const adminAuth = `Bearer ${admin.body.token}`
    const queue = await request(app).get('/api/moderation/comments').set('Authorization', adminAuth)
    assert.equal(queue.status, 200)
    assert.equal(queue.body.comments.length, 1)

    const id = queue.body.comments[0].id
    await request(app).post(`/api/comments/${id}/approve`).set('Authorization', adminAuth)
    const publicList = await request(app).get('/api/articles/release-date-confirmed/comments')
    assert.equal(publicList.body.comments.length, 1)
  })

  it('verweigert die Queue für normale Nutzer', async () => {
    await register()
    const reader = await registerSecond()
    const res = await request(app).get('/api/moderation/comments').set('Authorization', `Bearer ${reader.body.token}`)
    assert.equal(res.status, 403)
  })

  it('Moderator kann einen Nutzer sperren; gesperrte können nicht kommentieren', async () => {
    const admin = await register()
    const reader = await registerSecond()
    const ban = await request(app)
      .post(`/api/users/${reader.body.user.id}/ban`)
      .set('Authorization', `Bearer ${admin.body.token}`)
      .send({ banned: true })
    assert.equal(ban.body.banned, true)

    const res = await request(app)
      .post('/api/articles/release-date-confirmed/comments')
      .set('Authorization', `Bearer ${reader.body.token}`)
      .send({ text: 'Hallo' })
    assert.equal(res.status, 403)
  })

  it('Faktencheck setzt die Verlässlichkeit + schreibt Audit-Log', async () => {
    const admin = await register()
    const auth = `Bearer ${admin.body.token}`
    const res = await request(app)
      .patch('/api/articles/map-leak-vice-city/verify')
      .set('Authorization', auth)
      .send({ reliability: 'confirmed' })
    assert.equal(res.body.article.reliability, 'confirmed')

    const audit = await request(app).get('/api/moderation/audit').set('Authorization', auth)
    assert.ok(audit.body.entries.some((e) => e.action === 'article.verify'))
  })
})

describe('Gamification', () => {
  it('Kommentieren bringt Reputation', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    await request(app).post('/api/articles/release-date-confirmed/comments').set('Authorization', auth).send({ text: 'Guter Artikel' })
    const me = await request(app).get('/api/auth/me').set('Authorization', auth)
    assert.ok(me.body.user.reputation >= 2)
  })

  it('Upvote auf fremden Kommentar erhöht Autor-Reputation', async () => {
    const admin = await register() // admin/author
    const reader = await registerSecond()
    // Reader kommentiert
    const c = await request(app).post('/api/articles/release-date-confirmed/comments').set('Authorization', `Bearer ${reader.body.token}`).send({ text: 'Mein Kommentar' })
    const commentId = c.body.comment.id
    const repBefore = (await request(app).get('/api/auth/me').set('Authorization', `Bearer ${reader.body.token}`)).body.user.reputation
    // Admin upvotet
    const vote = await request(app).post(`/api/comments/${commentId}/vote`).set('Authorization', `Bearer ${admin.body.token}`).send({ value: 1 })
    assert.equal(vote.body.score, 1)
    const repAfter = (await request(app).get('/api/auth/me').set('Authorization', `Bearer ${reader.body.token}`)).body.user.reputation
    assert.equal(repAfter, repBefore + 1)
  })

  it('eigene Kommentare sind nicht bewertbar', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    const c = await request(app).post('/api/articles/release-date-confirmed/comments').set('Authorization', auth).send({ text: 'Selbst' })
    const res = await request(app).post(`/api/comments/${c.body.comment.id}/vote`).set('Authorization', auth).send({ value: 1 })
    assert.equal(res.status, 403)
  })

  it('Einreichung → Freigabe veröffentlicht & belohnt den Einreicher', async () => {
    const admin = await register()
    const reader = await registerSecond()
    const sub = await request(app).post('/api/submissions').set('Authorization', `Bearer ${reader.body.token}`).send({ title: 'Leak: Neue Map', source: 'Forum', body: 'Details', category: 'leak' })
    assert.equal(sub.status, 201)
    const id = sub.body.id

    // Vor Freigabe nicht öffentlich
    const before = await request(app).get('/api/articles')
    assert.equal(before.body.articles.some((a) => a.id === id), false)

    // Freigeben
    const approve = await request(app).post(`/api/submissions/${id}/approve`).set('Authorization', `Bearer ${admin.body.token}`)
    assert.equal(approve.status, 200)

    const after = await request(app).get('/api/articles')
    assert.equal(after.body.articles.some((a) => a.id === id), true)
    const rep = (await request(app).get('/api/auth/me').set('Authorization', `Bearer ${reader.body.token}`)).body.user.reputation
    assert.ok(rep >= 10)
  })

  it('Profil liefert Level, Badges und Stats', async () => {
    const { body } = await register()
    await request(app).post('/api/articles/release-date-confirmed/comments').set('Authorization', `Bearer ${body.token}`).send({ text: 'Hi' })
    const res = await request(app).get(`/api/users/${body.user.id}/profile`)
    assert.equal(res.status, 200)
    assert.equal(res.body.profile.stats.commentCount, 1)
    assert.ok(res.body.profile.badges.some((b) => b.id === 'first-comment'))
    assert.ok(res.body.profile.level >= 1)
  })

  it('Rangliste sortiert nach Reputation', async () => {
    await register()
    const res = await request(app).get('/api/leaderboard')
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body.leaders))
  })
})

describe('Platform & API', () => {
  it('Health liefert Version & Uptime', async () => {
    const res = await request(app).get('/api/health')
    assert.equal(res.status, 200)
    assert.ok(res.body.version)
    assert.ok(typeof res.body.uptimeSec === 'number')
  })

  it('API-Versionierung: /api/v1 ist ein Alias', async () => {
    const v1 = await request(app).get('/api/v1/articles')
    assert.equal(v1.status, 200)
    assert.ok(v1.body.articles.length >= 4)
  })

  it('liefert die OpenAPI-Spezifikation', async () => {
    const res = await request(app).get('/api/openapi.json')
    assert.equal(res.body.openapi, '3.0.3')
    assert.ok(res.body.paths['/articles'])
  })

  it('Feature-Flags lesen und (als Admin) umschalten', async () => {
    const pub = await request(app).get('/api/flags')
    assert.equal(pub.body.flags.media, true)
    const { body } = await register()
    const res = await request(app).post('/api/flags/media').set('Authorization', `Bearer ${body.token}`).send({ value: false })
    assert.equal(res.body.flags.media, false)
  })

  it('verweigert Flag-Umschalten ohne Admin', async () => {
    await register() // admin
    const reader = await registerSecond()
    const res = await request(app).post('/api/flags/media').set('Authorization', `Bearer ${reader.body.token}`).send({ value: false })
    assert.equal(res.status, 403)
  })

  it('Metrics zählt Requests', async () => {
    await request(app).get('/api/health')
    const res = await request(app).get('/api/metrics')
    assert.ok(res.body.requests >= 1)
  })

  it('Backup → Restore stellt gelöschte Inhalte wieder her', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    const backup = await request(app).get('/api/admin/backup').set('Authorization', auth)
    assert.ok(backup.body.data.articles.length >= 4)

    // Einen Artikel löschen …
    await request(app).delete('/api/articles/release-date-confirmed').set('Authorization', auth)
    const afterDelete = await request(app).get('/api/articles/release-date-confirmed')
    assert.equal(afterDelete.status, 404)

    // … und per Restore zurückholen.
    const restore = await request(app).post('/api/admin/restore').set('Authorization', auth).send({ data: backup.body.data })
    assert.equal(restore.status, 200)
    const restored = await request(app).get('/api/articles/release-date-confirmed')
    assert.equal(restored.status, 200)
  })
})

describe('Rate limiting', () => {
  it('greift nach vielen Auth-Anfragen', async () => {
    let limited = false
    for (let i = 0; i < 25; i++) {
      const res = await request(app).post('/api/auth/login').send({ email: 'x@y.de', password: 'nope' })
      if (res.status === 429) { limited = true; break }
    }
    assert.equal(limited, true)
  })
})
