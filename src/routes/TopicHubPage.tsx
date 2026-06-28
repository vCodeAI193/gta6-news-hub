import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { ArticleCard } from '../components/ArticleCard'
import { SkeletonGrid } from '../components/Skeleton'
import { fetchArticles } from '../services/articlesRepo'
import { relatedTags, topicArticles } from '../lib/discovery'
import type { Article } from '../types'

/**
 * Themen-Hub (FEATURES-3 #19): aggregierte Landingpage je Tag mit verwandten
 * Tags (#20).
 */
export function TopicHubPage() {
  const { tag = '' } = useParams()
  const decoded = decodeURIComponent(tag)
  const [articles, setArticles] = useState<Article[] | null>(null)

  useEffect(() => {
    fetchArticles().then(setArticles)
  }, [])

  const topic = useMemo(() => (articles ? topicArticles(decoded, articles) : []), [articles, decoded])
  const related = useMemo(() => (articles ? relatedTags(articles, decoded) : []), [articles, decoded])

  if (!articles) return <SkeletonGrid count={3} />

  return (
    <>
      <Seo title={`Thema: ${decoded}`} description={`Alle GTA-6-News zum Thema ${decoded}.`} path={`/thema/${tag}`} />
      <Breadcrumbs items={[{ label: 'Start', to: '/' }, { label: 'Entdecken', to: '/entdecken' }, { label: decoded }]} />

      <header className="page-head">
        <h1 className="page-head__title"># {decoded}</h1>
        <p className="page-head__desc">
          {topic.length} {topic.length === 1 ? 'Beitrag' : 'Beiträge'} zu diesem Thema.
        </p>
      </header>

      {related.length > 0 && (
        <section className="tagcloud" aria-label="Verwandte Themen">
          <span className="tagcloud__label">Verwandt:</span>
          {related.map((t) => (
            <Link key={t.tag} to={`/thema/${encodeURIComponent(t.tag)}`} className="tagcloud__tag">
              {t.tag} <span className="chip__count">{t.count}</span>
            </Link>
          ))}
        </section>
      )}

      {topic.length ? (
        <section className="grid">
          {topic.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </section>
      ) : (
        <p className="empty">
          Noch keine Beiträge zu „{decoded}". <Link to="/entdecken">Zurück zum Entdecken</Link>
        </p>
      )}
    </>
  )
}
