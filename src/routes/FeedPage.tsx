import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { useAuth } from '../context/AuthContext'
import { isApiEnabled } from '../services/api'
import { socialApi, type FeedItem } from '../services/socialApi'
import { timeAgo } from '../lib/filterArticles'

export function FeedPage() {
  const { user, loading } = useAuth()
  const [feed, setFeed] = useState<FeedItem[] | null>(null)

  useEffect(() => {
    if (user) socialApi.feed().then(setFeed, () => setFeed([]))
  }, [user])

  if (loading) return null
  if (!isApiEnabled() || !user) return <Navigate to="/login" replace />

  return (
    <>
      <Seo title="Mein Feed" path="/feed" />
      <header className="page-head">
        <h1 className="page-head__title">📰 Mein Feed</h1>
        <p className="page-head__desc">Neueste Beiträge von Mitgliedern, denen du folgst.</p>
      </header>

      {feed === null ? (
        <p className="comments__empty">Lade…</p>
      ) : feed.length === 0 ? (
        <div className="empty">
          <p className="empty__title">Dein Feed ist leer</p>
          <p>Folge anderen Mitgliedern (über deren Profil), um ihre Beiträge hier zu sehen.</p>
          <Link to="/rangliste" className="btn">Mitglieder entdecken</Link>
        </div>
      ) : (
        <ul className="comment-list">
          {feed.map((c) => (
            <li key={c.id} className="comment">
              <div className="comment__head">
                <Link className="comment__author" to={`/u/${c.authorId}`}>{c.author}</Link>
                <time className="comment__time" dateTime={c.createdAt}>{timeAgo(c.createdAt)}</time>
              </div>
              <p className="comment__text">{c.text}</p>
              <Link className="related__date" to={`/news/${c.articleId}`}>zum Artikel →</Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
