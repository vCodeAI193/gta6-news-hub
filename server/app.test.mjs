import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from './app.mjs'
import { totpCode } from './totp.mjs'
import { weeklyChallenge } from './challenges.mjs'

const weeklyChallengeReward = weeklyChallenge.reward

function currentCode(secret) {
  return totpCode(secret, Math.floor(Date.now() / 1000 / 30))
}

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

describe('2FA, Mentions & Co-Authoring', () => {
  it('TOTP-Flow: setup → enable → Login erfordert Code', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    const setup = await request(app).post('/api/auth/2fa/setup').set('Authorization', auth)
    assert.ok(setup.body.secret)
    assert.match(setup.body.otpauth, /^otpauth:\/\/totp\//)

    // Falscher Code → kein Enable.
    assert.equal((await request(app).post('/api/auth/2fa/enable').set('Authorization', auth).send({ code: '000000' })).status, 400)
    // Richtiger Code → Enable.
    const enable = await request(app).post('/api/auth/2fa/enable').set('Authorization', auth).send({ code: currentCode(setup.body.secret) })
    assert.equal(enable.body.twoFactorEnabled, true)

    // Login ohne Code → 401 mit require2fa.
    const noCode = await request(app).post('/api/auth/login').send({ email: 'a@b.de', password: 'password123' })
    assert.equal(noCode.status, 401)
    assert.equal(noCode.body.require2fa, true)
    // Login mit Code → ok.
    const ok = await request(app).post('/api/auth/login').send({ email: 'a@b.de', password: 'password123', code: currentCode(setup.body.secret) })
    assert.equal(ok.status, 200)
    assert.equal(ok.body.user.twoFactorEnabled, true)
  })

  it('@mention erzeugt eine Benachrichtigung', async () => {
    const a = await register() // Tester
    const b = await registerSecond() // Leser
    await request(app).post('/api/articles/release-date-confirmed/comments')
      .set('Authorization', `Bearer ${b.body.token}`)
      .send({ text: 'Hey @Tester schau dir das an!' })
    const notifs = await request(app).get('/api/me/notifications').set('Authorization', `Bearer ${a.body.token}`)
    assert.equal(notifs.body.unread, 1)
    assert.match(notifs.body.notifications[0].text, /erwähnt/)

    await request(app).post('/api/me/notifications/read').set('Authorization', `Bearer ${a.body.token}`)
    const after = await request(app).get('/api/me/notifications').set('Authorization', `Bearer ${a.body.token}`)
    assert.equal(after.body.unread, 0)
  })

  it('Artikel speichert Co-Autoren', async () => {
    const { body } = await register()
    const res = await request(app).post('/api/articles').set('Authorization', `Bearer ${body.token}`)
      .send({ title: 'Teamarbeit', source: 'Q', coAuthors: ['Co-Autor A', 'Co-Autor B'] })
    assert.deepEqual(res.body.article.coAuthors, ['Co-Autor A', 'Co-Autor B'])
  })
})

describe('Account & DSGVO', () => {
  it('Profil aktualisieren (Name/E-Mail)', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    const res = await request(app).patch('/api/auth/me').set('Authorization', auth).send({ displayName: 'Neuer Name', email: 'neu@b.de' })
    assert.equal(res.body.user.displayName, 'Neuer Name')
    assert.equal(res.body.user.email, 'neu@b.de')
  })

  it('verhindert E-Mail-Kollision beim Update', async () => {
    await register() // a@b.de
    const second = await registerSecond() // leser@b.de
    const res = await request(app).patch('/api/auth/me').set('Authorization', `Bearer ${second.body.token}`).send({ email: 'a@b.de' })
    assert.equal(res.status, 409)
  })

  it('Passwort ändern erfordert korrektes aktuelles Passwort', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    assert.equal((await request(app).post('/api/auth/change-password').set('Authorization', auth).send({ currentPassword: 'falsch', newPassword: 'neuespasswort' })).status, 403)
    assert.equal((await request(app).post('/api/auth/change-password').set('Authorization', auth).send({ currentPassword: 'password123', newPassword: 'neuespasswort' })).status, 200)
  })

  it('exportiert die eigenen Daten (DSGVO)', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    await request(app).post('/api/articles/release-date-confirmed/comments').set('Authorization', auth).send({ text: 'Hallo' })
    const res = await request(app).get('/api/auth/export').set('Authorization', auth)
    assert.equal(res.body.user.email, 'a@b.de')
    assert.equal(res.body.comments.length, 1)
  })

  it('Konto löschen entfernt den Nutzer', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    assert.equal((await request(app).delete('/api/auth/me').set('Authorization', auth)).status, 200)
    assert.equal((await request(app).get('/api/auth/me').set('Authorization', auth)).status, 401)
  })

  it('Sync speichert und liest Nutzerdaten', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    await request(app).put('/api/me/sync').set('Authorization', auth).send({ data: { bookmarks: ['a', 'b'] } })
    const res = await request(app).get('/api/me/sync').set('Authorization', auth)
    assert.deepEqual(res.body.data.bookmarks, ['a', 'b'])
  })
})

describe('Follow, Feed & Tippspiel', () => {
  it('Folgen/Entfolgen aktualisiert die Zähler', async () => {
    const a = await register()
    const b = await registerSecond()
    const auth = `Bearer ${a.body.token}`
    await request(app).post(`/api/users/${b.body.user.id}/follow`).set('Authorization', auth)
    const status = await request(app).get(`/api/users/${b.body.user.id}/follow-status`).set('Authorization', auth)
    assert.equal(status.body.followers, 1)
    assert.equal(status.body.isFollowing, true)
    await request(app).delete(`/api/users/${b.body.user.id}/follow`).set('Authorization', auth)
    const after = await request(app).get(`/api/users/${b.body.user.id}/follow-status`).set('Authorization', auth)
    assert.equal(after.body.followers, 0)
  })

  it('Feed zeigt Kommentare gefolgter Nutzer', async () => {
    const a = await register()
    const b = await registerSecond()
    await request(app).post('/api/articles/release-date-confirmed/comments').set('Authorization', `Bearer ${b.body.token}`).send({ text: 'Von B' })
    await request(app).post(`/api/users/${b.body.user.id}/follow`).set('Authorization', `Bearer ${a.body.token}`)
    const feed = await request(app).get('/api/me/feed').set('Authorization', `Bearer ${a.body.token}`)
    assert.ok(feed.body.feed.some((c) => c.text === 'Von B'))
  })

  it('Tippspiel: abstimmen und Zähler abrufen', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    const vote = await request(app).post('/api/predictions/on-time').set('Authorization', auth).send({ choice: 'Ja, pünktlich' })
    assert.equal(vote.status, 200)
    const res = await request(app).get('/api/predictions').set('Authorization', auth)
    const q = res.body.questions.find((x) => x.id === 'on-time')
    assert.equal(q.counts['Ja, pünktlich'], 1)
    assert.equal(q.mine, 'Ja, pünktlich')
  })

  it('Tippspiel lehnt ungültige Auswahl ab', async () => {
    const { body } = await register()
    const res = await request(app).post('/api/predictions/on-time').set('Authorization', `Bearer ${body.token}`).send({ choice: 'Quatsch' })
    assert.equal(res.status, 400)
  })
})

describe('Editorial & Analytics', () => {
  async function createArticle(auth, over = {}) {
    const res = await request(app).post('/api/articles').set('Authorization', auth)
      .send({ title: 'Original', source: 'Q', category: 'official', body: 'b1', ...over })
    return res.body.article.id
  }

  it('legt bei Updates Revisionen an und kann zurückrollen', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    const id = await createArticle(auth)
    await request(app).put(`/api/articles/${id}`).set('Authorization', auth).send({ title: 'Geändert 1' })
    await request(app).put(`/api/articles/${id}`).set('Authorization', auth).send({ title: 'Geändert 2' })

    const revs = await request(app).get(`/api/articles/${id}/revisions`).set('Authorization', auth)
    assert.ok(revs.body.revisions.length >= 2)

    // Älteste Revision enthält den Originaltitel.
    const oldest = revs.body.revisions[revs.body.revisions.length - 1]
    const restore = await request(app).post(`/api/articles/${id}/revisions/${oldest.id}/restore`).set('Authorization', auth)
    assert.equal(restore.body.article.title, 'Original')
  })

  it('zählt Aufrufe und füllt das Dashboard', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    // Anonyme Detailaufrufe zählen.
    await request(app).get('/api/articles/release-date-confirmed')
    await request(app).get('/api/articles/release-date-confirmed')
    const dash = await request(app).get('/api/analytics/dashboard').set('Authorization', auth)
    assert.ok(dash.body.totals.totalViews >= 2)
    assert.ok(dash.body.topArticles.length > 0)
  })

  it('Redaktions-Preview (Admin) zählt keine Aufrufe', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    const before = (await request(app).get('/api/analytics/dashboard').set('Authorization', auth)).body.totals.totalViews
    await request(app).get('/api/articles/release-date-confirmed').set('Authorization', auth) // Admin
    const after = (await request(app).get('/api/analytics/dashboard').set('Authorization', auth)).body.totals.totalViews
    assert.equal(after, before)
  })

  it('Workflow: review → publish macht den Artikel öffentlich', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    const id = await createArticle(auth, { status: 'review' })
    const reviewList = await request(app).get('/api/moderation/review').set('Authorization', auth)
    assert.ok(reviewList.body.review.some((a) => a.id === id))

    await request(app).post(`/api/articles/${id}/publish`).set('Authorization', auth)
    const pub = await request(app).get('/api/articles')
    assert.ok(pub.body.articles.some((a) => a.id === id))
  })

  it('Such-Analytics protokolliert Begriffe inkl. Null-Treffer', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    await request(app).post('/api/analytics/search').send({ term: 'lucia', results: 3 })
    await request(app).post('/api/analytics/search').send({ term: 'zzznope', results: 0 })
    const dash = await request(app).get('/api/analytics/dashboard').set('Authorization', auth)
    assert.ok(dash.body.topSearches.some((s) => s.term === 'lucia'))
    assert.ok(dash.body.zeroResults.includes('zzznope'))
  })

  it('CSV-Export liefert eine Report-Datei', async () => {
    const { body } = await register()
    const res = await request(app).get('/api/analytics/export.csv').set('Authorization', `Bearer ${body.token}`)
    assert.equal(res.status, 200)
    assert.match(res.headers['content-type'], /csv/)
    assert.match(res.text, /id,title,category,date,status,views/)
  })
})

describe('A/B, Challenges, Cohorts & Trends', () => {
  it('weist Experiment-Varianten deterministisch zu', async () => {
    const r1 = await request(app).get('/api/experiments?clientId=abc')
    const r2 = await request(app).get('/api/experiments?clientId=abc')
    assert.ok(r1.body.assignments['home-hero-cta'])
    assert.equal(r1.body.assignments['home-hero-cta'], r2.body.assignments['home-hero-cta'])
  })

  it('trackt A/B-Events und aggregiert Conversion-Raten', async () => {
    const variant = (await request(app).get('/api/experiments?clientId=c1')).body.assignments['home-hero-cta']
    await request(app).post('/api/ab/track').send({ experiment: 'home-hero-cta', variant, type: 'view', clientId: 'c1' })
    await request(app).post('/api/ab/track').send({ experiment: 'home-hero-cta', variant, type: 'convert', clientId: 'c1' })
    const { body } = await register()
    const ab = await request(app).get('/api/analytics/ab').set('Authorization', `Bearer ${body.token}`)
    const exp = ab.body.experiments.find((e) => e.id === 'home-hero-cta')
    const v = exp.variants.find((x) => x.variant === variant)
    assert.equal(v.views, 1)
    assert.equal(v.conversions, 1)
    assert.equal(v.rate, 100)
  })

  it('lehnt ungültige A/B-Events ab', async () => {
    assert.equal((await request(app).post('/api/ab/track').send({ experiment: 'home-hero-cta', variant: 'X', type: 'view' })).status, 400)
  })

  it('Challenge: Fortschritt zählt und Belohnung gibt es einmalig', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    for (let i = 0; i < 3; i++) {
      await request(app).post('/api/articles/release-date-confirmed/comments').set('Authorization', auth).send({ text: `Kommentar ${i}` })
    }
    const ch = await request(app).get('/api/challenges').set('Authorization', auth)
    assert.equal(ch.body.completed, true)
    assert.equal(ch.body.progress, 3)

    const claim = await request(app).post('/api/challenges/week-comments/claim').set('Authorization', auth)
    assert.equal(claim.body.reward, weeklyChallengeReward)
    // Zweimal abholen → 409
    assert.equal((await request(app).post('/api/challenges/week-comments/claim').set('Authorization', auth)).status, 409)
  })

  it('Kohorten-Analyse gruppiert Nutzer nach Woche', async () => {
    const { body } = await register()
    const res = await request(app).get('/api/analytics/cohorts').set('Authorization', `Bearer ${body.token}`)
    assert.ok(res.body.cohorts.length >= 1)
    assert.ok(res.body.cohorts[0].total >= 1)
  })

  it('Trend-Erkennung liefert Such- und Tag-Trends', async () => {
    const { body } = await register()
    const auth = `Bearer ${body.token}`
    await request(app).post('/api/analytics/search').send({ term: 'vice city', results: 2 })
    const res = await request(app).get('/api/analytics/trends').set('Authorization', auth)
    assert.ok(res.body.searchTrends.some((s) => s.term === 'vice city'))
    assert.ok(Array.isArray(res.body.tagTrends))
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

describe('KI & Automatisierung', () => {
  it('liefert AI-Status (heuristisch ohne Key)', async () => {
    const res = await request(app).get('/api/ai/status')
    assert.equal(res.status, 200)
    assert.ok(['heuristic', 'anthropic'].includes(res.body.provider))
  })

  it('fasst Text zusammen', async () => {
    const text =
      'Rockstar hat GTA 6 angekündigt. Das Spiel erscheint 2026. Der Trailer zeigt Vice City. Fans sind begeistert.'
    const res = await request(app).post('/api/ai/summarize').send({ text, sentences: 2 })
    assert.equal(res.status, 200)
    assert.ok(res.body.summary.length > 0)
    assert.equal(res.body.provider, 'heuristic')
  })

  it('lehnt zu kurzen Text ab', async () => {
    assert.equal((await request(app).post('/api/ai/summarize').send({ text: 'kurz' })).status, 400)
  })

  it('liefert Tags, Sentiment und Moderation', async () => {
    const tags = await request(app).post('/api/ai/tags').send({ text: 'Vice City Trailer Rockstar Rockstar' })
    assert.ok(tags.body.tags.length >= 1)
    const senti = await request(app).post('/api/ai/sentiment').send({ text: 'Das ist mega genial' })
    assert.equal(senti.body.label, 'positiv')
    const mod = await request(app).post('/api/ai/moderate').send({ text: 'Du Idiot' })
    assert.equal(mod.body.flagged, true)
  })

  it('beantwortet Fragen via RAG mit Quellen', async () => {
    const res = await request(app).post('/api/ai/ask').send({ question: 'Wann erscheint GTA 6?' })
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body.sources))
    assert.ok(res.body.sources.length >= 1)
  })

  it('liefert Briefing, Lesbarkeit und Quellenbewertung', async () => {
    const brief = await request(app).get('/api/ai/briefing')
    assert.ok(brief.body.items.length >= 1)
    const read = await request(app).post('/api/ai/readability').send({ text: 'Ein kurzer Satz. Noch einer hier.' })
    assert.ok(read.body.score >= 0 && read.body.score <= 100)
    const cred = await request(app).post('/api/ai/source-credibility').send({ source: 'rockstargames.com' })
    assert.equal(cred.body.label, 'verlässlich')
  })

  it('macht semantische Suche', async () => {
    const res = await request(app).get('/api/ai/semantic-search').query({ q: 'Release Termin' })
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body.results))
  })
})

describe('Suche & Discovery', () => {
  it('Volltextsuche liefert Treffer, Facetten und Snippets', async () => {
    const res = await request(app).get('/api/search').query({ q: 'trailer' })
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body.results))
    assert.ok(res.body.facets.categories.length >= 1)
    if (res.body.results.length) assert.ok('snippet' in res.body.results[0])
  })

  it('Synonyme und Operatoren funktionieren', async () => {
    const syn = await request(app).get('/api/search').query({ q: 'karte' })
    assert.equal(syn.status, 200)
    const excl = await request(app).get('/api/search').query({ q: 'gta -xyzqurk' })
    assert.equal(excl.status, 200)
  })

  it('filtert nach Verlässlichkeit', async () => {
    const res = await request(app).get('/api/search').query({ reliability: 'confirmed' })
    assert.equal(res.status, 200)
    assert.ok(res.body.results.every((r) => r.reliability === 'confirmed'))
  })

  it('durchsucht Kommentare', async () => {
    const res = await request(app).get('/api/search/comments').query({ q: 'gta' })
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body.results))
  })

  it('liefert ähnliche Artikel', async () => {
    const list = await request(app).get('/api/articles')
    const id = list.body.articles[0]?.id
    const res = await request(app).get(`/api/articles/${id}/similar`)
    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body.similar))
  })
})
