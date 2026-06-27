import { Link } from 'react-router-dom'
import { categoryMap } from '../data/categories'
import { formatDate } from '../lib/filterArticles'
import { highlight } from '../lib/highlight'
import { readingTimeLabel } from '../lib/readingTime'
import { getById } from '../services/articlesService'
import { isRead } from '../services/userDataService'
import type { Article } from '../types'
import { BookmarkButton } from './BookmarkButton'
import { ReliabilityBadge } from './ReliabilityBadge'

interface ArticleCardProps {
  article: Article
  /** Suchbegriff zur Treffer-Hervorhebung. */
  query?: string
}

export function ArticleCard({ article, query = '' }: ArticleCardProps) {
  const category = categoryMap[article.category]
  const read = isRead(article.id)

  // Prefetch der Artikeldaten beim Hover (füllt den Service-Cache vor).
  const prefetch = () => void getById(article.id)

  return (
    <article className={`card${article.featured ? ' card--featured' : ''}${read ? ' card--read' : ''}`}>
      <Link to={`/news/${article.id}`} className="card__link" onMouseEnter={prefetch} onFocus={prefetch}>
        <div className="card__media">
          <picture>
            <source srcSet={article.image} type="image/jpeg" />
            <img src={article.image} alt="" loading="lazy" width={800} height={450} />
          </picture>
          <span className={`card__tag tag--${article.category}`}>{category?.label}</span>
        </div>
        <div className="card__body">
          <div className="card__badges">
            <ReliabilityBadge reliability={article.reliability} />
            {read && <span className="badge badge--muted">Gelesen</span>}
          </div>
          <h3 className="card__title">{highlight(article.title, query)}</h3>
          <p className="card__excerpt">{highlight(article.excerpt, query)}</p>
          <div className="card__footer">
            <span className="card__source">{article.source}</span>
            <span className="card__meta-dot" aria-hidden="true">·</span>
            <span>{readingTimeLabel(article.body)}</span>
            <time className="card__date" dateTime={article.date}>
              {formatDate(article.date)}
            </time>
          </div>
        </div>
      </Link>
      <div className="card__overlay-actions">
        <BookmarkButton articleId={article.id} compact />
      </div>
    </article>
  )
}
