import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { ArticleGrid } from '../components/ArticleGrid'
import { useArticles } from '../hooks/useArticles'
import { getFavorites, getReadLater } from '../services/userDataService'

type Tab = 'favorites' | 'readlater'

export function BookmarksPage() {
  const { articles } = useArticles()
  const [tab, setTab] = useState<Tab>('favorites')

  const ids = useMemo(
    () => (tab === 'favorites' ? getFavorites() : getReadLater()),
    [tab],
  )
  const list = articles.filter((a) => ids.has(a.id))

  return (
    <>
      <Seo title="Lesezeichen" path="/bookmarks" />
      <header className="page-head">
        <h1 className="page-head__title">Deine Lesezeichen</h1>
        <p className="page-head__desc">Gemerkte Artikel und deine „Später lesen"-Liste.</p>
      </header>

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'favorites'}
          className={`tab${tab === 'favorites' ? ' tab--active' : ''}`}
          onClick={() => setTab('favorites')}
        >
          ★ Favoriten
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'readlater'}
          className={`tab${tab === 'readlater' ? ' tab--active' : ''}`}
          onClick={() => setTab('readlater')}
        >
          🕮 Später lesen
        </button>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <p className="empty__title">Noch nichts gespeichert</p>
          <p>
            Öffne einen Artikel und tippe auf <strong>Merken</strong>, um ihn hier zu sammeln.
          </p>
          <Link to="/" className="btn">
            News entdecken
          </Link>
        </div>
      ) : (
        <ArticleGrid articles={list} />
      )}
    </>
  )
}
