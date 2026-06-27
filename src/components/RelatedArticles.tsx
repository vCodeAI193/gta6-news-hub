import { Link } from 'react-router-dom'
import { formatDate } from '../lib/filterArticles'
import { useI18n } from '../i18n/I18nContext'
import type { Article } from '../types'

export function RelatedArticles({ articles }: { articles: Article[] }) {
  const { t } = useI18n()
  if (articles.length === 0) return null
  return (
    <aside className="related" aria-label={t('article.related')}>
      <h3 className="related__title">{t('article.related')}</h3>
      <ul className="related__list">
        {articles.map((a) => (
          <li key={a.id}>
            <Link to={`/news/${a.id}`} className="related__item">
              <img src={a.image} alt="" loading="lazy" className="related__thumb" />
              <span>
                <span className="related__headline">{a.title}</span>
                <time className="related__date" dateTime={a.date}>
                  {formatDate(a.date)}
                </time>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
