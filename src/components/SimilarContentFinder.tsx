import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/I18nContext'

interface SimilarArticle {
  id: string
  title: string
  excerpt: string
  date: string
  category: string
  reliability: string
  similarityScore: number
}

interface SimilarContentFinderProps {
  articleId: string
  limit?: number
  onArticleSelect?: (article: SimilarArticle) => void
}

/**
 * Similarity score badge with visual indicator
 */
function SimilarityBadge({ score }: { score: number }) {
  const getColor = (score: number) => {
    if (score >= 70) return 'var(--color-success)'
    if (score >= 50) return 'var(--color-warning)'
    return 'var(--color-info)'
  }

  return (
    <span
      className="similarity-badge"
      style={{ backgroundColor: getColor(score) }}
      title={`${score}% similar`}
    >
      {score}%
    </span>
  )
}

/**
 * Component for finding and displaying similar articles
 */
export function SimilarContentFinder({ articleId, limit = 5, onArticleSelect }: SimilarContentFinderProps) {
  const { t } = useI18n()
  const [similar, setSimilar] = useState<SimilarArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!articleId) return

    const fetchSimilar = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(
          `/api/search/similar?articleId=${encodeURIComponent(articleId)}&limit=${limit}`,
          { headers: { 'Content-Type': 'application/json' } },
        )

        if (!response.ok) {
          if (response.status === 404) {
            setSimilar([])
            return
          }
          throw new Error(`Failed to fetch similar articles: ${response.statusText}`)
        }

        const data = await response.json()
        setSimilar(data.similar || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load similar content')
        console.error('Similar content fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSimilar()
  }, [articleId, limit])

  if (loading) {
    return (
      <div className="similar-content-finder" role="status">
        <div className="similar-content-finder__loading">{t('common.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="similar-content-finder" role="alert">
        <div className="similar-content-finder__error">{error}</div>
      </div>
    )
  }

  if (similar.length === 0) {
    return (
      <div className="similar-content-finder">
        <div className="similar-content-finder__empty">
          {t('search.noSimilarContent') || 'No similar articles found'}
        </div>
      </div>
    )
  }

  return (
    <div className="similar-content-finder">
      <h3 className="similar-content-finder__title">
        {t('search.similarContent') || 'Related Articles'}
      </h3>

      <ul className="similar-content-finder__list">
        {similar.map((article) => (
          <li key={article.id} className="similar-article">
            <button
              type="button"
              className="similar-article__button"
              onClick={() => onArticleSelect?.(article)}
              title={`${article.similarityScore}% similar`}
            >
              <div className="similar-article__header">
                <h4 className="similar-article__title">{article.title}</h4>
                <SimilarityBadge score={article.similarityScore} />
              </div>

              <p className="similar-article__excerpt">{article.excerpt}</p>

              <div className="similar-article__meta">
                <span className="similar-article__category">{article.category}</span>
                <span className="similar-article__date">
                  {new Date(article.date).toLocaleDateString()}
                </span>
                {article.reliability && (
                  <span className={`similar-article__reliability similar-article__reliability--${article.reliability}`}>
                    {article.reliability}
                  </span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Component for displaying clustering/grouping of similar articles
 */
export function SimilarArticleCluster({ articles, onArticleSelect }: { articles: SimilarArticle[]; onArticleSelect?: (article: SimilarArticle) => void }) {
  const { t } = useI18n()

  if (articles.length === 0) return null

  const avgSimilarity = Math.round(articles.reduce((sum, a) => sum + a.similarityScore, 0) / articles.length)

  return (
    <div className="article-cluster">
      <div className="article-cluster__header">
        <h3 className="article-cluster__title">
          {t('search.relatedStory') || 'Related Story'} ({articles.length} {t('search.variations') || 'variations'})
        </h3>
        <div className="article-cluster__similarity">{t('search.avgSimilarity') || 'Avg Similarity'}: {avgSimilarity}%</div>
      </div>

      <div className="article-cluster__items">
        {articles.map((article) => (
          <button
            key={article.id}
            type="button"
            className="article-cluster__item"
            onClick={() => onArticleSelect?.(article)}
          >
            <div className="article-cluster__item-header">
              <h4 className="article-cluster__item-title">{article.title}</h4>
              <SimilarityBadge score={article.similarityScore} />
            </div>
            <p className="article-cluster__item-excerpt">{article.excerpt}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
