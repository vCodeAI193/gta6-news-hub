import { categoryMap } from '../data/categories'
import { formatDate } from '../lib/filterArticles'
import type { Article } from '../types'

interface ArticleCardProps {
  article: Article
  onOpen: (article: Article) => void
}

export function ArticleCard({ article, onOpen }: ArticleCardProps) {
  const category = categoryMap[article.category]

  return (
    <button
      type="button"
      className={`card${article.featured ? ' card--featured' : ''}`}
      onClick={() => onOpen(article)}
      aria-label={`Artikel öffnen: ${article.title}`}
    >
      <div className="card__media">
        <img
          src={article.image}
          alt=""
          loading="lazy"
          width={800}
          height={450}
        />
        <span className={`card__tag tag--${article.category}`}>
          {category?.label}
        </span>
      </div>
      <div className="card__body">
        <h3 className="card__title">{article.title}</h3>
        <p className="card__excerpt">{article.excerpt}</p>
        <div className="card__footer">
          <span className="card__source">{article.source}</span>
          <time dateTime={article.date}>{formatDate(article.date)}</time>
        </div>
      </div>
    </button>
  )
}
