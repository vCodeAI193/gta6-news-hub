import { describe, expect, it, beforeEach } from 'vitest'
import { isPublished, getAllRaw, upsertArticle, deleteArticle, resetUserArticles } from './articlesService'
import { toggleFavorite, isFavorite } from './userDataService'
import { addComment, getComments, commentLeaderboard } from './commentsService'
import { castVote, getVotes } from './votesService'
import { subscribeNewsletter, pushSearchHistory, getSearchHistory } from './miscServices'
import type { Article } from '../types'

beforeEach(() => {
  localStorage.clear()
  resetUserArticles()
})

const draft: Article = {
  id: 'd1', title: 'T', excerpt: 'e', body: 'b', category: 'official',
  date: '2026-01-01', source: 's', image: 'i', status: 'draft',
}

describe('articlesService', () => {
  it('Entwürfe gelten nicht als veröffentlicht', () => {
    expect(isPublished(draft)).toBe(false)
  })

  it('geplante Artikel sind erst ab Datum sichtbar', () => {
    const scheduled: Article = { ...draft, status: 'published', publishAt: '2030-01-01' }
    expect(isPublished(scheduled, new Date('2026-01-01'))).toBe(false)
    expect(isPublished(scheduled, new Date('2031-01-01'))).toBe(true)
  })

  it('upsert + delete im User-Store', () => {
    const a = upsertArticle({ title: 'Neu', excerpt: 'x', body: 'y', category: 'leak', date: '2026-06-01', source: 'q', image: 'i' })
    expect(getAllRaw().some((x) => x.id === a.id)).toBe(true)
    deleteArticle(a.id)
    expect(getAllRaw().some((x) => x.id === a.id)).toBe(false)
  })
})

describe('userDataService', () => {
  it('Favorit umschalten', () => {
    expect(isFavorite('a')).toBe(false)
    expect(toggleFavorite('a')).toBe(true)
    expect(isFavorite('a')).toBe(true)
    expect(toggleFavorite('a')).toBe(false)
  })
})

describe('commentsService', () => {
  it('Kommentar + Antwort + Leaderboard', () => {
    const root = addComment('art', 'Alice', 'Hallo')
    addComment('art', 'Bob', 'Antwort', root.id)
    expect(getComments('art')).toHaveLength(2)
    const board = commentLeaderboard()
    expect(board[0].count).toBeGreaterThanOrEqual(1)
  })
})

describe('votesService', () => {
  it('Stimme zählt und toggelt', () => {
    castVote('art', 'credible')
    expect(getVotes('art').credible).toBe(1)
    castVote('art', 'credible') // zurücknehmen
    expect(getVotes('art').credible).toBe(0)
  })
})

describe('miscServices', () => {
  it('lehnt ungültige E-Mails ab', () => {
    expect(subscribeNewsletter('keine-mail')).toBe(false)
    expect(subscribeNewsletter('a@b.de')).toBe(true)
  })

  it('Suchhistorie ohne Duplikate, neueste zuerst', () => {
    pushSearchHistory('vice')
    pushSearchHistory('city')
    pushSearchHistory('vice')
    expect(getSearchHistory()).toEqual(['vice', 'city'])
  })
})
