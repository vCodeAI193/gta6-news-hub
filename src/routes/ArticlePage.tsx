import { useEffect, useMemo, useRef, useState } from 'react'
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
import { ArticleSummary } from '../components/ArticleSummary'
import { TextToSpeech } from '../components/TextToSpeech'
import { generateCover } from '../lib/coverImage'
import { SkeletonGrid } from '../components/Skeleton'
import { categoryMap } from '../data/categories'
import { useArticles } from '../hooks/useArticles'
import { useRealtime } from '../context/RealtimeContext'
import { useI18n } from '../i18n/I18nContext'
import { formatDate } from '../lib/filterArticles'
import { readingTimeLabel } from '../lib/readingTime'
import { getRelated } from '../services/articlesService'
import { fetchArticle } from '../services/articlesRepo'
import { isReadLater, markRead, toggleReadLater } from '../services/userDataService'
import type { Article } from '../types'
import { NotFoundPage } from './NotFoundPage'
import { savePosition, getLastPosition, recordRead } from '../services/readingHistoryService'
import { usePreferences } from '../context/PreferencesContext'
import { getHiddenSources, getHiddenTags } from '../services/hiddenTopicsService'
import { getHistory } from '../services/readingHistoryService'
import { recommendFeed, explainRecommendation } from '../lib/recommendation'

export function ArticlePage() {
  const { id = '' } = useParams()
  const { t } = useI18n()
  const { articles } = useArticles()
  const { setViewing, subscribe } = useRealtime()
  const [article, setArticle] = useState<Article | null | undefined>(undefined)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [readLater, setReadLater] = useState(false)
  const [presence, setPresence] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const articleRef = useRef<HTMLElement>(null)
  const { prefs } = usePreferences()

  // Präsenz: diesen Artikel als „betrachtet" melden und Zähler empfangen.
  useEffect(() => {
    if (!id) return
    setViewing(id)
    const unsub = subscribe('presence', (msg) => {
      if (msg.articleId === id) setPresence(Number(msg.count) || 0)
    })
    return () => {
      setViewing(null)
      unsub()
    }
  }, [id, setViewing, subscribe])

  useEffect(() => {
    let active = true
    setArticle(undefined)
    fetchArticle(id).then((found) => {
      if (!active) return
      setArticle(found ?? null)
      if (found) {
        markRead(found.id)
        recordRead(found.id)
        setReadLater(isReadLater(found.id))
        // Restore last scroll position
        const lastPos = getLastPosition(found.id)
        if (lastPos > 10) {
          setTimeout(() => {
            const el = articleRef.current
            if (el) {
              const scrollY = (lastPos / 100) * (document.documentElement.scrollHeight - window.innerHeight)
              window.scrollTo({ top: scrollY, behavior: 'smooth' })
            }
          }, 300)
        }
      }
    })
    return () => {
      active = false
    }
  }, [id])

  // Track scroll progress and save position on scroll/unmount
  useEffect(() => {
    if (!article) return
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      if (total <= 0) return
      const pct = Math.round((window.scrollY / total) * 100)
      setScrollProgress(pct)
      savePosition(article.id, pct)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      // Save final position on unmount
      if (article) {
        const total = document.documentElement.scrollHeight - window.innerHeight
        if (total > 0) {
          savePosition(article.id, Math.round((window.scrollY / total) * 100))
        }
      }
    }
  }, [article])

  const related = useMemo(
    () => (article ? getRelated(article, articles) : []),
    [article, articles],
  )

  const personalRecommendations = useMemo(() => {
    if (!article) return []
    const history = getHistory()
    const hiddenTags = getHiddenTags()
    const hiddenSources = getHiddenSources()
    return recommendFeed(
      articles.filter((a) => a.id !== article.id),
      prefs.interests,
      history,
      hiddenTags,
      hiddenSources,
    ).slice(0, 3)
  }, [article, articles, prefs.interests])

  if (article === undefined) return <SkeletonGrid count={3} />
  if (article === null) return <NotFoundPage />

  const category = categoryMap[article.category]
  const sources = article.sources ?? [{ name: article.source, url: article.sourceUrl }]

  return (
    <article className="article" ref={articleRef}>
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
          {article.author && (
            <span>
              Von <strong>{article.author}</strong>
              {article.coAuthors && article.coAuthors.length > 0 && <> &amp; {article.coAuthors.join(', ')}</>}
            </span>
          )}
          <time dateTime={article.date}>{formatDate(article.date)}</time>
          {article.updatedDate && (
            <span>
              {t('article.updated')}: {formatDate(article.updatedDate)}
            </span>
          )}
          <span>{readingTimeLabel(article.body)}</span>
          {typeof article.views === 'number' && article.views > 0 && (
            <span>📊 {article.views} Aufrufe</span>
          )}
          {presence > 1 && (
            <span className="presence" title="Gerade aktive Leser:innen">
              👁 {presence} lesen das gerade
            </span>
          )}
        </div>
      </header>

      <img
        className="article__cover"
        src={article.image}
        alt=""
        width={800}
        height={450}
        onError={(e) => {
          e.currentTarget.src = generateCover(article.title, { label: category?.label })
        }}
      />

      <ArticleSummary text={article.body} />

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
        <TextToSpeech text={`${article.title}. ${article.body}`} />
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

      {scrollProgress > 10 && scrollProgress < 90 && (
        <div className="article__continue">
          <span>📖 Du hast {scrollProgress}% gelesen. </span>
          <Link to={`/fuer-dich`}>Weiterlesen — Für dich</Link>
        </div>
      )}

      {personalRecommendations.length > 0 && (
        <section className="article__personal-recs">
          <h3>Empfohlen für dich</h3>
          <ul className="related__list">
            {personalRecommendations.map((rec) => (
              <li key={rec.id} className="related__item">
                <img className="related__thumb" src={rec.image} alt="" width={84} height={56} />
                <div>
                  <Link to={`/news/${rec.id}`} className="related__headline">
                    {rec.title}
                  </Link>
                  <span className="related__date">
                    {explainRecommendation(rec, prefs.interests, getHistory())}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="article__back">
        <Link to="/">← {t('article.back')}</Link>
      </p>

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </article>
  )
}
