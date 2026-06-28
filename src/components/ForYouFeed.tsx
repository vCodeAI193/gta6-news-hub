import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePreferences } from '../context/PreferencesContext'
import { useArticles } from '../hooks/useArticles'
import { getHistory } from '../services/readingHistoryService'
import { getHiddenSources, getHiddenTags } from '../services/hiddenTopicsService'
import {
  explainRecommendation,
  moodFilter,
  recommendFeed,
  timeSaveMode,
} from '../lib/recommendation'

type Mood = 'alle' | 'positiv' | 'fakten'

export function ForYouFeed() {
  const { prefs } = usePreferences()
  const { articles } = useArticles()
  const [mood, setMood] = useState<Mood>('alle')
  const [timeSave, setTimeSave] = useState(false)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const history = useMemo(() => getHistory(), [])
  const hiddenTags = useMemo(() => getHiddenTags(), [])
  const hiddenSources = useMemo(() => getHiddenSources(), [])

  const feed = useMemo(() => {
    let results = recommendFeed(
      articles,
      prefs.interests,
      history,
      hiddenTags,
      hiddenSources,
    )
    results = moodFilter(results, mood)
    if (timeSave) results = timeSaveMode(results)
    return results
  }, [articles, prefs.interests, history, hiddenTags, hiddenSources, mood, timeSave])

  const visible = feed.slice(0, page * PAGE_SIZE)
  const hasMore = visible.length < feed.length

  const moods: Array<{ id: Mood; label: string }> = [
    { id: 'alle', label: 'Alle' },
    { id: 'positiv', label: '✅ Bestätigt' },
    { id: 'fakten', label: '🔍 Nur Fakten' },
  ]

  return (
    <section className="for-you-feed">
      <div className="for-you-feed__filters">
        <div className="tabs">
          {moods.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`tab${mood === m.id ? ' tab--active' : ''}`}
              onClick={() => { setMood(m.id); setPage(1) }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`btn btn--small${timeSave ? '' : ' btn--ghost'}`}
          onClick={() => { setTimeSave((v) => !v); setPage(1) }}
          title="Nur Artikel mit ≤ 2 Min Lesezeit"
        >
          ⚡ Zeit sparen
        </button>
      </div>

      {feed.length === 0 ? (
        <p className="for-you-feed__empty">
          Keine Artikel für dein Profil gefunden. Passe deine Interessen an!
        </p>
      ) : (
        <ul className="for-you-feed__list">
          {visible.map((article) => {
            const explanation = explainRecommendation(article, prefs.interests, history)
            return (
              <li key={article.id} className="for-you-feed__item">
                <Link to={`/news/${article.id}`} className="for-you-feed__link">
                  {article.image && (
                    <img
                      className="for-you-feed__thumb"
                      src={article.image}
                      alt=""
                      width={120}
                      height={68}
                    />
                  )}
                  <div className="for-you-feed__body">
                    <span className="for-you-feed__why">{explanation}</span>
                    <strong className="for-you-feed__title">{article.title}</strong>
                    <p className="for-you-feed__excerpt">{article.excerpt}</p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {hasMore && (
        <button
          type="button"
          className="feed__more"
          onClick={() => setPage((p) => p + 1)}
        >
          Mehr laden
        </button>
      )}
    </section>
  )
}
