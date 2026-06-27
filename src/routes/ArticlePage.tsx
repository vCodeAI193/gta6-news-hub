import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Seo } from '../components/Seo'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { TagList } from '../components/TagList'
import { ReliabilityBadge } from '../components/ReliabilityBadge'
import { ShareButtons } from '../components/ShareButtons'
import { BookmarkButton } from '../components/BookmarkButton'
import { ReactionBar } from '../components/ReactionBar'
import { LeakVote } from '../components/LeakVote'
import { ReportButton } from '../components/ReportButton'
import { Comments } from '../components/Comments'
import { Gallery, Lightbox } from '../components/Lightbox'
import { VideoEmbed } from '../components/VideoEmbed'
import { RelatedArticles } from '../components/RelatedArticles'
import { SkeletonGrid } from '../components/Skeleton'
import { categoryMap } from '../data/categories'
import { useArticles } from '../hooks/useArticles'
import { useI18n } from '../i18n/I18nContext'
import { formatDate } from '../lib/filterArticles'
import { readingTimeLabel } from '../lib/readingTime'
import { getById, getRelated } from '../services/articlesService'
import { isReadLater, markRead, toggleReadLater } from '../services/userDataService'
import type { Article } from '../types'
import { NotFoundPage } from './NotFoundPage'

export function ArticlePage() {
  const { id = '' } = useParams()
  const { t } = useI18n()
  const { articles } = useArticles()
  const [article, setArticle] = useState<Article | null | undefined>(undefined)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [readLater, setReadLater] = useState(false)

  useEffect(() => {
    let active = true
    setArticle(undefined)
    getById(id).then((found) => {
      if (!active) return
      setArticle(found ?? null)
      if (found) {
        markRead(found.id)
        setReadLater(isReadLater(found.id))
      }
    })
    return () => {
      active = false
    }
  }, [id])

  const related = useMemo(
    () => (article ? getRelated(article, articles) : []),
    [article, articles],
  )

  if (article === undefined) return <SkeletonGrid count={3} />
  if (article === null) return <NotFoundPage />

  const category = categoryMap[article.category]
  const sources = article.sources ?? [{ name: article.source, url: article.sourceUrl }]

  return (
    <article className="article">
      <Seo
        title={article.title}
        description={article.excerpt}
        path={`/news/${article.id}`}
        image={article.image}
        article={article}
      />

      <Breadcrumbs
        items={[
          { label: 'Start', to: '/' },
          { label: category?.label ?? 'News', to: `/kategorie/${category?.slug}` },
          { label: article.title },
        ]}
      />

      <header className="article__header">
        <div className="article__badges">
          <span className={`card__tag tag--${article.category}`}>{category?.label}</span>
          <ReliabilityBadge reliability={article.reliability} />
        </div>
        <h1 className="article__title">{article.title}</h1>
        <div className="article__meta">
          {article.author && <span>Von <strong>{article.author}</strong></span>}
          <time dateTime={article.date}>{formatDate(article.date)}</time>
          {article.updatedDate && (
            <span>
              {t('article.updated')}: {formatDate(article.updatedDate)}
            </span>
          )}
          <span>{readingTimeLabel(article.body)}</span>
        </div>
      </header>

      <img className="article__cover" src={article.image} alt="" width={800} height={450} />

      <div className="article__toolbar">
        <BookmarkButton articleId={article.id} />
        <button
          type="button"
          className={`btn btn--small${readLater ? ' btn--active' : ' btn--ghost'}`}
          onClick={() => setReadLater(toggleReadLater(article.id))}
        >
          {readLater ? '✓ ' : '🕮 '}
          {t('common.readLater')}
        </button>
        <ReportButton articleId={article.id} />
      </div>

      {article.videoUrl && <VideoEmbed url={article.videoUrl} title={article.title} />}

      <div className="article__body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.body}</ReactMarkdown>
      </div>

      {article.gallery && article.gallery.length > 0 && (
        <Gallery images={article.gallery} onSelect={setLightbox} />
      )}

      <TagList tags={article.tags} linked />

      <section className="article__sources">
        <h3>{t('article.sources')}</h3>
        <ul>
          {sources.map((s, i) => (
            <li key={i}>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.name} →
                </a>
              ) : (
                s.name
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="article__engagement">
        <ReactionBar articleId={article.id} />
        <ShareButtons title={article.title} path={`/news/${article.id}`} />
      </div>

      {article.category === 'leak' && <LeakVote articleId={article.id} />}

      <RelatedArticles articles={related} />

      <Comments articleId={article.id} live={article.category === 'trailer'} />

      <p className="article__back">
        <Link to="/">← {t('article.back')}</Link>
      </p>

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </article>
  )
}
