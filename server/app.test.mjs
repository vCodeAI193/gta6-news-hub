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
