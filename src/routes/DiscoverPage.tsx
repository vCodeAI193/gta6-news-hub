import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { ArticleCard } from '../components/ArticleCard'
import { SkeletonGrid } from '../components/Skeleton'
import { fetchArticles } from '../services/articlesRepo'
import { discoveryStream, pickRandom, tagCloud } from '../lib/discovery'
import type { Article } from '../types'

const PAGE = 6

/**
 * Discovery-Feed (FEATURES-3 #18), „Überrasch mich" (#15) und Tag-Wolke (#20).
 */
export function DiscoverPage() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState<Article[] | null>(null)
  const [count, setCount] = useState(PAGE)
  // Seed bleibt pro Seitenbesuch stabil (Stream springt beim „Mehr"-Klick nicht um).
  const [seed] = useState(() => `disc-${new Date().toISOString().slice(0, 13)}`)

  useEffect(() => {
    fetchArticles().then(setArticles)
  }, [])

  const stream = useMemo(() => (articles ? discoveryStream(articles, seed, 0, count) : []), [articles, seed, count])
  const cloud = useMemo(() => (articles ? tagCloud(articles).slice(0, 24) : []), [articles])
  const maxCount = cloud[0]?.count ?? 1

  function surprise() {
    if (!articles?.length) return
    const pick = pickRandom(articles, `surprise-${Date.now()}`)
    if (pick) navigate(`/news/${pick.id}`)
  }

  if (!articles) return <SkeletonGrid count={3} />

  return (
    <>
      <Seo title="Entdecken" description="Kuratierte GTA-6-Entdeckungen, Zufallsartikel und Themen." path="/entdecken" />
      <header className="page-head">
        <h1 className="page-head__title">✨ Entdecken</h1>
        <p className="page-head__desc">Stöbere durch kuratierte Vorschläge oder lass dich überraschen.</p>
        <button type="button" className="btn" onClick={surprise}>🎲 Überrasch mich</button>
      </header>

      {cloud.length > 0 && (
        <section className="tagcloud" aria-label="Themen-Wolke">
          {cloud.map((t) => (
            <Link
              key={t.tag}
              to={`/thema/${encodeURIComponent(t.tag)}`}
              className="tagcloud__tag"
              style={{ fontSize: `${0.85 + (t.count / maxCount) * 1.1}rem` }}
            >
              {t.tag}
            </Link>
          ))}
        </section>
      )}

      <section className="grid">
        {stream.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </section>

      {count < articles.length && (
        <div className="feed__more">
          <button type="button" className="btn btn--ghost" onClick={() => setCount((c) => c + PAGE)}>
            Mehr entdecken
          </button>
        </div>
      )}
    </>
  )
}
