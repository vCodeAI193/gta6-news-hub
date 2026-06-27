import { useEffect } from 'react'
import { categoryMap } from '../data/categories'
import { formatDate } from '../lib/filterArticles'
import type { Article } from '../types'

interface ArticleModalProps {
  article: Article
  onClose: () => void
}

export function ArticleModal({ article, onClose }: ArticleModalProps) {
  const category = categoryMap[article.category]

  // Close on Escape and lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <article
        className="modal"
        style={{ position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal__close"
          onClick={onClose}
          aria-label="Schließen"
        >
          ×
        </button>
        <div className="modal__media">
          <img src={article.image} alt="" width={800} height={450} />
        </div>
        <div className="modal__body">
          <span className={`card__tag tag--${article.category}`}>
            {category?.label}
          </span>
          <h2 className="modal__title" id="modal-title">
            {article.title}
          </h2>
          <div className="modal__meta">
            <span>
              Quelle: <strong>{article.source}</strong>
            </span>
            <span>
              Datum:{' '}
              <strong>
                <time dateTime={article.date}>{formatDate(article.date)}</time>
              </strong>
            </span>
          </div>
          <div className="modal__text">
            {article.body.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          {article.sourceUrl && (
            <a
              className="modal__source-link"
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Zur Originalquelle →
            </a>
          )}
        </div>
      </article>
    </div>
  )
}
